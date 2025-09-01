from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal
from core.models import BaseModel, Currency
from dateutil.relativedelta import relativedelta
from dateutil.rrule import rrule, DAILY, WEEKLY, MONTHLY, YEARLY


class ScheduledPayment(BaseModel):
    """Scheduled payment model for recurring payments and reminders."""
    
    FREQUENCIES = [
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('BIWEEKLY', 'Bi-weekly'),
        ('MONTHLY', 'Monthly'),
        ('QUARTERLY', 'Quarterly'),
        ('YEARLY', 'Yearly'),
        ('CUSTOM', 'Custom (RRULE)'),
    ]
    
    PAYMENT_STATUS = [
        ('ACTIVE', 'Active'),
        ('PAUSED', 'Paused'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    # Basic information
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    # Payment details
    payee_contact = models.ForeignKey('contacts.Contact', on_delete=models.CASCADE)
    account = models.ForeignKey('finance.Account', on_delete=models.CASCADE)
    category = models.ForeignKey('finance.Category', on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    
    # Scheduling
    frequency = models.CharField(max_length=20, choices=FREQUENCIES, default='MONTHLY')
    recurrence_rule = models.TextField(blank=True, null=True, help_text="RRULE string for custom frequencies")
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True, help_text="Optional end date for recurring payments")
    next_due_date = models.DateField()
    last_executed_date = models.DateField(null=True, blank=True)
    
    # Automation settings
    auto_execute = models.BooleanField(default=False, help_text="Automatically create transactions on due date")
    reminder_days_before = models.PositiveSmallIntegerField(default=3, help_text="Days before due date to send reminder")
    
    # Status and limits
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='ACTIVE')
    max_occurrences = models.PositiveIntegerField(null=True, blank=True, help_text="Maximum number of times to execute")
    execution_count = models.PositiveIntegerField(default=0)
    
    # Additional settings
    tags = models.ManyToManyField('finance.Tag', blank=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        unique_together = ['user', 'name']
        ordering = ['next_due_date', 'name']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'next_due_date']),
            models.Index(fields=['user', 'auto_execute']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.amount} {self.currency.code} ({self.get_frequency_display()})"
    
    def save(self, *args, **kwargs):
        # Set next due date if not provided
        if not self.next_due_date:
            self.next_due_date = self.start_date
            
        super().save(*args, **kwargs)
    
    @property
    def is_overdue(self):
        """Check if payment is overdue."""
        return self.next_due_date < timezone.now().date() and self.status == 'ACTIVE'
    
    @property
    def days_until_due(self):
        """Calculate days until next due date."""
        return (self.next_due_date - timezone.now().date()).days
    
    @property
    def should_send_reminder(self):
        """Check if reminder should be sent."""
        return (self.days_until_due <= self.reminder_days_before and 
                self.days_until_due >= 0 and 
                self.status == 'ACTIVE')
    
    def calculate_next_due_date(self, from_date=None):
        """Calculate next due date based on frequency."""
        if not from_date:
            from_date = self.next_due_date
            
        if self.frequency == 'DAILY':
            return from_date + relativedelta(days=1)
        elif self.frequency == 'WEEKLY':
            return from_date + relativedelta(weeks=1)
        elif self.frequency == 'BIWEEKLY':
            return from_date + relativedelta(weeks=2)
        elif self.frequency == 'MONTHLY':
            return from_date + relativedelta(months=1)
        elif self.frequency == 'QUARTERLY':
            return from_date + relativedelta(months=3)
        elif self.frequency == 'YEARLY':
            return from_date + relativedelta(years=1)
        elif self.frequency == 'CUSTOM' and self.recurrence_rule:
            # Parse RRULE and get next occurrence
            try:
                rule = rrule.rrulestr(self.recurrence_rule, dtstart=from_date)
                next_occurrence = rule.after(from_date, inc=False)
                return next_occurrence.date() if next_occurrence else None
            except:
                return from_date + relativedelta(months=1)  # Fallback to monthly
        
        return from_date
    
    def execute_payment(self, execution_date=None, amount=None, note=None):
        """Execute the scheduled payment by creating a transaction."""
        if not execution_date:
            execution_date = timezone.now().date()
            
        if not amount:
            amount = self.amount
            
        # Create transaction
        from finance.models import Transaction
        
        transaction = Transaction.objects.create(
            user=self.user,
            account=self.account,
            type='EXPENSE',
            amount=amount,
            currency=self.currency,
            description=f"{self.name} (Scheduled)",
            note=note or f"Auto-generated from scheduled payment: {self.name}",
            contact=self.payee_contact,
            category=self.category,
            occurred_at=timezone.now().replace(
                year=execution_date.year,
                month=execution_date.month,
                day=execution_date.day
            )
        )
        
        # Add tags
        if self.tags.exists():
            transaction.tags.set(self.tags.all())
        
        # Create execution record
        execution = ScheduledPaymentExecution.objects.create(
            scheduled_payment=self,
            transaction=transaction,
            execution_date=execution_date,
            amount=amount,
            auto_executed=True
        )
        
        # Update scheduled payment
        self.last_executed_date = execution_date
        self.execution_count += 1
        
        # Calculate next due date
        self.next_due_date = self.calculate_next_due_date()
        
        # Check if we've reached max occurrences
        if self.max_occurrences and self.execution_count >= self.max_occurrences:
            self.status = 'COMPLETED'
        
        # Check if we've passed end date
        if self.end_date and self.next_due_date > self.end_date:
            self.status = 'COMPLETED'
            
        self.save()
        
        return execution
    
    def get_upcoming_dates(self, count=12):
        """Get upcoming due dates."""
        dates = []
        current_date = self.next_due_date
        
        for i in range(count):
            if self.end_date and current_date > self.end_date:
                break
            if self.max_occurrences and (self.execution_count + i) >= self.max_occurrences:
                break
                
            dates.append(current_date)
            current_date = self.calculate_next_due_date(current_date)
            
        return dates


