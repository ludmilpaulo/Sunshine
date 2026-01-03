# 🌐 Configurar Impressora LAN - Guia Prático

Sua impressora já está conectada à LAN! Vamos configurar o Print Bridge para usá-la.

## 🔍 Passo 1: Descobrir o IP da Impressora

### Método Mais Fácil: Menu da Impressora

1. **Acesse o menu da impressora** usando os botões no painel
2. Procure por uma dessas opções:
   - "Network Settings"
   - "TCP/IP Settings"  
   - "Network Configuration"
   - "Network Info"
   - "IP Settings"
   - "Network Status"
3. **Anote o endereço IP** que aparece (ex: `192.168.1.50`)
4. **Anote a porta** (geralmente `9100`)

### Método Alternativo: Página de Teste

1. Imprima uma página de teste/configuração da impressora
2. Procure pelo IP na página impressa
3. Geralmente aparece como: `IP Address: 192.168.1.50`

### Método Alternativo: Roteador

1. Acesse o painel do roteador:
   - Abra navegador: `http://192.168.1.1` ou `http://192.168.0.1`
   - Ou descubra o IP do gateway: 
     - Windows: `ipconfig` → procure "Default Gateway"
     - Mac/Linux: `route -n get default` ou `ip route`
2. Faça login no roteador
3. Procure por:
   - "Dispositivos Conectados"
   - "DHCP Clients"  
   - "Network Devices"
   - "Connected Devices"
4. Procure pelo nome da sua impressora na lista
5. Anote o IP atribuído

## ✅ Passo 2: Testar Conexão

Depois de descobrir o IP, teste se está acessível:

```bash
# Testar ping (substitua pelo IP real)
ping 192.168.1.50

# Testar porta 9100 (padrão para ESC/POS)
# Mac/Linux:
nc -zv 192.168.1.50 9100

# Windows:
telnet 192.168.1.50 9100
```

**Se conectar, está funcionando!** ✅

**Se não conectar na porta 9100, tente 9101:**
```bash
nc -zv 192.168.1.50 9101
```

## ⚙️ Passo 3: Configurar `.env`

Edite o arquivo `.env` na pasta `print-bridge`:

**Substitua o conteúdo atual por:**

```env
PORT=3333
PRINTER_LAN_IP=192.168.1.50
PRINTER_LAN_PORT=9100
```

**Substitua `192.168.1.50` pelo IP real da sua impressora!**

**Se a porta for diferente de 9100, ajuste também `PRINTER_LAN_PORT`**

### Exemplo Completo:

Se sua impressora está em `192.168.1.100` na porta `9100`:
```env
PORT=3333
PRINTER_LAN_IP=192.168.1.100
PRINTER_LAN_PORT=9100
```

## 🧪 Passo 4: Testar Print Bridge

```bash
cd print-bridge

# Iniciar Print Bridge
node dist/index.js
```

**Em outro terminal, verificar impressoras:**
```bash
curl http://localhost:3333/printers
```

**Deve mostrar algo como:**
```json
{
  "printers": [
    {
      "name": "LAN: 192.168.1.50:9100",
      "type": "LAN",
      "ip": "192.168.1.50",
      "port": 9100
    }
  ],
  "platform": "darwin"
}
```

## 🖨️ Passo 5: Testar Impressão

```bash
curl -X POST http://localhost:3333/print \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "LAN",
    "lan": {"ip": "192.168.1.50", "port": 9100},
    "receipt": {
      "shopName": "Test Shop",
      "saleNumber": "TEST-001",
      "date": "2024-01-01",
      "subtotal": "10.00",
      "tax": "0.00",
      "total": "10.00",
      "items": [{
        "name": "Test Item",
        "qty": 1,
        "unitPrice": "10.00",
        "total": "10.00"
      }]
    },
    "cut": true
  }'
```

**Substitua `192.168.1.50` pelo IP real da sua impressora!**

Se imprimir, está funcionando! ✅

## 🎯 Próximo Passo

Depois de testar e confirmar que funciona:

1. **Configure auto-start** para iniciar automaticamente:
   - Windows: `install-service-windows.bat`
   - Mac: `install-service-mac.sh`
   - Linux: `install-service-linux.sh`

2. **Teste uma venda real** no sistema POS

## 🐛 Troubleshooting

### Erro: "Connection timeout"

**Causa:** Impressora não está acessível

**Solução:**
1. Verificar se impressora está ligada
2. Verificar cabo Ethernet conectado
3. Verificar se IP está correto: `ping 192.168.1.50`
4. Verificar firewall (desativar temporariamente para teste)

### Erro: "Connection refused"

**Causa:** Porta não está acessível

**Solução:**
1. Verificar se porta está correta (pode ser 9101)
2. Testar outras portas: `nc -zv 192.168.1.50 9101`
3. Verificar configurações de firewall da impressora

### Não encontra impressora

**Solução:**
1. Verificar se IP está correto no menu da impressora
2. Verificar se impressora está na mesma rede
3. Testar ping: `ping 192.168.1.50`
4. Verificar se porta 9100 está aberta

## ✅ Checklist

- [ ] IP da impressora descoberto
- [ ] Ping funciona: `ping <IP>`
- [ ] Porta 9100 testada: `nc -zv <IP> 9100`
- [ ] Arquivo `.env` configurado com `PRINTER_LAN_IP`
- [ ] Print Bridge iniciado
- [ ] Impressora aparece em `GET /printers`
- [ ] Teste de impressão funcionando

## 🎉 Pronto!

Agora o Print Bridge está configurado para usar LAN. Quando você finalizar uma venda no sistema POS (`https://sunshinebar.vercel.app`), o recibo será impresso automaticamente na impressora LAN!

