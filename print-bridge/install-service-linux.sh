#!/bin/bash

echo "========================================"
echo "INSTALAR PRINT BRIDGE COMO SERVIÇO LINUX"
echo "========================================"
echo ""

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Este script precisa ser executado como root (sudo)"
    echo "Executando com sudo..."
    sudo "$0" "$@"
    exit $?
fi

# Obter diretório do script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVICE_NAME="print-bridge"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
NODE_PATH=$(which node)

# Verificar se Node.js está instalado
if [ -z "$NODE_PATH" ]; then
    echo "❌ Node.js não encontrado!"
    echo "Por favor, instale Node.js primeiro"
    exit 1
fi

# Obter usuário que executou o script original
if [ -n "$SUDO_USER" ]; then
    SERVICE_USER="$SUDO_USER"
else
    SERVICE_USER=$(whoami)
fi

echo "✅ Node.js encontrado: $NODE_PATH"
echo "✅ Usuário do serviço: $SERVICE_USER"
echo ""

# Verificar se dist/index.js existe
if [ ! -f "$SCRIPT_DIR/dist/index.js" ]; then
    echo "❌ Arquivo não encontrado: $SCRIPT_DIR/dist/index.js"
    echo ""
    echo "Compilando Print Bridge..."
    cd "$SCRIPT_DIR"
    sudo -u "$SERVICE_USER" npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao compilar!"
        exit 1
    fi
fi

echo "Configuração:"
echo "  Node.js: $NODE_PATH"
echo "  Print Bridge: $SCRIPT_DIR/dist/index.js"
echo "  Diretório: $SCRIPT_DIR"
echo "  Usuário: $SERVICE_USER"
echo ""

read -p "Deseja instalar Print Bridge como serviço? (s/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Ss]$ ]]; then
    echo "Cancelado."
    exit 0
fi

# Criar arquivo de serviço systemd
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Print Bridge Service
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$SCRIPT_DIR
ExecStart=$NODE_PATH $SCRIPT_DIR/dist/index.js
Restart=always
RestartSec=10
StandardOutput=append:$SCRIPT_DIR/print-bridge.log
StandardError=append:$SCRIPT_DIR/print-bridge-error.log
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

if [ $? -ne 0 ]; then
    echo "❌ Erro ao criar arquivo de serviço!"
    exit 1
fi

echo "✅ Arquivo de serviço criado: $SERVICE_FILE"
echo ""

# Recarregar systemd
systemctl daemon-reload
if [ $? -ne 0 ]; then
    echo "❌ Erro ao recarregar systemd!"
    exit 1
fi

# Habilitar serviço para iniciar automaticamente
systemctl enable "$SERVICE_NAME"
if [ $? -ne 0 ]; then
    echo "❌ Erro ao habilitar serviço!"
    exit 1
fi

echo "✅ Serviço habilitado (iniciará automaticamente)"
echo ""

# Iniciar serviço
read -p "Deseja iniciar o serviço agora? (s/N): " START
if [[ "$START" =~ ^[Ss]$ ]]; then
    systemctl start "$SERVICE_NAME"
    if [ $? -eq 0 ]; then
        echo "✅ Serviço iniciado!"
        sleep 2
        echo ""
        echo "Testando..."
        curl -s http://localhost:3333/health && echo "" || echo "⚠️  Serviço pode estar iniciando ainda..."
    else
        echo "❌ Erro ao iniciar serviço!"
        echo "Verifique os logs: journalctl -u $SERVICE_NAME -n 50"
    fi
fi

echo ""
echo "========================================"
echo "INSTALAÇÃO CONCLUÍDA"
echo "========================================"
echo ""
echo "Comandos úteis:"
echo "  Iniciar:   sudo systemctl start $SERVICE_NAME"
echo "  Parar:     sudo systemctl stop $SERVICE_NAME"
echo "  Reiniciar: sudo systemctl restart $SERVICE_NAME"
echo "  Status:    sudo systemctl status $SERVICE_NAME"
echo "  Logs:      sudo journalctl -u $SERVICE_NAME -f"
echo "  Desabilitar: sudo systemctl disable $SERVICE_NAME"
echo "  Remover:   sudo systemctl disable $SERVICE_NAME && sudo rm $SERVICE_FILE && sudo systemctl daemon-reload"
echo ""

