from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, Count
from django.utils import timezone
from django.contrib.auth.models import User
from datetime import datetime, timedelta
from decimal import Decimal

# Import models
from core.models import Currency, Profile
from contacts.models import Contact
from finance.models import Account, Category, Tag, Transaction, Budget, IncomeSource
from loans.models import Loan, EMIPayment
from scheduling.models import ScheduledPayment, ScheduledPaymentExecution
from statements.models import Statement
from notifications.models import Notification

# Import serializers
from .serializers import (
    UserSerializer, CurrencySerializer, ProfileSerializer, ContactSerializer,
    AccountSerializer, CategorySerializer, TagSerializer, TransactionSerializer,
    BudgetSerializer, IncomeSourceSerializer, LoanSerializer, EMIPaymentSerializer,
    ScheduledPaymentSerializer, ScheduledPaymentExecutionSerializer,
    StatementSerializer, NotificationSerializer
)

# Import filters
from .filters import (
    TransactionFilter, BudgetFilter, LoanFilter, 
    ScheduledPaymentFilter, StatementFilter, NotificationFilter
)


class BaseUserViewSet(viewsets.ModelViewSet):
    """Base viewset that filters by user and provides common functionality."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter queryset by current user."""
        return self.queryset.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Set user to current user when creating."""
        serializer.save(user=self.request.user)


class CurrencyViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only viewset for currencies."""
    queryset = Currency.objects.filter(is_active=True)
    serializer_class = CurrencySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['code', 'name']


class ProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for user profiles."""
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Profile.objects.filter(user=self.request.user)
    
    def get_object(self):
        """Get or create profile for current user."""
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return profile
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user's profile."""
        profile = self.get_object()
        serializer = self.get_serializer(profile)
        return Response(serializer.data)


class ContactViewSet(BaseUserViewSet):
    """ViewSet for contacts."""
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'is_favorite']
    search_fields = ['name', 'email', 'phone']
    ordering_fields = ['name', 'created_at', 'transaction_count']
    ordering = ['name']


class AccountViewSet(BaseUserViewSet):
    """ViewSet for accounts."""
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'currency', 'is_default', 'include_in_totals']
    search_fields = ['name', 'bank_name', 'account_number']
    ordering_fields = ['name', 'current_balance', 'created_at']
    ordering = ['name']
    
    @action(detail=True, methods=['post'])
    def update_balance(self, request, pk=None):
        """Manually update account balance."""
        account = self.get_object()
        account.update_balance()
        return Response({'balance': account.current_balance})


