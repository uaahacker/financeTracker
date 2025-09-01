from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal
from core.models import BaseModel, Currency
import os


def upload_receipt_path(instance, filename):
    """Generate file path for receipt uploads."""
    return f'receipts/{instance.user.id}/{timezone.now().year}/{timezone.now().month}/{filename}'


class Account(BaseModel):
    """Account model for cash, bank accounts, e-wallets, crypto, etc."""
    
    ACCOUNT_TYPES = [
        ('CASH', 'Cash'),
        ('BANK', 'Bank Account'),
        ('SAVINGS', 'Savings Account'),
        ('CREDIT_CARD', 'Credit Card'),
        ('E_WALLET', 'E-Wallet'),
        ('CRYPTO', 'Cryptocurrency'),
        ('INVESTMENT', 'Investment'),
        ('OTHER', 'Other'),
    ]
    
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=ACCOUNT_TYPES, default='BANK')
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    opening_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    current_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Bank specific fields
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    account_number = models.CharField(max_length=50, blank=True, null=True)
    routing_number = models.CharField(max_length=20, blank=True, null=True)
    
    # Credit card specific fields
    credit_limit = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    # Additional fields
    description = models.TextField(blank=True, null=True)
    is_default = models.BooleanField(default=False)
    include_in_totals = models.BooleanField(default=True, help_text="Include this account in dashboard totals")
    
    class Meta:
        unique_together = ['user', 'name']
        ordering = ['name']
        indexes = [
            models.Index(fields=['user', 'type']),
            models.Index(fields=['user', 'is_default']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.currency.code})"
    
    def save(self, *args, **kwargs):
        # Set current_balance to opening_balance if it's a new account
        if not self.pk:
            self.current_balance = self.opening_balance
            
        # Ensure only one default account per user
        if self.is_default:
            Account.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
            
        super().save(*args, **kwargs)
    
    def update_balance(self):
        """Recalculate current balance based on transactions."""
        from django.db.models import Sum, Q
        
        transactions = Transaction.objects.filter(account=self, is_active=True)
        
        income = transactions.filter(type='INCOME').aggregate(total=Sum('amount'))['total'] or 0
        expenses = transactions.filter(type='EXPENSE').aggregate(total=Sum('amount'))['total'] or 0
        transfers_in = transactions.filter(type='TRANSFER', transfer_to_account=self).aggregate(total=Sum('amount'))['total'] or 0
        transfers_out = transactions.filter(type='TRANSFER', account=self).aggregate(total=Sum('amount'))['total'] or 0
        
        self.current_balance = self.opening_balance + income - expenses + transfers_in - transfers_out
        self.save(update_fields=['current_balance'])
    
    @property
    def available_balance(self):
        """Available balance considering credit limits."""
        if self.type == 'CREDIT_CARD' and self.credit_limit:
            return self.credit_limit + self.current_balance  # Credit cards have negative balance
        return self.current_balance


