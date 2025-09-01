import django_filters
from django.db import models
from finance.models import Transaction, Budget
from loans.models import Loan
from scheduling.models import ScheduledPayment
from statements.models import Statement
from notifications.models import Notification


class TransactionFilter(django_filters.FilterSet):
    """Filter for transactions with advanced filtering options."""
    
    # Date range filters
    date_from = django_filters.DateFilter(field_name='occurred_at', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='occurred_at', lookup_expr='lte')
    
    # Amount range filters
    min_amount = django_filters.NumberFilter(field_name='amount', lookup_expr='gte')
    max_amount = django_filters.NumberFilter(field_name='amount', lookup_expr='lte')
    
    # Text search
    search = django_filters.CharFilter(method='filter_search')
    
    # Multiple choice filters
    accounts = django_filters.ModelMultipleChoiceFilter(
        field_name='account',
        to_field_name='id',
        queryset=None  # Will be set in __init__
    )
    
    categories = django_filters.ModelMultipleChoiceFilter(
        field_name='category',
        to_field_name='id',
        queryset=None  # Will be set in __init__
    )
    
    contacts = django_filters.ModelMultipleChoiceFilter(
        field_name='contact',
        to_field_name='id',
        queryset=None  # Will be set in __init__
    )
    
    tags = django_filters.ModelMultipleChoiceFilter(
        field_name='tags',
        to_field_name='id',
        queryset=None  # Will be set in __init__
    )
    
    class Meta:
        model = Transaction
        fields = [
            'type', 'currency', 'is_reconciled', 'is_recurring',
            'date_from', 'date_to', 'min_amount', 'max_amount',
            'accounts', 'categories', 'contacts', 'tags', 'search'
        ]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if hasattr(self, 'request') and self.request.user.is_authenticated:
            from finance.models import Account, Category
            from contacts.models import Contact
            from finance.models import Tag
            
            user = self.request.user
            self.filters['accounts'].queryset = Account.objects.filter(user=user, is_active=True)
            self.filters['categories'].queryset = Category.objects.filter(user=user, is_active=True)
            self.filters['contacts'].queryset = Contact.objects.filter(user=user, is_active=True)
            self.filters['tags'].queryset = Tag.objects.filter(user=user, is_active=True)
    
    def filter_search(self, queryset, name, value):
        """Search across description, note, and related fields."""
        if not value:
            return queryset
        
        return queryset.filter(
            models.Q(description__icontains=value) |
            models.Q(note__icontains=value) |
            models.Q(contact__name__icontains=value) |
            models.Q(category__name__icontains=value)
        )


class BudgetFilter(django_filters.FilterSet):
    """Filter for budgets."""
    
    # Date range filters
    start_date_from = django_filters.DateFilter(field_name='start_date', lookup_expr='gte')
    start_date_to = django_filters.DateFilter(field_name='start_date', lookup_expr='lte')
    end_date_from = django_filters.DateFilter(field_name='end_date', lookup_expr='gte')
    end_date_to = django_filters.DateFilter(field_name='end_date', lookup_expr='lte')
    
    # Current period filter
    current = django_filters.BooleanFilter(method='filter_current')
    
    # Exceeded budget filter
    exceeded = django_filters.BooleanFilter(method='filter_exceeded')
    
    # Multiple choice filters
    categories = django_filters.ModelMultipleChoiceFilter(
        field_name='categories',
        to_field_name='id',
        queryset=None  # Will be set in __init__
    )
    
    accounts = django_filters.ModelMultipleChoiceFilter(
        field_name='accounts',
        to_field_name='id',
        queryset=None  # Will be set in __init__
    )
    
    class Meta:
        model = Budget
        fields = [
            'period', 'currency', 'is_active',
            'start_date_from', 'start_date_to', 'end_date_from', 'end_date_to',
            'current', 'exceeded', 'categories', 'accounts'
        ]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if hasattr(self, 'request') and self.request.user.is_authenticated:
            from finance.models import Account, Category
            
            user = self.request.user
            self.filters['categories'].queryset = Category.objects.filter(user=user, is_active=True)
            self.filters['accounts'].queryset = Account.objects.filter(user=user, is_active=True)
    
    def filter_current(self, queryset, name, value):
        """Filter budgets that are currently active."""
        if value:
            from django.utils import timezone
            today = timezone.now().date()
            return queryset.filter(start_date__lte=today, end_date__gte=today)
        return queryset
    
    def filter_exceeded(self, queryset, name, value):
        """Filter budgets that are exceeded."""
        if value:
            exceeded_ids = []
            for budget in queryset:
                if budget.is_over_budget:
                    exceeded_ids.append(budget.id)
            return queryset.filter(id__in=exceeded_ids)
        return queryset


class LoanFilter(django_filters.FilterSet):
    """Filter for loans."""
    
    # Date range filters
    start_date_from = django_filters.DateFilter(field_name='start_date', lookup_expr='gte')
    start_date_to = django_filters.DateFilter(field_name='start_date', lookup_expr='lte')
    end_date_from = django_filters.DateFilter(field_name='end_date', lookup_expr='gte')
    end_date_to = django_filters.DateFilter(field_name='end_date', lookup_expr='lte')
    
    # EMI date filters
    emi_date_from = django_filters.DateFilter(field_name='next_emi_date', lookup_expr='gte')
    emi_date_to = django_filters.DateFilter(field_name='next_emi_date', lookup_expr='lte')
    
    # Amount range filters
    principal_min = django_filters.NumberFilter(field_name='principal_amount', lookup_expr='gte')
    principal_max = django_filters.NumberFilter(field_name='principal_amount', lookup_expr='lte')
    emi_min = django_filters.NumberFilter(field_name='emi_amount', lookup_expr='gte')
    emi_max = django_filters.NumberFilter(field_name='emi_amount', lookup_expr='lte')
    
    # Status filters
    overdue = django_filters.BooleanFilter(method='filter_overdue')
    
    class Meta:
        model = Loan
        fields = [
            'type', 'status', 'currency', 'lender_contact', 'account',
            'start_date_from', 'start_date_to', 'end_date_from', 'end_date_to',
            'emi_date_from', 'emi_date_to', 'principal_min', 'principal_max',
            'emi_min', 'emi_max', 'overdue'
        ]
    
    def filter_overdue(self, queryset, name, value):
        """Filter loans that have overdue EMIs."""
        if value:
            overdue_ids = []
            for loan in queryset:
                if loan.is_overdue:
                    overdue_ids.append(loan.id)
            return queryset.filter(id__in=overdue_ids)
        return queryset


