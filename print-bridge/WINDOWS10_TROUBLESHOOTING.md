# Windows 10 Printing Troubleshooting Guide

This guide helps resolve common printing issues on Windows 10 when using the Print Bridge service.

## Common Issues

### Issue: Printer is configured in Windows but not printing from Print Bridge

**Symptoms:**
- Printer works when printing from Windows (test page, Notepad, etc.)
- Print Bridge shows printer in `/printers` endpoint
- Print requests fail with error messages

**Solutions:**

#### 1. Verify Printer Name Matches Exactly

Windows 10 is case-sensitive for printer names. The name must match **exactly** as shown in Windows.

**Steps:**
1. Open Print Bridge and call `GET http://localhost:3333/printers`
2. Note the exact printer name (including spaces and capitalization)
3. Compare with Windows:
   - Open **Settings** → **Devices** → **Printers & scanners**
   - Or **Control Panel** → **Devices and Printers**
   - Find your printer and note the exact name

4. Update your `.env` file or printer configuration:
   ```env
   PRINTER_USB_NAME=Exact Printer Name Here
   ```

**Important:** Copy the name exactly, including:
- Capital letters
- Spaces
- Special characters
- No trailing spaces

#### 2. Set Printer as Default

Sometimes Windows requires the printer to be set as default for raw printing to work.

**Steps:**
1. Open **Settings** → **Devices** → **Printers & scanners**
2. Find your thermal printer
3. Click on it
4. Click **"Set as default"**

#### 3. Check Printer Status

Ensure the printer is **online** and **ready**.

**Steps:**
1. Open **Settings** → **Devices** → **Printers & scanners**
2. Check printer status:
   - Should show "Ready" (not "Offline" or "Error")
   - If offline, click printer → **"Open queue"** → **"Printer"** → **"Use Printer Online"**

#### 4. Verify Printer Driver

Ensure the printer driver is properly installed.

**Steps:**
1. Open **Device Manager** (Win + X → Device Manager)
2. Expand **"Print queues"**
3. Find your printer
4. Right-click → **"Properties"**
5. Check **"Device status"** - should show "This device is working properly"
6. If there's an error, try:
   - Right-click → **"Update driver"**
   - Or reinstall the printer driver from manufacturer's website

#### 5. Test Print from Windows

Before troubleshooting Print Bridge, verify Windows can print to the printer.

**Steps:**
1. Open **Settings** → **Devices** → **Printers & scanners**
2. Click your printer
3. Click **"Open queue"**
4. Click **"Printer"** → **"Print Test Page"**
5. If test page prints successfully, the issue is with Print Bridge configuration
6. If test page fails, fix Windows printer issues first

#### 6. Check Print Bridge Logs

Print Bridge now provides detailed error messages. Check the console output when printing fails.

**Common error messages and solutions:**

- **"Printer not found in system"**
  - Solution: Call `GET /printers` to see available printers
  - Use the exact name from the response

- **"USB print failed with all name variations"**
  - Solution: Try setting printer as default (see step 2)
  - Verify printer name matches exactly
  - Check printer is online

- **"USB_MODULE_NOT_AVAILABLE"**
  - Solution: Rebuild native modules:
    ```bash
    npm install
    ```
  - If that fails, install Visual Studio Build Tools:
    - Download from: https://visualstudio.microsoft.com/downloads/
    - Select "Build Tools for Visual Studio"
    - Install with "Desktop development with C++" workload

#### 7. Run Windows Diagnostic Script

Use the provided diagnostic script:

```bash
diagnostico-windows.bat
```

This will:
- Check if Print Bridge is running
- List available printers
- Verify configuration
- Check Node.js installation

## Advanced Troubleshooting

### Enable Detailed Logging

Print Bridge now logs detailed information. Watch the console output when printing:

```bash
npm run dev
```

Look for messages like:
- `✅ Print succeeded with name variation: "..."` - Shows which name worked
- `⚠️ Trying default printer as fallback` - Shows fallback attempts
- Error messages with specific troubleshooting hints

### Try Different Printer Name Variations

Print Bridge now automatically tries multiple name variations:
- Exact name
- Trimmed name (no spaces)
- Uppercase version
- Lowercase version
- Default printer (if configured)

If one variation works, the logs will show which one succeeded.

### Check Windows Event Viewer

For deeper diagnostics:

1. Open **Event Viewer** (Win + X → Event Viewer)
2. Navigate to **Windows Logs** → **Application**
3. Look for printer-related errors around the time of print failure
4. Note any error codes or messages

### Verify Printer Permissions

Ensure the user running Print Bridge has permission to print:

1. Open **Settings** → **Devices** → **Printers & scanners**
2. Click your printer → **"Printer properties"**
3. Go to **"Security"** tab
4. Ensure your user account has **"Print"** permission

### Reinstall Printer Driver

If driver issues persist:

1. Uninstall printer:
   - Settings → Devices → Printers & scanners
   - Click printer → **"Remove device"**

2. Reinstall driver:
   - Download latest driver from manufacturer
   - Install driver
   - Add printer again

3. Test print from Windows first
4. Then test with Print Bridge

## Quick Checklist

Before reporting an issue, verify:

- [ ] Printer prints test page from Windows successfully
- [ ] Printer name in `.env` matches exactly (case-sensitive)
- [ ] Printer is set as default (if possible)
- [ ] Printer status shows "Ready" (not offline)
- [ ] Print Bridge is running (`GET http://localhost:3333/health`)
- [ ] Printer appears in `GET http://localhost:3333/printers`
- [ ] Checked Print Bridge console logs for detailed errors
- [ ] Ran `diagnostico-windows.bat` script

## Getting Help

If issues persist after trying all steps:

1. Run diagnostic script: `diagnostico-windows.bat`
2. Copy the output
3. Check Print Bridge console logs
4. Note the exact error message from Print Bridge API response
5. Include:
   - Windows version (Win + R → `winver`)
   - Printer model and driver version
   - Node.js version (`node --version`)
   - Print Bridge version/commit
   - Exact error messages from logs

## Recent Improvements

The Print Bridge has been updated with Windows 10 specific improvements:

1. **Automatic name variation testing** - Tries multiple name formats automatically
2. **Default printer fallback** - Falls back to default printer if specified name fails
3. **Enhanced error messages** - Provides specific Windows troubleshooting hints
4. **Better printer listing** - Shows default printer status in `/printers` endpoint
5. **Detailed logging** - Logs which name variation succeeded

These improvements should resolve most Windows 10 printing issues automatically.

