# Solução: "Print Bridge não está configurado"

## ✅ Problema Resolvido

O erro "Print Bridge não está configurado" ocorria porque o serviço Print Bridge não estava rodando.

## 🔧 O que foi feito:

1. ✅ **Print Bridge iniciado** na porta 3333
2. ✅ **Arquivo .env criado** com configuração da impressora USB
3. ✅ **Melhorada detecção de ambiente** no frontend (agora detecta melhor localhost e IPs locais)
4. ✅ **Script de inicialização criado** (`start-print-bridge.sh`)

## 🚀 Como manter o Print Bridge rodando:

### Opção 1: Script de inicialização (Recomendado)

```bash
cd print-bridge
./start-print-bridge.sh
```

Mantenha este terminal aberto.

### Opção 2: Manual

```bash
cd print-bridge
npm run build
node dist/index.js
```

### Opção 3: Em segundo plano (macOS/Linux)

```bash
cd print-bridge
nohup ./start-print-bridge.sh > /tmp/print-bridge.log 2>&1 &
```

## ✅ Verificar se está rodando:

```bash
curl http://localhost:3333/health
```

Deve retornar: `{"ok":true,"service":"print-bridge"}`

## 🔍 Testar impressão:

1. Abra o sistema POS no navegador
2. Complete uma venda de teste
3. A impressão deve funcionar automaticamente

## ⚠️ Se ainda não funcionar:

### 1. Verifique se o Print Bridge está rodando:
```bash
curl http://localhost:3333/health
```

### 2. Verifique as impressoras disponíveis:
```bash
curl http://localhost:3333/printers
```

### 3. Verifique o arquivo .env:
```bash
cat print-bridge/.env
```

Deve conter:
```
PORT=3333
PRINTER_USB_NAME=_USB_Receipt_Printer
```

### 4. Verifique os logs:
```bash
tail -f /tmp/print-bridge.log
```

### 5. Verifique se o frontend está em desenvolvimento:

Abra o console do navegador (F12) e procure por:
```
🔍 Print Bridge URL: http://localhost:3333 Hostname: ...
```

Se o hostname não for `localhost` ou `127.0.0.1`, o frontend pode estar detectando como produção.

**Solução:** Configure a variável de ambiente no frontend:
```bash
# No arquivo frontend/.env.local
NEXT_PUBLIC_PRINT_BRIDGE_URL=http://localhost:3333
```

## 📝 Configuração da Impressora

O arquivo `.env` já está configurado com:
- `PRINTER_USB_NAME=_USB_Receipt_Printer`

Se precisar alterar, edite o arquivo `print-bridge/.env` e reinicie o serviço.

## 🐛 Problemas Comuns

### Print Bridge para de rodar

**Causa:** O processo foi encerrado ou o terminal foi fechado.

**Solução:** 
- Use `nohup` para rodar em segundo plano
- Ou configure como serviço do sistema (veja `QUICK_START.md`)

### Erro: "Failed to fetch" ou CORS

**Causa:** Print Bridge não está rodando ou há problema de CORS.

**Solução:**
1. Verifique se Print Bridge está rodando: `curl http://localhost:3333/health`
2. Verifique os logs: `tail -f /tmp/print-bridge.log`
3. Reinicie o Print Bridge

### Frontend não detecta localhost

**Causa:** O frontend está detectando como produção.

**Solução:** Configure `NEXT_PUBLIC_PRINT_BRIDGE_URL=http://localhost:3333` no `.env.local` do frontend.

## 📞 Próximos Passos

1. ✅ Print Bridge está rodando
2. ✅ Configuração da impressora está correta
3. ✅ Frontend melhorado para detectar ambiente
4. ⏭️ Teste uma venda no sistema POS
5. ⏭️ Se funcionar, configure para rodar automaticamente (serviço do sistema)

## 🔄 Para Windows 10

Se estiver usando Windows 10, veja `WINDOWS10_TROUBLESHOOTING.md` para instruções específicas.

