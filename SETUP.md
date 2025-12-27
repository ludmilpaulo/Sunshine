# Quick Setup Guide

## Prerequisites

- Python 3.10+ (for Django backend)
- Node.js 18+ (for Next.js frontend and Print Bridge)
- PostgreSQL (or MySQL for PythonAnywhere)
- Barcode scanner (USB keyboard wedge)
- Thermal receipt printer (ESC/POS, LAN or USB)

## Step-by-Step Setup

### 1. Backend (Django)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database settings
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your API URL
npm run dev
```

### 3. Print Bridge (Local PC)

```bash
cd print-bridge
npm install
cp .env.example .env
# Edit .env with your printer IP (if using LAN)
npm run dev
```

## First Time Setup

1. **Create Django superuser**: Run `python manage.py createsuperuser` and create an admin account
2. **Login to Django admin**: Go to `http://localhost:8000/admin` and create some products
3. **Add initial stock**: Use the admin interface or API to set initial inventory quantities
4. **Test barcode scanning**: Scan a product barcode in the POS interface
5. **Configure printer**: Set printer IP in print-bridge `.env` file

## Testing the System

1. Open POS: `http://localhost:3000/pos`
2. Login with your superuser credentials
3. Scan a barcode (or manually add product)
4. Click "Checkout"
5. Complete payment
6. Receipt should print automatically

## Common Issues

### Print Bridge not connecting
- Check printer IP is correct
- Ensure printer is on same network
- Verify port 9100 is open
- Check firewall settings

### Barcode scanner not working
- Ensure scanner is in "keyboard wedge" mode
- Check USB connection
- Try scanning in a text field to verify scanner works

### CORS errors
- Update `CORS_ALLOWED_ORIGINS` in Django settings
- Ensure frontend URL is in allowed origins list

### Database connection errors
- Verify database credentials in `.env`
- Ensure database server is running
- Check database exists

## Production Deployment

See main README.md for deployment instructions to PythonAnywhere and Vercel.

