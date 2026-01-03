# ✅ Checklist de Produção - Print Bridge

## 🎯 Objetivo
Garantir que o sistema de impressão funcione corretamente em produção.

## 📋 Checklist

### 1. Frontend (Vercel) ✅

- [x] Código atualizado para tentar `localhost:3333` automaticamente
- [x] Tratamento de erros melhorado com mensagens claras
- [x] CORS configurado no Print Bridge para aceitar requisições do Vercel
- [ ] **Ação**: Fazer deploy no Vercel (push para GitHub ou redeploy manual)

**Variáveis de Ambiente no Vercel (Opcional):**
- `NEXT_PUBLIC_PRINT_BRIDGE_URL` - Deixe vazio ou não configure (usa localhost automaticamente)
  - OU configure se Print Bridge estiver em cloud: `https://seu-print-bridge.com`

### 2. Print Bridge (Máquina do Cliente) ✅

- [x] Código compilado (`dist/` folder)
- [x] CORS configurado para aceitar `https://sunshinebar.vercel.app`
- [x] Tratamento de erros melhorado para Windows 10
- [x] Suporte a variações de nome de impressora
- [ ] **Ação**: Instalar e rodar na máquina do caixa

**Configuração na máquina do caixa:**
```bash
cd print-bridge
npm install
npm run build
node dist/index.js
```

**Arquivo `.env` (criar na máquina do caixa):**
```env
PORT=3333
PRINTER_USB_NAME=Nome Exato da Impressora
# ou para LAN:
# PRINTER_LAN_IP=192.168.1.50
# PRINTER_LAN_PORT=9100
```

### 3. Backend (PythonAnywhere) ✅

- [x] CORS configurado para aceitar `https://sunshinebar.vercel.app`
- [ ] **Verificar**: CORS_ALLOWED_ORIGINS inclui o domínio Vercel

### 4. Testes em Produção

#### Teste 1: Verificar Print Bridge está rodando
```bash
curl http://localhost:3333/health
```
**Esperado:** `{"ok":true,"service":"print-bridge"}`

#### Teste 2: Verificar impressoras disponíveis
```bash
curl http://localhost:3333/printers
```
**Esperado:** Lista de impressoras disponíveis

#### Teste 3: Testar impressão via frontend
1. Abrir `https://sunshinebar.vercel.app/pos` na máquina do caixa
2. Fazer login
3. Adicionar produtos ao carrinho
4. Finalizar venda
5. **Esperado:** Recibo imprime automaticamente

#### Teste 4: Verificar console do navegador
1. Abrir DevTools (F12)
2. Ir para Console
3. Procurar por: `🔍 Print Bridge: Trying localhost:3333`
4. **Esperado:** Sem erros de CORS ou conexão

### 5. Troubleshooting

#### Erro: "Print Bridge não está acessível"
**Causa:** Print Bridge não está rodando na máquina do cliente
**Solução:**
```bash
cd print-bridge
node dist/index.js
```

#### Erro: "CORS blocked"
**Causa:** Print Bridge não está aceitando requisições do Vercel
**Solução:** Verificar se `https://sunshinebar.vercel.app` está na lista de origens permitidas no Print Bridge

#### Erro: "USB print failed"
**Causa:** Nome da impressora incorreto ou impressora offline
**Solução:**
1. Verificar nome exato: `curl http://localhost:3333/printers`
2. Atualizar `.env` com nome correto
3. Reiniciar Print Bridge

### 6. Deploy no Vercel

**Opção 1: Deploy automático (recomendado)**
```bash
git add .
git commit -m "Ready for production: Print Bridge improvements"
git push origin master
```
Vercel detectará automaticamente e fará deploy.

**Opção 2: Deploy manual**
1. Acessar https://vercel.com/dashboard
2. Selecionar projeto "Sunshine"
3. Clicar em "Deployments"
4. Clicar em "..." → "Redeploy"

### 7. Configuração Final

#### Na máquina do caixa (Windows 10):
1. Instalar Node.js (se não tiver)
2. Copiar pasta `print-bridge` para a máquina
3. Executar `npm install` na pasta `print-bridge`
4. Executar `npm run build`
5. Criar arquivo `.env` com configuração da impressora
6. Iniciar Print Bridge: `node dist/index.js`
7. (Opcional) Configurar como serviço do Windows para iniciar automaticamente

#### No Vercel:
- Não precisa configurar nada (usa localhost automaticamente)
- OU configure `NEXT_PUBLIC_PRINT_BRIDGE_URL` se Print Bridge estiver em cloud

## ✅ Status Atual

- ✅ Código frontend pronto para produção
- ✅ Código Print Bridge compilado e pronto
- ✅ CORS configurado corretamente
- ✅ Tratamento de erros melhorado
- ✅ Documentação completa
- ⏭️ **Próximo passo**: Deploy no Vercel e teste na máquina do caixa

## 📝 Notas Importantes

1. **Print Bridge deve rodar na máquina do cliente** - não no servidor
2. **Funciona mesmo com frontend no Vercel** - porque JavaScript roda no navegador
3. **CORS já está configurado** - `https://sunshinebar.vercel.app` está na lista permitida
4. **Não precisa configurar variável no Vercel** - usa localhost automaticamente

## 🚀 Pronto para Produção!

Tudo está configurado e pronto. Basta:
1. Fazer deploy no Vercel
2. Instalar Print Bridge na máquina do caixa
3. Testar uma venda

