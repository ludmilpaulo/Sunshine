# 🔍 Verificar Impressora no Roteador

Sua impressora está conectada via RJ45 ao roteador. Vamos verificar no painel do roteador.

## 🌐 Acessar Roteador

Seu roteador está em: **http://192.168.1.1** (Zyxel)

### Passos:

1. **Abra o navegador** e acesse: `http://192.168.1.1`

2. **Faça login:**
   - Usuário: `admin` (ou deixe vazio)
   - Senha: `admin` ou `1234` ou `password` (ou verifique no rótulo do roteador)

3. **Procure por:**
   - "Dispositivos Conectados"
   - "DHCP Clients"
   - "Network Devices"
   - "Attached Devices"
   - "Connected Devices"
   - "LAN Clients"

4. **Encontre sua impressora:**
   - Procure por "GO INFINITY" ou "Printer"
   - Ou procure por um dispositivo com nome desconhecido/estranho
   - Ou procure por um dispositivo recém-conectado
   - Anote o **IP Address** atribuído

## 📋 Alternativa: Menu da Impressora

Se não conseguir acessar o roteador:

1. **Ligue a impressora** (se não estiver ligada)

2. **Acesse o menu:**
   - Pressione os botões no painel da impressora GO INFINITY
   - Use as setas para navegar

3. **Procure:**
   - "Network Settings"
   - "TCP/IP Settings"
   - "Network Info"
   - "IP Settings"

4. **Anote o IP** que aparece

## ✅ Depois de Descobrir o IP

Execute o teste de impressão:

```bash
cd print-bridge
./test-lan-print.sh <IP_DA_IMPRESSORA>
```

**Exemplo:**
```bash
./test-lan-print.sh 192.168.1.50
```

## 🔧 Se a Impressora Não Aparecer no Roteador

A impressora pode precisar de configuração inicial:

1. **Verifique se está ligada** e o cabo RJ45 está conectado
2. **Aguarde alguns minutos** - pode levar tempo para obter IP via DHCP
3. **Reinicie a impressora** - desligue e ligue novamente
4. **Verifique o menu da impressora** - pode precisar ativar DHCP ou configurar IP manualmente

## 📝 Nota

Algumas impressoras GO INFINITY precisam ser configuradas primeiro via menu antes de aparecer na rede. Se não encontrar no roteador, use o menu da impressora para ver o IP.

