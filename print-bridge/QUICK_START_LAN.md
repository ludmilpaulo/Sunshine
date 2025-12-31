# 🚀 Início Rápido - Impressora LAN

## Passo 1: Descobrir o IP da Impressora

1. **Menu da Impressora**: Acesse configurações de rede e anote o IP
2. **Roteador**: Verifique dispositivos conectados no painel do roteador
3. **Teste**: `ping IP_DA_IMPRESSORA`

## Passo 2: Iniciar Print Bridge

### Opção A: Script Rápido (Recomendado)

```bash
cd print-bridge
./start-lan.sh 192.168.1.100 9100
```

Substitua `192.168.1.100` pelo IP da sua impressora.

### Opção B: Variáveis de Ambiente

```bash
cd print-bridge
export PRINTER_LAN_IP="192.168.1.100"
export PRINTER_LAN_PORT="9100"
export PRINTER_MODE="LAN"
npm run dev
```

## Passo 3: Testar

```bash
# 1. Verificar se está rodando
curl http://localhost:3333/health

# 2. Listar impressoras
curl http://localhost:3333/printers

# 3. Testar impressão
curl -X POST http://localhost:3333/print \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "LAN",
    "lan": {"ip": "192.168.1.100", "port": 9100},
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

## Passo 4: Usar no Frontend

O frontend já está configurado! Quando você finalizar uma venda no POS, o recibo será impresso automaticamente.

## Troubleshooting

- **Print Bridge não inicia**: Verifique se porta 3333 está livre
- **Impressão não funciona**: Teste conectividade: `nc -zv IP 9100`
- **Ver logs**: O Print Bridge mostra logs no terminal

## Scripts Úteis

- `./start-lan.sh [IP] [PORT]` - Inicia com configuração LAN
- `./test-lan-connection.sh [IP] [PORT]` - Testa conexão

