from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from .views import (
    CurrencyViewSet,
    ProfileViewSet,
    ContactViewSet,
    AccountViewSet,
    CategoryViewSet,
    TagViewSet,
    TransactionViewSet,
    BudgetViewSet,
    IncomeSourceViewSet,
    LoanViewSet,
    EMIPaymentViewSet,
    ScheduledPaymentViewSet,
    ScheduledPaymentExecutionViewSet,
    StatementViewSet,
    NotificationViewSet,
    DashboardViewSet,
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'currencies', CurrencyViewSet)
router.register(r'profile', ProfileViewSet, basename='profile')
router.register(r'contacts', ContactViewSet)
router.register(r'accounts', AccountViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'tags', TagViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'budgets', BudgetViewSet)
router.register(r'income-sources', IncomeSourceViewSet)
router.register(r'loans', LoanViewSet)
router.register(r'emi-payments', EMIPaymentViewSet)
router.register(r'scheduled-payments', ScheduledPaymentViewSet)
router.register(r'scheduled-payment-executions', ScheduledPaymentExecutionViewSet)
router.register(r'statements', StatementViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

app_name = 'api'

urlpatterns = [
    # API Authentication
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # API Documentation
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='api:schema'), name='swagger-ui'),
    path('redoc/', SpectacularRedocView.as_view(url_name='api:schema'), name='redoc'),
    
    # API Routes
    path('', include(router.urls)),
]
