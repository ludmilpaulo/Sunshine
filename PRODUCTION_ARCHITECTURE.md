# Arquitetura de Produção - Sunshine POS

## Componentes do Sistema

### 1. Backend - Django (PythonAnywhere)
- **URL**: `https://sunshinebar.pythonanywhere.com/api`
- **Responsabilidades**:
  - Autenticação (JWT)
  - Produtos (CRUD)
  - Vendas (checkout)
  - Estoque
  - Usuários
- **Banco de Dados**: MySQL (PythonAnywhere)

### 2. Frontend - Next.js (Vercel)
- **URL**: `https://sunshinebar.vercel.app`
- **Responsabilidades**:
  - Interface do usuário (POS, Admin)
  - Comunicação com backend Django
  - Comunicação com Print Bridge (local)
- **Deploy**: Vercel (automatic via GitHub)

### 3. Print Bridge - Node.js (Máquina do Caixa - LOCAL)
- **URL**: `http://localhost:3333`
- **Responsabilidades**:
  - Receber requisições de impressão do frontend
  - Imprimir recibos na impressora USB/LAN local
- **Localização**: Deve rodar na mesma máquina onde o caixa usa o sistema

## Fluxo de uma Venda

```
1. Caixa abre sistema no navegador
   └─> Frontend (Next.js) carregado do Vercel
   
2. Caixa escaneia produtos e finaliza venda
   └─> Frontend envia para Backend Django (PythonAnywhere)
   
3. Backend processa venda
   └─> Salva no banco de dados
   └─> Retorna recibo formatado
   
4. Frontend recebe recibo
   └─> Código JavaScript (rodando no browser do caixa)
   └─> Envia recibo para Print Bridge (localhost:3333)
   
5. Print Bridge imprime
   └─> Recebe requisição HTTP
   └─> Envia para impressora USB/LAN local
   └─> Retorna sucesso/erro
```

## Por que Print Bridge é Local?

O Print Bridge **DEVE** rodar na máquina do caixa porque:

1. **Impressora USB**: Só pode ser acessada localmente
2. **Impressora LAN**: Precisa estar na mesma rede local
3. **Segurança**: Não expõe impressora na internet
4. **Performance**: Comunicação local é mais rápida

## Configuração de Produção

### Backend Django (PythonAnywhere)

**Variáveis de Ambiente:**
```env
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=sunshinebar.pythonanywhere.com
DB_ENGINE=mysql
DB_NAME=sunshinebar$default
CORS_ALLOWED_ORIGINS=https://sunshinebar.vercel.app
```

### Frontend Next.js (Vercel)

**Variáveis de Ambiente (Vercel Dashboard):**
```env
NEXT_PUBLIC_API_BASE_URL=https://sunshinebar.pythonanywhere.com/api
NEXT_PUBLIC_PRINT_BRIDGE_URL=http://localhost:3333
# Opcional - já tem padrão:
NEXT_PUBLIC_PRINTER_USB_NAME=_USB_Receipt_Printer
```

**Nota**: `NEXT_PUBLIC_PRINT_BRIDGE_URL` pode ser deixado vazio - o código usa `localhost:3333` como padrão.

### Print Bridge (Máquina do Caixa)

**Arquivo `.env`:**
```env
PORT=3333
PRINTER_USB_NAME=_USB_Receipt_Printer
CORS_ORIGIN_ALLOW_ALL=true
```

**Como iniciar:**
```bash
cd print-bridge
npm install
npm run build
npm start
```

**Ou usar o script:**
```bash
./START_PRODUCTION.sh
```

## Por que Funciona?

### Frontend (Vercel) → Print Bridge (Localhost)

O frontend Next.js é **compilado** e enviado para o Vercel, mas o **código JavaScript roda no navegador do caixa**.

Quando o código tenta acessar `http://localhost:3333`:
- ✅ Funciona porque o navegador está na máquina do caixa
- ✅ Print Bridge está rodando na mesma máquina
- ✅ Comunicação é local (não passa pela internet)

### CORS

O Print Bridge precisa permitir requisições do domínio Vercel:
- Frontend carregado de: `https://sunshinebar.vercel.app`
- Requisição vem de: `https://sunshinebar.vercel.app` (origin do browser)
- Print Bridge precisa aceitar essa origem

**Solução**: `CORS_ORIGIN_ALLOW_ALL=true` no Print Bridge `.env`

## Troubleshooting

### Erro: "Failed to fetch" ou "Print Bridge não está acessível"

**Causa**: Print Bridge não está rodando na máquina do caixa

**Solução**:
```bash
# Na máquina do caixa:
cd print-bridge
npm start
# Verificar:
curl http://localhost:3333/health
```

### Erro: "CORS blocked"

**Causa**: Print Bridge não está permitindo requisições do Vercel

**Solução**: Adicionar `CORS_ORIGIN_ALLOW_ALL=true` no Print Bridge `.env` e reiniciar

### Erro: "LAN_FAILED_AND_USB_PRINTER_NOT_SET"

**Causa**: Frontend não está enviando nome da impressora USB

**Solução**: ✅ Já corrigido - frontend sempre envia USB config

### Venda funciona mas não imprime

**Verificar**:
1. Print Bridge está rodando? (`curl http://localhost:3333/health`)
2. Impressora USB está conectada?
3. Nome da impressora está correto? (`curl http://localhost:3333/printers`)
4. Console do navegador mostra erros?

## Checklist de Deploy

### Backend (PythonAnywhere)
- [ ] Código atualizado
- [ ] Migrations aplicadas
- [ ] Variáveis de ambiente configuradas
- [ ] CORS_ALLOWED_ORIGINS inclui domínio Vercel
- [ ] Testar API endpoints

### Frontend (Vercel)
- [ ] Código no GitHub
- [ ] Vercel conectado ao repositório
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy automático funcionando
- [ ] Testar acesso ao sistema

### Print Bridge (Máquina do Caixa)
- [ ] Node.js instalado
- [ ] Código copiado para máquina do caixa
- [ ] `npm install` executado
- [ ] `.env` configurado
- [ ] `CORS_ORIGIN_ALLOW_ALL=true` no `.env`
- [ ] `PRINTER_USB_NAME` configurado
- [ ] Print Bridge rodando (`npm start`)
- [ ] Testar impressão

## Resumo

✅ **Backend Django**: Processa vendas (PythonAnywhere)
✅ **Frontend Next.js**: Interface do usuário (Vercel)
✅ **Print Bridge**: Impressão local (Máquina do Caixa)

A comunicação funciona porque:
- Frontend (código JavaScript) roda no navegador
- Navegador pode acessar `localhost:3333` na máquina local
- Print Bridge está na mesma máquina
- CORS permite requisições do domínio Vercel

