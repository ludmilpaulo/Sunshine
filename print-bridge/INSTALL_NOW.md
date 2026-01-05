# 🚀 Instalar Print Bridge AGORA (Auto-Start)

Se você está vendo a mensagem "Para imprimir, inicie o Print Bridge nesta máquina", siga estes passos:

## ⚡ Instalação Rápida (5 minutos)

### Passo 1: Executar Script de Instalação

Abra o terminal/prompt de comando e execute:

```bash
cd print-bridge
./QUICK_INSTALL.sh
```

**Windows:**
```powershell
cd print-bridge
.\install-service-windows.bat
```

**macOS/Linux:**
```bash
cd print-bridge
chmod +x QUICK_INSTALL.sh
./QUICK_INSTALL.sh
```

### Passo 2: Aguardar Instalação

O script irá:
- ✅ Verificar Node.js
- ✅ Instalar dependências
- ✅ Compilar Print Bridge
- ✅ Instalar como serviço (inicia automaticamente)
- ✅ Testar se está funcionando

### Passo 3: Pronto!

Após a instalação, o Print Bridge irá:
- ✅ Iniciar automaticamente quando o computador ligar
- ✅ Reiniciar automaticamente se parar
- ✅ Funcionar sem intervenção manual

---

## 🔍 Verificar se Está Funcionando

Abra o navegador e teste:

```
http://localhost:3333/health
```

Deve retornar: `{"ok":true,"service":"print-bridge"}`

---

## ❌ Ainda Vendo a Mensagem de Erro?

### Solução Rápida:

1. **Verificar se está rodando:**
   ```bash
   curl http://localhost:3333/health
   ```

2. **Se não estiver rodando, iniciar manualmente:**
   ```bash
   cd print-bridge
   npm start
   ```

3. **Instalar como serviço (para iniciar automaticamente):**
   - macOS: `./install-service-mac.sh`
   - Linux: `sudo ./install-service-linux.sh`
   - Windows: `.\install-service-windows.bat`

### Problemas Comuns:

Veja o guia completo: [AUTO_START_TROUBLESHOOTING.md](./AUTO_START_TROUBLESHOOTING.md)

---

## 📝 Por que Preciso Instalar?

O Print Bridge precisa ser instalado **uma vez em cada computador** do caixa. Depois disso, ele inicia automaticamente.

**Não precisa instalar:**
- ✅ No servidor (Vercel/PythonAnywhere)
- ✅ No navegador
- ✅ No frontend

**Precisa instalar:**
- ✅ Em cada computador do caixa (onde a impressora está conectada)

---

## 🎯 Resumo

1. Execute `./QUICK_INSTALL.sh` em cada computador do caixa
2. Aguarde a instalação
3. Pronto! Funciona automaticamente depois

**Tempo:** ~5 minutos por computador  
**Manutenção:** Zero (funciona sozinho)