class CategoryViewSet(BaseUserViewSet):
    """ViewSet for categories."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['kind', 'parent']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'kind', 'created_at']
    ordering = ['kind', 'name']


class TagViewSet(BaseUserViewSet):
    """ViewSet for tags."""
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class TransactionViewSet(BaseUserViewSet):
    """ViewSet for transactions."""
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TransactionFilter
    search_fields = ['description', 'note']
    ordering_fields = ['occurred_at', 'amount', 'created_at']
    ordering = ['-occurred_at']
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Create multiple transactions at once."""
        transactions_data = request.data
        if not isinstance(transactions_data, list):
            return Response(
                {'error': 'Expected a list of transactions'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=transactions_data, many=True)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Update multiple transactions at once."""
        updates = request.data
        if not isinstance(updates, list):
            return Response(
                {'error': 'Expected a list of transaction updates'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated_transactions = []
        for update_data in updates:
            transaction_id = update_data.get('id')
            if not transaction_id:
                continue
                
            try:
                transaction = self.get_queryset().get(id=transaction_id)
                serializer = self.get_serializer(transaction, data=update_data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    updated_transactions.append(serializer.data)
            except Transaction.DoesNotExist:
                continue
        
        return Response(updated_transactions)
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Soft delete multiple transactions at once."""
        transaction_ids = request.data.get('ids', [])
        if not transaction_ids:
            return Response(
                {'error': 'No transaction IDs provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        transactions = self.get_queryset().filter(id__in=transaction_ids)
        count = transactions.count()
        
        # Soft delete
        transactions.update(is_active=False)
        
        return Response({'deleted': count})


class BudgetViewSet(BaseUserViewSet):
    """ViewSet for budgets."""
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = BudgetFilter
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'start_date', 'end_date', 'created_at']
    ordering = ['-start_date']
    
    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        """Get detailed budget progress."""
        budget = self.get_object()
        
        progress_data = {
            'budget_id': budget.id,
            'name': budget.name,
            'period': f"{budget.start_date} to {budget.end_date}",
            'limit_amount': budget.limit_amount,
            'spent_amount': budget.spent_amount,
            'remaining_amount': budget.remaining_amount,
            'usage_percentage': budget.usage_percentage,
            'is_over_budget': budget.is_over_budget,
            'should_alert': budget.should_alert,
            'daily_average': budget.spent_amount / ((budget.end_date - budget.start_date).days + 1),
        }
        
        # Add category breakdown
        from django.db.models import Sum
        category_spending = Transaction.objects.filter(
            user=request.user,
            type='EXPENSE',
            occurred_at__gte=budget.start_date,
            occurred_at__lte=budget.end_date,
            category__in=budget.categories.all(),
            is_active=True
        ).values('category__name').annotate(
            total=Sum('amount_base')
        ).order_by('-total')
        
        progress_data['category_breakdown'] = list(category_spending)
        
        return Response(progress_data)


class IncomeSourceViewSet(BaseUserViewSet):
    """ViewSet for income sources."""
    queryset = IncomeSource.objects.all()
    serializer_class = IncomeSourceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['frequency', 'is_active', 'payer_contact', 'account']
    search_fields = ['name']
    ordering_fields = ['name', 'next_expected_date', 'expected_amount', 'created_at']
    ordering = ['next_expected_date']


class LoanViewSet(BaseUserViewSet):
    """ViewSet for loans."""
    queryset = Loan.objects.all()
    serializer_class = LoanSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = LoanFilter
    search_fields = ['name', 'loan_account_number']
    ordering_fields = ['name', 'next_emi_date', 'outstanding_principal', 'created_at']
    ordering = ['next_emi_date']
    
    @action(detail=True, methods=['get'])
    def amortization(self, request, pk=None):
        """Get loan amortization schedule."""
        loan = self.get_object()
        schedule = loan.generate_amortization_schedule()
        return Response({'schedule': schedule})
    
    @action(detail=True, methods=['post'])
    def make_payment(self, request, pk=None):
        """Record a loan payment."""
        loan = self.get_object()
        amount = request.data.get('amount')
        payment_date = request.data.get('payment_date')
        extra_principal = request.data.get('extra_principal', 0)
        
        if not amount:
            return Response(
                {'error': 'Payment amount is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            payment = loan.make_payment(
                amount=Decimal(str(amount)),
                payment_date=datetime.strptime(payment_date, '%Y-%m-%d').date() if payment_date else None,
                extra_principal=Decimal(str(extra_principal))
            )
            
            serializer = EMIPaymentSerializer(payment)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class EMIPaymentViewSet(BaseUserViewSet):
    """ViewSet for EMI payments."""
    queryset = EMIPayment.objects.all()
    serializer_class = EMIPaymentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['loan', 'payment_date']
    search_fields = ['reference_number', 'notes']
    ordering_fields = ['payment_date', 'amount_paid', 'created_at']
    ordering = ['-payment_date']


class ScheduledPaymentViewSet(BaseUserViewSet):
    """ViewSet for scheduled payments."""
    queryset = ScheduledPayment.objects.all()
    serializer_class = ScheduledPaymentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ScheduledPaymentFilter
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'next_due_date', 'amount', 'created_at']
    ordering = ['next_due_date']
    
    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """Execute a scheduled payment now."""
        scheduled_payment = self.get_object()
        
        try:
            execution = scheduled_payment.execute_payment(
                execution_date=timezone.now().date(),
                amount=request.data.get('amount'),
                note=request.data.get('note')
            )
            
            serializer = ScheduledPaymentExecutionSerializer(execution)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def upcoming(self, request, pk=None):
        """Get upcoming payment dates."""
        scheduled_payment = self.get_object()
        count = int(request.query_params.get('count', 12))
        upcoming_dates = scheduled_payment.get_upcoming_dates(count)
        
        return Response({
            'upcoming_dates': [date.isoformat() for date in upcoming_dates]
        })


class ScheduledPaymentExecutionViewSet(BaseUserViewSet):
    """ViewSet for scheduled payment executions."""
    queryset = ScheduledPaymentExecution.objects.all()
    serializer_class = ScheduledPaymentExecutionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['scheduled_payment', 'execution_date', 'auto_executed']
    search_fields = ['notes']
    ordering_fields = ['execution_date', 'amount', 'created_at']
    ordering = ['-execution_date']


class StatementViewSet(BaseUserViewSet):
    """ViewSet for statements."""
    queryset = Statement.objects.all()
    serializer_class = StatementSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = StatementFilter
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'period_start', 'period_end', 'created_at']
    ordering = ['-period_end']
    
    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        """Start statement generation."""
        statement = self.get_object()
        
        if statement.status != 'PENDING':
            return Response(
                {'error': 'Statement is already being processed or completed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        statement.start_generation()
        
        return Response({
            'message': 'Statement generation started',
            'status': statement.status
        })
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download generated statement file."""
        statement = self.get_object()
        
        if not statement.is_ready:
            return Response(
                {'error': 'Statement is not ready for download'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.http import HttpResponse
        
        response = HttpResponse(
            statement.file.read(),
            content_type='application/octet-stream'
        )
        response['Content-Disposition'] = f'attachment; filename="{statement.file.name}"'
        return response


class NotificationViewSet(BaseUserViewSet):
    """ViewSet for notifications."""
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = NotificationFilter
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'scheduled_at', 'priority']
    ordering = ['-created_at']
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read."""
        notification = self.get_object()
        notification.mark_as_read()
        
        return Response({
            'message': 'Notification marked as read',
            'read_at': notification.read_at
        })
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read."""
        self.get_queryset().filter(read_at__isnull=True).update(
            read_at=timezone.now(),
            status='READ'
        )
        
        return Response({'message': 'All notifications marked as read'})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications."""
        count = self.get_queryset().filter(read_at__isnull=True).count()
        return Response({'count': count})


class DashboardViewSet(viewsets.ViewSet):
    """ViewSet for dashboard summary data."""
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get dashboard summary statistics."""
        user = request.user
        today = timezone.now().date()
        
        # Date range (default: current month)
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date:
            start_date = today.replace(day=1)
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            
        if not end_date:
            from calendar import monthrange
            _, last_day = monthrange(today.year, today.month)
            end_date = today.replace(day=last_day)
        else:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Get transactions for the period
        transactions = Transaction.objects.filter(
            user=user,
            occurred_at__gte=start_date,
            occurred_at__lte=end_date,
            is_active=True
        )
        
        # Calculate totals
        total_income = transactions.filter(type='INCOME').aggregate(
            total=Sum('amount_base')
        )['total'] or Decimal('0')
        
        total_expenses = transactions.filter(type='EXPENSE').aggregate(
            total=Sum('amount_base')
        )['total'] or Decimal('0')
        
        net_flow = total_income - total_expenses
        
        # Account balances
        accounts = Account.objects.filter(user=user, is_active=True, include_in_totals=True)
        total_balance = accounts.aggregate(total=Sum('current_balance'))['total'] or Decimal('0')
        
        # Category breakdown
        category_spending = transactions.filter(type='EXPENSE').values(
            'category__name', 'category__color'
        ).annotate(
            total=Sum('amount_base'),
            count=Count('id')
        ).order_by('-total')[:10]
        
        # Recent transactions
        recent_transactions = TransactionSerializer(
            transactions.order_by('-occurred_at')[:10],
            many=True
        ).data
        
        # Upcoming payments
        upcoming_payments = ScheduledPayment.objects.filter(
            user=user,
            status='ACTIVE',
            next_due_date__gte=today,
            next_due_date__lte=today + timedelta(days=7)
        ).order_by('next_due_date')[:5]
        
        upcoming_payments_data = ScheduledPaymentSerializer(upcoming_payments, many=True).data
        
        # Budget alerts
        budgets = Budget.objects.filter(
            user=user,
            is_active=True,
            start_date__lte=today,
            end_date__gte=today
        )
        
        budget_alerts = []
        for budget in budgets:
            if budget.should_alert or budget.is_over_budget:
                budget_alerts.append({
                    'id': budget.id,
                    'name': budget.name,
                    'usage_percentage': budget.usage_percentage,
                    'is_over_budget': budget.is_over_budget,
                    'spent_amount': budget.spent_amount,
                    'limit_amount': budget.limit_amount,
                })
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date,
            },
            'totals': {
                'income': total_income,
                'expenses': total_expenses,
                'net_flow': net_flow,
                'total_balance': total_balance,
            },
            'category_breakdown': list(category_spending),
            'recent_transactions': recent_transactions,
            'upcoming_payments': upcoming_payments_data,
            'budget_alerts': budget_alerts,
            'account_balances': [
                {
                    'name': account.name,
                    'balance': account.current_balance,
                    'type': account.type,
                    'currency': account.currency.code,
                }
                for account in accounts
            ],
        })
