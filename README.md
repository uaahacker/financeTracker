# Finance Tracker - Django REST API

A comprehensive finance tracking application built with Django and Django REST Framework, designed to be dead-simple for daily use yet robust enough for power features. Includes full REST API support for Android/mobile applications with offline-first capabilities.

## Features

### Core Functionality
- ✅ **Transaction Management**: Add, edit, delete transactions (expense/income/transfer)
- ✅ **Multi-Account Support**: Cash, bank accounts, credit cards, e-wallets, crypto
- ✅ **Categories & Tags**: Flexible organization with hierarchical categories
- ✅ **Contact Management**: Track people, merchants, lenders, employers
- ✅ **Multi-Currency**: Support for multiple currencies with exchange rates
- ✅ **Budgets**: Set spending limits with progress tracking and alerts
- ✅ **Income Sources**: Track expected income with frequency settings
- ✅ **Loans & EMIs**: Full loan management with amortization schedules
- ✅ **Scheduled Payments**: Recurring payments with auto-execution
- ✅ **Statements**: Generate PDF/Excel statements for any period
- ✅ **Notifications**: In-app, email, and push notification system
- ✅ **Dashboard**: Monthly summaries with charts and insights

### Technical Features
- ✅ **REST API**: Complete REST API with JWT authentication
- ✅ **OpenAPI Documentation**: Auto-generated API documentation
- ✅ **Offline-First Ready**: Sync endpoints for mobile offline support
- ✅ **Background Tasks**: Celery integration for long-running operations
- ✅ **Admin Interface**: Comprehensive Django admin interface
- ✅ **Security**: Multi-tenant isolation, rate limiting, input validation
- ✅ **File Uploads**: Receipt attachments with S3 compatibility
- ✅ **Audit Logging**: Track all changes for compliance

## Tech Stack

- **Backend**: Django 5.2, Django REST Framework
- **Database**: PostgreSQL (production), SQLite (development)
- **Authentication**: JWT with refresh tokens
- **Background Tasks**: Celery + Redis
- **Documentation**: DRF Spectacular (OpenAPI/Swagger)
- **File Storage**: Local + S3 compatible
- **Caching**: Redis
- **Email**: Configurable backends

## Quick Start

### Prerequisites
- Python 3.12+
- Redis (for caching and Celery)
- PostgreSQL (for production)

### Installation

1. **Clone and setup virtual environment**:
```bash
git clone <repository-url>
cd financeTracker
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Environment configuration**:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Database setup**:
```bash
python manage.py migrate
python manage.py populate_initial_data
python manage.py createsuperuser
```

5. **Run development server**:
```bash
python manage.py runserver
```

### API Documentation
- **Swagger UI**: http://localhost:8000/api/v1/docs/
- **ReDoc**: http://localhost:8000/api/v1/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/v1/schema/

### Admin Interface
- **Django Admin**: http://localhost:8000/admin/

## API Overview

### Authentication
```bash
# Login
POST /api/v1/auth/login/
{
    "username": "your_username",
    "password": "your_password"
}

# Use returned access token in headers
Authorization: Bearer <access_token>
```

### Core Endpoints
- `GET/POST /api/v1/accounts/` - Account management
- `GET/POST /api/v1/transactions/` - Transaction CRUD
- `GET/POST /api/v1/budgets/` - Budget management
- `GET/POST /api/v1/contacts/` - Contact management
- `GET/POST /api/v1/categories/` - Category management
- `GET/POST /api/v1/loans/` - Loan management
- `GET/POST /api/v1/scheduled-payments/` - Scheduled payments
- `GET /api/v1/dashboard/summary/` - Dashboard data

### Filtering & Search
Most endpoints support advanced filtering:
```bash
# Filter transactions
GET /api/v1/transactions/?date_from=2024-01-01&date_to=2024-01-31&type=EXPENSE&category=1

