from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal
from core.models import BaseModel, Currency
from dateutil.relativedelta import relativedelta
import math


class Loan(BaseModel):
    """Loan model for tracking loans and EMIs."""
    
    LOAN_TYPES = [
        ('PERSONAL', 'Personal Loan'),
        ('HOME', 'Home Loan'),
        ('CAR', 'Car Loan'),
        ('BUSINESS', 'Business Loan'),
        ('EDUCATION', 'Education Loan'),
        ('CREDIT_CARD', 'Credit Card'),
        ('OTHER', 'Other'),
    ]
    
    LOAN_STATUS = [
        ('ACTIVE', 'Active'),
        ('PAID_OFF', 'Paid Off'),
        ('DEFAULTED', 'Defaulted'),
        ('CLOSED', 'Closed'),
    ]
    
    # Basic information
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=LOAN_TYPES, default='PERSONAL')
    lender_contact = models.ForeignKey('contacts.Contact', on_delete=models.CASCADE)
    account = models.ForeignKey('finance.Account', on_delete=models.CASCADE, help_text="Account used for EMI payments")
    
    # Loan details
    principal_amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    interest_rate_annual = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))])
    
    # Terms
    start_date = models.DateField()
    end_date = models.DateField()
    term_months = models.PositiveIntegerField(help_text="Loan term in months")
    
    # EMI details
    emi_amount = models.DecimalField(max_digits=15, decimal_places=2)
    emi_day = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(31)], help_text="Day of month for EMI payment")
    next_emi_date = models.DateField()
    
    # Current status
    outstanding_principal = models.DecimalField(max_digits=15, decimal_places=2)
    total_paid = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=LOAN_STATUS, default='ACTIVE')
    
    # Settings
    auto_create_emi = models.BooleanField(default=False, help_text="Automatically create EMI transactions")
    reminder_days_before = models.PositiveSmallIntegerField(default=3, help_text="Days before EMI due date to send reminder")
    
    # Additional fields
    loan_account_number = models.CharField(max_length=50, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        unique_together = ['user', 'name']
        ordering = ['next_emi_date', 'name']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'next_emi_date']),
            models.Index(fields=['user', 'lender_contact']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.emi_amount} {self.currency.code}/month"
    
    def save(self, *args, **kwargs):
        # Calculate EMI amount if not provided
        if not self.emi_amount or self.emi_amount == 0:
            self.emi_amount = self.calculate_emi()
        
        # Set outstanding principal to principal amount if new loan
        if not self.pk:
            self.outstanding_principal = self.principal_amount
            
        # Calculate next EMI date if not set
        if not self.next_emi_date:
            self.next_emi_date = self.calculate_next_emi_date()
            
        super().save(*args, **kwargs)
    
    def calculate_emi(self):
        """Calculate EMI amount using the EMI formula."""
        if self.interest_rate_annual == 0:
            return self.principal_amount / self.term_months
        
        monthly_rate = self.interest_rate_annual / (12 * 100)
        emi = (self.principal_amount * monthly_rate * (1 + monthly_rate) ** self.term_months) / ((1 + monthly_rate) ** self.term_months - 1)
        return round(emi, 2)
    
    def calculate_next_emi_date(self, from_date=None):
        """Calculate next EMI date."""
        if not from_date:
            from_date = self.start_date
        
        next_date = from_date.replace(day=min(self.emi_day, 28))  # Handle month-end dates
        if next_date <= from_date:
            next_date += relativedelta(months=1)
        
        return next_date
    
    @property
    def monthly_interest_rate(self):
        """Get monthly interest rate."""
        return self.interest_rate_annual / (12 * 100)
    
    @property
    def total_interest(self):
        """Calculate total interest to be paid."""
        return (self.emi_amount * self.term_months) - self.principal_amount
    
    @property
    def total_amount(self):
        """Calculate total amount to be paid."""
        return self.emi_amount * self.term_months
    
    @property
    def paid_percentage(self):
        """Calculate percentage of loan paid."""
        if self.principal_amount == 0:
            return 0
        return ((self.principal_amount - self.outstanding_principal) / self.principal_amount) * 100
    
    @property
    def remaining_emis(self):
        """Calculate remaining EMI payments."""
        if self.emi_amount == 0:
            return 0
        return math.ceil(self.outstanding_principal / self.emi_amount)
    
    @property
    def is_overdue(self):
        """Check if EMI is overdue."""
        return self.next_emi_date < timezone.now().date() and self.status == 'ACTIVE'
    
    def generate_amortization_schedule(self):
        """Generate complete amortization schedule."""
        schedule = []
        balance = self.principal_amount
        payment_date = self.start_date
        
        for payment_num in range(1, self.term_months + 1):
            payment_date = self.calculate_next_emi_date(payment_date)
            
            interest_payment = balance * self.monthly_interest_rate
            principal_payment = self.emi_amount - interest_payment
            balance -= principal_payment
            
            schedule.append({
                'payment_number': payment_num,
                'payment_date': payment_date,
                'emi_amount': self.emi_amount,
                'principal_payment': round(principal_payment, 2),
                'interest_payment': round(interest_payment, 2),
                'remaining_balance': round(max(balance, 0), 2),
            })
            
            if balance <= 0:
                break
                
        return schedule
    
    def make_payment(self, amount, payment_date=None, extra_principal=0):
        """Record a loan payment and update outstanding balance."""
        if not payment_date:
            payment_date = timezone.now().date()
        
        # Calculate interest and principal portions
        interest_payment = self.outstanding_principal * self.monthly_interest_rate
        principal_payment = amount - interest_payment + extra_principal
        
        # Update outstanding principal
        self.outstanding_principal = max(0, self.outstanding_principal - principal_payment)
        self.total_paid += amount
        
        # Update next EMI date
        if payment_date >= self.next_emi_date:
            self.next_emi_date = self.calculate_next_emi_date(payment_date)
        
        # Check if loan is paid off
        if self.outstanding_principal <= 0:
            self.status = 'PAID_OFF'
            
        self.save()
        
        # Create EMI payment record
        return EMIPayment.objects.create(
            loan=self,
            payment_date=payment_date,
            amount_paid=amount,
            principal_portion=principal_payment,
            interest_portion=interest_payment,
            extra_principal=extra_principal,
            outstanding_balance=self.outstanding_principal
        )


class EMIPayment(BaseModel):
    """EMI payment record for tracking loan payments."""
    
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='payments')
    payment_date = models.DateField()
    amount_paid = models.DecimalField(max_digits=15, decimal_places=2)
    principal_portion = models.DecimalField(max_digits=15, decimal_places=2)
    interest_portion = models.DecimalField(max_digits=15, decimal_places=2)
    extra_principal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    outstanding_balance = models.DecimalField(max_digits=15, decimal_places=2)
    
    # Link to transaction if auto-created
    transaction = models.OneToOneField('finance.Transaction', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Payment details
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    reference_number = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-payment_date', '-created_at']
        indexes = [
            models.Index(fields=['loan', 'payment_date']),
            models.Index(fields=['user', 'payment_date']),
        ]
    
    def __str__(self):
        return f"{self.loan.name} - {self.amount_paid} {self.loan.currency.code} on {self.payment_date}"
    
    @property
    def is_regular_emi(self):
        """Check if this is a regular EMI payment."""
        return abs(self.amount_paid - self.loan.emi_amount) < 0.01
    
    @property
    def is_prepayment(self):
        """Check if this payment includes prepayment."""
        return self.extra_principal > 0 or self.amount_paid > self.loan.emi_amount
