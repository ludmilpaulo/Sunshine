# Fix para Impressão em Produção

## Problema

Em produção (Vercel), o frontend não consegue imprimir porque:
1. O Print Bridge precisa estar rodando na máquina do caixa (não no servidor)
2. CORS pode estar bloqueando requisições do domínio de produção
3. O frontend em produção tenta acessar `localhost:3333` (que funciona porque roda no browser do caixa)

## Solução

### 1. Print Bridge deve rodar na máquina do caixa

O Print Bridge **DEVE** estar rodando na mesma máquina onde o caixa usa o sistema.

**Como verificar:**
```bash
# Na máquina do caixa, verifique se Print Bridge está rodando:
curl http://localhost:3333/health
```

**Como iniciar:**
```bash
cd print-bridge
npm run dev
# ou em produção:
npm run build
npm start
```

### 2. Configurar CORS no Print Bridge

Adicione ao `.env` do Print Bridge:

```env
# Permitir todas as origens (para produção)
CORS_ORIGIN_ALLOW_ALL=true

# OU configure origens específicas:
CORS_ORIGINS=https://sunshinebar.vercel.app,https://seu-dominio.vercel.app
```

### 3. Verificar variáveis de ambiente no Vercel

No Vercel, configure (opcional, já tem padrão):
- `NEXT_PUBLIC_PRINT_BRIDGE_URL` = `http://localhost:3333` (ou deixe vazio para usar padrão)
- `NEXT_PUBLIC_PRINTER_USB_NAME` = `_USB_Receipt_Printer` (ou deixe vazio para usar padrão)

### 4. Como funciona em produção

1. Frontend está no Vercel (https://sunshinebar.vercel.app)
2. Caixa abre o sistema no navegador da máquina local
3. Frontend (código JavaScript) roda no browser do caixa
4. Browser tenta acessar `http://localhost:3333` (Print Bridge na máquina local)
5. Print Bridge imprime na impressora USB conectada localmente

**Isso funciona porque:**
- O código JavaScript do frontend roda no browser (não no servidor Vercel)
- O browser pode acessar `localhost:3333` na máquina onde está rodando
- Print Bridge está rodando na mesma máquina

## Checklist de Produção

- [ ] Print Bridge está rodando na máquina do caixa
- [ ] Print Bridge `.env` tem `CORS_ORIGIN_ALLOW_ALL=true` ou `CORS_ORIGINS` configurado
- [ ] Impressora USB está conectada e configurada
- [ ] `PRINTER_USB_NAME` está correto no Print Bridge `.env`
- [ ] Testar impressão de uma venda

## Teste Rápido

Na máquina do caixa:

```bash
# 1. Verificar Print Bridge
curl http://localhost:3333/health

# 2. Listar impressoras
curl http://localhost:3333/printers

# 3. Testar impressão
curl -X POST http://localhost:3333/print \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "USB",
    "usb": {"printerName": "_USB_Receipt_Printer"},
    "receipt": {
      "shopName": "Test",
      "saleNumber": "TEST",
      "date": "2024-01-01T12:00:00Z",
      "subtotal": "10.00",
      "tax": "0.00",
      "total": "10.00",
      "items": [{"name": "Test", "qty": 1, "unitPrice": "10.00", "total": "10.00"}]
    },
    "cut": true
  }'
```

## Erros Comuns

### "Failed to fetch" ou "CORS error"
- **Solução**: Adicione `CORS_ORIGIN_ALLOW_ALL=true` no Print Bridge `.env`

### "Print Bridge não está acessível"
- **Solução**: Verifique se Print Bridge está rodando: `curl http://localhost:3333/health`

### "LAN_FAILED_AND_USB_PRINTER_NOT_SET"
- **Solução**: Já corrigido - frontend agora sempre envia nome USB

### "USB_PRINTER_NAME_REQUIRED"
- **Solução**: Verifique `PRINTER_USB_NAME` no Print Bridge `.env`

