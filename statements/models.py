from django.db import models
from django.utils import timezone
from django.core.files.base import ContentFile
from core.models import BaseModel, Currency
import os
import json


def statement_upload_path(instance, filename):
    """Generate file path for statement uploads."""
    return f'statements/{instance.user.id}/{timezone.now().year}/{timezone.now().month}/{filename}'


class Statement(BaseModel):
    """Statement model for generating periodic financial statements."""
    
    STATEMENT_TYPES = [
        ('MONTHLY', 'Monthly Statement'),
        ('QUARTERLY', 'Quarterly Statement'),
        ('YEARLY', 'Yearly Statement'),
        ('CUSTOM', 'Custom Period Statement'),
        ('ACCOUNT', 'Account Statement'),
        ('CATEGORY', 'Category Statement'),
    ]
    
    STATEMENT_STATUS = [
        ('PENDING', 'Pending'),
        ('GENERATING', 'Generating'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]
    
    EXPORT_FORMATS = [
        ('PDF', 'PDF'),
        ('EXCEL', 'Excel'),
        ('CSV', 'CSV'),
    ]
    
    # Basic information
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=STATEMENT_TYPES, default='MONTHLY')
    description = models.TextField(blank=True, null=True)
    
    # Period
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Filters
    accounts = models.ManyToManyField('finance.Account', blank=True, help_text="Specific accounts to include")
    categories = models.ManyToManyField('finance.Category', blank=True, help_text="Specific categories to include")
    contacts = models.ManyToManyField('contacts.Contact', blank=True, help_text="Specific contacts to include")
    tags = models.ManyToManyField('finance.Tag', blank=True, help_text="Specific tags to include")
    
    # Currency and formatting
    base_currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    include_transfers = models.BooleanField(default=True)
    include_inactive = models.BooleanField(default=False, help_text="Include soft-deleted transactions")
    
    # Generation settings
    export_format = models.CharField(max_length=10, choices=EXPORT_FORMATS, default='PDF')
    include_charts = models.BooleanField(default=True)
    include_attachments = models.BooleanField(default=False, help_text="Include transaction attachments in ZIP")
    
    # Status and results
    status = models.CharField(max_length=20, choices=STATEMENT_STATUS, default='PENDING')
    generated_at = models.DateTimeField(null=True, blank=True)
    file = models.FileField(upload_to=statement_upload_path, null=True, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True, help_text="File size in bytes")
    
    # Summary data (JSON)
    summary_data = models.JSONField(null=True, blank=True, help_text="Statement summary statistics")
    
    # Generation metadata
    generation_time_seconds = models.FloatField(null=True, blank=True)
    transaction_count = models.PositiveIntegerField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-period_end', '-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'period_start', 'period_end']),
            models.Index(fields=['user', 'type']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.period_start} to {self.period_end})"
    
    @property
    def file_url(self):
        """Get file URL if file exists."""
        return self.file.url if self.file else None
    
    @property
    def is_ready(self):
        """Check if statement is ready for download."""
        return self.status == 'COMPLETED' and self.file
    
    def generate_summary_data(self):
        """Generate summary statistics for the statement."""
        from django.db.models import Sum, Count, Q
        from finance.models import Transaction
        
        # Build query filters
        filters = Q(
            user=self.user,
            occurred_at__gte=self.period_start,
            occurred_at__lte=self.period_end,
        )
        
        if not self.include_inactive:
            filters &= Q(is_active=True)
        
        if self.accounts.exists():
            filters &= Q(account__in=self.accounts.all())
            
        if self.categories.exists():
            filters &= Q(category__in=self.categories.all())
            
        if self.contacts.exists():
            filters &= Q(contact__in=self.contacts.all())
            
        if self.tags.exists():
            filters &= Q(tags__in=self.tags.all())
        
        if not self.include_transfers:
            filters &= ~Q(type='TRANSFER')
        
        # Get transactions
        transactions = Transaction.objects.filter(filters)
        
        # Calculate summary statistics
        summary = {
            'period': {
                'start': self.period_start.isoformat(),
                'end': self.period_end.isoformat(),
                'days': (self.period_end - self.period_start).days + 1,
            },
            'totals': {
                'transaction_count': transactions.count(),
                'total_income': float(transactions.filter(type='INCOME').aggregate(total=Sum('amount_base'))['total'] or 0),
                'total_expenses': float(transactions.filter(type='EXPENSE').aggregate(total=Sum('amount_base'))['total'] or 0),
                'total_transfers': float(transactions.filter(type='TRANSFER').aggregate(total=Sum('amount_base'))['total'] or 0),
            },
            'by_category': [],
            'by_account': [],
            'by_contact': [],
            'by_month': [],
            'top_expenses': [],
            'top_income': [],
        }
        
        # Net flow calculation
        summary['totals']['net_flow'] = summary['totals']['total_income'] - summary['totals']['total_expenses']
        
        # Group by category
        category_stats = transactions.values('category__name', 'category__kind').annotate(
            total=Sum('amount_base'),
            count=Count('id')
        ).order_by('-total')
        
        summary['by_category'] = [
            {
                'name': stat['category__name'],
                'kind': stat['category__kind'],
                'total': float(stat['total']),
                'count': stat['count'],
            }
            for stat in category_stats
        ]
        
        # Group by account
        account_stats = transactions.values('account__name', 'account__type').annotate(
            total=Sum('amount_base'),
            count=Count('id')
        ).order_by('-total')
        
        summary['by_account'] = [
            {
                'name': stat['account__name'],
                'type': stat['account__type'],
                'total': float(stat['total']),
                'count': stat['count'],
            }
            for stat in account_stats
        ]
        
        # Group by contact (top 10)
        contact_stats = transactions.filter(contact__isnull=False).values(
            'contact__name', 'contact__type'
        ).annotate(
            total=Sum('amount_base'),
            count=Count('id')
        ).order_by('-total')[:10]
        
        summary['by_contact'] = [
            {
                'name': stat['contact__name'],
                'type': stat['contact__type'],
                'total': float(stat['total']),
                'count': stat['count'],
            }
            for stat in contact_stats
        ]
        
        # Monthly breakdown (if period spans multiple months)
        from django.db.models.functions import TruncMonth
        monthly_stats = transactions.annotate(
            month=TruncMonth('occurred_at')
        ).values('month').annotate(
            income=Sum('amount_base', filter=Q(type='INCOME')),
            expenses=Sum('amount_base', filter=Q(type='EXPENSE')),
            count=Count('id')
        ).order_by('month')
        
        summary['by_month'] = [
            {
                'month': stat['month'].isoformat(),
                'income': float(stat['income'] or 0),
                'expenses': float(stat['expenses'] or 0),
                'net': float((stat['income'] or 0) - (stat['expenses'] or 0)),
                'count': stat['count'],
            }
            for stat in monthly_stats
        ]
        
        # Top expenses and income
        top_expenses = transactions.filter(type='EXPENSE').order_by('-amount_base')[:10]
        summary['top_expenses'] = [
            {
                'description': t.description,
                'amount': float(t.amount_base),
                'date': t.occurred_at.date().isoformat(),
                'category': t.category.name,
                'account': t.account.name,
                'contact': t.contact.name if t.contact else None,
            }
            for t in top_expenses
        ]
        
        top_income = transactions.filter(type='INCOME').order_by('-amount_base')[:10]
        summary['top_income'] = [
            {
                'description': t.description,
                'amount': float(t.amount_base),
                'date': t.occurred_at.date().isoformat(),
                'category': t.category.name,
                'account': t.account.name,
                'contact': t.contact.name if t.contact else None,
            }
            for t in top_income
        ]
        
        self.summary_data = summary
        self.transaction_count = summary['totals']['transaction_count']
        self.save(update_fields=['summary_data', 'transaction_count'])
        
        return summary
    
    def start_generation(self):
        """Start the statement generation process."""
        self.status = 'GENERATING'
        self.save(update_fields=['status'])
        
        # This would typically be called as a Celery task
        from .tasks import generate_statement_task
        generate_statement_task.delay(self.id)


