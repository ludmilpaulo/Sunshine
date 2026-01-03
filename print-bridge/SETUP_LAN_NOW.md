# ⚡ Configurar Impressora LAN - Agora!

Sua impressora já está conectada à LAN. Vamos configurar!

## 🎯 Passo a Passo Rápido

### 1. Descobrir o IP da Impressora

**Opção A: Menu da Impressora (Mais Fácil)**
1. Acesse o menu da impressora (botões no painel)
2. Procure: "Network Settings" ou "TCP/IP" ou "Network Info"
3. Anote o IP (ex: `192.168.1.50`)

**Opção B: Página de Teste**
1. Imprima uma página de teste/configuração
2. Procure pelo IP na página

**Opção C: Roteador**
1. Acesse `http://192.168.1.1` (ou IP do seu roteador)
2. Procure "Dispositivos Conectados"
3. Encontre sua impressora e anote o IP

### 2. Testar Conexão

```bash
# Testar ping (substitua pelo IP real)
ping 192.168.1.50

# Testar porta 9100
nc -zv 192.168.1.50 9100
```

### 3. Configurar `.env`

Edite o arquivo `.env` na pasta `print-bridge`:

```env
PORT=3333
PRINTER_LAN_IP=192.168.1.50
PRINTER_LAN_PORT=9100
```

**Substitua `192.168.1.50` pelo IP real da sua impressora!**

### 4. Testar Print Bridge

```bash
cd print-bridge

# Iniciar
node dist/index.js

# Em outro terminal, verificar
curl http://localhost:3333/printers
```

Deve mostrar:
```json
{
  "printers": [{
    "name": "LAN: 192.168.1.50:9100",
    "type": "LAN",
    "ip": "192.168.1.50",
    "port": 9100
  }]
}
```

### 5. Testar Impressão

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

## ✅ Pronto!

Agora o Print Bridge está configurado para usar LAN. Quando você finalizar uma venda no sistema POS, o recibo será impresso automaticamente!

## 🔧 Se Não Funcionar

1. **Verificar IP:**
   ```bash
   ping 192.168.1.50
   ```

2. **Verificar porta:**
   ```bash
   nc -zv 192.168.1.50 9100
   ```
   Se não conectar, tente porta `9101`:
   ```bash
   nc -zv 192.168.1.50 9101
   ```

3. **Verificar firewall:**
   - Desative temporariamente para teste
   - Adicione exceção para porta 9100

4. **Verificar impressora:**
   - Certifique-se que está ligada
   - Verifique cabo Ethernet conectado
   - Verifique se IP está correto no menu da impressora

## 📚 Mais Informações

- `LAN_SETUP_GUIDE.md` - Guia completo
- `find-printer-ip.md` - Métodos para descobrir IP

