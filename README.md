# Sunshine POS System

A complete Point of Sale (POS) system built with Django (backend) and Next.js (frontend), designed for retail shops with barcode scanning and thermal receipt printing.

## Architecture

- **Backend (Django)**: REST API running on PythonAnywhere
- **Frontend (Next.js)**: POS web app running on Vercel
- **Print Bridge**: Local Node.js service running on cashier PC for thermal printer communication

## Features

- ✅ Barcode scanning (keyboard wedge scanners)
- ✅ Thermal receipt printing (ESC/POS, LAN + USB support)
- ✅ Real-time inventory management
- ✅ Multi-cashier support with atomic stock operations
- ✅ Product management with barcode scanning
- ✅ Sales history and reporting
- ✅ JWT authentication

## Project Structure

```
Sunshine/
├── backend/          # Django REST API
├── frontend/         # Next.js POS app
└── print-bridge/     # Local print service (Node.js)
```

## Quick Start

### Backend Setup (Django)

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Copy environment file:
```bash
cp .env.example .env
# Edit .env with your settings
```

5. Run migrations:
```bash
python manage.py migrate
```

6. Create superuser:
```bash
python manage.py createsuperuser
```

7. Run development server:
```bash
python manage.py runserver
```

### Frontend Setup (Next.js)

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env.local
# Edit .env.local with your API URL
```

4. Run development server:
```bash
npm run dev
```

### Print Bridge Setup

1. Navigate to print-bridge directory:
```bash
cd print-bridge
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env
# Edit .env with your printer IP (if using LAN)
```

4. Run service:
```bash
npm run dev
```

## Deployment

### Backend (PythonAnywhere)

1. Upload backend code to PythonAnywhere
2. Set up virtual environment and install dependencies
3. Configure database (PostgreSQL recommended)
4. Set environment variables in PythonAnywhere dashboard
5. Run migrations
6. Configure WSGI file to point to `config.wsgi.application`

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables:
   - `NEXT_PUBLIC_API_BASE_URL`: Your PythonAnywhere API URL
   - `NEXT_PUBLIC_PRINT_BRIDGE_URL`: `http://localhost:3333` (for local print bridge)
3. Deploy

### Print Bridge (Local PC)

1. Install Node.js on cashier PC
2. Copy print-bridge folder to PC
3. Install dependencies and run as service
4. Configure printer IP in `.env` file
5. Optionally set up as Windows service or systemd service for auto-start

## Hardware Setup

### Barcode Scanner (Wintec)

- Plug scanner into USB port
- Scanner acts as keyboard input
- No driver needed
- Scan barcodes directly into POS or Admin forms

### Thermal Printer

**LAN Setup (Recommended):**
1. Connect printer to network via Ethernet
2. Assign static IP to printer
3. Configure `PRINTER_LAN_IP` in print-bridge `.env`
4. Default port: 9100

**USB Setup:**
- Connect printer via USB
- Install printer driver
- For Windows: Share printer and use LAN mode with localhost
- Direct USB printing requires OS-specific implementation

## Usage

### POS Screen

1. Login with cashier credentials
2. Scan products to add to cart
3. Click "Checkout" when ready
4. Select payment method and enter amount
5. Receipt prints automatically

### Admin Products

1. Navigate to Admin → Products
2. Click "Add Product"
3. Scan barcode to auto-fill (or type manually)
4. Fill in product details
5. Save product
6. Adjust stock as needed

## API Endpoints

### Authentication
- `POST /api/auth/login/` - Login
- `POST /api/auth/refresh/` - Refresh token
- `GET /api/auth/me/` - Current user

### Products
- `GET /api/products/` - List products
- `GET /api/products/by-barcode/{barcode}/` - Get product by barcode
- `POST /api/products/` - Create product
- `PATCH /api/products/{id}/` - Update product

### Sales
- `POST /api/sales/checkout/` - Create sale (atomic)
- `GET /api/sales/` - List sales

### Stock
- `POST /api/stock/adjust/` - Adjust stock

## Environment Variables

### Backend (.env)
```
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,your-domain.com
DB_NAME=sunshine_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_BASE_URL=https://your-api.pythonanywhere.com/api
NEXT_PUBLIC_PRINT_BRIDGE_URL=http://localhost:3333
```

### Print Bridge (.env)
```
PORT=3333
PRINTER_LAN_IP=192.168.1.50
PRINTER_LAN_PORT=9100
```

## Security Notes

- Change `SECRET_KEY` in production
- Use HTTPS in production
- Configure CORS properly
- Print Bridge only accepts localhost connections by default
- Use strong database passwords

## Support

For issues or questions, check the individual README files in each component directory.

