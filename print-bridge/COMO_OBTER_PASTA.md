# 📥 Como Obter a Pasta print-bridge no Computador

## 🎯 Opção 1: Usando Git (Recomendado - Mais Fácil)

### Passo 1: Abrir Terminal/PowerShell

**Windows:**
- Pressione `Windows + X`
- Escolha "Windows PowerShell" ou "Terminal"

**macOS:**
- Pressione `Cmd + Espaço`
- Digite "Terminal" e pressione Enter

**Linux:**
- Pressione `Ctrl + Alt + T`

### Passo 2: Clonar o Repositório

No terminal, execute:

```bash
# Ir para o Desktop (ou Documents)
cd ~/Desktop

# Clonar o projeto
git clone https://github.com/ludmilpaulo/Sunshine.git

# Entrar na pasta print-bridge
cd Sunshine/print-bridge
```

**Pronto!** Você está na pasta `print-bridge`.

---

## 📦 Opção 2: Download ZIP (Sem Git)

### Passo 1: Baixar o Código

1. Acesse: https://github.com/ludmilpaulo/Sunshine
2. Clique no botão verde **"Code"**
3. Clique em **"Download ZIP"**
4. Aguarde o download

### Passo 2: Extrair o Arquivo

1. Encontre o arquivo `Sunshine-main.zip` (geralmente em Downloads)
2. Clique duas vezes para extrair
3. Uma pasta `Sunshine-main` será criada

### Passo 3: Abrir Terminal na Pasta print-bridge

**Windows:**
1. Abra o Explorer
2. Navegue até a pasta extraída: `Sunshine-main/print-bridge`
3. Clique na barra de endereço (onde mostra o caminho)
4. Digite: `powershell` e pressione Enter
5. O PowerShell abrirá na pasta correta!

**macOS:**
1. Abra o Terminal
2. Digite: `cd ` (com espaço no final)
3. No Finder, encontre a pasta `print-bridge`
4. Arraste a pasta para o Terminal
5. Pressione Enter

**Linux:**
1. Abra o Terminal
2. Navegue até a pasta:
   ```bash
   cd ~/Downloads/Sunshine-main/print-bridge
   ```

---

## 🔍 Como Verificar que Está na Pasta Certa?

Execute no terminal:

```bash
# Windows:
dir

# macOS/Linux:
ls
```

Você deve ver:
- ✅ `package.json`
- ✅ `src/` (pasta)
- ✅ `install-service-mac.sh` ou `install-service-windows.bat`
- ✅ `QUICK_INSTALL.sh`

Se você ver esses arquivos, está na pasta certa! ✅

---

## 🚀 Depois de Obter a Pasta

Uma vez na pasta `print-bridge`, execute:

```bash
# Instalação rápida (recomendado):
./QUICK_INSTALL.sh  # macOS/Linux
# ou
.\install-service-windows.bat  # Windows
```

---

## 📍 Dica: Encontrar o Caminho Completo

### Windows:

1. Abra o Explorer
2. Navegue até `print-bridge`
3. Clique na barra de endereço (mostra o caminho)
4. Copie o caminho completo (ex: `C:\Users\Nome\Desktop\Sunshine-main\print-bridge`)
5. No PowerShell: `cd "C:\Users\Nome\Desktop\Sunshine-main\print-bridge"`

### macOS:

1. Abra o Finder
2. Navegue até `print-bridge`
3. Segure `Option` e clique com botão direito na pasta
4. Escolha "Copiar print-bridge como nome de caminho"
5. No Terminal: `cd ` e cole o caminho

---

**Resumo:** Use Git para clonar OU baixe o ZIP e extraia. Depois navegue até `Sunshine/print-bridge` (ou `Sunshine-main/print-bridge` se baixou ZIP) e execute os comandos de instalação!

