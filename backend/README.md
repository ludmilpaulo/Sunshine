# Django Backend

REST API for Sunshine POS system.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your settings
```

3. Run migrations:
```bash
python manage.py migrate
```

4. Create superuser:
```bash
python manage.py createsuperuser
```

5. Run server:
```bash
python manage.py runserver
```

## Models

- **Product**:** Products with barcode, price, tax rate
- **Inventory**: Stock levels per product
- **Sale**: Sales transactions
- **SaleItem**: Items in each sale
- **Payment**: Payment methods and amounts
- **StockMove**: Stock movement history

## Key Features

- Atomic checkout (prevents negative stock)
- Row-level locking for concurrent sales
- JWT authentication
- CORS configured for frontend
- Pagination on list endpoints

## API Documentation

See main README.md for endpoint details.

