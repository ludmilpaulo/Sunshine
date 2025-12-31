# 🔍 Auto-Descoberta de Impressoras LAN

## 🎯 Problema Resolvido

Quando você muda de computador ou a impressora recebe um novo IP via DHCP, não precisa mais reconfigurar manualmente! O sistema agora detecta automaticamente a impressora na rede.

## ✨ Como Funciona

### Método 1: Hostname (Recomendado) ⭐

A maioria das impressoras tem um hostname fixo (ex: `EPSON-ABC123.local` ou `printer.local`). Mesmo que o IP mude, o hostname permanece o mesmo.

**Configuração:**
```bash
# No arquivo .env ou variável de ambiente
PRINTER_HOSTNAME=printer.local
PRINTER_LAN_PORT=9100
```

**Vantagens:**
- ✅ Funciona mesmo quando IP muda
- ✅ Não precisa descobrir IP manualmente
- ✅ Resolve automaticamente em cada impressão

### Método 2: Auto-Descoberta Completa

O sistema escaneia a rede local procurando por impressoras.

**Como usar:**
```bash
# Inicie sem configuração
cd print-bridge
./start-lan.sh

# Ou use o endpoint de descoberta
curl http://localhost:3333/discover
```

### Método 3: IP Fixo (Tradicional)

Se você tem IP fixo configurado na impressora:
```bash
PRINTER_LAN_IP=192.168.1.100
PRINTER_LAN_PORT=9100
```

## 🚀 Início Rápido

### Passo 1: Descobrir o Hostname da Impressora

**No macOS:**
```bash
# Escaneie a rede
dns-sd -B _printer._tcp

# Ou verifique no menu da impressora
# Geralmente está em: Configurações → Rede → Hostname
```

**Na impressora:**
- Acesse o menu de configuração
- Procure por "Hostname" ou "Nome do Dispositivo"
- Anote o nome (ex: `EPSON-ABC123`, `printer`, `POS-Printer`)

**Formato comum:**
- `printer.local`
- `epson-printer.local`
- `EPSON-ABC123.local`
- `star-printer.local`

### Passo 2: Configurar

**Opção A: Arquivo .env**
```bash
cd print-bridge
cp .env.example .env
nano .env
```

Adicione:
```env
PRINTER_HOSTNAME=printer.local
PRINTER_LAN_PORT=9100
```

**Opção B: Script direto**
```bash
cd print-bridge
./start-lan.sh printer.local
```

**Opção C: Variável de ambiente**
```bash
export PRINTER_HOSTNAME="printer.local"
export PRINTER_LAN_PORT="9100"
cd print-bridge
npm run dev
```

### Passo 3: Testar

```bash
# Verificar se encontrou a impressora
curl http://localhost:3333/printers

# Testar auto-descoberta
curl http://localhost:3333/discover
```

## 🔄 Monitoramento Automático

O sistema resolve o hostname automaticamente em cada impressão, então:

- ✅ Se o IP mudar, será detectado automaticamente
- ✅ Não precisa reiniciar o serviço
- ✅ Funciona mesmo mudando de rede (se hostname for o mesmo)

## 📋 Estratégias de Descoberta

O sistema tenta na seguinte ordem:

1. **Hostname configurado** (`PRINTER_HOSTNAME`)
   - Resolve via DNS/mDNS
   - Mais rápido e confiável

2. **IP configurado** (`PRINTER_LAN_IP`)
   - Usa diretamente
   - Requer IP fixo

3. **Auto-descoberta completa**
   - Escaneia rede local
   - Tenta hostnames comuns
   - Mais lento mas funciona sem configuração

## 🛠️ Troubleshooting

### Hostname não resolve

**Teste manual:**
```bash
# macOS/Linux
ping printer.local
nslookup printer.local

# Se não funcionar, tente descobrir o IP atual:
# 1. Menu da impressora → Configurações de Rede
# 2. Ou escaneie a rede
```

**Solução temporária:**
Use IP diretamente até configurar hostname na impressora:
```bash
./start-lan.sh 192.168.1.100 9100
```

### Auto-descoberta não encontra impressora

1. Verifique se impressora está ligada e na rede
2. Verifique firewall da impressora
3. Tente configurar hostname manualmente na impressora
4. Use IP fixo como fallback

### IP muda frequentemente

**Solução:** Configure hostname fixo na impressora:
1. Acesse menu de configuração
2. Rede → Configurações Avançadas
3. Configure hostname fixo (ex: `printer.local`)
4. Use esse hostname no `.env`

## 📝 Exemplos

### Exemplo 1: Impressora Epson com hostname
```bash
# .env
PRINTER_HOSTNAME=EPSON-TM-T20.local
PRINTER_LAN_PORT=9100

# Iniciar
./start-lan.sh
```

### Exemplo 2: Impressora genérica
```bash
# Descobrir hostname primeiro
dns-sd -B _printer._tcp

# Depois configurar
export PRINTER_HOSTNAME="printer.local"
./start-lan.sh
```

### Exemplo 3: Sem configuração (auto-discovery)
```bash
# Inicia e procura automaticamente
./start-lan.sh

# Verifica o que encontrou
curl http://localhost:3333/discover
```

## ✅ Vantagens da Auto-Descoberta

- 🔄 **IP dinâmico**: Funciona mesmo com DHCP
- 🖥️ **Múltiplos computadores**: Mesma configuração em todos
- 🚀 **Zero configuração**: Detecta automaticamente
- 🔍 **Inteligente**: Tenta múltiplas estratégias
- 📡 **Hostname fixo**: Mais confiável que IP

## 🎯 Recomendação

**Use hostname sempre que possível!** É a forma mais confiável e não requer reconfiguração quando o IP muda.

