# 🚀 Print Bridge - Production Deployment Guide

Este guia mostra como instalar o Print Bridge em produção para iniciar automaticamente no Windows, macOS e Linux.

## 📋 Pré-requisitos

1. **Node.js instalado** (v18 ou superior)
2. **Print Bridge compilado** (`npm run build`)
3. **Arquivo `.env` configurado** com as configurações da impressora

## 🪟 Windows

### Instalação Rápida

1. **Instalar NSSM** (se ainda não tiver):
   - Baixe: https://nssm.cc/download
   - Extraia para `C:\nssm`
   - Adicione `C:\nssm\win64` ao PATH

2. **Executar script de instalação**:
   ```powershell
   cd print-bridge
   .\install-service-windows.bat
   ```
   
   O script irá:
   - ✅ Detectar Node.js automaticamente
   - ✅ Compilar se necessário
   - ✅ Instalar como serviço do Windows
   - ✅ Configurar para iniciar automaticamente no boot
   - ✅ Iniciar o serviço

### Verificar Instalação

```powershell
# Ver status do serviço
nssm status PrintBridge

# Testar se está rodando
curl http://localhost:3333/health

# Ver logs
type print-bridge.log
```

### Comandos Úteis

```powershell
nssm start PrintBridge      # Iniciar
nssm stop PrintBridge       # Parar
nssm restart PrintBridge    # Reiniciar
nssm remove PrintBridge confirm  # Remover serviço
```

## 🍎 macOS

### Instalação Rápida

```bash
cd print-bridge
chmod +x install-service-mac.sh
./install-service-mac.sh
```

O script irá:
- ✅ Detectar Node.js automaticamente
- ✅ Compilar se necessário
- ✅ Criar serviço launchd
- ✅ Configurar para iniciar automaticamente no login
- ✅ Iniciar o serviço

### Verificar Instalação

```bash
# Ver status do serviço
launchctl list | grep printbridge

# Testar se está rodando
curl http://localhost:3333/health

# Ver logs
tail -f print-bridge.log
```

### Comandos Úteis

```bash
launchctl start com.sunshine.printbridge    # Iniciar
launchctl stop com.sunshine.printbridge     # Parar
launchctl list | grep printbridge           # Ver status
tail -f print-bridge.log                    # Ver logs
```

## 🐧 Linux

### Instalação Rápida

```bash
cd print-bridge
chmod +x install-service-linux.sh
sudo ./install-service-linux.sh
```

O script irá:
- ✅ Detectar Node.js automaticamente
- ✅ Compilar se necessário
- ✅ Criar serviço systemd
- ✅ Habilitar para iniciar automaticamente no boot
- ✅ Iniciar o serviço (se confirmado)

### Verificar Instalação

```bash
# Ver status do serviço
sudo systemctl status print-bridge

# Testar se está rodando
curl http://localhost:3333/health

# Ver logs
sudo journalctl -u print-bridge -f
```

### Comandos Úteis

```bash
sudo systemctl start print-bridge      # Iniciar
sudo systemctl stop print-bridge       # Parar
sudo systemctl restart print-bridge    # Reiniciar
sudo systemctl status print-bridge     # Status
sudo journalctl -u print-bridge -f     # Ver logs
```

## ✅ Checklist de Produção

Antes de instalar como serviço, certifique-se de:

- [ ] Print Bridge compilado (`npm run build`)
- [ ] Arquivo `.env` configurado corretamente
- [ ] Testado manualmente (`npm start` funciona)
- [ ] Porta 3333 disponível
- [ ] Impressora configurada e testada
- [ ] Firewall configurado (se necessário)

## 🔧 Configuração do .env

Certifique-se de configurar o arquivo `.env` antes de instalar:

```env
PORT=3333
PRINTER_LAN_IP=192.168.1.50      # IP da impressora (LAN mode)
PRINTER_LAN_PORT=9100             # Porta padrão
PRINTER_USB_NAME=Nome da Impressora  # Nome exato da impressora (USB mode)
PRINTER_HOSTNAME=printer.local    # Hostname (opcional, para auto-discovery)
CORS_ORIGIN_ALLOW_ALL=true        # Permitir todas as origens (produção)
```

## 🎯 Comportamento Automático

Após instalar como serviço, o Print Bridge irá:

1. **Iniciar automaticamente** quando o computador ligar
2. **Reiniciar automaticamente** se parar inesperadamente
3. **Manter logs** em `print-bridge.log` e `print-bridge-error.log`
4. **Rodar em background** sem necessidade de terminal

## 🐛 Troubleshooting

### Serviço não inicia

**Windows:**
```powershell
# Ver logs de erro
type print-bridge-error.log

# Verificar se Node.js está no PATH
where node

# Testar manualmente
node dist/index.js
```

**macOS:**
```bash
# Ver logs
tail -f print-bridge-error.log

# Ver status
launchctl list | grep printbridge

# Recarregar serviço
launchctl unload ~/Library/LaunchAgents/com.sunshine.printbridge.plist
launchctl load ~/Library/LaunchAgents/com.sunshine.printbridge.plist
```

**Linux:**
```bash
# Ver logs
sudo journalctl -u print-bridge -n 50

# Ver status detalhado
sudo systemctl status print-bridge

# Verificar permissões
ls -la dist/index.js
```

### Porta 3333 já em uso

Se a porta estiver ocupada, você pode:
1. Parar o processo que está usando a porta
2. Ou alterar a porta no `.env` (não recomendado, requer mudança no frontend)

### Permissões

**Linux/macOS:** Certifique-se de que o usuário do serviço tem permissão para:
- Acessar a impressora
- Ler/escrever arquivos na pasta do Print Bridge
- Acessar a porta 3333

## 📝 Notas Importantes

1. **Caminhos Absolutos**: Os scripts usam caminhos absolutos automaticamente
2. **Node.js no PATH**: Certifique-se de que Node.js está no PATH ou use caminho completo
3. **Usuário do Serviço**: No Linux, o serviço roda como o usuário que executou o script (com sudo)
4. **Reiniciar Após Instalar**: Reinicie o computador para testar se inicia automaticamente

## 🔄 Atualização

Para atualizar o Print Bridge:

1. **Parar o serviço**
2. **Fazer backup do `.env`**
3. **Atualizar o código**
4. **Recompilar**: `npm run build`
5. **Reiniciar o serviço**

O serviço continuará funcionando mesmo após atualizações do código (desde que você recompile).

## ✅ Verificação Final

Após instalar, teste:

```bash
# 1. Verificar se o serviço está rodando
# (Windows: nssm status PrintBridge)
# (macOS: launchctl list | grep printbridge)
# (Linux: sudo systemctl status print-bridge)

# 2. Testar health endpoint
curl http://localhost:3333/health
# Deve retornar: {"ok":true,"service":"print-bridge"}

# 3. Listar impressoras
curl http://localhost:3333/printers

# 4. Reiniciar o computador e verificar se inicia automaticamente
```

---

**Todos os scripts estão prontos e testados. Execute o script apropriado para seu sistema operacional!**

