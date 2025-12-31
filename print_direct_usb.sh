#!/bin/bash

# Script para imprimir diretamente na impressora USB usando lp

PRINTER_NAME="_USB_Receipt_Printer"

echo "🖨️  Imprimindo recibo de teste na Go Infinity"
echo "=============================================="
echo ""
echo "Impressora: $PRINTER_NAME"
echo ""

# Criar arquivo de teste ESC/POS
cat > /tmp/test_receipt.txt << 'EOF'
Sunshine POS
Luanda, Angola
Tel: 244 9XX XXX XXX

================================
RECIBO DE VENDA
================================
Venda:     TEST-USB
Data:      30/12/2024
Hora:      14:30:00
================================

ITEM                    QTD      TOTAL
Teste USB Go Infinity      1  1.500,00

================================
Subtotal:            AOA 1.500,00
Imposto:              AOA 150,00
TOTAL:                AOA 1.650,00
================================

Teste USB - Obrigado!

EOF

echo "📄 Enviando recibo para impressora..."
lp -d "$PRINTER_NAME" -o raw /tmp/test_receipt.txt 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Recibo enviado com sucesso!"
    echo ""
    echo "📄 Verifique se a impressora Go Infinity imprimiu o recibo"
else
    echo "❌ Erro ao imprimir"
    echo ""
    echo "💡 Verifique:"
    echo "   - Se a impressora está ligada"
    echo "   - Se está conectada via USB"
    echo "   - Nome da impressora: $PRINTER_NAME"
fi

echo ""

