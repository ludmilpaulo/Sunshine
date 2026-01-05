# Print Bridge não inicia automaticamente? - Solução

## 🔍 Problema

Você vê a mensagem "Para imprimir, inicie o Print Bridge nesta máquina" mesmo depois de instalar.

## ✅ Soluções por Sistema Operacional

### 🍎 macOS

#### Verificar se serviço está instalado:

```bash
launchctl list | grep printbridge
```

#### Se não aparecer nada, instalar novamente:

```bash
cd print-bridge
./install-service-mac.sh
```

#### Se aparecer mas não está rodando, iniciar:

```bash
launchctl start com.sunshine.printbridge
```

#### Verificar status:

```bash
# Ver se está rodando
curl http://localhost:3333/health

# Ver logs
tail -f print-bridge.log
```

#### Recarregar serviço:

```bash
launchctl unload ~/Library/LaunchAgents/com.sunshine.printbridge.plist
launchctl load ~/Library/LaunchAgents/com.sunshine.printbridge.plist
launchctl start com.sunshine.printbridge
```

---

### 🪟 Windows

#### Verificar se serviço está instalado:

```powershell
nssm status PrintBridge
```

#### Se não existe, instalar:

```powershell
cd print-bridge
.\install-service-windows.bat
```

#### Se existe mas não está rodando, iniciar:

```powershell
nssm start PrintBridge
```

#### Verificar status:

```powershell
# Ver se está rodando
curl http://localhost:3333/health

# Ver logs
type print-bridge.log
```

---

### 🐧 Linux

#### Verificar se serviço está instalado:

```bash
sudo systemctl status print-bridge
```

#### Se não existe, instalar:

```bash
cd print-bridge
sudo ./install-service-linux.sh
```

#### Se existe mas não está rodando, iniciar:

```bash
sudo systemctl start print-bridge
sudo systemctl enable print-bridge  # Garantir auto-start
```

#### Verificar status:

```bash
# Ver se está rodando
curl http://localhost:3333/health

# Ver logs
sudo journalctl -u print-bridge -f
```

---

## 🚀 Solução Rápida: Reinstalar

### Opção 1: Script Rápido (Recomendado)

```bash
cd print-bridge
./QUICK_INSTALL.sh
```

Este script:
- ✅ Verifica Node.js
- ✅ Instala dependências
- ✅ Compila
- ✅ Cria .env se necessário
- ✅ Instala como serviço automaticamente
- ✅ Testa se está rodando

### Opção 2: Instalação Manual

```bash
cd print-bridge

# 1. Instalar dependências
npm install

# 2. Compilar
npm run build

# 3. Instalar como serviço (escolha o script do seu OS)
./install-service-mac.sh      # macOS
sudo ./install-service-linux.sh  # Linux
.\install-service-windows.bat   # Windows
```

---

## 🔧 Problemas Comuns

### Problema 1: Serviço não inicia após reiniciar computador

**Solução:**
- Verificar se serviço está habilitado para iniciar automaticamente
- **macOS**: Verificar se `RunAtLoad` está `true` no plist
- **Linux**: Verificar se serviço está habilitado: `sudo systemctl enable print-bridge`
- **Windows**: Verificar se serviço está configurado como "Automático"

### Problema 2: Erro ao compilar

**Solução:**
```bash
# Limpar e reinstalar
rm -rf node_modules dist
npm install
npm run build
```

### Problema 3: Porta 3333 já em uso

**Solução:**
```bash
# Encontrar processo usando a porta
# macOS/Linux:
lsof -i :3333
kill -9 <PID>

# Windows:
netstat -ano | findstr :3333
taskkill /PID <PID> /F
```

### Problema 4: Permissões

**Solução:**
- **macOS/Linux**: Garantir que usuário tem permissões
- **Linux**: Verificar usuário do serviço: `sudo systemctl edit print-bridge`

---

## ✅ Verificação Final

Após instalar, teste:

```bash
# 1. Verificar serviço está rodando
curl http://localhost:3333/health
# Deve retornar: {"ok":true,"service":"print-bridge"}

# 2. Listar impressoras
curl http://localhost:3333/printers

# 3. Reiniciar computador e verificar se inicia automaticamente
```

---

## 📝 Checklist de Instalação

- [ ] Node.js instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Print Bridge compilado (`npm run build`)
- [ ] Serviço instalado (script de instalação executado)
- [ ] Serviço rodando (`curl http://localhost:3333/health`)
- [ ] Serviço inicia automaticamente (testar reiniciando computador)

---

## 🆘 Ainda não funciona?

1. **Verificar logs:**
   - macOS: `tail -f print-bridge.log`
   - Linux: `sudo journalctl -u print-bridge -f`
   - Windows: `type print-bridge-error.log`

2. **Testar manualmente:**
   ```bash
   cd print-bridge
   npm start
   ```
   Se funcionar manualmente, o problema é com o serviço. Se não funcionar, o problema é com a configuração.

3. **Verificar .env:**
   ```bash
   cat .env
   ```
   Deve ter pelo menos:
   ```
   PORT=3333
   CORS_ORIGIN_ALLOW_ALL=true
   ```

4. **Reinstalar do zero:**
   ```bash
   cd print-bridge
   rm -rf node_modules dist
   ./QUICK_INSTALL.sh
   ```

