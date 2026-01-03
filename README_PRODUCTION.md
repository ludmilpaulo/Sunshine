# 🚀 Guia de Produção - Sistema Sunshine

## ✅ Status: Pronto para Produção

Todos os componentes estão configurados e prontos para uso em produção.

## 📦 Componentes

### 1. Backend (PythonAnywhere)
- **URL**: `https://sunshinebar.pythonanywhere.com/`
- **Status**: ✅ Configurado
- **CORS**: ✅ Aceita requisições de `https://sunshinebar.vercel.app`

### 2. Frontend (Vercel)
- **URL**: `https://sunshinebar.vercel.app`
- **Status**: ✅ Pronto para deploy
- **Print Bridge**: ✅ Configurado para usar `localhost:3333` automaticamente

### 3. Print Bridge (Local - Máquina do Cliente)
- **URL**: `http://localhost:3333`
- **Status**: ✅ Código compilado e pronto
- **CORS**: ✅ Aceita requisições de `https://sunshinebar.vercel.app`

## 🎯 Como Funciona

### Arquitetura

```
┌─────────────────┐
│   Vercel        │  Frontend (código)
│   (Cloud)       │  ──────────────────┐
└─────────────────┘                     │
                                         │
                                         ▼
                              ┌──────────────────────┐
                              │  Navegador do        │
                              │  Cliente (Browser)   │  JavaScript executa aqui
                              └──────────────────────┘
                                         │
                                         │ localhost:3333
                                         ▼
                              ┌──────────────────────┐
                              │  Print Bridge        │
                              │  (Máquina Local)     │  Acessa impressora física
                              └──────────────────────┘
```

**Por que funciona:**
- O código JavaScript do frontend roda no **navegador do cliente**
- O navegador pode acessar `localhost:3333` se Print Bridge estiver na mesma máquina
- Funciona mesmo com frontend hospedado no Vercel!

## 📋 Passos para Produção

### Passo 1: Deploy no Vercel

**Opção A: Deploy Automático (Recomendado)**
```bash
git add .
git commit -m "Production ready: Print Bridge improvements"
git push origin master
```
Vercel detectará automaticamente e fará deploy.

**Opção B: Deploy Manual**
1. Acesse https://vercel.com/dashboard
2. Selecione projeto "Sunshine"
3. Vá em "Deployments"
4. Clique em "..." → "Redeploy"

**Variáveis de Ambiente no Vercel:**
- Não precisa configurar `NEXT_PUBLIC_PRINT_BRIDGE_URL` (usa localhost automaticamente)
- OU configure se Print Bridge estiver em cloud: `https://seu-print-bridge.com`

### Passo 2: Instalar Print Bridge na Máquina do Caixa

**Requisitos:**
- Node.js instalado (versão 16 ou superior)
- Impressora conectada (USB ou LAN)

**Instalação:**
```bash
# 1. Copiar pasta print-bridge para a máquina
# 2. Instalar dependências
cd print-bridge
npm install

# 3. Compilar
npm run build

# 4. Criar arquivo .env
cat > .env << EOF
PORT=3333
PRINTER_USB_NAME=Nome Exato da Impressora
# ou para LAN:
# PRINTER_LAN_IP=192.168.1.50
# PRINTER_LAN_PORT=9100
EOF

# 5. Descobrir nome da impressora
node dist/index.js &
sleep 2
curl http://localhost:3333/printers
# Copie o nome exato e atualize o .env

# 6. Iniciar Print Bridge
node dist/index.js
```

**Configurar como Serviço do Windows (Opcional):**
Veja `print-bridge/WINDOWS10_TROUBLESHOOTING.md` para instruções.

### Passo 3: Testar

1. **Verificar Print Bridge:**
   ```bash
   curl http://localhost:3333/health
   ```
   Deve retornar: `{"ok":true,"service":"print-bridge"}`

2. **Abrir sistema no navegador:**
   - URL: `https://sunshinebar.vercel.app`
   - Fazer login
   - Ir para POS

3. **Testar impressão:**
   - Adicionar produtos ao carrinho
   - Finalizar venda
   - Verificar se recibo imprime

4. **Verificar console (F12):**
   - Procurar por: `🔍 Print Bridge: Trying localhost:3333`
   - Não deve haver erros de CORS

## 🔧 Configuração Detalhada

### Print Bridge - Arquivo .env

```env
# Porta do serviço
PORT=3333

# Impressora USB (use o nome exato do sistema)
PRINTER_USB_NAME=Nome Exato da Impressora

# OU Impressora LAN
# PRINTER_LAN_IP=192.168.1.50
# PRINTER_LAN_PORT=9100

# CORS (já configurado no código, mas pode sobrescrever)
# CORS_ORIGIN=https://sunshinebar.vercel.app
# CORS_ORIGIN_ALLOW_ALL=false
```

### Frontend - Variáveis de Ambiente (Vercel)

**Não precisa configurar nada!** O código usa `localhost:3333` automaticamente.

**OU se Print Bridge estiver em cloud:**
```
NEXT_PUBLIC_PRINT_BRIDGE_URL=https://seu-print-bridge.com
```

## 🐛 Troubleshooting

### Erro: "Print Bridge não está acessível"

**Causa:** Print Bridge não está rodando na máquina do cliente

**Solução:**
```bash
cd print-bridge
node dist/index.js
```

### Erro: "CORS blocked"

**Causa:** Print Bridge não está aceitando requisições do Vercel

**Solução:** Verificar se `https://sunshinebar.vercel.app` está na lista de origens permitidas (já está configurado no código)

### Erro: "USB print failed"

**Causa:** Nome da impressora incorreto

**Solução:**
1. Verificar nome exato: `curl http://localhost:3333/printers`
2. Atualizar `.env` com nome correto (case-sensitive)
3. Reiniciar Print Bridge

### Impressão não funciona no Windows 10

**Solução:** Veja `print-bridge/WINDOWS10_TROUBLESHOOTING.md`

## ✅ Checklist Final

- [x] Código frontend atualizado e pronto
- [x] Código Print Bridge compilado
- [x] CORS configurado corretamente
- [x] Tratamento de erros melhorado
- [x] Documentação completa
- [ ] Deploy no Vercel
- [ ] Print Bridge instalado na máquina do caixa
- [ ] Teste de impressão realizado

## 📚 Documentação Adicional

- `PRODUCTION_CHECKLIST.md` - Checklist detalhado
- `ARQUITETURA_PRINT_BRIDGE.md` - Explicação da arquitetura
- `print-bridge/WINDOWS10_TROUBLESHOOTING.md` - Troubleshooting Windows
- `print-bridge/QUICK_START.md` - Início rápido

## 🎉 Pronto!

O sistema está configurado e pronto para produção. Basta fazer o deploy e instalar o Print Bridge na máquina do caixa.

