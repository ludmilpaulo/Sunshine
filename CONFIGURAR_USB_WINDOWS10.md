# Configurar Impressora USB GO INFINITY no Windows 10

Guia rápido para configurar a impressora GO INFINITY conectada via USB no Windows 10.

## Passo 1: Verificar Impressora no Windows

1. Conecte a impressora GO INFINITY via cabo USB ao computador
2. Aguarde o Windows detectar e instalar o driver automaticamente
3. Abra **Painel de Controle** → **Dispositivos e Impressoras**
   - Ou pressione `Win + R`, digite `control printers` e pressione Enter
4. Localize a impressora "GOINFINITY" ou "GO INFINITY" na lista
5. **Copie o nome EXATO** da impressora (exemplo: "GOINFINITY Thermal Receipt Printer")

## Passo 2: Configurar Print Bridge

### Opção A: Usar Script Automático (Recomendado)

1. Abra o **Prompt de Comando** como Administrador
2. Navegue até a pasta `print-bridge`:
   ```cmd
   cd C:\caminho\para\Sunshine\print-bridge
   ```
3. Execute o script de configuração:
   ```cmd
   configurar-usb-windows.bat
   ```
4. Siga as instruções na tela
5. O script irá:
   - Verificar Node.js
   - Instalar dependências
   - Descobrir impressoras
   - Criar arquivo `.env` automaticamente

### Opção B: Configuração Manual

1. Navegue até a pasta `print-bridge`:
   ```cmd
   cd print-bridge
   ```

2. Instale as dependências (se ainda não fez):
   ```cmd
   npm install
   ```

3. Crie o arquivo `.env`:
   ```cmd
   notepad .env
   ```

4. Adicione o seguinte conteúdo (substitua pelo nome exato da sua impressora):
   ```env
   PORT=3333
   PRINTER_USB_NAME=GOINFINITY Thermal Receipt Printer
   ```
   ⚠️ **IMPORTANTE**: Use o nome EXATO da impressora como aparece no Windows

5. Salve o arquivo

## Passo 3: Iniciar Print Bridge

```cmd
npm run dev
```

Você deve ver:
```
Print Bridge running on http://localhost:3333
✅ USB printing via native module (win32)
```

## Passo 4: Testar Impressora

1. Abra o navegador e acesse: `http://localhost:3333/printers`
2. Você deve ver sua impressora listada
3. No sistema Sunshine, vá em **Testar Impressora** e clique em **Imprimir Teste**

## Solução de Problemas

### Erro: "USB_MODULE_NOT_AVAILABLE"

**Causa**: O módulo nativo `printer` não foi compilado corretamente.

**Solução**:
1. Instale **Visual Studio Build Tools**:
   - Baixe de: https://visualstudio.microsoft.com/downloads/
   - Selecione "Build Tools for Visual Studio"
   - Instale "Desktop development with C++"
2. Reinstale as dependências:
   ```cmd
   cd print-bridge
   npm rebuild
   npm install
   ```

### Erro: "Printer not found"

**Causa**: Nome da impressora não corresponde.

**Solução**:
1. Verifique o nome exato no Windows:
   - Painel de Controle → Dispositivos e Impressoras
   - Clique com botão direito na impressora → Propriedades da Impressora
   - Copie o nome exato
2. Atualize o arquivo `.env` com o nome correto
3. Reinicie o Print Bridge

### Erro: "Failed to load USB printing module"

**Causa**: Módulo nativo não compilado ou driver não instalado.

**Solução**:
1. Verifique se o driver da impressora está instalado:
   - Teste imprimindo uma página de teste do Windows
   - Se não imprimir, instale o driver do fabricante
2. Recompile o módulo:
   ```cmd
   npm rebuild printer
   ```

### Impressora não aparece na lista

**Solução**:
1. Verifique se a impressora está ligada e conectada
2. Verifique se o driver está instalado corretamente
3. Teste a impressora manualmente no Windows
4. Reinicie o Print Bridge

## Executar como Serviço (Produção)

Para que o Print Bridge inicie automaticamente com o Windows:

### Usando NSSM

1. Baixe NSSM: https://nssm.cc/download
2. Extraia em `C:\nssm\win64`
3. Abra Prompt de Comando como Administrador:
   ```cmd
   cd C:\nssm\win64
   nssm install PrintBridge
   ```
4. Configure:
   - **Path**: `C:\Program Files\nodejs\node.exe`
   - **Startup directory**: `C:\caminho\para\print-bridge`
   - **Arguments**: `dist\index.js`
5. Inicie o serviço:
   ```cmd
   nssm start PrintBridge
   ```

## Especificações da Impressora

Baseado na imagem fornecida:
- **Modelo**: GO INFINITY Thermal Receipt Printer
- **Largura do papel**: 80mm
- **Velocidade**: 250mm/sec
- **Comandos**: ESC/POS
- **Interface**: USB, Network, Serial
- **Alimentação**: DC24V === 2.5A

## Verificação Final

Execute estes comandos para verificar:

```cmd
REM 1. Verificar Print Bridge
curl http://localhost:3333/health

REM 2. Listar impressoras
curl http://localhost:3333/printers

REM 3. Testar impressão
curl -X POST http://localhost:3333/print -H "Content-Type: application/json" -d "{\"mode\":\"USB\",\"usb\":{\"printerName\":\"GOINFINITY Thermal Receipt Printer\"},\"receipt\":{\"shopName\":\"Teste\",\"saleNumber\":\"TEST-001\",\"date\":\"2024-01-01\",\"subtotal\":\"10.00\",\"tax\":\"1.00\",\"total\":\"11.00\",\"items\":[{\"name\":\"Produto Teste\",\"qty\":1,\"unitPrice\":\"10.00\",\"total\":\"10.00\"}]}}"
```

## Próximos Passos

Após configurar:
1. ✅ Print Bridge rodando na porta 3333
2. ✅ Impressora configurada no `.env`
3. ✅ Teste de impressão funcionando
4. ✅ Sistema Sunshine pode imprimir recibos

Para mais ajuda, consulte: `SOLUCAO_IMPRESSORA_WINDOWS10.md`

