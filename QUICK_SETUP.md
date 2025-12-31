# 🚀 Configuração Rápida - Go Infinity no Mac

## Status Atual

✅ **Print Bridge corrigido e funcionando**
- Problema do módulo USB resolvido
- Servidor rodando em modo LAN (USB opcional)

## 📋 Como Configurar

### Opção 1: Se você tem o IP da impressora

```bash
# 1. Pare qualquer Print Bridge rodando
pkill -f "tsx src/index.ts"

# 2. Inicie com o IP
cd print-bridge
PORT=3333 PRINTER_LAN_IP="192.168.100.XXX" PRINTER_LAN_PORT=9100 npx tsx src/index.ts
```

**Substitua `192.168.100.XXX` pelo IP real da sua impressora**

### Opção 2: Se você tem o hostname

```bash
cd print-bridge
PORT=3333 PRINTER_HOSTNAME="goinfinity-printer.local" PRINTER_LAN_PORT=9100 npx tsx src/index.ts
```

### Opção 3: Modo USB (se conectada via USB)

```bash
cd print-bridge
PORT=3333 PRINTER_MODE=USB PRINTER_USB_NAME="GOINFINITY Thermal Receipt Printer" npx tsx src/index.ts
```

### Opção 4: Modo AUTO (tenta LAN, depois USB)

```bash
cd print-bridge
PORT=3333 PRINTER_MODE=AUTO npx tsx src/index.ts
```

## 🔍 Como Descobrir o IP da Impressora

### No Menu da Impressora:
1. Pressione o botão de configuração
2. Vá em "Network Settings"
3. Procure "IP Address"
4. Anote o IP

### No Roteador:
1. Acesse http://192.168.100.1 (ou IP do seu roteador)
2. Vá em "Dispositivos Conectados"
3. Procure "GO INFINITY" ou dispositivo com porta 9100

### Via Terminal (Mac):
```bash
# Ver dispositivos na rede
arp -a | grep "192.168.100"

# Testar IP específico
ping 192.168.100.50
nc -zv 192.168.100.50 9100  # Testa porta 9100
```

## 🧪 Testar Impressão

Depois de configurar o Print Bridge:

### Via Script Python:
```bash
python3 -c "
import requests
import json
from datetime import datetime

receipt = {
    'mode': 'AUTO',
    'receipt': {
        'shopName': 'Sunshine POS',
        'shopPhone': '244 9XX XXX XXX',
        'shopAddress': 'Luanda, Angola',
        'saleNumber': f'TEST-{int(datetime.now().timestamp())}',
        'date': datetime.now().strftime('%d/%m/%Y %H:%M:%S'),
        'subtotal': 'AOA 1.500,00',
        'tax': 'AOA 150,00',
        'total': 'AOA 1.650,00',
        'items': [{
            'name': 'Teste',
            'qty': 1,
            'unitPrice': 'AOA 1.500,00',
            'total': 'AOA 1.500,00'
        }],
        'footer': 'Teste - Obrigado!'
    },
    'cut': True,
    'openCashDrawer': False
}

response = requests.post('http://localhost:3333/print', json=receipt)
print(response.json())
"
```

### Via Interface Web:
1. Acesse: http://localhost:3000/test-printer
2. Faça login como **admin**
3. Clique em **"Imprimir Recibo de Teste"**

## ✅ Checklist

- [ ] Print Bridge iniciado
- [ ] IP/hostname da impressora descoberto
- [ ] Print Bridge configurado
- [ ] Teste de impressão realizado
- [ ] Recibo impresso com sucesso

## 🆘 Problemas Comuns

### Print Bridge não inicia
- Verifique se a porta 3333 está livre: `lsof -i :3333`
- Verifique os logs: `tail -f /tmp/print-bridge.log`

### Impressora não imprime
- Verifique se está ligada e conectada
- Teste conexão: `ping [IP]` e `nc -zv [IP] 9100`
- Verifique firewall do Mac

### Erro "Connection refused"
- Verifique se o IP está correto
- Verifique se está na mesma rede
- Tente reiniciar a impressora

