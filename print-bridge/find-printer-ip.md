# 🔍 Como Descobrir o IP da Impressora na LAN

Sua impressora já está conectada à LAN! Agora precisamos descobrir o IP dela.

## Métodos para Descobrir o IP

### Método 1: Via Menu da Impressora (Mais Confiável)

1. **Acesse o menu da impressora** (botões no painel)
2. Procure por:
   - "Network Settings"
   - "TCP/IP Settings"
   - "Network Configuration"
   - "Network Info"
   - "IP Settings"
3. Anote o **endereço IP** (ex: `192.168.1.50`)
4. Anote também a **porta** (geralmente `9100`)

### Método 2: Via Página de Teste/Configuração

1. **Imprima uma página de teste** ou configuração da impressora
2. Procure pelo IP na página impressa
3. Geralmente aparece como: `IP Address: 192.168.1.50`

### Método 3: Via Roteador/Modem

1. **Acesse o painel do roteador:**
   - Abra navegador: `http://192.168.1.1` ou `http://192.168.0.1`
   - Ou verifique o IP do gateway: `ipconfig` (Windows) / `ifconfig` (Mac/Linux)
2. **Procure por:**
   - "Dispositivos Conectados"
   - "DHCP Clients"
   - "Network Devices"
   - "Connected Devices"
3. **Procure pelo nome da impressora** na lista
4. Anote o IP atribuído

### Método 4: Usar Auto-Discovery do Print Bridge

```bash
cd print-bridge

# Iniciar Print Bridge (se não estiver rodando)
node dist/index.js &
sleep 3

# Descobrir impressora automaticamente
curl http://localhost:3333/discover
```

### Método 5: Usar Script de Descoberta

**Mac/Linux:**
```bash
cd print-bridge
chmod +x discover-printer.sh
./discover-printer.sh
```

**Windows:**
```cmd
cd print-bridge
discover-printer-windows.bat
```

### Método 6: Escanear a Rede (Avançado)

**Mac/Linux:**
```bash
# Descobrir sua própria rede
ifconfig | grep "inet " | grep -v 127.0.0.1

# Escanear rede (exemplo para 192.168.1.x)
for i in {1..254}; do
  timeout 1 bash -c "echo >/dev/tcp/192.168.1.$i/9100" 2>/dev/null && echo "Impressora encontrada em: 192.168.1.$i"
done
```

**Windows (PowerShell):**
```powershell
# Descobrir sua própria rede
ipconfig | findstr "IPv4"

# Escanear porta 9100 na rede
1..254 | ForEach-Object {
    $ip = "192.168.1.$_"
    $tcp = New-Object System.Net.Sockets.TcpClient
    try {
        $tcp.Connect($ip, 9100)
        Write-Host "Impressora encontrada em: $ip"
    } catch {}
    $tcp.Close()
}
```

## ✅ Depois de Descobrir o IP

1. **Teste a conexão:**
   ```bash
   ping 192.168.1.50  # Substitua pelo IP real
   ```

2. **Teste a porta 9100:**
   ```bash
   # Mac/Linux
   nc -zv 192.168.1.50 9100
   
   # Windows
   telnet 192.168.1.50 9100
   ```

3. **Configure o `.env`:**
   ```env
   PORT=3333
   PRINTER_LAN_IP=192.168.1.50
   PRINTER_LAN_PORT=9100
   ```

4. **Teste o Print Bridge:**
   ```bash
   node dist/index.js
   curl http://localhost:3333/printers
   ```

## 🎯 Próximo Passo

Depois de descobrir o IP, veja `LAN_SETUP_GUIDE.md` para configuração completa.

