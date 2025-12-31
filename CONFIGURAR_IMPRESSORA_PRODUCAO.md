# Configuração da Impressora em Produção

Este guia explica como configurar a impressora para funcionar em produção (Vercel + Print Bridge).

## Arquitetura

O sistema de impressão funciona da seguinte forma:

1. **Frontend (Vercel)**: Interface web que envia comandos de impressão
2. **Print Bridge (Servidor Local)**: Serviço Node.js que recebe comandos e envia para a impressora
3. **Impressora**: Pode ser USB ou LAN (rede)

## Opções de Configuração

### Opção 1: Print Bridge no mesmo computador (Recomendado)

Se o Print Bridge está rodando no mesmo computador onde a impressora está conectada:

1. **No Vercel (Variáveis de Ambiente)**:
   ```
   NEXT_PUBLIC_PRINT_BRIDGE_URL=http://SEU_IP_LOCAL:3333
   ```
   
   Exemplo:
   ```
   NEXT_PUBLIC_PRINT_BRIDGE_URL=http://192.168.1.100:3333
   ```

2. **No Print Bridge (`.env`)**:
   ```env
   PORT=3333
   CORS_ORIGIN=https://sunshinebar.vercel.app
   FRONTEND_URL=https://sunshinebar.vercel.app
   ```

### Opção 2: Print Bridge em servidor separado

Se o Print Bridge está em um servidor dedicado:

1. **No Vercel**:
   ```
   NEXT_PUBLIC_PRINT_BRIDGE_URL=http://SEU_SERVIDOR:3333
   ```
   
   Exemplo:
   ```
   NEXT_PUBLIC_PRINT_BRIDGE_URL=http://print.sunshinebar.com:3333
   ```

2. **No servidor do Print Bridge**:
   - Configure firewall para permitir porta 3333
   - Configure CORS para aceitar requisições do Vercel

### Opção 3: Print Bridge via túnel (ngrok/Cloudflare Tunnel)

Para desenvolvimento ou se não tiver IP público:

1. **Instale ngrok ou Cloudflare Tunnel**
2. **Crie um túnel para o Print Bridge**:
   ```bash
   ngrok http 3333
   # ou
   cloudflared tunnel --url http://localhost:3333
   ```
3. **No Vercel**:
   ```
   NEXT_PUBLIC_PRINT_BRIDGE_URL=https://seu-tunel.ngrok.io
   ```

## Configuração no Vercel

1. Acesse o painel do Vercel: https://vercel.com/dashboard
2. Selecione o projeto `Sunshine`
3. Vá em **Settings** → **Environment Variables**
4. Adicione as seguintes variáveis:

   ```
   NEXT_PUBLIC_PRINT_BRIDGE_URL=http://SEU_IP_OU_DOMINIO:3333
   NEXT_PUBLIC_PRINTER_LAN_IP=192.168.1.XXX (se usar LAN)
   NEXT_PUBLIC_PRINTER_USB_NAME=Nome da Impressora (se usar USB)
   ```

5. Clique em **Save**
6. Faça um novo deploy (ou aguarde o próximo)

## Configuração do Print Bridge

### 1. Atualizar CORS

O Print Bridge já está configurado para aceitar requisições do Vercel. Se precisar adicionar mais domínios, edite `print-bridge/src/index.ts`:

```typescript
const allowedOrigins = [
  "http://localhost:3000",
  "https://sunshinebar.vercel.app",
  "https://seu-dominio.com", // Adicione aqui
];
```

### 2. Configurar Impressora

#### Para Impressora USB:

1. Edite `print-bridge/.env`:
   ```env
   PRINTER_MODE=USB
   PRINTER_USB_NAME=GO INFINITY
   ```

2. Ou use o script de configuração:
   ```bash
   cd print-bridge
   npm run config:usb
   ```

#### Para Impressora LAN:

1. Descubra o IP da impressora:
   ```bash
   cd print-bridge
   npm run discover
   ```

2. Edite `print-bridge/.env`:
   ```env
   PRINTER_MODE=LAN
   PRINTER_LAN_IP=192.168.1.XXX
   PRINTER_LAN_PORT=9100
   ```

### 3. Iniciar Print Bridge

```bash
cd print-bridge
npm start
```

Para rodar como serviço (Windows):
```bash
npm run install-service
```

Para rodar como serviço (Linux/macOS):
```bash
pm2 start npm --name "print-bridge" -- start
```

## Testando a Configuração

1. **Teste do Print Bridge**:
   ```bash
   curl http://localhost:3333/health
   # Deve retornar: {"ok":true,"service":"print-bridge"}
   ```

2. **Teste do Frontend**:
   - Acesse: https://sunshinebar.vercel.app/test-printer
   - Clique em "Carregar Impressoras"
   - Deve listar as impressoras disponíveis

3. **Teste de Impressão**:
   - Na página de teste, clique em "Imprimir Recibo de Teste"
   - Verifique se a impressora imprime

## Troubleshooting

### Erro: "Print Bridge não está acessível"

**Causa**: O frontend não consegue se conectar ao Print Bridge.

**Soluções**:
1. Verifique se `NEXT_PUBLIC_PRINT_BRIDGE_URL` está configurado no Vercel
2. Verifique se o Print Bridge está rodando
3. Verifique se o firewall permite conexões na porta 3333
4. Se estiver usando IP local, certifique-se de que o computador está na mesma rede

### Erro: CORS

**Causa**: O Print Bridge está bloqueando requisições do Vercel.

**Solução**: 
1. Edite `print-bridge/src/index.ts`
2. Adicione o domínio do Vercel em `allowedOrigins`
3. Reinicie o Print Bridge

### Impressora não encontrada

**Causa**: A impressora não está configurada corretamente.

**Soluções**:
1. Para USB: Verifique se a impressora está conectada e o nome está correto
2. Para LAN: Verifique se o IP está correto e a impressora está na rede
3. Use a página de teste para descobrir a impressora

## Exemplo de Configuração Completa

### Vercel Environment Variables:
```
NEXT_PUBLIC_PRINT_BRIDGE_URL=http://192.168.1.100:3333
NEXT_PUBLIC_PRINTER_MODE=USB
NEXT_PUBLIC_PRINTER_USB_NAME=GO INFINITY
```

### Print Bridge .env:
```env
PORT=3333
PRINTER_MODE=USB
PRINTER_USB_NAME=GO INFINITY
CORS_ORIGIN=https://sunshinebar.vercel.app
FRONTEND_URL=https://sunshinebar.vercel.app
```

## Notas Importantes

1. **Segurança**: Em produção, considere usar HTTPS para o Print Bridge
2. **Firewall**: Certifique-se de que a porta 3333 está aberta
3. **IP Dinâmico**: Se o IP mudar, atualize a variável no Vercel
4. **Rede Local**: O Print Bridge deve estar acessível da rede onde o frontend está sendo usado

