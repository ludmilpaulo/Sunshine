#!/bin/bash

echo "========================================"
echo "INSTALAR PRINT BRIDGE COMO SERVIÇO MAC"
echo "========================================"
echo ""

# Obter diretório do script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVICE_NAME="com.sunshine.printbridge"
PLIST_PATH="$HOME/Library/LaunchAgents/${SERVICE_NAME}.plist"
NODE_PATH=$(which node)

# Verificar se Node.js está instalado
if [ -z "$NODE_PATH" ]; then
    echo "❌ Node.js não encontrado!"
    echo "Por favor, instale Node.js primeiro: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js encontrado: $NODE_PATH"
echo ""

# Verificar se dist/index.js existe
if [ ! -f "$SCRIPT_DIR/dist/index.js" ]; then
    echo "❌ Arquivo não encontrado: $SCRIPT_DIR/dist/index.js"
    echo ""
    echo "Compilando Print Bridge..."
    cd "$SCRIPT_DIR"
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao compilar!"
        exit 1
    fi
fi

echo "Configuração:"
echo "  Node.js: $NODE_PATH"
echo "  Print Bridge: $SCRIPT_DIR/dist/index.js"
echo "  Diretório: $SCRIPT_DIR"
echo ""

read -p "Deseja instalar Print Bridge como serviço? (s/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Ss]$ ]]; then
    echo "Cancelado."
    exit 0
fi

# Parar serviço existente se houver
launchctl unload "$PLIST_PATH" 2>/dev/null

# Criar arquivo plist
cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${SERVICE_NAME}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${NODE_PATH}</string>
        <string>${SCRIPT_DIR}/dist/index.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${SCRIPT_DIR}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${SCRIPT_DIR}/print-bridge.log</string>
    <key>StandardErrorPath</key>
    <string>${SCRIPT_DIR}/print-bridge-error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
EOF

if [ $? -ne 0 ]; then
    echo "❌ Erro ao criar arquivo de serviço!"
    exit 1
fi

echo "✅ Arquivo de serviço criado: $PLIST_PATH"
echo ""

# Carregar serviço
launchctl load "$PLIST_PATH"
if [ $? -ne 0 ]; then
    echo "❌ Erro ao carregar serviço!"
    exit 1
fi

echo "✅ Serviço instalado e iniciado!"
echo ""

# Aguardar um pouco e testar
sleep 2
echo "Testando..."
curl -s http://localhost:3333/health && echo "" || echo "⚠️  Serviço pode estar iniciando ainda..."

echo ""
echo "========================================"
echo "INSTALAÇÃO CONCLUÍDA"
echo "========================================"
echo ""
echo "Comandos úteis:"
echo "  Iniciar:   launchctl start ${SERVICE_NAME}"
echo "  Parar:     launchctl stop ${SERVICE_NAME}"
echo "  Reiniciar: launchctl unload $PLIST_PATH && launchctl load $PLIST_PATH"
echo "  Remover:   launchctl unload $PLIST_PATH && rm $PLIST_PATH"
echo "  Status:    launchctl list | grep ${SERVICE_NAME}"
echo "  Logs:      tail -f ${SCRIPT_DIR}/print-bridge.log"
echo ""

