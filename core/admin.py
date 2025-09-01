from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import Currency, ExchangeRate, Profile, AuditLog


@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'symbol', 'decimal_places', 'is_default', 'is_active']
    list_filter = ['is_default', 'is_active', 'decimal_places']
    search_fields = ['code', 'name']
    ordering = ['code']
    list_editable = ['is_default', 'is_active']
    
    fieldsets = (
        (None, {
            'fields': ('code', 'name', 'symbol', 'decimal_places')
        }),
        ('Settings', {
            'fields': ('is_default', 'is_active')
        }),
    )


@admin.register(ExchangeRate)
class ExchangeRateAdmin(admin.ModelAdmin):
    list_display = ['from_currency', 'to_currency', 'rate', 'date', 'created_at']
    list_filter = ['from_currency', 'to_currency', 'date']
    search_fields = ['from_currency__code', 'to_currency__code']
    ordering = ['-date', 'from_currency__code']
    date_hierarchy = 'date'
    
    fieldsets = (
        (None, {
            'fields': ('from_currency', 'to_currency', 'rate', 'date')
        }),
    )


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile'
    fk_name = 'user'
    
    fieldsets = (
        ('Currency & Locale', {
            'fields': ('default_currency', 'locale', 'timezone')
        }),
        ('Financial Settings', {
            'fields': ('salary_day_of_month', 'monthly_budget_limit')
        }),
        ('Preferences', {
            'fields': ('notification_preferences',),
            'classes': ('collapse',)
        }),
    )


class CustomUserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)
    
    def get_inline_instances(self, request, obj=None):
        if not obj:
            return list()
        return super().get_inline_instances(request, obj)


# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'default_currency', 'locale', 'timezone', 'salary_day_of_month']
    list_filter = ['default_currency', 'locale', 'timezone']
    search_fields = ['user__username', 'user__email', 'user__first_name', 'user__last_name']
    ordering = ['user__username']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Currency & Locale', {
            'fields': ('default_currency', 'locale', 'timezone')
        }),
        ('Financial Settings', {
            'fields': ('salary_day_of_month', 'monthly_budget_limit')
        }),
        ('Preferences', {
            'fields': ('notification_preferences',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'entity_type', 'entity_id', 'action', 'created_at', 'ip_address']
    list_filter = ['action', 'entity_type', 'created_at']
    search_fields = ['user__username', 'entity_type', 'entity_id']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('user', 'entity_type', 'entity_id', 'action')
        }),
        ('Data', {
            'fields': ('snapshot_before', 'snapshot_after'),
            'classes': ('collapse',)
        }),
        ('Request Info', {
            'fields': ('ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
