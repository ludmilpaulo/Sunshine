# Solução de Problemas - Impressora Windows 10

Este guia ajuda a resolver problemas com a impressora no Windows 10.

## Diagnóstico Rápido

### 1. Verificar se o Print Bridge está rodando

Abra o **Prompt de Comando** (cmd) ou **PowerShell** e execute:

```cmd
curl http://localhost:3333/health
```

**Se retornar erro:**
- O Print Bridge não está rodando
- Vá até a pasta `print-bridge` e execute: `npm run dev`

### 2. Listar Impressoras Disponíveis

```cmd
curl http://localhost:3333/printers
```

Isso mostrará todas as impressoras disponíveis no Windows. **Copie o nome exato** da sua impressora.

### 3. Verificar Configuração do .env

Abra o arquivo `print-bridge/.env` e verifique:

```env
PORT=3333
PRINTER_USB_NAME=Nome Exato da Impressora
PRINTER_LAN_IP=192.168.1.50  # Se usar LAN
PRINTER_LAN_PORT=9100
```

**⚠️ IMPORTANTE**: O nome da impressora deve ser **exatamente igual** ao nome no Windows, incluindo:
- Maiúsculas e minúsculas
- Espaços
- Caracteres especiais

## Problemas Comuns e Soluções

### Problema 1: "Print Bridge não está acessível"

**Sintomas:**
- Erro no navegador: "Failed to fetch"
- Erro: "Print Bridge não está acessível"

**Solução:**

1. **Verificar se o Print Bridge está rodando:**
   ```cmd
   cd print-bridge
   npm run dev
   ```
   Você deve ver: `Print Bridge running on port 3333`

2. **Verificar Firewall do Windows:**
   - Abra **Configurações** → **Firewall do Windows Defender**
   - Clique em **Configurações Avançadas**
   - Clique em **Regras de Entrada**
   - Procure por regras bloqueando a porta 3333
   - Se necessário, crie uma nova regra permitindo a porta 3333

3. **Verificar se outra aplicação está usando a porta 3333:**
   ```cmd
   netstat -ano | findstr :3333
   ```
   Se houver outro processo, pare-o ou mude a porta no `.env`

### Problema 2: "Impressora não encontrada"

**Sintomas:**
- Erro: "Printer not found"
- Erro: "Impressora não encontrada"

**Solução:**

1. **Verificar se a impressora está instalada no Windows:**
   - Abra **Configurações** → **Dispositivos** → **Impressoras e scanners**
   - Verifique se sua impressora aparece na lista
   - Se não aparecer, adicione a impressora

2. **Verificar o nome exato da impressora:**
   - Abra **Painel de Controle** → **Dispositivos e Impressoras**
   - Clique com o botão direito na impressora → **Propriedades da Impressora**
   - Copie o nome **exatamente** como aparece
   - Atualize o arquivo `.env` com o nome correto

3. **Testar impressão manual:**
   - Clique com o botão direito na impressora → **Propriedades da Impressora**
   - Clique em **Imprimir Página de Teste**
   - Se não imprimir, há problema com o driver

### Problema 3: "Driver não encontrado" ou "Impressão falha"

**Sintomas:**
- Erro ao tentar imprimir
- Impressora não responde

**Solução:**

1. **Reinstalar o driver:**
   - Baixe o driver mais recente do site do fabricante
   - Desinstale o driver atual:
     - **Configurações** → **Dispositivos** → **Impressoras e scanners**
     - Clique na impressora → **Remover dispositivo**
   - Instale o novo driver
   - Adicione a impressora novamente

2. **Usar driver genérico ESC/POS:**
   - Algumas impressoras térmicas funcionam com drivers genéricos
   - Ao adicionar impressora, escolha **Adicionar manualmente**
   - Selecione **Generic / Text Only** ou **Generic ESC/POS**

3. **Verificar status da impressora:**
   - Abra **Painel de Controle** → **Dispositivos e Impressoras**
   - Verifique se a impressora não está com status "Offline" ou "Pausada"
   - Se estiver, clique com o botão direito → **Usar impressora online**

### Problema 4: "Erro ao conectar via LAN"

**Sintomas:**
- Erro ao tentar imprimir via rede
- Timeout na conexão

**Solução:**

1. **Verificar conectividade:**
   ```cmd
   ping 192.168.1.50
   ```
   Substitua pelo IP da sua impressora
   - Se não responder, verifique a conexão de rede
   - Verifique se a impressora está ligada

2. **Testar porta 9100:**
   ```cmd
   telnet 192.168.1.50 9100
   ```
   Se o Windows não tiver telnet:
   - **Configurações** → **Aplicativos** → **Recursos Opcionais**
   - Adicione **Cliente Telnet**

3. **Verificar firewall:**
   - Certifique-se de que o firewall não está bloqueando a porta 9100
   - Adicione exceção para a impressora no firewall

### Problema 5: "Erro de permissão"

**Sintomas:**
- Erro: "Access denied"
- Erro: "Permission denied"

**Solução:**

1. **Executar Print Bridge como Administrador:**
   - Clique com o botão direito no Prompt de Comando
   - Escolha **Executar como administrador**
   - Navegue até `print-bridge` e execute `npm run dev`

2. **Verificar permissões de impressão:**
   - Abra **Painel de Controle** → **Dispositivos e Impressoras**
   - Clique com o botão direito na impressora → **Propriedades da Impressora**
   - Vá na aba **Segurança**
   - Certifique-se de que seu usuário tem permissão de **Imprimir**

