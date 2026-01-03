# 🔍 Como Descobrir o IP da Impressora GO INFINITY

A varredura automática não encontrou a impressora. Vamos descobrir o IP manualmente - é mais rápido e confiável!

## 📋 Método 1: Menu da Impressora (Mais Fácil e Confiável)

Sua impressora GO INFINITY tem botões no painel. Siga estes passos:

1. **Ligue a impressora** (se ainda não estiver ligada)

2. **Acesse o menu:**
   - Pressione os botões do painel da impressora
   - Procure por: "Network", "Network Settings", "TCP/IP", ou "Network Info"
   - Use as setas para navegar

3. **Encontre o IP:**
   - Procure por "IP Address" ou "IP"
   - Anote o número (ex: `192.168.1.50`)

4. **Anote também a porta:**
   - Geralmente é `9100` (padrão ESC/POS)
   - Pode aparecer como "Port" ou "TCP Port"

## 📋 Método 2: Página de Teste/Configuração

1. **Imprima uma página de teste:**
   - Pressione os botões da impressora
   - Procure "Print Test Page" ou "Self Test"
   - Ou imprima uma página de configuração

2. **Procure o IP na página impressa:**
   - Geralmente aparece no topo ou rodapé
   - Formato: `IP: 192.168.1.50` ou `192.168.1.50`

## 📋 Método 3: Via Roteador

1. **Acesse o painel do roteador:**
   - Abra navegador: `http://192.168.1.1` ou `http://192.168.0.1`
   - Ou descubra o IP do gateway:
     - Mac: `route -n get default | grep gateway`
     - Windows: `ipconfig | findstr "Default Gateway"`

2. **Faça login** (geralmente admin/admin ou admin/senha)

3. **Procure por:**
   - "Dispositivos Conectados"
   - "DHCP Clients"
   - "Network Devices"
   - "Connected Devices"
   - "Attached Devices"

4. **Encontre sua impressora:**
   - Procure por "GO INFINITY" ou "Printer"
   - Ou procure por um dispositivo com MAC address desconhecido
   - Anote o IP atribuído

## 📋 Método 4: Via ARP (Dispositivos Recentes)

Execute no terminal:
```bash
arp -a | grep "192.168.1"
```

Isso mostra dispositivos que se comunicaram recentemente na rede.

## ✅ Depois de Descobrir o IP

1. **Teste a conexão:**
   ```bash
   ping 192.168.1.50  # Substitua pelo IP real
   nc -zv 192.168.1.50 9100  # Testar porta
   ```

2. **Teste a impressão:**
   ```bash
   cd print-bridge
   ./test-lan-print.sh 192.168.1.50
   ```

3. **Configure o `.env`:**
   ```env
   PORT=3333
   PRINTER_LAN_IP=192.168.1.50
   PRINTER_LAN_PORT=9100
   ```

## 🎯 Dica Rápida

**A forma mais rápida:** Acesse o menu da impressora usando os botões no painel e procure "Network Settings" ou "TCP/IP". O IP geralmente aparece logo no primeiro menu de rede.

## ❓ Se Não Encontrar

- Verifique se a impressora está ligada
- Verifique se o cabo Ethernet está conectado
- Verifique se a impressora está na mesma rede (192.168.1.x)
- Tente reiniciar a impressora

