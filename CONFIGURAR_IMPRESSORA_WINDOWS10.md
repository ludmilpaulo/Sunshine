# Configurar Impressora no Windows 10

Este guia explica como configurar a impressora térmica GOINFINITY (ou similar) no Windows 10 para uso com o sistema Sunshine POS.

## Métodos de Configuração

O sistema suporta dois métodos de impressão:

1. **USB** - Impressora conectada via cabo USB
2. **LAN** - Impressora conectada à rede local (via cabo de rede ou Wi-Fi)

## Configuração USB (Recomendado para uso local)

### Passo 1: Conectar a Impressora

1. Conecte a impressora ao computador via cabo USB
2. Aguarde o Windows 10 detectar o dispositivo automaticamente

### Passo 2: Instalar Driver (se necessário)

1. Abra **Configurações** → **Dispositivos** → **Impressoras e scanners**
2. Se a impressora não aparecer automaticamente, clique em **Adicionar uma impressora ou scanner**
3. Se o Windows não encontrar automaticamente:
   - Baixe o driver do site do fabricante (GOINFINITY)
   - Execute o instalador do driver
   - Siga as instruções na tela

### Passo 3: Encontrar o Nome da Impressora

1. Abra **Painel de Controle** → **Dispositivos e Impressoras**
   - Ou pressione `Win + R`, digite `control printers` e pressione Enter
2. Localize sua impressora térmica na lista
3. **Copie o nome exato** da impressora (exemplo: "GOINFINITY Thermal Receipt Printer")
   - ⚠️ **IMPORTANTE**: O nome deve ser exatamente igual, incluindo maiúsculas e minúsculas

### Passo 4: Configurar no Print Bridge

1. Navegue até a pasta `print-bridge` no projeto
2. Crie ou edite o arquivo `.env`:
   ```env
   PORT=3333
   PRINTER_USB_NAME=GOINFINITY Thermal Receipt Printer
   ```
   - Substitua `GOINFINITY Thermal Receipt Printer` pelo nome exato da sua impressora

3. Instale as dependências (se ainda não fez):
   ```bash
   cd print-bridge
   npm install
   ```

4. Inicie o Print Bridge:
   ```bash
   npm run dev
   ```

### Passo 5: Testar a Impressora

1. Abra o navegador e acesse: `http://localhost:3333/printers`
2. Você deve ver sua impressora listada
3. No sistema Sunshine, vá em **Testar Impressora** e clique em **Imprimir Teste**

## Configuração LAN (Recomendado para rede)

### Passo 1: Conectar a Impressora à Rede

1. Conecte a impressora à rede local via cabo de rede ou configure o Wi-Fi
2. Configure um IP estático na impressora (recomendado)
   - Acesse o menu da impressora
   - Configure o IP (exemplo: 192.168.1.50)
   - Configure a porta (geralmente 9100 para ESC/POS)

### Passo 2: Descobrir o IP da Impressora

**Método 1: Via Menu da Impressora**
- Acesse o menu de configuração da impressora
- Procure por "Network Settings" ou "Configurações de Rede"
- Anote o endereço IP

**Método 2: Via Impressão de Teste**
- Muitas impressoras têm um botão para imprimir uma página de teste
- A página de teste geralmente mostra o IP da impressora

**Método 3: Via Roteador**
- Acesse o painel do roteador (geralmente 192.168.1.1 ou 192.168.0.1)
- Procure por "Dispositivos Conectados" ou "DHCP Client List"
- Localize a impressora na lista

### Passo 3: Testar Conectividade

1. Abra o **Prompt de Comando** (cmd)
2. Teste se a impressora responde:
   ```cmd
   ping 192.168.1.50
   ```
   - Substitua pelo IP da sua impressora
   - Se receber respostas, a impressora está acessível

3. Teste a porta (opcional):
   ```cmd
   telnet 192.168.1.50 9100
   ```
   - Se o Windows não tiver telnet, instale via "Recursos do Windows"

### Passo 4: Configurar no Print Bridge

1. Edite o arquivo `.env` em `print-bridge/`:
   ```env
   PORT=3333
   PRINTER_LAN_IP=192.168.1.50
   PRINTER_LAN_PORT=9100
   ```
   - Substitua `192.168.1.50` pelo IP da sua impressora

2. Inicie o Print Bridge:
   ```bash
   npm run dev
   ```