class ScheduledPaymentFilter(django_filters.FilterSet):
    """Filter for scheduled payments."""
    
    # Date range filters
    due_date_from = django_filters.DateFilter(field_name='next_due_date', lookup_expr='gte')
    due_date_to = django_filters.DateFilter(field_name='next_due_date', lookup_expr='lte')
    start_date_from = django_filters.DateFilter(field_name='start_date', lookup_expr='gte')
    start_date_to = django_filters.DateFilter(field_name='start_date', lookup_expr='lte')
    
    # Amount range filters
    amount_min = django_filters.NumberFilter(field_name='amount', lookup_expr='gte')
    amount_max = django_filters.NumberFilter(field_name='amount', lookup_expr='lte')
    
    # Status filters
    overdue = django_filters.BooleanFilter(method='filter_overdue')
    due_soon = django_filters.BooleanFilter(method='filter_due_soon')
    
    # Multiple choice filters
    tags = django_filters.ModelMultipleChoiceFilter(
        field_name='tags',
        to_field_name='id',
        queryset=None  # Will be set in __init__
    )
    
    class Meta:
        model = ScheduledPayment
        fields = [
            'frequency', 'status', 'currency', 'payee_contact', 'account', 'category',
            'auto_execute', 'due_date_from', 'due_date_to', 'start_date_from', 'start_date_to',
            'amount_min', 'amount_max', 'overdue', 'due_soon', 'tags'
        ]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if hasattr(self, 'request') and self.request.user.is_authenticated:
            from finance.models import Tag
            
            user = self.request.user
            self.filters['tags'].queryset = Tag.objects.filter(user=user, is_active=True)
    
    def filter_overdue(self, queryset, name, value):
        """Filter payments that are overdue."""
        if value:
            overdue_ids = []
            for payment in queryset:
                if payment.is_overdue:
                    overdue_ids.append(payment.id)
            return queryset.filter(id__in=overdue_ids)
        return queryset
    
    def filter_due_soon(self, queryset, name, value):
        """Filter payments that are due within the next 7 days."""
        if value:
            from django.utils import timezone
            from datetime import timedelta
            
            today = timezone.now().date()
            week_from_now = today + timedelta(days=7)
            return queryset.filter(next_due_date__gte=today, next_due_date__lte=week_from_now)
        return queryset


class StatementFilter(django_filters.FilterSet):
    """Filter for statements."""
    
    # Date range filters
    period_from = django_filters.DateFilter(field_name='period_start', lookup_expr='gte')
    period_to = django_filters.DateFilter(field_name='period_end', lookup_expr='lte')
    generated_from = django_filters.DateTimeFilter(field_name='generated_at', lookup_expr='gte')
    generated_to = django_filters.DateTimeFilter(field_name='generated_at', lookup_expr='lte')
    
    # Multiple choice filters
    accounts = django_filters.ModelMultipleChoiceFilter(
        field_name='accounts',
        to_field_name='id',
        queryset=None  # Will be set in __init__
    )
    
    categories = django_filters.ModelMultipleChoiceFilter(
        field_name='categories',
        to_field_name='id',
        queryset=None  # Will be set in __init__
    )
    
    class Meta:
        model = Statement
        fields = [
            'type', 'status', 'export_format', 'base_currency',
            'period_from', 'period_to', 'generated_from', 'generated_to',
            'accounts', 'categories'
        ]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if hasattr(self, 'request') and self.request.user.is_authenticated:
            from finance.models import Account, Category
            
            user = self.request.user
            self.filters['accounts'].queryset = Account.objects.filter(user=user, is_active=True)
            self.filters['categories'].queryset = Category.objects.filter(user=user, is_active=True)


class NotificationFilter(django_filters.FilterSet):
    """Filter for notifications."""
    
    # Date range filters
    created_from = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_to = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    scheduled_from = django_filters.DateTimeFilter(field_name='scheduled_at', lookup_expr='gte')
    scheduled_to = django_filters.DateTimeFilter(field_name='scheduled_at', lookup_expr='lte')
    
    # Status filters
    unread = django_filters.BooleanFilter(method='filter_unread')
    expired = django_filters.BooleanFilter(method='filter_expired')
    
    class Meta:
        model = Notification
        fields = [
            'type', 'channel', 'priority', 'status',
            'created_from', 'created_to', 'scheduled_from', 'scheduled_to',
            'unread', 'expired'
        ]
    
    def filter_unread(self, queryset, name, value):
        """Filter unread notifications."""
        if value:
            return queryset.filter(read_at__isnull=True)
        return queryset
    
    def filter_expired(self, queryset, name, value):
        """Filter expired notifications."""
        if value:
            from django.utils import timezone
            return queryset.filter(expires_at__lt=timezone.now())
        return queryset
