# 🖨️ Configuração de Impressora LAN - Resumo

## ⚡ Início Rápido

### 1. Descubra o IP da sua impressora
- Menu da impressora → Configurações de Rede
- Ou verifique no roteador (dispositivos conectados)

### 2. Inicie o Print Bridge
```bash
cd print-bridge
./start-lan.sh SEU_IP_AQUI 9100
```

Exemplo:
```bash
./start-lan.sh 192.168.1.100 9100
```

### 3. Teste
```bash
# Verificar se está rodando
curl http://localhost:3333/health

# Listar impressoras
curl http://localhost:3333/printers
```

## 📁 Arquivos Criados

- `start-lan.sh` - Script para iniciar com configuração LAN
- `test-lan-connection.sh` - Script para testar conexão
- `QUICK_START_LAN.md` - Guia rápido
- `CONFIGURAR_IMPRESSORA_LAN.md` - Guia completo
- `.env.example` - Exemplo de configuração

## ✅ Pronto!

O frontend já está configurado para usar o Print Bridge. Quando você finalizar uma venda no POS, o recibo será impresso automaticamente na impressora LAN configurada.

## 🆘 Problemas?

1. **Print Bridge não inicia**: Verifique se porta 3333 está livre
2. **Impressão não funciona**: Execute `./test-lan-connection.sh IP 9100`
3. **Ver logs**: O Print Bridge mostra logs no terminal