# Search transactions
GET /api/v1/transactions/?search=grocery

# Multiple filters
GET /api/v1/transactions/?accounts=1,2&tags=3,4&min_amount=100
```

### Bulk Operations
```bash
# Bulk create transactions
POST /api/v1/transactions/bulk_create/
[
    {...transaction1...},
    {...transaction2...}
]

# Bulk update
POST /api/v1/transactions/bulk_update/
[
    {"id": 1, "description": "Updated"},
    {"id": 2, "amount": 150}
]

# Bulk delete
POST /api/v1/transactions/bulk_delete/
{
    "ids": [1, 2, 3]
}
```

## Android/Mobile Integration

### Offline-First Sync
The API supports offline-first mobile applications:

1. **Change Tracking**: All entities include `updated_at` timestamps
2. **Sync Endpoint**: `GET /api/v1/sync/changes/?since=timestamp`
3. **Conflict Resolution**: Last-write-wins with client notification
4. **Bulk Operations**: Efficient batch sync operations

### Example Sync Flow
```bash
# Get all changes since last sync
GET /api/v1/sync/changes/?since=2024-01-01T10:00:00Z

# Upload local changes
POST /api/v1/transactions/bulk_create/
POST /api/v1/transactions/bulk_update/
```

## Project Structure

```
financetracker/
├── core/                   # Shared models and utilities
├── finance/               # Accounts, transactions, budgets
├── contacts/              # Contact management
├── loans/                 # Loan and EMI management
├── scheduling/            # Scheduled payments and reminders
├── statements/            # Statement generation
├── notifications/         # Notification system
├── api/                   # REST API (serializers, views, filters)
├── static/                # Static files
├── media/                 # User uploads
└── templates/             # HTML templates
```

## Configuration

### Environment Variables
Key configuration options in `.env`:

```bash
# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=financetracker
DB_USER=postgres
DB_PASSWORD=your-password

# Redis/Celery
REDIS_URL=redis://127.0.0.1:6379/1
CELERY_BROKER_URL=redis://localhost:6379/0

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Background Tasks
Start Celery worker for background tasks:
```bash
# Worker
celery -A financetracker worker -l info

# Beat scheduler (for periodic tasks)
celery -A financetracker beat -l info
```

## Development

### Running Tests
```bash
python manage.py test
# Or with pytest
pytest
```

### Code Quality
```bash
# Linting
ruff check .

# Type checking
mypy .

# Format code
ruff format .
```

### Database Migrations
```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Reset database (development only)
python manage.py flush
python manage.py populate_initial_data
```

## Production Deployment

### Key Considerations
1. **Security**: Change `SECRET_KEY`, set `DEBUG=False`
2. **Database**: Use PostgreSQL with connection pooling
3. **Static Files**: Configure S3 or CDN for static/media files
4. **Background Tasks**: Deploy Celery workers
5. **Monitoring**: Add logging and error tracking
6. **SSL**: Enable HTTPS with proper certificates

### Example Production Settings
```python
# settings.py additions for production
SECURE_SSL_REDIRECT = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or issues:
- Check the API documentation at `/api/v1/docs/`
- Review the Django admin interface
- Open an issue on GitHub

## Roadmap

### Phase 1 - MVP (Current)
- ✅ Core transaction management
- ✅ Basic budgeting and categories
- ✅ REST API with authentication
- ✅ Admin interface

### Phase 2 - Enhanced Features
- 📋 Advanced reporting and analytics
- 📋 OCR for receipt scanning
- 📋 Bank integration (Plaid-like)
- 📋 Web dashboard UI

### Phase 3 - Advanced Features
- 📋 Multi-user households
- 📋 Shared budgets and expense splitting
- 📋 Investment tracking
- 📋 Advanced analytics and insights

### Phase 4 - Enterprise
- 📋 White-label deployment
- 📋 Advanced security features
- 📋 Custom integrations
- 📋 Compliance features
