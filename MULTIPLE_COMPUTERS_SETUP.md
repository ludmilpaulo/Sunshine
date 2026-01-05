# Setup para Múltiplos Computadores

## 🎯 Arquitetura com Múltiplos Caixas

Quando você tem múltiplos computadores usando o sistema, cada máquina precisa ter o Print Bridge instalado localmente.

### Como Funciona

```
┌─────────────────────────────────────────────────────────────┐
│  INTERNET (Cloud)                                           │
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   VERCEL     │         │ PYTHONANYWHERE│                 │
│  │ (Frontend)   │         │  (Backend)    │                 │
│  │              │         │               │                 │
│  │ 1 servidor   │         │ 1 servidor    │                 │
│  │ compartilhado│         │ compartilhado │                 │
│  └──────────────┘         └──────────────┘                 │
│         │                          │                         │
└─────────┼──────────────────────────┼─────────────────────────┘
          │                          │
          │ HTTPS                    │ HTTPS
          │ (múltiplas conexões)     │ (múltiplas conexões)
          │                          │
┌─────────┴──────────────────────────┴─────────────────────────┐
│  LOJA - Múltiplos Computadores                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐  ┌─────────┐
│  COMPUTADOR CAIXA 1  │  │  COMPUTADOR CAIXA 2  │  │  ...    │
│                      │  │                      │  │         │
│  ┌────────────────┐  │  │  ┌────────────────┐  │  │         │
│  │  Navegador     │  │  │  │  Navegador     │  │  │         │
│  │  (Chrome)      │  │  │  │  (Chrome)      │  │  │         │
│  │                │  │  │  │                │  │  │         │
│  │  Acessa:       │  │  │  │  Acessa:       │  │  │         │
│  │  sunshinebar.  │  │  │  │  sunshinebar.  │  │  │         │
│  │  vercel.app    │  │  │  │  vercel.app    │  │  │         │
│  └────────┬───────┘  │  │  └────────┬───────┘  │  │         │
│           │          │  │           │          │  │         │
│           │ localhost│  │           │ localhost│  │         │
│           │ :3333    │  │           │ :3333    │  │         │
│           ▼          │  │           ▼          │  │         │
│  ┌────────────────┐  │  │  ┌────────────────┐  │  │         │
│  │  Print Bridge  │  │  │  │  Print Bridge  │  │  │         │
│  │  localhost:3333│  │  │  │  localhost:3333│  │  │         │
│  │                │  │  │  │                │  │  │         │
│  │  ✅ Rodando    │  │  │  │  ✅ Rodando    │  │  │         │
│  │     AQUI       │  │  │  │     AQUI       │  │  │         │
│  └────────┬───────┘  │  │  └────────┬───────┘  │  │         │
│           │          │  │           │          │  │         │
│           │ USB/LAN  │  │           │ USB/LAN  │  │         │
│           ▼          │  │           ▼          │  │         │
│  ┌────────────────┐  │  │  ┌────────────────┐  │  │         │
│  │  Impressora 1  │  │  │  │  Impressora 2  │  │  │         │
│  │  (física)      │  │  │  │  (física)      │  │  │         │
│  └────────────────┘  │  │  └────────────────┘  │  │         │
└──────────────────────┘  └──────────────────────┘  └─────────┘
```

## 📋 Checklist: Instalação em Múltiplos Computadores

### Para CADA computador do caixa:

- [ ] **Node.js instalado**
- [ ] **Print Bridge instalado** (copiar pasta `print-bridge`)
- [ ] **Print Bridge compilado** (`npm install && npm run build`)
- [ ] **Print Bridge configurado** (arquivo `.env` com impressora deste computador)
- [ ] **Print Bridge rodando** (como serviço ou processo)
- [ ] **Impressora conectada** (USB ou LAN)
- [ ] **Teste de impressão funcionando**

## 🔧 Passo a Passo: Instalar em Cada Computador

### 1. Preparar os Arquivos

**Opção A: Copiar do GitHub (recomendado)**
```bash
# Em CADA computador do caixa:
git clone https://github.com/seu-usuario/Sunshine.git
cd Sunshine/print-bridge
npm install
npm run build
```

**Opção B: Copiar pasta**
```bash
# Copiar a pasta print-bridge para cada computador
# Via USB, rede, ou compartilhamento de arquivos
```

### 2. Configurar Cada Computador

Cada computador precisa de seu próprio arquivo `.env`:

**Computador 1 (Caixa 1):**
```env
PORT=3333
PRINTER_USB_NAME=Impressora_Caixa_1
# ou
PRINTER_LAN_IP=192.168.1.50
CORS_ORIGIN_ALLOW_ALL=true
```

