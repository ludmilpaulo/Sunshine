# 🧪 Guia de Teste - Scanner e Impressora

## 📷 Teste do Scanner

### Método 1: Página de Teste Dedicada
1. Acesse: **http://localhost:3000/test-scanner**
2. Certifique-se de que o status mostra "✅ Ouvindo..."
3. Escaneie um código de barras com seu scanner físico
4. O código deve aparecer na lista "Códigos Escaneados"

### Método 2: Teste Manual (Simulação)
1. Acesse: **http://localhost:3000/test-scanner**
2. Abra o Console do navegador (F12)
3. Digite rapidamente um código de barras (ex: `7898553445613`)
4. Pressione Enter imediatamente após digitar
5. O código deve aparecer na lista

### Método 3: Teste no POS
1. Acesse: **http://localhost:3000/pos**
2. Escaneie um código de barras de um produto existente
3. O produto deve ser adicionado ao carrinho automaticamente

### 🔍 Verificação de Logs
- Abra o Console do navegador (F12 → Console)
- Procure por mensagens começando com `[Barcode]`
- Logs incluem:
  - `[Barcode] Potential scan started` - Scanner detectado
  - `[Barcode] Added char:` - Caracteres sendo capturados
  - `[Barcode] ✅ Valid barcode received:` - Código válido capturado

### ⚠️ Troubleshooting do Scanner
- **Scanner não detecta**: Verifique se está em modo "Keyboard Wedge" (HID)
- **Código aparece duplicado**: Normal, o sistema detecta e ignora duplicatas
- **Não funciona em campos de input**: Clique fora dos campos antes de escanear
- **Scanner muito lento**: Aumente o timeout em `barcodeCapture.ts` (padrão: 200ms)

---

## 🖨️ Teste da Impressora

### Status Atual
⚠️ **O módulo `printer` precisa ser recompilado para Node.js v20**

### Solução Temporária
O Print Bridge pode não iniciar devido a incompatibilidade do módulo nativo. Opções:

#### Opção 1: Usar apenas impressão LAN
1. Configure a impressora em rede (IP)
2. Use modo `LAN` no Print Bridge
3. Não requer módulo USB nativo

#### Opção 2: Recompilar módulo (Recomendado)
```bash
cd print-bridge
npm rebuild printer
# Se falhar, tente:
npm install printer --build-from-source --legacy-peer-deps
```

#### Opção 3: Usar Node.js compatível
O módulo `printer` foi compilado para Node.js v14/v16. Considere usar `nvm`:
```bash
nvm install 16
nvm use 16
cd print-bridge
npm install
npm run dev
```

### Teste de Impressão (quando Print Bridge estiver rodando)

#### 1. Verificar Health
```bash
curl http://localhost:3333/health
# Deve retornar: {"ok":true,"service":"print-bridge"}
```

#### 2. Listar Impressoras
```bash
curl http://localhost:3333/printers
# Retorna lista de impressoras disponíveis
```

#### 3. Testar Impressão
```bash
curl -X POST http://localhost:3333/print \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "LAN",
    "lan": {
      "ip": "192.168.1.100",
      "port": 9100
    },
    "receipt": {
      "shopName": "Sunshine POS",
      "saleNumber": "TEST-001",
      "date": "30/12/2024 10:00",
      "subtotal": "1,000.00",
      "tax": "140.00",
      "total": "1,140.00",
      "items": [{
        "name": "Produto Teste",
        "qty": 1,
        "unitPrice": "1,000.00",
        "total": "1,000.00"
      }]
    },
    "cut": true
  }'
```

---

## ✅ Checklist de Testes

### Scanner
- [ ] Scanner físico conectado e ligado
- [ ] Scanner em modo "Keyboard Wedge" (HID)
- [ ] Página de teste acessível: http://localhost:3000/test-scanner
- [ ] Status mostra "✅ Ouvindo..."
- [ ] Código escaneado aparece na lista
- [ ] Console mostra logs `[Barcode]`
- [ ] Funciona na página POS

### Impressora
- [ ] Print Bridge iniciado (porta 3333)
- [ ] Health check responde: `/health`
- [ ] Lista impressoras: `/printers`
- [ ] Impressora configurada (LAN IP ou USB nome)
- [ ] Teste de impressão envia dados
- [ ] Recibo imprime corretamente

---

## 🚀 Iniciar Serviços

### Frontend (já rodando)
```bash
cd frontend
npm run dev
# http://localhost:3000
```

### Backend (já rodando)
```bash
cd backend
source venv/bin/activate
python manage.py runserver 8000
# http://localhost:8000
```

### Print Bridge
```bash
cd print-bridge
npm run dev
# http://localhost:3333
```

---

## 📝 Notas Importantes

1. **Scanner**: Funciona independente do Print Bridge
2. **Impressora**: Requer Print Bridge rodando
3. **Modo AUTO**: Tenta LAN primeiro, depois USB
4. **Logs**: Sempre verifique o console do navegador para debug
5. **Teste Manual**: Digite rápido (<50ms entre caracteres) para simular scanner

---

## 🆘 Suporte

Se os testes falharem:
1. Verifique logs do console (F12)
2. Verifique logs do Print Bridge: `/tmp/print-bridge.log`
3. Verifique se os serviços estão rodando nas portas corretas
4. Teste com scanner físico primeiro (mais confiável)