class StatementTemplate(BaseModel):
    """Template for customizing statement appearance and content."""
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    # Template settings
    header_logo = models.ImageField(upload_to='statement_templates/', null=True, blank=True)
    header_text = models.TextField(blank=True, null=True)
    footer_text = models.TextField(blank=True, null=True)
    
    # Styling options
    primary_color = models.CharField(max_length=7, default='#3B82F6', help_text="Hex color code")
    secondary_color = models.CharField(max_length=7, default='#64748B', help_text="Hex color code")
    font_family = models.CharField(max_length=50, default='Arial', help_text="Font family name")
    
    # Content options
    include_summary = models.BooleanField(default=True)
    include_charts = models.BooleanField(default=True)
    include_transaction_list = models.BooleanField(default=True)
    include_category_breakdown = models.BooleanField(default=True)
    include_account_breakdown = models.BooleanField(default=True)
    
    # Page layout
    page_size = models.CharField(max_length=10, default='A4', choices=[
        ('A4', 'A4'),
        ('LETTER', 'Letter'),
        ('LEGAL', 'Legal'),
    ])
    page_orientation = models.CharField(max_length=10, default='PORTRAIT', choices=[
        ('PORTRAIT', 'Portrait'),
        ('LANDSCAPE', 'Landscape'),
    ])
    
    # Template file (optional, for advanced customization)
    template_file = models.FileField(upload_to='statement_templates/', null=True, blank=True)
    
    is_default = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ['user', 'name']
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Ensure only one default template per user
        if self.is_default:
            StatementTemplate.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)
