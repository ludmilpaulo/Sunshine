# Next.js Frontend

POS web application for Sunshine POS system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env.local
# Edit .env.local with your API URL
```

3. Run development server:
```bash
npm run dev
```

## Features

- POS interface with barcode scanning
- Admin product management
- Real-time cart updates
- Payment processing
- Receipt printing integration

## Pages

- `/` - Redirects to POS
- `/login` - Login page
- `/pos` - Point of Sale interface
- `/admin/products` - Product management

## Barcode Scanning

The app uses a global keyboard listener to capture barcode scanner input. Scanners typically type digits rapidly and send Enter at the end.

## State Management

Uses Zustand for cart state management.

