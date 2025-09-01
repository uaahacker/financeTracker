from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import Currency, Profile
from contacts.models import Contact
from finance.models import Account, Category, Tag, Transaction, Budget, IncomeSource
from loans.models import Loan, EMIPayment
from scheduling.models import ScheduledPayment, ScheduledPaymentExecution
from statements.models import Statement
from notifications.models import Notification


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ['id', 'code', 'name', 'symbol', 'decimal_places', 'is_default']


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    default_currency = CurrencySerializer(read_only=True)
    default_currency_id = serializers.PrimaryKeyRelatedField(
        queryset=Currency.objects.all(), 
        source='default_currency', 
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Profile
        fields = [
            'id', 'user', 'default_currency', 'default_currency_id',
            'locale', 'timezone', 'salary_day_of_month', 'monthly_budget_limit',
            'notification_preferences', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class ContactSerializer(serializers.ModelSerializer):
    transaction_count = serializers.ReadOnlyField()
    total_spent = serializers.ReadOnlyField()
    total_received = serializers.ReadOnlyField()
    
    class Meta:
        model = Contact
        fields = [
            'id', 'name', 'type', 'email', 'phone', 'address', 'website',
            'notes', 'tax_id', 'is_favorite', 'tags',
            'transaction_count', 'total_spent', 'total_received',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AccountSerializer(serializers.ModelSerializer):
    currency = CurrencySerializer(read_only=True)
    currency_id = serializers.PrimaryKeyRelatedField(
        queryset=Currency.objects.all(),
        source='currency',
        write_only=True
    )
    available_balance = serializers.ReadOnlyField()
    
    class Meta:
        model = Account
        fields = [
            'id', 'name', 'type', 'currency', 'currency_id',
            'opening_balance', 'current_balance', 'available_balance',
            'bank_name', 'account_number', 'routing_number', 'credit_limit',
            'description', 'is_default', 'include_in_totals',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'current_balance', 'created_at', 'updated_at']


class CategorySerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    transaction_count = serializers.ReadOnlyField()
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'kind', 'color', 'icon', 'description',
            'parent', 'parent_name', 'full_name', 'is_system', 'transaction_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_system', 'created_at', 'updated_at']


class TagSerializer(serializers.ModelSerializer):
    transaction_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Tag
        fields = [
            'id', 'name', 'color', 'description', 'transaction_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TransactionSerializer(serializers.ModelSerializer):
    account = AccountSerializer(read_only=True)
    account_id = serializers.PrimaryKeyRelatedField(
        queryset=Account.objects.all(),
        source='account',
        write_only=True
    )
    currency = CurrencySerializer(read_only=True)
    currency_id = serializers.PrimaryKeyRelatedField(
        queryset=Currency.objects.all(),
        source='currency',
        write_only=True
    )
    contact = ContactSerializer(read_only=True)
    contact_id = serializers.PrimaryKeyRelatedField(
        queryset=Contact.objects.all(),
        source='contact',
        write_only=True,
        required=False,
        allow_null=True
    )
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True
    )
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        source='tags',
        many=True,
        write_only=True,
        required=False
    )
    transfer_to_account = AccountSerializer(read_only=True)
    transfer_to_account_id = serializers.PrimaryKeyRelatedField(
        queryset=Account.objects.all(),
        source='transfer_to_account',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'account', 'account_id', 'type', 'amount', 'currency', 'currency_id',
            'fx_rate', 'amount_base', 'description', 'note',
            'contact', 'contact_id', 'category', 'category_id',
            'tags', 'tag_ids', 'transfer_to_account', 'transfer_to_account_id',
            'occurred_at', 'is_recurring', 'recurrence_rule', 'parent_transaction',
            'attachment', 'is_reconciled', 'reconciled_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'amount_base', 'created_at', 'updated_at']
    
    def validate(self, data):
        if data.get('type') == 'TRANSFER' and not data.get('transfer_to_account'):
            raise serializers.ValidationError("Transfer transactions require a transfer_to_account")
        return data


class BudgetSerializer(serializers.ModelSerializer):
    currency = CurrencySerializer(read_only=True)
    currency_id = serializers.PrimaryKeyRelatedField(
        queryset=Currency.objects.all(),
        source='currency',
        write_only=True
    )
    categories = CategorySerializer(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='categories',
        many=True,
        write_only=True
    )
    accounts = AccountSerializer(many=True, read_only=True)
    account_ids = serializers.PrimaryKeyRelatedField(
        queryset=Account.objects.all(),
        source='accounts',
        many=True,
        write_only=True,
        required=False
    )
    spent_amount = serializers.ReadOnlyField()
    remaining_amount = serializers.ReadOnlyField()
    usage_percentage = serializers.ReadOnlyField()
    is_over_budget = serializers.ReadOnlyField()
    should_alert = serializers.ReadOnlyField()
    
    class Meta:
        model = Budget
        fields = [
            'id', 'name', 'period', 'limit_amount', 'currency', 'currency_id',
            'start_date', 'end_date', 'categories', 'category_ids',
            'accounts', 'account_ids', 'roll_over', 'alert_threshold',
            'spent_amount', 'remaining_amount', 'usage_percentage',
            'is_over_budget', 'should_alert', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class IncomeSourceSerializer(serializers.ModelSerializer):
    payer_contact = ContactSerializer(read_only=True)
    payer_contact_id = serializers.PrimaryKeyRelatedField(
        queryset=Contact.objects.all(),
        source='payer_contact',
        write_only=True,
        required=False,
        allow_null=True
    )
    currency = CurrencySerializer(read_only=True)
    currency_id = serializers.PrimaryKeyRelatedField(
        queryset=Currency.objects.all(),
        source='currency',
        write_only=True
    )
    account = AccountSerializer(read_only=True)
    account_id = serializers.PrimaryKeyRelatedField(
        queryset=Account.objects.all(),
        source='account',
        write_only=True
    )
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True
    )
    is_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = IncomeSource
        fields = [
            'id', 'name', 'payer_contact', 'payer_contact_id',
            'frequency', 'expected_amount', 'currency', 'currency_id',
            'account', 'account_id', 'category', 'category_id',
            'next_expected_date', 'last_received_date',
            'auto_create_transaction', 'reminder_days_before',
            'is_overdue', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LoanSerializer(serializers.ModelSerializer):
    lender_contact = ContactSerializer(read_only=True)
    lender_contact_id = serializers.PrimaryKeyRelatedField(
        queryset=Contact.objects.all(),
        source='lender_contact',
        write_only=True
    )
    account = AccountSerializer(read_only=True)
    account_id = serializers.PrimaryKeyRelatedField(
        queryset=Account.objects.all(),
        source='account',
        write_only=True
    )
    currency = CurrencySerializer(read_only=True)
    currency_id = serializers.PrimaryKeyRelatedField(
        queryset=Currency.objects.all(),
        source='currency',
        write_only=True
    )
    total_interest = serializers.ReadOnlyField()
    total_amount = serializers.ReadOnlyField()
    paid_percentage = serializers.ReadOnlyField()
    remaining_emis = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = Loan
        fields = [
            'id', 'name', 'type', 'lender_contact', 'lender_contact_id',
            'account', 'account_id', 'principal_amount', 'currency', 'currency_id',
            'interest_rate_annual', 'start_date', 'end_date', 'term_months',
            'emi_amount', 'emi_day', 'next_emi_date',
            'outstanding_principal', 'total_paid', 'status',
            'total_interest', 'total_amount', 'paid_percentage', 'remaining_emis',
            'is_overdue', 'auto_create_emi', 'reminder_days_before',
            'loan_account_number', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'emi_amount', 'created_at', 'updated_at']


class EMIPaymentSerializer(serializers.ModelSerializer):
    loan = LoanSerializer(read_only=True)
    loan_id = serializers.PrimaryKeyRelatedField(
        queryset=Loan.objects.all(),
        source='loan',
        write_only=True
    )
    is_regular_emi = serializers.ReadOnlyField()
    is_prepayment = serializers.ReadOnlyField()
    
    class Meta:
        model = EMIPayment
        fields = [
            'id', 'loan', 'loan_id', 'payment_date', 'amount_paid',
            'principal_portion', 'interest_portion', 'extra_principal',
            'outstanding_balance', 'transaction', 'payment_method',
            'reference_number', 'notes', 'is_regular_emi', 'is_prepayment',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ScheduledPaymentSerializer(serializers.ModelSerializer):
    payee_contact = ContactSerializer(read_only=True)
    payee_contact_id = serializers.PrimaryKeyRelatedField(
        queryset=Contact.objects.all(),
        source='payee_contact',
        write_only=True
    )
    account = AccountSerializer(read_only=True)
    account_id = serializers.PrimaryKeyRelatedField(
        queryset=Account.objects.all(),
        source='account',
        write_only=True
    )
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True
    )
    currency = CurrencySerializer(read_only=True)
    currency_id = serializers.PrimaryKeyRelatedField(
        queryset=Currency.objects.all(),
        source='currency',
        write_only=True
    )
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        source='tags',
        many=True,
        write_only=True,
        required=False
    )
    is_overdue = serializers.ReadOnlyField()
    days_until_due = serializers.ReadOnlyField()
    should_send_reminder = serializers.ReadOnlyField()
    
    class Meta:
        model = ScheduledPayment
        fields = [
            'id', 'name', 'description', 'payee_contact', 'payee_contact_id',
            'account', 'account_id', 'category', 'category_id',
            'amount', 'currency', 'currency_id', 'frequency', 'recurrence_rule',
            'start_date', 'end_date', 'next_due_date', 'last_executed_date',
            'auto_execute', 'reminder_days_before', 'status',
            'max_occurrences', 'execution_count', 'tags', 'tag_ids', 'notes',
            'is_overdue', 'days_until_due', 'should_send_reminder',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'execution_count', 'created_at', 'updated_at']


class ScheduledPaymentExecutionSerializer(serializers.ModelSerializer):
    scheduled_payment = ScheduledPaymentSerializer(read_only=True)
    transaction = TransactionSerializer(read_only=True)
    
    class Meta:
        model = ScheduledPaymentExecution
        fields = [
            'id', 'scheduled_payment', 'transaction', 'execution_date',
            'amount', 'auto_executed', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StatementSerializer(serializers.ModelSerializer):
    base_currency = CurrencySerializer(read_only=True)
    base_currency_id = serializers.PrimaryKeyRelatedField(
        queryset=Currency.objects.all(),
        source='base_currency',
        write_only=True
    )
    accounts = AccountSerializer(many=True, read_only=True)
    account_ids = serializers.PrimaryKeyRelatedField(
        queryset=Account.objects.all(),
        source='accounts',
        many=True,
        write_only=True,
        required=False
    )
    categories = CategorySerializer(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='categories',
        many=True,
        write_only=True,
        required=False
    )
    contacts = ContactSerializer(many=True, read_only=True)
    contact_ids = serializers.PrimaryKeyRelatedField(
        queryset=Contact.objects.all(),
        source='contacts',
        many=True,
        write_only=True,
        required=False
    )
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        source='tags',
        many=True,
        write_only=True,
        required=False
    )
    file_url = serializers.ReadOnlyField()
    is_ready = serializers.ReadOnlyField()
    
    class Meta:
        model = Statement
        fields = [
            'id', 'name', 'type', 'description', 'period_start', 'period_end',
            'accounts', 'account_ids', 'categories', 'category_ids',
            'contacts', 'contact_ids', 'tags', 'tag_ids',
            'base_currency', 'base_currency_id', 'include_transfers', 'include_inactive',
            'export_format', 'include_charts', 'include_attachments',
            'status', 'generated_at', 'file', 'file_url', 'file_size',
            'summary_data', 'generation_time_seconds', 'transaction_count',
            'error_message', 'is_ready',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'status', 'generated_at', 'file', 'file_size',
            'summary_data', 'generation_time_seconds', 'transaction_count',
            'error_message', 'created_at', 'updated_at'
        ]


class NotificationSerializer(serializers.ModelSerializer):
    is_read = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    can_retry = serializers.ReadOnlyField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'title', 'message', 'channel', 'priority',
            'scheduled_at', 'expires_at', 'status', 'sent_at', 'delivered_at', 'read_at',
            'delivery_attempts', 'max_attempts', 'last_attempt_at', 'error_message',
            'related_object_type', 'related_object_id', 'data', 'action_buttons',
            'is_read', 'is_expired', 'can_retry',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'status', 'sent_at', 'delivered_at', 'read_at',
            'delivery_attempts', 'last_attempt_at', 'error_message',
            'created_at', 'updated_at'
        ]
