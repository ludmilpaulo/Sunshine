# 🖨️ Guia de Configuração - Impressora LAN

## 📋 Pré-requisitos

1. Impressora conectada à rede (WiFi ou Ethernet)
2. IP da impressora conhecido
3. Porta de impressão (geralmente 9100 para ESC/POS)

---

## 🔍 Passo 1: Descobrir o IP da Impressora

### Método 1: Menu da Impressora
1. Acesse o menu de configuração da impressora
2. Procure por "Network Settings" ou "Configurações de Rede"
3. Anote o endereço IP

### Método 2: Scanner de Rede
```bash
# No macOS/Linux, use nmap:
nmap -sn 192.168.1.0/24 | grep -B 2 "printer\|EPSON\|Star"

# Ou verifique no roteador:
# Acesse o painel do roteador (geralmente 192.168.1.1)
# Procure por "Dispositivos Conectados" ou "DHCP Clients"
```

### Método 3: Teste de Conectividade
```bash
# Teste se a porta está aberta:
telnet 192.168.1.100 9100
# Ou:
nc -zv 192.168.1.100 9100
```

---

## ⚙️ Passo 2: Configurar o Print Bridge

### Opção A: Usando Script (Recomendado)

1. **Edite o script `start-lan.sh`:**
   ```bash
   cd print-bridge
   nano start-lan.sh
   ```
   
   Altere a linha:
   ```bash
   PRINTER_IP=${1:-${PRINTER_LAN_IP:-"192.168.1.100"}}
   ```
   
   Para o IP da sua impressora:
   ```bash
   PRINTER_IP=${1:-${PRINTER_LAN_IP:-"SEU_IP_AQUI"}}
   ```

2. **Inicie o Print Bridge:**
   ```bash
   ./start-lan.sh
   ```
   
   Ou passe o IP como argumento:
   ```bash
   ./start-lan.sh 192.168.1.100 9100
   ```

### Opção B: Usando Variáveis de Ambiente

1. **Crie arquivo `.env`:**
   ```bash
   cd print-bridge
   cp .env.example .env
   nano .env
   ```

2. **Configure:**
   ```env
   PRINTER_LAN_IP=192.168.1.100
   PRINTER_LAN_PORT=9100
   PRINTER_MODE=LAN
   PORT=3333
   ```

3. **Inicie:**
   ```bash
   source .env
   npm run dev
   ```

### Opção C: Configuração Manual (Temporária)

```bash
cd print-bridge
export PRINTER_LAN_IP="192.168.1.100"
export PRINTER_LAN_PORT="9100"
export PRINTER_MODE="LAN"
PORT=3333 npx tsx src/index.ts
```

---

## 🧪 Passo 3: Testar a Configuração

### 1. Verificar se o Print Bridge está rodando:
```bash
curl http://localhost:3333/health
# Deve retornar: {"ok":true,"service":"print-bridge"}
```

### 2. Testar conexão com a impressora:
```bash
# Teste de impressão simples
curl -X POST http://localhost:3333/print \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "LAN",
    "lan": {
      "ip": "192.168.1.100",
      "port": 9100
    },
    "receipt": {
      "shopName": "Sunshine POS",
      "saleNumber": "TEST-001",
      "date": "30/12/2024 10:00",
      "subtotal": "1,000.00",
      "tax": "140.00",
      "total": "1,140.00",
      "items": [{
        "name": "Teste de Impressão",
        "qty": 1,
        "unitPrice": "1,000.00",
        "total": "1,000.00"
      }],
      "footer": "Teste de configuração LAN"
    },
    "cut": true
  }'
```

### 3. Verificar logs:
```bash
# Se iniciou em background, veja os logs:
tail -f /tmp/print-bridge.log
```

---

## 🔧 Passo 4: Configurar no Frontend

O frontend já está configurado para usar o Print Bridge. Se necessário, ajuste:

### Arquivo: `frontend/.env.local` (opcional)
```env
NEXT_PUBLIC_PRINT_BRIDGE_URL=http://localhost:3333
NEXT_PUBLIC_PRINTER_LAN_IP=192.168.1.100
NEXT_PUBLIC_PRINTER_LAN_PORT=9100
```

O frontend usa `AUTO` mode por padrão, que tenta LAN primeiro.

---

## ✅ Checklist de Verificação

- [ ] IP da impressora identificado
- [ ] Porta 9100 (ou outra) está aberta e acessível
- [ ] Print Bridge iniciado com configuração LAN
- [ ] Health check responde: `curl http://localhost:3333/health`
- [ ] Teste de impressão envia dados (verifique impressora)
- [ ] Recibo imprime corretamente

---

## 🐛 Troubleshooting

### Problema: "Connection refused" ou "ECONNREFUSED"
**Solução:**
- Verifique se o IP está correto: `ping 192.168.1.100`
- Verifique se a porta está aberta: `nc -zv IP 9100`
- Verifique firewall da impressora

### Problema: "Timeout" ou "ETIMEDOUT"
**Solução:**
- Verifique se impressora está ligada e na rede
- Teste conectividade: `telnet IP 9100`
- Verifique se está na mesma rede/subnet

### Problema: "Print Bridge não inicia"
**Solução:**
- Verifique se porta 3333 está livre: `lsof -ti:3333`
- Verifique logs: `cat /tmp/print-bridge.log`
- Tente iniciar manualmente: `npx tsx src/index.ts`

### Problema: "Dados enviados mas não imprime"
**Solução:**
- Verifique se impressora suporta ESC/POS
- Verifique se está em modo "RAW" ou "ESC/POS"
- Teste com outro software de impressão primeiro

---

## 📝 Exemplo Completo

```bash
# 1. Descobrir IP (exemplo)
# IP encontrado: 192.168.1.150

# 2. Testar conectividade
ping 192.168.1.150
nc -zv 192.168.1.150 9100

# 3. Iniciar Print Bridge
cd print-bridge
./start-lan.sh 192.168.1.150 9100

# 4. Em outro terminal, testar
curl http://localhost:3333/health

# 5. Testar impressão
curl -X POST http://localhost:3333/print \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "LAN",
    "lan": {"ip": "192.168.1.150", "port": 9100},
    "receipt": {
      "shopName": "Teste",
      "saleNumber": "001",
      "date": "30/12/2024 10:00",
      "subtotal": "100.00",
      "tax": "14.00",
      "total": "114.00",
      "items": [{"name": "Teste", "qty": 1, "unitPrice": "100.00", "total": "100.00"}]
    }
  }'
```

---

## 🚀 Iniciar Automaticamente

### macOS (usando launchd)

Crie `~/Library/LaunchAgents/com.sunshine.printbridge.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.sunshine.printbridge</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>/Users/ludmil/Desktop/Apps/Sunshine/print-bridge/start-lan.sh</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PRINTER_LAN_IP</key>
    <string>192.168.1.100</string>
    <key>PRINTER_LAN_PORT</key>
    <string>9100</string>
  </dict>
</dict>
</plist>
```

Carregue:
```bash
launchctl load ~/Library/LaunchAgents/com.sunshine.printbridge.plist
```

---

## 📞 Suporte

Se ainda tiver problemas:
1. Verifique logs do Print Bridge
2. Teste conectividade de rede
3. Verifique configurações da impressora
4. Teste com outro software de impressão para confirmar que a impressora funciona

