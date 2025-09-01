#!/usr/bin/env python
"""
Demo script to test the Finance Tracker API functionality.
This script demonstrates the key features of the finance tracker.
"""

import os
import sys
import django
import requests
import json
from datetime import datetime, date, timedelta
from decimal import Decimal

# Setup Django environment
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'financetracker.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Currency, Profile
from finance.models import Account, Category, Tag, Transaction, Budget
from contacts.models import Contact


class FinanceTrackerDemo:
    def __init__(self):
        self.base_url = 'http://127.0.0.1:8000/api/v1'
        self.token = None
        self.headers = {}
        
    def authenticate(self, username='admin', password='admin'):
        """Authenticate and get JWT token."""
        print("🔐 Authenticating...")
        
        response = requests.post(f'{self.base_url}/auth/login/', json={
            'username': username,
            'password': password
        })
        
        if response.status_code == 200:
            data = response.json()
            self.token = data['access']
            self.headers = {'Authorization': f'Bearer {self.token}'}
            print(f"✅ Authentication successful!")
            return True
        else:
            print(f"❌ Authentication failed: {response.text}")
            return False
    
    def create_demo_user_data(self):
        """Create demo user data directly in the database."""
        print("\n📝 Creating demo user data...")
        
        # Get or create demo user
        user, created = User.objects.get_or_create(
            username='demo_user',
            defaults={
                'email': 'demo@example.com',
                'first_name': 'Demo',
                'last_name': 'User',
            }
        )
        if created:
            user.set_password('demo123')
            user.save()
            print(f"✅ Created demo user: {user.username}")
        
        # Create profile
        usd_currency = Currency.objects.get(code='USD')
        profile, created = Profile.objects.get_or_create(
            user=user,
            defaults={
                'default_currency': usd_currency,
                'timezone': 'UTC',
                'salary_day_of_month': 1,
            }
        )
        if created:
            print(f"✅ Created profile for {user.username}")
        
        # Create demo contacts
        bank_contact, _ = Contact.objects.get_or_create(
            user=user,
            name='Chase Bank',
            defaults={
                'type': 'BANK',
                'email': 'support@chase.com',
                'phone': '+1-800-CHASE',
            }
        )
        
        grocery_contact, _ = Contact.objects.get_or_create(
            user=user,
            name='Whole Foods',
            defaults={
                'type': 'MERCHANT',
                'address': '123 Market St, City, State',
            }
        )
        
        employer_contact, _ = Contact.objects.get_or_create(
            user=user,
            name='Tech Corp Inc',
            defaults={
                'type': 'EMPLOYER',
                'email': 'hr@techcorp.com',
            }
        )
        
        print(f"✅ Created {Contact.objects.filter(user=user).count()} contacts")
        
        # Create demo accounts
        checking_account, _ = Account.objects.get_or_create(
            user=user,
            name='Chase Checking',
            defaults={
                'type': 'BANK',
                'currency': usd_currency,
                'opening_balance': Decimal('2500.00'),
                'current_balance': Decimal('2500.00'),
                'bank_name': 'Chase Bank',
                'account_number': '****1234',
                'is_default': True,
            }
        )
        
        savings_account, _ = Account.objects.get_or_create(
            user=user,
            name='Chase Savings',
            defaults={
                'type': 'SAVINGS',
                'currency': usd_currency,
                'opening_balance': Decimal('10000.00'),
                'current_balance': Decimal('10000.00'),
                'bank_name': 'Chase Bank',
                'account_number': '****5678',
            }
        )
        
        credit_card, _ = Account.objects.get_or_create(
            user=user,
            name='Chase Credit Card',
            defaults={
                'type': 'CREDIT_CARD',
                'currency': usd_currency,
                'opening_balance': Decimal('0.00'),
                'current_balance': Decimal('-450.00'),
                'credit_limit': Decimal('5000.00'),
                'bank_name': 'Chase Bank',
                'account_number': '****9999',
            }
        )
        
        print(f"✅ Created {Account.objects.filter(user=user).count()} accounts")
        
        # Create demo tags
        essential_tag, _ = Tag.objects.get_or_create(
            user=user,
            name='Essential',
            defaults={'color': '#EF4444', 'description': 'Essential expenses'}
        )
        
        recurring_tag, _ = Tag.objects.get_or_create(
            user=user,
            name='Recurring',
            defaults={'color': '#3B82F6', 'description': 'Recurring payments'}
        )
        
        print(f"✅ Created {Tag.objects.filter(user=user).count()} tags")
        
        # Create demo transactions
        grocery_category = Category.objects.filter(user=user, name='Groceries').first()
        salary_category = Category.objects.filter(user=user, name='Salary').first()
        fuel_category = Category.objects.filter(user=user, name='Fuel').first()
        
        if grocery_category and salary_category and fuel_category:
            # Salary transaction
            salary_transaction, _ = Transaction.objects.get_or_create(
                user=user,
                account=checking_account,
                type='INCOME',
                amount=Decimal('5000.00'),
                currency=usd_currency,
                description='Monthly Salary',
                defaults={
                    'category': salary_category,
                    'contact': employer_contact,
                    'occurred_at': datetime.now().replace(day=1),
                    'note': 'Salary for current month',
                }
            )
            
            # Grocery transactions
            for i in range(5):
                Transaction.objects.get_or_create(
                    user=user,
                    account=checking_account,
                    type='EXPENSE',
                    amount=Decimal(f'{85 + i * 10}.{i*15:02d}'),
                    currency=usd_currency,
                    description=f'Grocery Shopping #{i+1}',
                    defaults={
                        'category': grocery_category,
                        'contact': grocery_contact,
                        'occurred_at': datetime.now() - timedelta(days=i*7),
                        'note': f'Weekly grocery shopping trip {i+1}',
                    }
                )
            
            # Fuel transactions
            for i in range(3):
                Transaction.objects.get_or_create(
                    user=user,
                    account=credit_card,
                    type='EXPENSE',
                    amount=Decimal(f'{45 + i * 5}.{i*25:02d}'),
                    currency=usd_currency,
                    description=f'Gas Station Fill-up #{i+1}',
                    defaults={
                        'category': fuel_category,
                        'occurred_at': datetime.now() - timedelta(days=i*10),
                        'note': f'Fuel purchase {i+1}',
                    }
                )
        
        print(f"✅ Created {Transaction.objects.filter(user=user).count()} transactions")
        
        # Create demo budget
        if grocery_category:
            budget, _ = Budget.objects.get_or_create(
                user=user,
                name='Monthly Grocery Budget',
                defaults={
                    'period': 'MONTHLY',
                    'limit_amount': Decimal('400.00'),
                    'currency': usd_currency,
                    'start_date': date.today().replace(day=1),
                    'end_date': date.today().replace(day=28),
                    'alert_threshold': Decimal('80.00'),
                }
            )
            budget.categories.add(grocery_category)
            budget.accounts.add(checking_account, credit_card)
            print(f"✅ Created budget: {budget.name}")
        
        print(f"🎉 Demo data creation completed for user: {user.username}")
        return user
    
    def test_api_endpoints(self):
        """Test various API endpoints."""
        print("\n🧪 Testing API endpoints...")
        
        # Test dashboard
        print("\n📊 Testing dashboard...")
        response = requests.get(f'{self.base_url}/dashboard/summary/', headers=self.headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Dashboard data retrieved:")
            print(f"   💰 Total Income: ${data['totals']['income']}")
            print(f"   💸 Total Expenses: ${data['totals']['expenses']}")
            print(f"   💳 Net Flow: ${data['totals']['net_flow']}")
            print(f"   🏦 Total Balance: ${data['totals']['total_balance']}")
        else:
            print(f"❌ Dashboard failed: {response.status_code}")
        
        # Test accounts
        print("\n🏦 Testing accounts...")
        response = requests.get(f'{self.base_url}/accounts/', headers=self.headers)
        if response.status_code == 200:
            accounts = response.json()['results']
            print(f"✅ Retrieved {len(accounts)} accounts:")
            for account in accounts:
                print(f"   {account['name']}: ${account['current_balance']} {account['currency']['code']}")
        else:
            print(f"❌ Accounts failed: {response.status_code}")
        
        # Test transactions with filters
        print("\n💳 Testing transactions...")
        response = requests.get(f'{self.base_url}/transactions/?type=EXPENSE&page_size=5', headers=self.headers)
        if response.status_code == 200:
            transactions = response.json()['results']
            print(f"✅ Retrieved {len(transactions)} expense transactions:")
            for transaction in transactions:
                print(f"   {transaction['description']}: ${transaction['amount']} on {transaction['occurred_at'][:10]}")
        else:
            print(f"❌ Transactions failed: {response.status_code}")
        
        # Test budgets
        print("\n💰 Testing budgets...")
        response = requests.get(f'{self.base_url}/budgets/', headers=self.headers)
        if response.status_code == 200:
            budgets = response.json()['results']
            print(f"✅ Retrieved {len(budgets)} budgets:")
            for budget in budgets:
                print(f"   {budget['name']}: ${budget['spent_amount']}/${budget['limit_amount']} ({budget['usage_percentage']:.1f}%)")
        else:
            print(f"❌ Budgets failed: {response.status_code}")
        
        # Test creating a new transaction via API
        print("\n➕ Testing transaction creation...")
        new_transaction = {
            'account_id': 1,  # Assuming first account
            'type': 'EXPENSE',
            'amount': '25.99',
            'currency_id': 1,  # USD
            'description': 'API Test Transaction',
            'category_id': 1,  # Assuming first category
            'occurred_at': datetime.now().isoformat(),
            'note': 'Created via API test'
        }
        
        response = requests.post(f'{self.base_url}/transactions/', 
                               json=new_transaction, headers=self.headers)
        if response.status_code == 201:
            transaction = response.json()
            print(f"✅ Created transaction: {transaction['description']} (ID: {transaction['id']})")
        else:
            print(f"❌ Transaction creation failed: {response.status_code} - {response.text}")
    
    def run_demo(self):
        """Run the complete demo."""
        print("🚀 Finance Tracker API Demo")
        print("=" * 50)
        
        # Create demo data
        demo_user = self.create_demo_user_data()
        
        # Authenticate with admin user
        if not self.authenticate():
            print("❌ Could not authenticate. Make sure the server is running and admin user exists.")
            return
        
        # Test API endpoints
        self.test_api_endpoints()
        
        print("\n" + "=" * 50)
        print("🎉 Demo completed successfully!")
        print(f"📖 API Documentation: http://127.0.0.1:8000/api/v1/docs/")
        print(f"🔧 Django Admin: http://127.0.0.1:8000/admin/")
        print(f"👤 Demo User: {demo_user.username} / demo123")
        print(f"🔑 Admin User: admin / admin")


if __name__ == '__main__':
    demo = FinanceTrackerDemo()
    demo.run_demo()
