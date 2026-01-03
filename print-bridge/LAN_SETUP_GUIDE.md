# 🌐 Guia: Configurar Impressora via LAN (TCP/IP)

Configurar a impressora via LAN é a **melhor opção para produção** porque:
- ✅ Mais confiável (não depende de drivers)
- ✅ Funciona em qualquer sistema operacional
- ✅ Mais rápido
- ✅ Não precisa de drivers instalados
- ✅ Funciona mesmo se a impressora estiver em outro computador na rede

## 📋 Pré-requisitos

1. Impressora conectada à rede via cabo Ethernet
2. Impressora configurada com IP estático (recomendado)
3. Porta 9100 acessível (padrão para ESC/POS)

## 🔍 Passo 1: Descobrir o IP da Impressora

### Opção 1: Via Painel da Impressora

1. Acesse o menu da impressora (botões no painel)
2. Procure por "Network Settings", "TCP/IP", ou "Network"
3. Anote o endereço IP (ex: `192.168.1.50`)

### Opção 2: Via Impressora Test Page

1. Imprima uma página de teste/configuração da impressora
2. Procure pelo IP na página impressa

### Opção 3: Via Roteador/Modem

1. Acesse o painel do roteador (geralmente `192.168.1.1` ou `192.168.0.1`)
2. Procure por "Dispositivos Conectados" ou "DHCP Clients"
3. Procure pelo nome da impressora e anote o IP

### Opção 4: Usar Auto-Discovery do Print Bridge

O Print Bridge tem um recurso de descoberta automática:

```bash
# Iniciar Print Bridge
cd print-bridge
node dist/index.js

# Em outro terminal, descobrir impressora
curl http://localhost:3333/discover
```

Isso tentará encontrar a impressora automaticamente na rede.

### Opção 5: Usar Script de Descoberta

Execute o script fornecido:
```bash
cd print-bridge
chmod +x discover-printer.sh
./discover-printer.sh
```

## ⚙️ Passo 2: Configurar o Print Bridge

### Criar/Editar arquivo `.env`

Na pasta `print-bridge`, crie ou edite o arquivo `.env`:

```env
PORT=3333

# Configuração LAN (Recomendado)
PRINTER_LAN_IP=192.168.1.50
PRINTER_LAN_PORT=9100

# OU usar hostname (se impressora suporta)
# PRINTER_HOSTNAME=printer.local

# Configuração USB (opcional - para fallback)
# PRINTER_USB_NAME=Nome da Impressora
```

**Substitua `192.168.1.50` pelo IP real da sua impressora!**

### Exemplo Completo

```env
PORT=3333
PRINTER_LAN_IP=192.168.1.50
PRINTER_LAN_PORT=9100
```

## ✅ Passo 3: Testar Conexão

### Teste 1: Ping
```bash
ping 192.168.1.50
```
Deve responder com sucesso.

### Teste 2: Porta 9100
```bash
# Windows
telnet 192.168.1.50 9100

# Mac/Linux
nc -zv 192.168.1.50 9100
# ou
telnet 192.168.1.50 9100
```

Se conectar, a porta está acessível.

### Teste 3: Print Bridge
```bash
# Iniciar Print Bridge
cd print-bridge
node dist/index.js

# Em outro terminal, verificar impressoras
curl http://localhost:3333/printers
```

Deve mostrar a impressora LAN:
```json
{
  "printers": [
    {
      "name": "LAN: 192.168.1.50:9100",
      "type": "LAN",
      "ip": "192.168.1.50",
      "port": 9100
    }
  ]
}
```

### Teste 4: Impressão de Teste
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

## 🔧 Configuração da Impressora

### Configurar IP Estático (Recomendado)

**Por que IP estático?**
- O IP não muda quando a impressora reinicia
- Mais confiável para produção
- Não precisa descobrir o IP toda vez

