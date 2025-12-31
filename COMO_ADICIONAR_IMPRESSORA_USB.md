# 🖨️ Como Adicionar Impressora Go Infinity USB no macOS

## ✅ Status Atual

- **Impressora detectada:** Sim (USB Receipt Printer conectada)
- **Driver instalado:** Não (precisa ser adicionada ao sistema)
- **Print Bridge:** Rodando em modo AUTO

## 📋 Passos para Adicionar a Impressora

### Opção 1: Via System Settings (Recomendado)

1. **Abra System Settings** (Configurações do Sistema)
2. Vá em **Printers & Scanners** (Impressoras e Scanners)
3. Clique no botão **"+"** (Adicionar)
4. O macOS deve detectar a impressora USB automaticamente
5. Selecione **"USB Receipt Printer"** ou **"Go Infinity"**
6. Se não aparecer automaticamente:
   - Clique em **"IP"** ou **"Add Other Printer"**
   - Selecione **"USB"** como protocolo
   - Escolha a impressora da lista

### Opção 2: Via Terminal (CUPS)

```bash
# Abrir interface web do CUPS
open http://localhost:631

# Ou adicionar via linha de comando
lpadmin -p GoInfinity -E -v usb:// -m raw
```

### Opção 3: Usar Driver Genérico

Se a impressora não aparecer automaticamente:

1. No System Settings > Printers & Scanners
2. Clique em **"+"**
3. Selecione **"IP"**
4. Protocolo: **"Line Printer Daemon - LPD"**
5. Endereço: deixe em branco (para USB)
6. Use: **"Generic PostScript Printer"** ou **"Raw Queue"**

## 🧪 Depois de Adicionar

Depois de adicionar a impressora ao sistema:

1. **Descubra o nome exato:**
   ```bash
   lpstat -p -d
   ```

2. **Configure o Print Bridge:**
   ```bash
   cd print-bridge
   PORT=3333 PRINTER_MODE=USB PRINTER_USB_NAME="[NOME_DA_IMPRESSORA]" npx tsx src/index.ts
   ```

3. **Teste a impressão:**
   ```bash
   ./test_usb_printer.sh
   ```

## 🔧 Modo AUTO (Atual)

O Print Bridge está rodando em modo AUTO, que:
- Tenta LAN primeiro (se configurado)
- Tenta USB depois (se disponível)

Para testar via USB mesmo sem estar instalada, você pode tentar usar o nome genérico, mas o ideal é adicionar ao sistema primeiro.

## 💡 Dicas

- A impressora Go Infinity usa comandos ESC/POS (padrão)
- Não precisa de driver especial, pode usar driver genérico
- O nome pode aparecer como "USB Receipt Printer" ou similar
- Verifique se a impressora está ligada antes de adicionar

## ✅ Checklist

- [ ] Impressora conectada via USB
- [ ] Impressora ligada
- [ ] Impressora adicionada ao sistema macOS
- [ ] Nome da impressora descoberto
- [ ] Print Bridge configurado
- [ ] Teste de impressão realizado

