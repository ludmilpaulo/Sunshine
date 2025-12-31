#!/bin/bash

# Script para adicionar impressora Go Infinity ao macOS via linha de comando

echo "🖨️  Adicionando Impressora Go Infinity ao macOS"
echo "================================================"
echo ""

# Verificar se impressora USB está conectada
USB_DEVICE=$(lpinfo -v 2>/dev/null | grep -i "usb.*receipt\|usb.*printer" | head -1)

if [ -z "$USB_DEVICE" ]; then
    echo "❌ Impressora USB não encontrada"
    echo "   Certifique-se de que a impressora está conectada via USB"
    exit 1
fi

echo "✅ Impressora USB detectada: $USB_DEVICE"
echo ""

# Tentar diferentes métodos
PRINTER_NAME="GoInfinity"
SUCCESS=false

echo "1️⃣ Tentando adicionar com driver genérico..."
lpadmin -p "$PRINTER_NAME" -E -v "$USB_DEVICE" -m "Generic PostScript Printer" 2>&1
if [ $? -eq 0 ]; then
    SUCCESS=true
    echo "✅ Impressora adicionada com Generic PostScript Printer"
else
    echo "⚠️  Método 1 falhou, tentando método 2..."
    
    echo "2️⃣ Tentando adicionar com driver 'everywhere'..."
    lpadmin -p "$PRINTER_NAME" -E -v "$USB_DEVICE" -m "everywhere" 2>&1
    if [ $? -eq 0 ]; then
        SUCCESS=true
        echo "✅ Impressora adicionada com driver 'everywhere'"
    else
        echo "⚠️  Método 2 falhou, tentando método 3..."
        
        echo "3️⃣ Tentando adicionar sem driver específico..."
        lpadmin -p "$PRINTER_NAME" -E -v "$USB_DEVICE" 2>&1
        if [ $? -eq 0 ]; then
            SUCCESS=true
            echo "✅ Impressora adicionada sem driver específico"
        fi
    fi
fi

echo ""

if [ "$SUCCESS" = true ]; then
    echo "✅ Verificando impressora adicionada..."
    lpstat -p "$PRINTER_NAME" 2>&1
    
    echo ""
    echo "✅ Impressora Go Infinity adicionada com sucesso!"
    echo ""
    echo "📝 Nome da impressora: $PRINTER_NAME"
    echo ""
    echo "🧪 Agora configure o Print Bridge:"
    echo "   ./setup_usb_printer.sh"
    echo ""
    echo "Ou manualmente:"
    echo "   cd print-bridge"
    echo "   PORT=3333 PRINTER_MODE=USB PRINTER_USB_NAME=\"$PRINTER_NAME\" npx tsx src/index.ts"
else
    echo "❌ Não foi possível adicionar a impressora via linha de comando"
    echo ""
    echo "💡 O macOS pode exigir adição manual via interface gráfica:"
    echo "   1. System Settings > Printers & Scanners"
    echo "   2. Clique no botão '+' (Adicionar)"
    echo "   3. Selecione 'USB Receipt Printer'"
    echo "   4. Use 'Generic PostScript Printer' como driver"
    echo ""
    echo "   Ou execute: open 'x-apple.systempreferences:com.apple.preference.printfax'"
fi

echo ""