**Como configurar:**
1. Acesse o menu da impressora
2. Vá em "Network Settings" → "TCP/IP"
3. Desative DHCP
4. Configure:
   - IP: `192.168.1.50` (use um IP disponível na sua rede)
   - Subnet Mask: `255.255.255.0`
   - Gateway: `192.168.1.1` (IP do roteador)
   - Porta: `9100` (padrão)

### Verificar Porta 9100

A porta 9100 é o padrão para impressão RAW (ESC/POS). Algumas impressoras usam:
- `9100` - Padrão (mais comum)
- `9101` - Alternativa
- `515` - LPR/LPD
- `631` - IPP

Teste qual porta funciona:
```bash
# Testar porta 9100
nc -zv 192.168.1.50 9100

# Testar porta 9101
nc -zv 192.168.1.50 9101
```

## 🚀 Modo AUTO (Recomendado)

O modo AUTO tenta LAN primeiro e faz fallback para USB se necessário:

```env
PORT=3333
PRINTER_LAN_IP=192.168.1.50
PRINTER_LAN_PORT=9100
PRINTER_USB_NAME=Nome da Impressora USB
```

O frontend automaticamente usará modo AUTO, tentando LAN primeiro.

## 🐛 Troubleshooting

### Erro: "Connection timeout"

**Causa:** Impressora não está acessível na rede

**Solução:**
1. Verificar se impressora está ligada
2. Verificar cabo Ethernet conectado
3. Verificar se IP está correto: `ping 192.168.1.50`
4. Verificar firewall (desativar temporariamente para teste)

### Erro: "Connection refused"

**Causa:** Porta 9100 não está acessível

**Solução:**
1. Verificar se porta está correta (pode ser 9101)
2. Verificar configurações de firewall da impressora
3. Testar outras portas: 9101, 515, 631

### Impressora não imprime

**Causa:** Dados não estão chegando corretamente

**Solução:**
1. Verificar se impressora suporta ESC/POS
2. Testar com impressão de teste do sistema operacional
3. Verificar logs do Print Bridge

### IP muda constantemente

**Causa:** DHCP está ativo

**Solução:**
1. Configurar IP estático na impressora (veja acima)
2. OU usar hostname se impressora suporta (mDNS/Bonjour)

## 📝 Exemplo de Configuração Completa

### Arquivo `.env`:
```env
PORT=3333
PRINTER_LAN_IP=192.168.1.50
PRINTER_LAN_PORT=9100
```

### Testar:
```bash
# 1. Verificar conexão
ping 192.168.1.50

# 2. Verificar porta
nc -zv 192.168.1.50 9100

# 3. Iniciar Print Bridge
cd print-bridge
node dist/index.js

# 4. Verificar impressoras
curl http://localhost:3333/printers

# 5. Testar impressão
curl -X POST http://localhost:3333/print \
  -H "Content-Type: application/json" \
  -d @test-print.json
```

## ✅ Checklist

- [ ] Impressora conectada à rede via Ethernet
- [ ] IP da impressora descoberto
- [ ] IP estático configurado (recomendado)
- [ ] Porta 9100 testada e acessível
- [ ] Arquivo `.env` configurado com `PRINTER_LAN_IP`
- [ ] Print Bridge iniciado
- [ ] Impressora aparece em `GET /printers`
- [ ] Teste de impressão funcionando

## 🎯 Vantagens da Configuração LAN

1. **Confiabilidade**: Não depende de drivers do sistema
2. **Velocidade**: Conexão direta TCP/IP é mais rápida
3. **Compatibilidade**: Funciona em Windows, Mac, Linux
4. **Flexibilidade**: Impressora pode estar em outro computador
5. **Simplicidade**: Não precisa instalar drivers

## 📚 Próximos Passos

Após configurar LAN:
1. Testar impressão de uma venda real
2. Configurar auto-start (veja `AUTO_START_GUIDE.md`)
3. Monitorar logs para garantir estabilidade