class Category(BaseModel):
    """Category model for organizing transactions."""
    
    CATEGORY_KINDS = [
        ('EXPENSE', 'Expense'),
        ('INCOME', 'Income'),
        ('TRANSFER', 'Transfer'),
    ]
    
    name = models.CharField(max_length=100)
    kind = models.CharField(max_length=10, choices=CATEGORY_KINDS, default='EXPENSE')
    color = models.CharField(max_length=7, default='#3B82F6', help_text="Hex color code")
    icon = models.CharField(max_length=50, default='💰', help_text="Emoji or icon name")
    description = models.TextField(blank=True, null=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories')
    is_system = models.BooleanField(default=False, help_text="System categories cannot be deleted")
    
    class Meta:
        verbose_name_plural = "Categories"
        unique_together = ['user', 'name', 'kind']
        ordering = ['kind', 'name']
        indexes = [
            models.Index(fields=['user', 'kind']),
            models.Index(fields=['user', 'name']),
        ]
    
    def __str__(self):
        parent_name = f"{self.parent.name} > " if self.parent else ""
        return f"{parent_name}{self.name} ({self.get_kind_display()})"
    
    @property
    def full_name(self):
        """Get full category name including parent."""
        if self.parent:
            return f"{self.parent.full_name} > {self.name}"
        return self.name
    
    @property
    def transaction_count(self):
        """Get the number of transactions in this category."""
        return self.transaction_set.filter(is_active=True).count()


class Tag(BaseModel):
    """Tag model for flexible transaction labeling."""
    
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#10B981', help_text="Hex color code")
    description = models.TextField(blank=True, null=True)
    
    class Meta:
        unique_together = ['user', 'name']
        ordering = ['name']
        indexes = [
            models.Index(fields=['user', 'name']),
        ]
    
    def __str__(self):
        return self.name
    
    @property
    def transaction_count(self):
        """Get the number of transactions with this tag."""
        return self.transaction_set.filter(is_active=True).count()


class Transaction(BaseModel):
    """Core transaction model for all financial transactions."""
    
    TRANSACTION_TYPES = [
        ('EXPENSE', 'Expense'),
        ('INCOME', 'Income'),
        ('TRANSFER', 'Transfer'),
    ]
    
    # Core fields
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    
    # For multi-currency support
    fx_rate = models.DecimalField(max_digits=10, decimal_places=6, default=1, help_text="Exchange rate to base currency")
    amount_base = models.DecimalField(max_digits=15, decimal_places=2, help_text="Amount in user's base currency")
    
    # Descriptive fields
    description = models.CharField(max_length=200)
    note = models.TextField(blank=True, null=True)
    
    # Relationships
    contact = models.ForeignKey('contacts.Contact', on_delete=models.SET_NULL, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    tags = models.ManyToManyField(Tag, blank=True)
    
    # Transfer specific fields
    transfer_to_account = models.ForeignKey(Account, on_delete=models.CASCADE, null=True, blank=True, related_name='transfers_in')
    transfer_transaction = models.OneToOneField('self', on_delete=models.CASCADE, null=True, blank=True, related_name='reverse_transfer')
    
    # Temporal fields
    occurred_at = models.DateTimeField(default=timezone.now)
    
    # Recurring transaction fields
    is_recurring = models.BooleanField(default=False)
    recurrence_rule = models.TextField(blank=True, null=True, help_text="RRULE string for recurring transactions")
    parent_transaction = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='recurring_instances')
    
    # Attachments
    attachment = models.FileField(upload_to=upload_receipt_path, null=True, blank=True, help_text="Receipt or document")
    
    # Status fields
    is_reconciled = models.BooleanField(default=False)
    reconciled_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-occurred_at', '-created_at']
        indexes = [
            models.Index(fields=['user', 'occurred_at']),
            models.Index(fields=['user', 'type']),
            models.Index(fields=['user', 'account']),
            models.Index(fields=['user', 'category']),
            models.Index(fields=['user', 'contact']),
            models.Index(fields=['account', 'occurred_at']),
        ]
    
    def __str__(self):
        sign = '-' if self.type == 'EXPENSE' else '+' if self.type == 'INCOME' else '→'
        return f"{sign}{self.amount} {self.currency.code} - {self.description}"
    
    def save(self, *args, **kwargs):
        # Calculate base amount if not provided
        if not self.amount_base:
            self.amount_base = self.amount * self.fx_rate
            
        # Handle transfers
        if self.type == 'TRANSFER' and self.transfer_to_account and not self.transfer_transaction:
            # Create the corresponding transfer transaction
            super().save(*args, **kwargs)  # Save this transaction first
            
            # Create reverse transaction
            reverse_transaction = Transaction.objects.create(
                user=self.user,
                account=self.transfer_to_account,
                type='INCOME',
                amount=self.amount,
                currency=self.currency,
                fx_rate=self.fx_rate,
                amount_base=self.amount_base,
                description=f"Transfer from {self.account.name}",
                note=self.note,
                category=self.category,
                occurred_at=self.occurred_at,
                transfer_transaction=self,
                is_active=self.is_active
            )
            
            # Update this transaction to reference the reverse
            self.transfer_transaction = reverse_transaction
            super().save(update_fields=['transfer_transaction'])
        else:
            super().save(*args, **kwargs)
        
        # Update account balances
        self.account.update_balance()
        if self.transfer_to_account:
            self.transfer_to_account.update_balance()
    
    def delete(self, *args, **kwargs):
        # Soft delete by default
        self.is_active = False
        self.save(update_fields=['is_active'])
        
        # Also soft delete the transfer transaction if it exists
        if self.transfer_transaction:
            self.transfer_transaction.is_active = False
            self.transfer_transaction.save(update_fields=['is_active'])
    
    def hard_delete(self):
        """Permanently delete the transaction."""
        if self.transfer_transaction:
            self.transfer_transaction.delete()
        super().delete()


class Budget(BaseModel):
    """Budget model for spending limits and goals."""
    
    BUDGET_PERIODS = [
        ('MONTHLY', 'Monthly'),
        ('WEEKLY', 'Weekly'),
        ('QUARTERLY', 'Quarterly'),
        ('YEARLY', 'Yearly'),
        ('CUSTOM', 'Custom Period'),
    ]
    
    name = models.CharField(max_length=100)
    period = models.CharField(max_length=20, choices=BUDGET_PERIODS, default='MONTHLY')
    limit_amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    
    # Period specific fields
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Relationships
    categories = models.ManyToManyField(Category, help_text="Categories included in this budget")
    accounts = models.ManyToManyField(Account, blank=True, help_text="Specific accounts to track (optional)")
    
    # Settings
    roll_over = models.BooleanField(default=False, help_text="Roll over unused budget to next period")
    alert_threshold = models.DecimalField(max_digits=5, decimal_places=2, default=80, help_text="Alert when % of budget is used")
    
    # Status
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['user', 'name']
        ordering = ['name']
        indexes = [
            models.Index(fields=['user', 'start_date', 'end_date']),
            models.Index(fields=['user', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.limit_amount} {self.currency.code}"
    
    @property
    def spent_amount(self):
        """Calculate total spent amount for this budget period."""
        from django.db.models import Sum, Q
        
        query = Q(
            type='EXPENSE',
            occurred_at__gte=self.start_date,
            occurred_at__lte=self.end_date,
            category__in=self.categories.all(),
            is_active=True
        )
        
        if self.accounts.exists():
            query &= Q(account__in=self.accounts.all())
            
        result = Transaction.objects.filter(query).aggregate(total=Sum('amount_base'))
        return result['total'] or Decimal('0')
    
    @property
    def remaining_amount(self):
        """Calculate remaining budget amount."""
        return self.limit_amount - self.spent_amount
    
    @property
    def usage_percentage(self):
        """Calculate budget usage percentage."""
        if self.limit_amount == 0:
            return 0
        return min((self.spent_amount / self.limit_amount) * 100, 100)
    
    @property
    def is_over_budget(self):
        """Check if budget is exceeded."""
        return self.spent_amount > self.limit_amount
    
    @property
    def should_alert(self):
        """Check if budget should trigger an alert."""
        return self.usage_percentage >= self.alert_threshold


class IncomeSource(BaseModel):
    """Income source model for tracking expected income."""
    
    FREQUENCIES = [
        ('WEEKLY', 'Weekly'),
        ('BIWEEKLY', 'Bi-weekly'),
        ('MONTHLY', 'Monthly'),
        ('QUARTERLY', 'Quarterly'),
        ('YEARLY', 'Yearly'),
        ('ONE_TIME', 'One Time'),
    ]
    
    name = models.CharField(max_length=100)
    payer_contact = models.ForeignKey('contacts.Contact', on_delete=models.CASCADE, null=True, blank=True)
    frequency = models.CharField(max_length=20, choices=FREQUENCIES, default='MONTHLY')
    expected_amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, help_text="Account where income is received")
    category = models.ForeignKey(Category, on_delete=models.PROTECT, limit_choices_to={'kind': 'INCOME'})
    
    # Scheduling
    next_expected_date = models.DateField()
    last_received_date = models.DateField(null=True, blank=True)
    
    # Settings
    auto_create_transaction = models.BooleanField(default=False, help_text="Automatically create transaction on expected date")
    reminder_days_before = models.PositiveSmallIntegerField(default=1, help_text="Days before expected date to send reminder")
    
    # Status
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['user', 'name']
        ordering = ['name']
        indexes = [
            models.Index(fields=['user', 'next_expected_date']),
            models.Index(fields=['user', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.expected_amount} {self.currency.code}"
    
    @property
    def is_overdue(self):
        """Check if income is overdue."""
        return self.next_expected_date < timezone.now().date()
    
    def calculate_next_date(self):
        """Calculate next expected date based on frequency."""
        from dateutil.relativedelta import relativedelta
        
        if not self.next_expected_date:
            return
            
        if self.frequency == 'WEEKLY':
            self.next_expected_date += relativedelta(weeks=1)
        elif self.frequency == 'BIWEEKLY':
            self.next_expected_date += relativedelta(weeks=2)
        elif self.frequency == 'MONTHLY':
            self.next_expected_date += relativedelta(months=1)
        elif self.frequency == 'QUARTERLY':
            self.next_expected_date += relativedelta(months=3)
        elif self.frequency == 'YEARLY':
            self.next_expected_date += relativedelta(years=1)
        
        self.save(update_fields=['next_expected_date'])
