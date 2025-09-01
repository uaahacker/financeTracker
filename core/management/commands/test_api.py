"""
Django management command to test API functionality
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.test import Client
from django.urls import reverse
import json


class Command(BaseCommand):
    help = 'Test Finance Tracker API functionality'
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🚀 Finance Tracker API Test'))
        self.stdout.write('=' * 50)
        
        # Create test client
        client = Client()
        
        try:
            # Create test user
            user = User.objects.create_user(
                username='test_api_user',
                email='test@example.com',
                password='testpass123'
            )
            self.stdout.write(self.style.SUCCESS(f'✅ Created test user: {user.username}'))
            
            # Test authentication
            login_data = {
                'username': 'test_api_user',
                'password': 'testpass123'
            }
            
            # Try to get JWT token
            response = client.post('/api/v1/auth/login/', 
                                 data=json.dumps(login_data),
                                 content_type='application/json')
            
            if response.status_code == 200:
                token_data = response.json()
                access_token = token_data.get('access')
                self.stdout.write(self.style.SUCCESS('✅ Successfully authenticated and got JWT token'))
                
                # Test API endpoints with authentication
                headers = {'HTTP_AUTHORIZATION': f'Bearer {access_token}'}
                
                # Test accounts endpoint
                response = client.get('/api/v1/accounts/', **headers)
                self.stdout.write(self.style.SUCCESS(f'✅ Accounts endpoint: {response.status_code}'))
                
                # Test transactions endpoint
                response = client.get('/api/v1/transactions/', **headers)
                self.stdout.write(self.style.SUCCESS(f'✅ Transactions endpoint: {response.status_code}'))
                
                # Test categories endpoint
                response = client.get('/api/v1/categories/', **headers)
                self.stdout.write(self.style.SUCCESS(f'✅ Categories endpoint: {response.status_code}'))
                
                # Test dashboard endpoint
                response = client.get('/api/v1/dashboard/', **headers)
                self.stdout.write(self.style.SUCCESS(f'✅ Dashboard endpoint: {response.status_code}'))
                
                # Create a test account
                account_data = {
                    'name': 'Test Account',
                    'account_type': 'savings',
                    'balance': '1000.00',
                    'currency': 1  # USD
                }
                response = client.post('/api/v1/accounts/', 
                                     data=json.dumps(account_data),
                                     content_type='application/json',
                                     **headers)
                
                if response.status_code == 201:
                    account = response.json()
                    self.stdout.write(self.style.SUCCESS(f'✅ Created test account: {account["name"]}'))
                    
                    # Create a test transaction
                    transaction_data = {
                        'account': account['id'],
                        'amount': '50.00',
                        'transaction_type': 'expense',
                        'description': 'Test expense',
                        'category': 1  # Should exist from initial data
                    }
                    response = client.post('/api/v1/transactions/',
                                         data=json.dumps(transaction_data),
                                         content_type='application/json',
                                         **headers)
                    
                    if response.status_code == 201:
                        transaction = response.json()
                        self.stdout.write(self.style.SUCCESS(f'✅ Created test transaction: {transaction["description"]}'))
                    else:
                        self.stdout.write(self.style.ERROR(f'❌ Failed to create transaction: {response.status_code}'))
                        self.stdout.write(response.content.decode())
                        
                else:
                    self.stdout.write(self.style.ERROR(f'❌ Failed to create account: {response.status_code}'))
                    self.stdout.write(response.content.decode())
                    
            else:
                self.stdout.write(self.style.ERROR(f'❌ Authentication failed: {response.status_code}'))
                self.stdout.write(response.content.decode())
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error during testing: {str(e)}'))
            
        finally:
            # Clean up
            try:
                User.objects.filter(username='test_api_user').delete()
                self.stdout.write(self.style.SUCCESS('✅ Cleaned up test data'))
            except:
                pass
                
        self.stdout.write(self.style.SUCCESS('\n🎉 API Test completed!'))
