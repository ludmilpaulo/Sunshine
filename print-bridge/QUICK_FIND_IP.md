# ⚡ Descobrir IP da Impressora - Guia Rápido

Sua impressora GO INFINITY está conectada via RJ45 ao roteador. Siga estes passos:

## 🎯 Método Mais Rápido: Menu da Impressora

1. **Ligue a impressora** (botão de energia)

2. **Pressione os botões do painel** para acessar o menu

3. **Navegue até:**
   - "Network" ou "Network Settings"
   - "TCP/IP" ou "TCP/IP Settings"
   - "Network Info" ou "Network Status"

4. **Anote o IP** que aparece (ex: `192.168.1.50`)

5. **Teste a impressão:**
   ```bash
   cd print-bridge
   ./test-lan-print.sh 192.168.1.50
   ```

## 🌐 Método Alternativo: Roteador

1. **Abra navegador:** `http://192.168.1.1`

2. **Login:** 
   - Usuário: `admin`
   - Senha: `admin` (ou verifique no rótulo do roteador)

3. **Procure:** "Dispositivos Conectados" ou "DHCP Clients"

4. **Encontre:** Impressora GO INFINITY ou dispositivo desconhecido

5. **Anote o IP**

## ✅ Teste Rápido

Depois de descobrir o IP, execute:

```bash
cd print-bridge
./test-lan-print.sh <IP>
```

**Exemplo:**
```bash
./test-lan-print.sh 192.168.1.50
```

## 🔧 Se Não Encontrar

- Verifique se impressora está ligada
- Verifique se cabo RJ45 está conectado
- Aguarde 1-2 minutos após ligar (pode levar tempo para obter IP)
- Reinicie a impressora

## 💡 Dica

A forma mais confiável é usar o menu da impressora. Geralmente o IP aparece logo no primeiro menu de rede.

