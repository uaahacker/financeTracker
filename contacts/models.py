from django.db import models
from core.models import BaseModel


class Contact(BaseModel):
    """Contact model for people, merchants, lenders, employers, etc."""
    
    CONTACT_TYPES = [
        ('PERSON', 'Person'),
        ('MERCHANT', 'Merchant'),
        ('LENDER', 'Lender'),
        ('EMPLOYER', 'Employer'),
        ('BANK', 'Bank'),
        ('OTHER', 'Other'),
    ]
    
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=CONTACT_TYPES, default='PERSON')
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    tax_id = models.CharField(max_length=50, blank=True, null=True, help_text="Tax ID or business registration number")
    
    # Relationship fields
    is_favorite = models.BooleanField(default=False)
    tags = models.ManyToManyField('finance.Tag', blank=True)
    
    class Meta:
        unique_together = ['user', 'name']
        ordering = ['name']
        indexes = [
            models.Index(fields=['user', 'type']),
            models.Index(fields=['user', 'name']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"
    
    @property
    def transaction_count(self):
        """Get the number of transactions associated with this contact."""
        return self.transaction_set.filter(is_active=True).count()
    
    @property
    def total_spent(self):
        """Get total amount spent with this contact."""
        from django.db.models import Sum
        from finance.models import Transaction
        
        result = Transaction.objects.filter(
            contact=self,
            type='EXPENSE',
            is_active=True
        ).aggregate(total=Sum('amount_base'))
        
        return result['total'] or 0
    
    @property
    def total_received(self):
        """Get total amount received from this contact."""
        from django.db.models import Sum
        from finance.models import Transaction
        
        result = Transaction.objects.filter(
            contact=self,
            type='INCOME',
            is_active=True
        ).aggregate(total=Sum('amount_base'))
        
        return result['total'] or 0
