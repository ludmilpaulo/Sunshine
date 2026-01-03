# 🚀 Guia: Iniciar Print Bridge Automaticamente

Este guia mostra como configurar o Print Bridge para iniciar automaticamente quando o computador ligar.

## 📋 Opções por Sistema Operacional

### 🪟 Windows 10/11

#### Opção 1: Usando NSSM (Recomendado - Mais Fácil)

**Passo 1: Instalar NSSM**
1. Baixe NSSM: https://nssm.cc/download
2. Extraia para `C:\nssm`
3. Adicione `C:\nssm\win64` ao PATH do Windows
   - Ou use o caminho completo nos comandos

**Passo 2: Instalar Print Bridge como Serviço**
1. Abra PowerShell ou CMD como **Administrador**
2. Navegue até a pasta `print-bridge`:
   ```powershell
   cd C:\caminho\para\print-bridge
   ```
3. Execute o script de instalação:
   ```powershell
   .\install-service-windows.bat
   ```
4. Siga as instruções na tela

**Ou instalar manualmente:**
```powershell
# Encontrar caminho do Node.js
where node

# Instalar serviço (substitua os caminhos)
nssm install PrintBridge "C:\Program Files\nodejs\node.exe" "C:\caminho\para\print-bridge\dist\index.js"

# Configurar diretório
nssm set PrintBridge AppDirectory "C:\caminho\para\print-bridge"

# Configurar para iniciar automaticamente
nssm set PrintBridge Start SERVICE_AUTO_START

# Iniciar serviço
nssm start PrintBridge
```

**Comandos úteis:**
```powershell
nssm start PrintBridge      # Iniciar
nssm stop PrintBridge       # Parar
nssm restart PrintBridge    # Reiniciar
nssm status PrintBridge     # Status
nssm remove PrintBridge confirm  # Remover
```

#### Opção 2: Usando Task Scheduler (Alternativa)

1. Abra **Agendador de Tarefas** (Task Scheduler)
2. Clique em **Criar Tarefa Básica**
3. Nome: "Print Bridge"
4. Trigger: **Quando o computador iniciar**
5. Ação: **Iniciar um programa**
   - Programa: `C:\Program Files\nodejs\node.exe`
   - Argumentos: `C:\caminho\para\print-bridge\dist\index.js`
   - Iniciar em: `C:\caminho\para\print-bridge`
6. Marque **Executar com privilégios mais altos**
7. Finalizar

### 🍎 macOS

**Passo 1: Executar script de instalação**
```bash
cd print-bridge
chmod +x install-service-mac.sh
./install-service-mac.sh
```

**Ou instalar manualmente:**

1. Criar arquivo de serviço:
```bash
cat > ~/Library/LaunchAgents/com.sunshine.printbridge.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.sunshine.printbridge</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/caminho/para/print-bridge/dist/index.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/caminho/para/print-bridge</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/caminho/para/print-bridge/print-bridge.log</string>
    <key>StandardErrorPath</key>
    <string>/caminho/para/print-bridge/print-bridge-error.log</string>
</dict>
</plist>
EOF
```

2. Carregar serviço:
```bash
launchctl load ~/Library/LaunchAgents/com.sunshine.printbridge.plist
```

**Comandos úteis:**
```bash
launchctl start com.sunshine.printbridge    # Iniciar
launchctl stop com.sunshine.printbridge     # Parar
launchctl unload ~/Library/LaunchAgents/com.sunshine.printbridge.plist  # Remover
tail -f print-bridge.log                    # Ver logs
```

### 🐧 Linux (systemd)

**Passo 1: Executar script de instalação**
```bash
cd print-bridge
chmod +x install-service-linux.sh
sudo ./install-service-linux.sh
```

**Ou instalar manualmente:**

1. Criar arquivo de serviço:
```bash
sudo nano /etc/systemd/system/print-bridge.service
```

2. Adicionar conteúdo:
```ini
[Unit]
Description=Print Bridge Service
After=network.target

[Service]
Type=simple
User=seu-usuario
WorkingDirectory=/caminho/para/print-bridge
ExecStart=/usr/bin/node /caminho/para/print-bridge/dist/index.js
Restart=always
RestartSec=10
StandardOutput=append:/caminho/para/print-bridge/print-bridge.log
StandardError=append:/caminho/para/print-bridge/print-bridge-error.log

[Install]
WantedBy=multi-user.target
```

3. Habilitar e iniciar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable print-bridge
sudo systemctl start print-bridge
```

**Comandos úteis:**
```bash
sudo systemctl start print-bridge      # Iniciar
sudo systemctl stop print-bridge       # Parar
sudo systemctl restart print-bridge     # Reiniciar
sudo systemctl status print-bridge      # Status
sudo journalctl -u print-bridge -f      # Ver logs
```

## ✅ Verificar se está funcionando

Após instalar, verifique:

```bash
# Testar se está rodando
curl http://localhost:3333/health

# Deve retornar: {"ok":true,"service":"print-bridge"}
```

## 🔍 Troubleshooting

### Windows: Serviço não inicia

1. Verificar logs:
   - Arquivo: `print-bridge-error.log` na pasta do Print Bridge
2. Verificar se Node.js está no PATH
3. Verificar se `dist/index.js` existe
4. Testar manualmente:
   ```powershell
   node dist/index.js
   ```

### macOS: Serviço não inicia

1. Verificar logs:
   ```bash
   tail -f print-bridge-error.log
   ```
2. Verificar se arquivo plist está correto:
   ```bash
   launchctl list | grep printbridge
   ```
3. Recarregar:
   ```bash
   launchctl unload ~/Library/LaunchAgents/com.sunshine.printbridge.plist
   launchctl load ~/Library/LaunchAgents/com.sunshine.printbridge.plist
   ```

### Linux: Serviço não inicia

1. Verificar logs:
   ```bash
   sudo journalctl -u print-bridge -n 50
   ```
2. Verificar status:
   ```bash
   sudo systemctl status print-bridge
   ```
3. Verificar permissões do arquivo:
   ```bash
   ls -la dist/index.js
   ```

## 📝 Notas Importantes

1. **Arquivo .env**: Certifique-se de que o arquivo `.env` está configurado antes de instalar como serviço
2. **Caminhos absolutos**: Use caminhos absolutos nos arquivos de serviço
3. **Permissões**: O serviço precisa de permissões para acessar a impressora
4. **Reiniciar**: Após instalar, reinicie o computador para testar se inicia automaticamente

## 🎯 Recomendação

- **Windows**: Use NSSM (mais fácil e confiável)
- **macOS**: Use launchd (script fornecido)
- **Linux**: Use systemd (script fornecido)

Todos os scripts estão prontos e testados. Basta executar o script apropriado para seu sistema!

