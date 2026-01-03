# Quick Start - Print Bridge

## Iniciar o Print Bridge

### Desenvolvimento (Development)

```bash
cd print-bridge
npm run dev
```

O serviço estará disponível em: `http://localhost:3333`

### Produção (Production)

```bash
cd print-bridge
npm run build
npm start
```

## Verificar se está rodando

Abra no navegador ou terminal:
```bash
curl http://localhost:3333/health
```

Deve retornar:
```json
{"ok":true,"service":"print-bridge"}
```

## Listar impressoras disponíveis

```bash
curl http://localhost:3333/printers
```

## Windows 10 - Manter rodando

### Opção 1: Terminal sempre aberto
Mantenha um terminal aberto com `npm run dev` rodando.

### Opção 2: Executar em segundo plano (PowerShell)
```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\caminho\para\print-bridge; npm run dev"
```

### Opção 3: Instalar como serviço do Windows (NSSM)

1. Baixe NSSM: https://nssm.cc/download
2. Extraia e abra PowerShell como Administrador
3. Execute:
```powershell
cd C:\caminho\para\nssm\win64
.\nssm.exe install PrintBridge "C:\Program Files\nodejs\node.exe" "C:\caminho\para\print-bridge\dist\index.js"
.\nssm.exe set PrintBridge AppDirectory "C:\caminho\para\print-bridge"
.\nssm.exe start PrintBridge
```

## Solução de Problemas

### Erro: "Print Bridge não está configurado"

1. **Verifique se está rodando:**
   ```bash
   curl http://localhost:3333/health
   ```

2. **Se não estiver rodando, inicie:**
   ```bash
   cd print-bridge
   npm run dev
   ```

3. **Verifique a porta 3333:**
   - Windows: `netstat -ano | findstr :3333`
   - Mac/Linux: `lsof -i :3333`

4. **Se a porta estiver em uso:**
   - Pare o processo que está usando a porta
   - Ou altere a porta no arquivo `.env`:
     ```
     PORT=3334
     ```

### Erro: "Print Bridge não está acessível"

1. Verifique se o serviço está rodando (veja acima)
2. Verifique se não há firewall bloqueando
3. Verifique se está usando a URL correta:
   - Desenvolvimento: `http://localhost:3333`
   - Produção: Configure `NEXT_PUBLIC_PRINT_BRIDGE_URL` no frontend

## Configuração da Impressora

Crie um arquivo `.env` na pasta `print-bridge/`:

```env
PORT=3333
PRINTER_USB_NAME=Nome Exato da Impressora
# ou
PRINTER_LAN_IP=192.168.1.50
PRINTER_LAN_PORT=9100
```

Para encontrar o nome exato da impressora:
```bash
curl http://localhost:3333/printers
```

## Testar Impressão

Use o endpoint de teste ou complete uma venda no sistema POS.

O Print Bridge tentará imprimir automaticamente quando uma venda for finalizada.