class ScheduledPaymentExecution(BaseModel):
    """Record of scheduled payment executions."""
    
    scheduled_payment = models.ForeignKey(ScheduledPayment, on_delete=models.CASCADE, related_name='executions')
    transaction = models.OneToOneField('finance.Transaction', on_delete=models.CASCADE)
    execution_date = models.DateField()
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    auto_executed = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-execution_date', '-created_at']
        indexes = [
            models.Index(fields=['scheduled_payment', 'execution_date']),
            models.Index(fields=['user', 'execution_date']),
        ]
    
    def __str__(self):
        return f"{self.scheduled_payment.name} executed on {self.execution_date}"


class PaymentReminder(BaseModel):
    """Payment reminder model for tracking sent reminders."""
    
    REMINDER_TYPES = [
        ('SCHEDULED_PAYMENT', 'Scheduled Payment'),
        ('LOAN_EMI', 'Loan EMI'),
        ('BILL_DUE', 'Bill Due'),
        ('BUDGET_ALERT', 'Budget Alert'),
        ('INCOME_EXPECTED', 'Income Expected'),
    ]
    
    REMINDER_CHANNELS = [
        ('EMAIL', 'Email'),
        ('IN_APP', 'In-App Notification'),
        ('PUSH', 'Push Notification'),
        ('SMS', 'SMS'),
    ]
    
    REMINDER_STATUS = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
        ('READ', 'Read'),
    ]
    
    type = models.CharField(max_length=20, choices=REMINDER_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    due_date = models.DateTimeField()
    
    # Related objects (generic foreign key would be better but keeping simple)
    scheduled_payment = models.ForeignKey(ScheduledPayment, on_delete=models.CASCADE, null=True, blank=True)
    loan = models.ForeignKey('loans.Loan', on_delete=models.CASCADE, null=True, blank=True)
    
    # Delivery settings
    channels = models.JSONField(default=list, help_text="List of channels to send reminder")
    send_at = models.DateTimeField(help_text="When to send the reminder")
    
    # Status tracking
    status = models.CharField(max_length=20, choices=REMINDER_STATUS, default='PENDING')
    sent_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    delivery_attempts = models.PositiveSmallIntegerField(default=0)
    last_attempt_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-due_date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'send_at']),
            models.Index(fields=['type', 'status']),
        ]
    
    def __str__(self):
        return f"{self.title} - Due {self.due_date.date()}"
    
    def mark_as_sent(self):
        """Mark reminder as sent."""
        self.status = 'SENT'
        self.sent_at = timezone.now()
        self.save(update_fields=['status', 'sent_at'])
    
    def mark_as_read(self):
        """Mark reminder as read."""
        self.status = 'READ'
        self.read_at = timezone.now()
        self.save(update_fields=['status', 'read_at'])
    
    def mark_as_failed(self, error_message):
        """Mark reminder as failed."""
        self.status = 'FAILED'
        self.error_message = error_message
        self.last_attempt_at = timezone.now()
        self.delivery_attempts += 1
        self.save(update_fields=['status', 'error_message', 'last_attempt_at', 'delivery_attempts'])
