# ⚡ Configuração Rápida - Impressora LAN

## 🎯 Setup em 3 Passos

### 1️⃣ Descobrir IP da Impressora

**Opção A: Auto-discovery (Mais Fácil)**
```bash
cd print-bridge
chmod +x discover-printer.sh
./discover-printer.sh
```

**Opção B: Manual**
- Acesse menu da impressora → Network Settings
- Anote o IP (ex: `192.168.1.50`)

### 2️⃣ Configurar `.env`

Crie arquivo `.env` na pasta `print-bridge`:
```env
PORT=3333
PRINTER_LAN_IP=192.168.1.50
PRINTER_LAN_PORT=9100
```

**Substitua `192.168.1.50` pelo IP real da sua impressora!**

### 3️⃣ Iniciar Print Bridge

```bash
cd print-bridge
npm run build
node dist/index.js
```

## ✅ Testar

```bash
# Verificar se está rodando
curl http://localhost:3333/health

# Ver impressoras
curl http://localhost:3333/printers

# Deve mostrar:
# {
#   "printers": [{
#     "name": "LAN: 192.168.1.50:9100",
#     "type": "LAN",
#     "ip": "192.168.1.50",
#     "port": 9100
#   }]
# }
```

## 🔧 Troubleshooting

**Não encontra impressora?**
```bash
# Testar conexão
ping 192.168.1.50

# Testar porta
nc -zv 192.168.1.50 9100
```

**Porta não responde?**
- Verifique se porta é 9100 (pode ser 9101)
- Verifique firewall
- Verifique se impressora está ligada e conectada

## 📚 Documentação Completa

Veja `LAN_SETUP_GUIDE.md` para guia detalhado.

## 🚀 Próximo Passo

Configure auto-start para iniciar automaticamente:
- Windows: `install-service-windows.bat`
- Mac: `install-service-mac.sh`
- Linux: `install-service-linux.sh`

Veja `AUTO_START_GUIDE.md` para detalhes.

