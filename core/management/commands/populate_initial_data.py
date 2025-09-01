from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import Currency
from finance.models import Category
from contacts.models import Contact
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Populate initial data for the finance tracker'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting initial data population...'))
        
        with transaction.atomic():
            # Create currencies
            self.create_currencies()
            
            # Create default categories
            self.create_default_categories()
            
        self.stdout.write(self.style.SUCCESS('Initial data population completed!'))

    def create_currencies(self):
        """Create common currencies."""
        currencies = [
            {'code': 'USD', 'name': 'US Dollar', 'symbol': '$', 'decimal_places': 2, 'is_default': True},
            {'code': 'EUR', 'name': 'Euro', 'symbol': '€', 'decimal_places': 2},
            {'code': 'GBP', 'name': 'British Pound', 'symbol': '£', 'decimal_places': 2},
            {'code': 'JPY', 'name': 'Japanese Yen', 'symbol': '¥', 'decimal_places': 0},
            {'code': 'CAD', 'name': 'Canadian Dollar', 'symbol': 'C$', 'decimal_places': 2},
            {'code': 'AUD', 'name': 'Australian Dollar', 'symbol': 'A$', 'decimal_places': 2},
            {'code': 'CHF', 'name': 'Swiss Franc', 'symbol': 'CHF', 'decimal_places': 2},
            {'code': 'CNY', 'name': 'Chinese Yuan', 'symbol': '¥', 'decimal_places': 2},
            {'code': 'INR', 'name': 'Indian Rupee', 'symbol': '₹', 'decimal_places': 2},
            {'code': 'BRL', 'name': 'Brazilian Real', 'symbol': 'R$', 'decimal_places': 2},
        ]
        
        for currency_data in currencies:
            currency, created = Currency.objects.get_or_create(
                code=currency_data['code'],
                defaults=currency_data
            )
            if created:
                self.stdout.write(f'Created currency: {currency.code}')
            else:
                self.stdout.write(f'Currency already exists: {currency.code}')

    def create_default_categories(self):
        """Create default system categories."""
        # Note: We'll create these as system categories without a user
        # They can be copied to user accounts when they first register
        
        expense_categories = [
            {'name': 'Food & Dining', 'icon': '🍽️', 'color': '#F59E0B'},
            {'name': 'Groceries', 'icon': '🛒', 'color': '#10B981'},
            {'name': 'Transportation', 'icon': '🚗', 'color': '#3B82F6'},
            {'name': 'Fuel', 'icon': '⛽', 'color': '#EF4444'},
            {'name': 'Shopping', 'icon': '🛍️', 'color': '#EC4899'},
            {'name': 'Entertainment', 'icon': '🎬', 'color': '#8B5CF6'},
            {'name': 'Bills & Utilities', 'icon': '💡', 'color': '#F97316'},
            {'name': 'Healthcare', 'icon': '🏥', 'color': '#EF4444'},
            {'name': 'Insurance', 'icon': '🛡️', 'color': '#6B7280'},
            {'name': 'Education', 'icon': '📚', 'color': '#3B82F6'},
            {'name': 'Travel', 'icon': '✈️', 'color': '#06B6D4'},
            {'name': 'Home & Garden', 'icon': '🏠', 'color': '#84CC16'},
            {'name': 'Personal Care', 'icon': '💄', 'color': '#EC4899'},
            {'name': 'Subscriptions', 'icon': '📱', 'color': '#8B5CF6'},
            {'name': 'Taxes', 'icon': '📊', 'color': '#DC2626'},
            {'name': 'Investment', 'icon': '📈', 'color': '#059669'},
            {'name': 'Donations', 'icon': '🤝', 'color': '#7C3AED'},
            {'name': 'Miscellaneous', 'icon': '📦', 'color': '#6B7280'},
        ]
        
        income_categories = [
            {'name': 'Salary', 'icon': '💰', 'color': '#10B981'},
            {'name': 'Freelance', 'icon': '💼', 'color': '#3B82F6'},
            {'name': 'Business', 'icon': '🏢', 'color': '#F59E0B'},
            {'name': 'Investment Returns', 'icon': '📈', 'color': '#059669'},
            {'name': 'Rental Income', 'icon': '🏠', 'color': '#84CC16'},
            {'name': 'Interest', 'icon': '🏦', 'color': '#0EA5E9'},
            {'name': 'Dividends', 'icon': '💎', 'color': '#7C3AED'},
            {'name': 'Bonus', 'icon': '🎁', 'color': '#F59E0B'},
            {'name': 'Refund', 'icon': '💸', 'color': '#06B6D4'},
            {'name': 'Gift', 'icon': '🎉', 'color': '#EC4899'},
            {'name': 'Other Income', 'icon': '💵', 'color': '#6B7280'},
        ]
        
        transfer_categories = [
            {'name': 'Account Transfer', 'icon': '🔄', 'color': '#6B7280'},
            {'name': 'Savings Transfer', 'icon': '🏦', 'color': '#10B981'},
            {'name': 'Investment Transfer', 'icon': '📊', 'color': '#8B5CF6'},
        ]
        
        # Create expense categories
        for cat_data in expense_categories:
            cat_data.update({'kind': 'EXPENSE', 'is_system': True})
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                kind='EXPENSE',
                user_id=1,  # Will need to be updated when user system is ready
                defaults=cat_data
            )
            if created:
                self.stdout.write(f'Created expense category: {category.name}')
        
        # Create income categories
        for cat_data in income_categories:
            cat_data.update({'kind': 'INCOME', 'is_system': True})
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                kind='INCOME',
                user_id=1,  # Will need to be updated when user system is ready
                defaults=cat_data
            )
            if created:
                self.stdout.write(f'Created income category: {category.name}')
        
        # Create transfer categories
        for cat_data in transfer_categories:
            cat_data.update({'kind': 'TRANSFER', 'is_system': True})
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                kind='TRANSFER',
                user_id=1,  # Will need to be updated when user system is ready
                defaults=cat_data
            )
            if created:
                self.stdout.write(f'Created transfer category: {category.name}')
        
        self.stdout.write(self.style.SUCCESS('Default categories created!'))