## Script de Diagnóstico Automático

Crie um arquivo `diagnostico-windows.bat` na pasta `print-bridge`:

```batch
@echo off
echo ========================================
echo DIAGNOSTICO IMPRESSORA WINDOWS 10
echo ========================================
echo.

echo [1] Verificando Print Bridge...
curl -s http://localhost:3333/health
if %errorlevel% neq 0 (
    echo ERRO: Print Bridge nao esta rodando!
    echo Execute: npm run dev
    pause
    exit /b 1
)
echo OK: Print Bridge esta rodando
echo.

echo [2] Listando impressoras disponiveis...
curl -s http://localhost:3333/printers
echo.

echo [3] Verificando arquivo .env...
if exist .env (
    echo OK: Arquivo .env encontrado
    type .env
) else (
    echo ERRO: Arquivo .env nao encontrado!
    echo Crie o arquivo .env com as configuracoes da impressora
)
echo.

echo [4] Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao esta instalado!
)
echo.

echo [5] Verificando dependencias...
if exist node_modules (
    echo OK: Dependencias instaladas
) else (
    echo ERRO: Dependencias nao instaladas!
    echo Execute: npm install
)
echo.

echo ========================================
echo DIAGNOSTICO CONCLUIDO
echo ========================================
pause
```

Execute o script:
```cmd
cd print-bridge
diagnostico-windows.bat
```

## Configuração Passo a Passo (Do Zero)

### Passo 1: Instalar Node.js
1. Baixe Node.js de https://nodejs.org/
2. Instale a versão LTS (Long Term Support)
3. Verifique a instalação:
   ```cmd
   node --version
   npm --version
   ```

### Passo 2: Instalar Print Bridge
```cmd
cd print-bridge
npm install
```

### Passo 3: Configurar Impressora

**Para USB:**
1. Conecte a impressora via USB
2. Aguarde o Windows instalar o driver
3. Abra **Painel de Controle** → **Dispositivos e Impressoras**
4. Copie o nome exato da impressora
5. Crie o arquivo `.env`:
   ```env
   PORT=3333
   PRINTER_USB_NAME=Nome Exato da Impressora
   ```

**Para LAN:**
1. Configure o IP estático na impressora
2. Descubra o IP (via menu da impressora ou roteador)
3. Teste a conectividade:
   ```cmd
   ping 192.168.1.50
   ```
4. Crie o arquivo `.env`:
   ```env
   PORT=3333
   PRINTER_LAN_IP=192.168.1.50
   PRINTER_LAN_PORT=9100
   ```

### Passo 4: Iniciar Print Bridge
```cmd
npm run dev
```

Você deve ver:
```
Print Bridge running on port 3333
```

### Passo 5: Testar
1. Abra o navegador: `http://localhost:3333/printers`
2. Você deve ver sua impressora listada
3. No sistema Sunshine, vá em **Testar Impressora**

## Executar como Serviço (Produção)

Para que o Print Bridge inicie automaticamente com o Windows:

### Usando NSSM (Recomendado)

1. **Baixe o NSSM:**
   - Acesse: https://nssm.cc/download
   - Baixe a versão para Windows 64-bit
   - Extraia em uma pasta (ex: `C:\nssm`)

2. **Instale o serviço:**
   ```cmd
   cd C:\nssm\win64
   nssm install PrintBridge
   ```
   
3. **Configure o serviço:**
   - **Path**: `C:\Program Files\nodejs\node.exe` (ou caminho do seu Node.js)
   - **Startup directory**: `C:\caminho\para\print-bridge`
   - **Arguments**: `dist\index.js`
   
4. **Inicie o serviço:**
   ```cmd
   nssm start PrintBridge
   ```

5. **Verificar status:**
   ```cmd
   nssm status PrintBridge
   ```

## Verificação Final

Execute estes comandos para verificar se tudo está funcionando:

```cmd
REM 1. Verificar Print Bridge
curl http://localhost:3333/health

REM 2. Listar impressoras
curl http://localhost:3333/printers

REM 3. Testar impressão (substitua o nome da impressora)
curl -X POST http://localhost:3333/print -H "Content-Type: application/json" -d "{\"mode\":\"USB\",\"usb\":{\"printerName\":\"GOINFINITY Thermal Receipt Printer\"},\"receipt\":{\"shopName\":\"Teste\",\"saleNumber\":\"TEST-001\",\"date\":\"2024-01-01\",\"subtotal\":\"10.00\",\"tax\":\"1.00\",\"total\":\"11.00\",\"items\":[{\"name\":\"Produto Teste\",\"qty\":1,\"unitPrice\":\"10.00\",\"total\":\"10.00\"}]}}"
```

## Ainda com Problemas?

Se nenhuma das soluções acima funcionou:

1. **Verifique os logs do Print Bridge:**
   - Os erros aparecem no terminal onde o Print Bridge está rodando
   - Procure por mensagens de erro específicas

2. **Teste a impressora manualmente:**
   - Imprima uma página de teste do Windows
   - Se não funcionar, o problema é com o driver ou hardware

3. **Verifique a versão do Windows:**
   - Certifique-se de que está usando Windows 10 atualizado
   - Execute o Windows Update

4. **Contate o suporte:**
   - Forneça os logs do Print Bridge
   - Informe o modelo exato da impressora
   - Informe a versão do Windows 10