**Computador 2 (Caixa 2):**
```env
PORT=3333
PRINTER_USB_NAME=Impressora_Caixa_2
# ou
PRINTER_LAN_IP=192.168.1.51
CORS_ORIGIN_ALLOW_ALL=true
```

### 3. Instalar como Serviço (Auto-Start)

Em CADA computador, execute o script apropriado:

**Windows:**
```powershell
cd print-bridge
.\install-service-windows.bat
```

**macOS:**
```bash
cd print-bridge
./install-service-mac.sh
```

**Linux:**
```bash
cd print-bridge
sudo ./install-service-linux.sh
```

## ⚠️ Pontos Importantes

### 1. Cada Computador = Print Bridge Separado

- ✅ Cada computador tem seu próprio Print Bridge
- ✅ Cada Print Bridge imprime na impressora daquele computador
- ✅ Não há conflito (cada um roda em localhost:3333 da sua própria máquina)

### 2. Impressora por Computador

- ✅ Cada computador deve ter sua própria impressora
- ✅ Ou usar impressora LAN (se estiver na mesma rede)
- ✅ Print Bridge imprime na impressora configurada no `.env` daquele computador

### 3. Porta 3333 é Local

- ✅ `localhost:3333` em cada computador é independente
- ✅ Computador 1: `localhost:3333` → Print Bridge do Computador 1
- ✅ Computador 2: `localhost:3333` → Print Bridge do Computador 2
- ✅ Não há conflito porque cada um só vê seu próprio `localhost`

### 4. Frontend Compartilhado

- ✅ Todos os computadores acessam: `https://sunshinebar.vercel.app`
- ✅ Cada navegador (em cada computador) faz requisições para seu próprio `localhost:3333`
- ✅ Backend compartilhado: `https://sunshinebar.pythonanywhere.com/api`

## 🔍 Verificação: Múltiplos Computadores

### Em CADA computador, verificar:

```bash
# 1. Print Bridge está rodando?
curl http://localhost:3333/health
# Deve retornar: {"ok":true,"service":"print-bridge"}

# 2. Impressora está configurada?
curl http://localhost:3333/printers
# Deve listar a impressora deste computador

# 3. Teste de impressão
# Abrir: https://sunshinebar.vercel.app/test-printer
# Clicar em "Test Print"
```

## 📊 Exemplo: Loja com 3 Caixas

```
Loja "Sunshine Bar"
├── Caixa 1
│   ├── Computador Windows
│   ├── Print Bridge (localhost:3333)
│   └── Impressora USB "Termica_Caixa1"
│
├── Caixa 2
│   ├── Computador macOS
│   ├── Print Bridge (localhost:3333)
│   └── Impressora LAN (192.168.1.50)
│
└── Caixa 3
    ├── Computador Linux
    ├── Print Bridge (localhost:3333)
    └── Impressora USB "Termica_Caixa3"
```

Cada caixa:
- ✅ Acessa: `https://sunshinebar.vercel.app`
- ✅ Backend: `https://sunshinebar.pythonanywhere.com/api`
- ✅ Print Bridge: `http://localhost:3333` (próprio computador)
- ✅ Impressora: Configurada no `.env` do computador

## 🚀 Deploy Simplificado

Para facilitar instalação em múltiplos computadores:

### Script de Instalação Automática

Crie um script que automatiza a instalação:

```bash
#!/bin/bash
# install-print-bridge.sh

echo "Instalando Print Bridge..."

# Instalar dependências
npm install

# Compilar
npm run build

# Criar .env se não existir
if [ ! -f .env ]; then
    cat > .env << EOF
PORT=3333
CORS_ORIGIN_ALLOW_ALL=true
EOF
    echo "Arquivo .env criado. Configure a impressora manualmente."
fi

# Instalar como serviço (detecta OS automaticamente)
./install-auto-start.sh

echo "✅ Print Bridge instalado!"
echo "⚠️  Configure a impressora no arquivo .env antes de usar"
```

## ✅ Checklist Final

Antes de usar em produção com múltiplos computadores:

- [ ] Print Bridge instalado em TODOS os computadores do caixa
- [ ] Cada computador tem seu `.env` configurado
- [ ] Cada computador tem impressora configurada e testada
- [ ] Auto-start configurado em todos os computadores
- [ ] Teste de impressão funcionando em todos os computadores
- [ ] Documentação de qual impressora está em qual computador

---

**Resumo:** Cada computador do caixa precisa ter seu próprio Print Bridge rodando em `localhost:3333` para imprimir na impressora daquele computador específico.

