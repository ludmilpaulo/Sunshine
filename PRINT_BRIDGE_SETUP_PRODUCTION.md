# Print Bridge - Production Setup Guide

## Problem

When your frontend is deployed on Vercel (or any cloud platform), it cannot access `localhost:3333` where Print Bridge runs. You need to deploy Print Bridge separately.

## Solution Options

### Option 1: Deploy Print Bridge to a Cloud Service (Recommended)

Deploy Print Bridge to a service that allows you to run Node.js applications:

#### Using Railway (Easiest)

1. Go to [Railway.app](https://railway.app)
2. Create a new project
3. Connect your GitHub repository
4. Select the `print-bridge` folder as the root
5. Add environment variables:
   ```
   PORT=3333
   PRINTER_LAN_IP=your.printer.ip
   PRINTER_LAN_PORT=9100
   CORS_ORIGIN=https://sunshinebar.vercel.app
   ```
6. Deploy and copy the public URL (e.g., `https://print-bridge-production.up.railway.app`)

#### Using Render

1. Go to [Render.com](https://render.com)
2. Create a new Web Service
3. Connect your repository
4. Set root directory to `print-bridge`
5. Build command: `npm install && npm run build`
6. Start command: `npm start`
7. Add environment variables (same as Railway)
8. Copy the public URL

#### Using a VPS (DigitalOcean, Linode, etc.)

1. Set up a VPS with Node.js
2. Clone your repository
3. Navigate to `print-bridge` folder
4. Run:
   ```bash
   npm install
   npm run build
   npm start
   ```
5. Use PM2 or systemd to keep it running:
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name print-bridge
   pm2 save
   ```

### Option 2: Use a Tunnel Service (For Testing)

If you're running Print Bridge locally and want to test with Vercel:

1. Install ngrok: https://ngrok.com
2. Run Print Bridge locally: `npm run dev`
3. In another terminal, run: `ngrok http 3333`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Use this URL in Vercel environment variables

**Note:** Free ngrok URLs change on restart. For production, use Option 1.

### Option 3: Run Print Bridge on the Same Network as Printer

If your printer is on a local network:

1. Deploy Print Bridge to a server on the same network
2. Configure firewall to allow port 3333
3. Use the server's local IP or set up a domain pointing to it

## Configuration

### Vercel Environment Variables

Add these to your Vercel project settings:

```
NEXT_PUBLIC_PRINT_BRIDGE_URL=https://your-print-bridge-url.com
NEXT_PUBLIC_PRINTER_LAN_IP=192.168.1.50  # Optional: if printer IP is known
NEXT_PUBLIC_PRINTER_LAN_PORT=9100        # Optional: default is 9100
```

### Print Bridge Environment Variables

On your Print Bridge server, set:

```
PORT=3333
PRINTER_LAN_IP=192.168.1.50      # Your printer's IP address
PRINTER_LAN_PORT=9100             # Printer port (usually 9100)
CORS_ORIGIN=https://sunshinebar.vercel.app  # Your Vercel URL
# OR allow all origins (less secure):
CORS_ORIGIN_ALLOW_ALL=true
```

## Testing

1. Check Print Bridge is running:
   ```bash
   curl https://your-print-bridge-url.com/health
   ```
   Should return: `{"ok":true,"service":"print-bridge"}`

2. Test from your Vercel app - the CORS error should be gone!

## Troubleshooting

### CORS Errors

- Make sure `CORS_ORIGIN` includes your Vercel URL exactly (with https://)
- Or set `CORS_ORIGIN_ALLOW_ALL=true` for testing (not recommended for production)

### Print Bridge Not Accessible

- Check if the service is running: `curl https://your-url/health`
- Check firewall rules on your server
- Verify the URL is correct in Vercel environment variables

### Printing Fails

- Verify printer IP is correct
- Check if printer is on the same network as Print Bridge server
- Test printer connectivity: `telnet printer-ip 9100`

## Security Notes

1. **Authentication**: Consider adding authentication to Print Bridge for production
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Don't use `CORS_ORIGIN_ALLOW_ALL=true` in production unless necessary
4. **Firewall**: Restrict access to Print Bridge port (3333) if possible

## Quick Start Checklist

- [ ] Deploy Print Bridge to cloud service (Railway/Render/VPS)
- [ ] Set Print Bridge environment variables (PRINTER_LAN_IP, CORS_ORIGIN)
- [ ] Add `NEXT_PUBLIC_PRINT_BRIDGE_URL` to Vercel environment variables
- [ ] Test health endpoint: `curl https://your-url/health`
- [ ] Test printing from Vercel app
- [ ] Verify CORS is working (no CORS errors in browser console)

