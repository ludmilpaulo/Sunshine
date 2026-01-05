# 📥 Como Instalar Print Bridge - Guia Completo

Este guia mostra como obter o código e instalar o Print Bridge no computador do caixa.

## 📋 Pré-requisitos

Antes de começar, você precisa:
- ✅ **Node.js instalado** (v18 ou superior) - [Baixar Node.js](https://nodejs.org/)
- ✅ **Git instalado** (opcional, mas recomendado) - [Baixar Git](https://git-scm.com/)

## 🎯 Método 1: Usando Git (Recomendado)

### Passo 1: Instalar Git (se ainda não tiver)

**Windows:**
- Baixe: https://git-scm.com/download/win
- Execute o instalador
- Use as opções padrão

**macOS:**
- Git geralmente já vem instalado
- Ou instale via Homebrew: `brew install git`

**Linux:**
```bash
sudo apt-get install git  # Ubuntu/Debian
# ou
sudo yum install git      # CentOS/RHEL
```

### Passo 2: Clonar o Repositório

Abra o Terminal (macOS/Linux) ou PowerShell (Windows) e execute:

```bash
# Navegar até onde você quer instalar (ex: Desktop, Documents)
cd ~/Desktop  # ou cd ~/Documents

# Clonar o repositório
git clone https://github.com/ludmilpaulo/Sunshine.git

# Navegar para a pasta print-bridge
cd Sunshine/print-bridge
```

### Passo 3: Instalar e Configurar

```bash
# Instalar dependências
npm install

# Compilar
npm run build

# Instalar como serviço (escolha o script do seu sistema)
# macOS:
./install-service-mac.sh

# Linux:
sudo ./install-service-linux.sh

# Windows:
.\install-service-windows.bat
```

---

## 📦 Método 2: Download Direto (Sem Git)

### Passo 1: Baixar o Código

1. Acesse: https://github.com/ludmilpaulo/Sunshine
2. Clique no botão verde **"Code"**
3. Selecione **"Download ZIP"**
4. Extraia o arquivo ZIP onde quiser (ex: Desktop, Documents)

### Passo 2: Encontrar a Pasta

Após extrair, você terá uma pasta chamada `Sunshine-main` (ou `Sunshine`).

Dentro dessa pasta, navegue até:
```
Sunshine-main/
  └── print-bridge/  ← Esta é a pasta que você precisa
```

### Passo 3: Abrir Terminal/PowerShell na Pasta

**Windows:**
1. Navegue até a pasta `print-bridge` no Explorer
2. Clique com botão direito na pasta
3. Selecione "Abrir no Terminal" ou "Open PowerShell window here"
4. Ou pressione `Shift + Botão Direito` e escolha "Abrir janela do PowerShell aqui"

**macOS:**
1. Abra o Terminal
2. Digite: `cd ` (com espaço no final)
3. Arraste a pasta `print-bridge` para o Terminal
4. Pressione Enter

**Linux:**
1. Abra o Terminal
2. Use `cd` para navegar até a pasta:
   ```bash
   cd ~/Downloads/Sunshine-main/print-bridge
   # (ajuste o caminho conforme onde você extraiu)
   ```

### Passo 4: Verificar que Está na Pasta Correta

No terminal, execute:

```bash
# Windows (PowerShell):
dir

# macOS/Linux:
ls
```

Você deve ver arquivos como:
- `package.json`
- `src/`
- `install-service-*.sh` ou `install-service-windows.bat`
- `README.md`

### Passo 5: Instalar

```bash
# Instalar dependências
npm install

# Compilar
npm run build

# Instalar como serviço (escolha o script do seu sistema)
# macOS:
chmod +x install-service-mac.sh
./install-service-mac.sh

# Linux:
sudo ./install-service-linux.sh

# Windows:
.\install-service-windows.bat
```

---

## 🚀 Método 3: Script de Instalação Automática (Mais Fácil)

Se você já tem a pasta `print-bridge` no computador:

### Passo 1: Abrir Terminal na Pasta

**Windows:**
1. Abra o Explorer
2. Navegue até `print-bridge`
3. Clique na barra de endereço e digite: `powershell`
4. Pressione Enter

**macOS/Linux:**
1. Abra Terminal
2. Navegue até a pasta:
   ```bash
   cd caminho/para/print-bridge
   ```

### Passo 2: Executar Script de Instalação Rápida

```bash
# macOS/Linux:
chmod +x QUICK_INSTALL.sh
./QUICK_INSTALL.sh

# Windows:
# Execute: install-service-windows.bat
```

O script faz tudo automaticamente!

---

## 🔍 Como Saber se Está na Pasta Correta?

Execute este comando no terminal:

```bash
# Windows:
dir package.json

# macOS/Linux:
ls package.json
```

Se aparecer `package.json`, você está na pasta certa!

---

## 📍 Encontrar o Caminho da Pasta

### Windows:

1. Abra o Explorer
2. Navegue até a pasta `print-bridge`
3. Clique na barra de endereço (onde mostra o caminho)
4. Copie o caminho (ex: `C:\Users\SeuNome\Desktop\Sunshine\print-bridge`)
5. No PowerShell, digite: `cd "C:\Users\SeuNome\Desktop\Sunshine\print-bridge"`

### macOS/Linux:

1. Abra o Finder (macOS) ou Nautilus (Linux)
2. Navegue até a pasta `print-bridge`
3. Clique com botão direito na pasta
4. Selecione "Obter Informações" (macOS) ou "Propriedades" (Linux)
5. Copie o caminho
6. No Terminal, digite: `cd /caminho/copiado`

**Ou mais fácil no macOS:**
1. Arraste a pasta para o Terminal
2. O caminho será preenchido automaticamente

---

## ❓ Problemas Comuns

### "cd: no such file or directory" ou "Cannot find path"

**Causa:** Você não está no caminho correto ou a pasta não existe.

**Solução:**
1. Verifique se a pasta `print-bridge` existe
2. Use o caminho completo:
   ```bash
   # Windows:
   cd "C:\caminho\completo\para\print-bridge"
   
   # macOS/Linux:
   cd /caminho/completo/para/print-bridge
   ```
3. Ou navegue passo a passo:
   ```bash
   cd ~/Desktop        # Ir para Desktop
   cd Sunshine         # Entrar na pasta Sunshine
   cd print-bridge     # Entrar na pasta print-bridge
   ```

### "npm: command not found"

**Causa:** Node.js não está instalado ou não está no PATH.

**Solução:**
1. Instale Node.js: https://nodejs.org/
2. Reinicie o terminal após instalar
3. Verifique: `node --version` (deve mostrar a versão)

### "Permission denied" (macOS/Linux)

**Causa:** Arquivo não tem permissão de execução.

**Solução:**
```bash
chmod +x install-service-mac.sh
chmod +x QUICK_INSTALL.sh
```

---

## ✅ Checklist de Instalação

- [ ] Node.js instalado (`node --version` funciona)
- [ ] Pasta `print-bridge` obtida (Git clone ou download ZIP)
- [ ] Terminal aberto na pasta `print-bridge`
- [ ] Dependências instaladas (`npm install`)
- [ ] Print Bridge compilado (`npm run build`)
- [ ] Serviço instalado (script de instalação executado)
- [ ] Print Bridge rodando (`curl http://localhost:3333/health`)

---

## 📞 Precisa de Ajuda?

1. **Verificar se está na pasta correta:**
   ```bash
   pwd  # macOS/Linux - mostra caminho atual
   cd   # Windows PowerShell - mostra caminho atual
   ```

2. **Listar arquivos:**
   ```bash
   ls   # macOS/Linux
   dir  # Windows
   ```

3. **Ver se package.json existe:**
   ```bash
   ls package.json   # macOS/Linux
   dir package.json  # Windows
   ```

---

**Dica:** Se você não tem certeza onde está, use `cd ~/Desktop` (macOS/Linux) ou `cd $HOME\Desktop` (Windows PowerShell) para ir ao Desktop, e depois navegue até a pasta `print-bridge` de lá.

