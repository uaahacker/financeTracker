from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid


class TimestampedModel(models.Model):
    """Abstract base model with timestamps and soft delete functionality."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        abstract = True
        

class UUIDModel(models.Model):
    """Abstract base model with UUID primary key."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    class Meta:
        abstract = True


class UserOwnedModel(models.Model):
    """Abstract base model for user-owned entities."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='%(class)s_set')
    
    class Meta:
        abstract = True


class BaseModel(TimestampedModel, UserOwnedModel):
    """Base model combining common functionality."""
    
    class Meta:
        abstract = True


class Currency(TimestampedModel):
    """Currency model for multi-currency support."""
    code = models.CharField(max_length=3, unique=True, help_text="ISO currency code (e.g., USD, EUR)")
    name = models.CharField(max_length=100)
    symbol = models.CharField(max_length=10)
    decimal_places = models.PositiveSmallIntegerField(default=2)
    is_default = models.BooleanField(default=False)
    
    class Meta:
        verbose_name_plural = "Currencies"
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"
    
    def save(self, *args, **kwargs):
        if self.is_default:
            # Ensure only one default currency
            Currency.objects.filter(is_default=True).update(is_default=False)
        super().save(*args, **kwargs)


class ExchangeRate(TimestampedModel):
    """Exchange rates for currency conversion."""
    from_currency = models.ForeignKey(Currency, on_delete=models.CASCADE, related_name='from_rates')
    to_currency = models.ForeignKey(Currency, on_delete=models.CASCADE, related_name='to_rates')
    rate = models.DecimalField(max_digits=15, decimal_places=6)
    date = models.DateField()
    
    class Meta:
        unique_together = ['from_currency', 'to_currency', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.from_currency.code} -> {self.to_currency.code}: {self.rate}"


class Profile(BaseModel):
    """Extended user profile with finance-specific settings."""
    default_currency = models.ForeignKey(Currency, on_delete=models.PROTECT, null=True, blank=True)
    locale = models.CharField(max_length=10, default='en-US')
    timezone = models.CharField(max_length=50, default='UTC')
    salary_day_of_month = models.PositiveSmallIntegerField(default=1, help_text="Day of month when salary is received")
    monthly_budget_limit = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    notification_preferences = models.JSONField(default=dict, help_text="User notification preferences")
    
    class Meta:
        unique_together = ['user']
    
    def __str__(self):
        return f"Profile for {self.user.username}"


class AuditLog(TimestampedModel):
    """Audit log for tracking changes to important entities."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    entity_type = models.CharField(max_length=100)
    entity_id = models.CharField(max_length=100)
    action = models.CharField(max_length=50, choices=[
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('VIEW', 'View'),
    ])
    snapshot_before = models.JSONField(null=True, blank=True)
    snapshot_after = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.user} {self.action} {self.entity_type} {self.entity_id}"