### Passo 5: Testar a Impressora

1. Acesse: `http://localhost:3333/printers`
2. Você deve ver a impressora LAN listada
3. Teste a impressão no sistema Sunshine

## Modo AUTO (Recomendado)

O modo AUTO tenta LAN primeiro e, se falhar, tenta USB automaticamente.

Configure ambos no `.env`:
```env
PORT=3333
PRINTER_LAN_IP=192.168.1.50
PRINTER_LAN_PORT=9100
PRINTER_USB_NAME=GOINFINITY Thermal Receipt Printer
```

O sistema tentará LAN primeiro e fará fallback para USB se necessário.

## Solução de Problemas

### Impressora não aparece na lista

1. **Verifique se o Print Bridge está rodando:**
   ```bash
   curl http://localhost:3333/health
   ```
   Deve retornar: `{"ok":true,"service":"print-bridge"}`

2. **Verifique o nome da impressora:**
   - Abra **Painel de Controle** → **Dispositivos e Impressoras**
   - Certifique-se de que o nome no `.env` é **exatamente igual** ao nome no Windows

3. **Teste a impressora manualmente:**
   - Clique com o botão direito na impressora → **Propriedades da Impressora**
   - Clique em **Imprimir Página de Teste**
   - Se não imprimir, há um problema com o driver

### Erro "Print Bridge não está acessível"

1. Verifique se o Print Bridge está rodando:
   ```bash
   cd print-bridge
   npm run dev
   ```

2. Verifique se a porta 3333 não está bloqueada pelo firewall:
   - **Configurações** → **Firewall do Windows Defender**
   - Adicione uma exceção para a porta 3333 se necessário

### Impressão não funciona

1. **Verifique os logs do Print Bridge:**
   - Os erros aparecerão no terminal onde o Print Bridge está rodando

2. **Teste via API diretamente:**
   ```bash
   curl -X POST http://localhost:3333/print -H "Content-Type: application/json" -d "{\"mode\":\"USB\",\"usb\":{\"printerName\":\"GOINFINITY Thermal Receipt Printer\"},\"receipt\":{\"shopName\":\"Teste\",\"saleNumber\":\"TEST-001\",\"date\":\"2024-01-01\",\"subtotal\":\"100.00\",\"tax\":\"10.00\",\"total\":\"110.00\",\"items\":[{\"name\":\"Produto Teste\",\"qty\":1,\"unitPrice\":\"100.00\",\"total\":\"100.00\"}]}}"
   ```

3. **Verifique permissões:**
   - Certifique-se de que o usuário tem permissão para imprimir
   - Teste imprimindo uma página de teste do Windows

### Driver não encontrado

1. **Baixe o driver do fabricante:**
   - Visite o site da GOINFINITY ou do fabricante
   - Baixe o driver para Windows 10
   - Execute o instalador

2. **Use driver genérico:**
   - Algumas impressoras térmicas funcionam com drivers genéricos ESC/POS
   - Tente instalar como "Generic / Text Only"

## Executar Print Bridge como Serviço (Produção)

Para produção, é recomendado executar o Print Bridge como um serviço do Windows.

### Usando NSSM (Non-Sucking Service Manager)

1. Baixe o NSSM: https://nssm.cc/download
2. Extraia e abra o Prompt de Comando como Administrador
3. Navegue até a pasta do NSSM
4. Instale o serviço:
   ```cmd
   nssm install PrintBridge "C:\Program Files\nodejs\node.exe" "C:\caminho\para\print-bridge\dist\index.js"
   ```
5. Configure o diretório de trabalho:
   ```cmd
   nssm set PrintBridge AppDirectory "C:\caminho\para\print-bridge"
   ```
6. Inicie o serviço:
   ```cmd
   nssm start PrintBridge
   ```

## Resumo Rápido

1. **USB**: Conecte → Encontre o nome exato → Configure no `.env` → Teste
2. **LAN**: Configure IP estático → Descubra o IP → Configure no `.env` → Teste
3. **AUTO**: Configure ambos → Sistema escolhe automaticamente

## Suporte

Se continuar com problemas:
1. Verifique os logs do Print Bridge
2. Teste a impressora manualmente no Windows
3. Verifique se o driver está instalado corretamente
4. Certifique-se de que o nome da impressora está correto (case-sensitive)

