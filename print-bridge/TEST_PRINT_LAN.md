# 🖨️ Testar Impressão LAN

## Método 1: Usando Script (Mais Fácil)

### Mac/Linux:
```bash
cd print-bridge
chmod +x test-lan-print.sh
./test-lan-print.sh <IP_DA_IMPRESSORA>
```

**Exemplo:**
```bash
./test-lan-print.sh 192.168.1.50
```

### Windows:
```cmd
cd print-bridge
test-lan-print-windows.bat <IP_DA_IMPRESSORA>
```

**Exemplo:**
```cmd
test-lan-print-windows.bat 192.168.1.50
```

## Método 2: Manual (curl)

```bash
curl -X POST http://localhost:3333/print \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "LAN",
    "lan": {
      "ip": "192.168.1.50",
      "port": 9100
    },
    "receipt": {
      "shopName": "Test Shop",
      "saleNumber": "TEST-001",
      "date": "2024-01-01 12:00:00",
      "subtotal": "10.00",
      "tax": "0.00",
      "total": "10.00",
      "items": [
        {
          "name": "Test Item",
          "qty": 1,
          "unitPrice": "10.00",
          "total": "10.00"
        }
      ]
    },
    "cut": true,
    "openCashDrawer": false
  }'
```

**Substitua `192.168.1.50` pelo IP real da sua impressora!**

## Método 3: Usando Arquivo JSON

1. Crie arquivo `test-print.json`:
```json
{
  "mode": "LAN",
  "lan": {
    "ip": "192.168.1.50",
    "port": 9100
  },
  "receipt": {
    "shopName": "Test Shop",
    "saleNumber": "TEST-001",
    "date": "2024-01-01 12:00:00",
    "subtotal": "10.00",
    "tax": "0.00",
    "total": "10.00",
    "items": [
      {
        "name": "Test Item",
        "qty": 1,
        "unitPrice": "10.00",
        "total": "10.00"
      }
    ]
  },
  "cut": true,
  "openCashDrawer": false
}
```

2. Execute:
```bash
curl -X POST http://localhost:3333/print \
  -H "Content-Type: application/json" \
  -d @test-print.json
```

## ✅ Verificar Resultado

**Sucesso:**
```json
{"ok":true,"used":"LAN"}
```

**Erro:**
```json
{
  "detail": "PRINT_FAILED",
  "error": "..."
}
```

## 🔍 Se Não Funcionar

1. **Verificar Print Bridge está rodando:**
   ```bash
   curl http://localhost:3333/health
   ```

2. **Verificar IP da impressora:**
   ```bash
   ping 192.168.1.50
   ```

3. **Verificar porta:**
   ```bash
   nc -zv 192.168.1.50 9100
   ```

4. **Verificar logs:**
   ```bash
   tail -f /tmp/print-bridge-test.log
   ```

## 📝 Nota

Se você configurou o IP no arquivo `.env`, o script tentará usar automaticamente. Caso contrário, forneça o IP como parâmetro.

