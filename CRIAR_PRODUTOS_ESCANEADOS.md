# Como Criar os Produtos que Estão Sendo Escaneados

Baseado nos códigos de barras que estão sendo escaneados, você precisa criar os seguintes produtos no banco de dados:

## Produtos Detectados

### 1. Produto com código: `5491472` (7 dígitos)
- **Status**: Código completo capturado ✅
- **Ação**: Criar produto com este código

### 2. Produto com código: `74576080578` (11 dígitos)
- **Status**: Código capturado, mas pode estar incompleto ⚠️
- **Código esperado**: `745760805778` (12 dígitos - Azzur Agua de Mesa)
- **Ação**: Criar produto com ambos os códigos (11 e 12 dígitos) para garantir compatibilidade

## Opção 1: Criar via Django Admin (Recomendado)

1. Acesse: `https://sunshinebar.pythonanywhere.com/admin`
2. Faça login como admin
3. Vá em **Shop > Products > Add Product**

### Produto 1: Código 5491472
- **Name**: `Produto 5491472` (ou o nome real do produto)
- **Barcode**: `5491472`
- **Price**: `100.00` (ajuste conforme necessário)
- **Cost**: `60.00` (ajuste conforme necessário)
- **Tax rate**: `0.00`
- **Active**: ✓
- Clique em **Save**
- Depois, vá em **Shop > Inventories > Add Inventory**
- Selecione o produto e defina **Qty on hand**: `100`

### Produto 2: Azzur Agua de Mesa
- **Name**: `Azzur Agua de Mesa`
- **Barcode**: `745760805778` (12 dígitos - código correto)
- **Price**: `100.00`
- **Cost**: `60.00`
- **Tax rate**: `0.00`
- **Active**: ✓
- Clique em **Save**
- Depois, vá em **Shop > Inventories > Add Inventory**
- Selecione o produto e defina **Qty on hand**: `100`

**IMPORTANTE**: Se o scanner continuar lendo apenas 11 dígitos (`74576080578`), crie também um produto com esse código para garantir compatibilidade.

## Opção 2: Usar o Comando Django

Execute no **Bash Console** do PythonAnywhere:

```bash
cd ~/Sunshine/backend
python3 manage.py create_azzur_product
```

Isso criará o produto Azzur com ambos os códigos (11 e 12 dígitos).

Para o produto `5491472`, você precisará criá-lo manualmente via admin ou frontend.

## Opção 3: Criar via Frontend

1. Acesse: `https://sunshinebar.vercel.app/products`
2. Faça login como admin
3. Clique em **Adicionar Produto**
4. Escaneie ou digite o código de barras
5. Preencha os dados e salve

## Verificação

Após criar os produtos, teste escaneando novamente:
- `5491472` deve encontrar o produto
- `74576080578` ou `745760805778` deve encontrar o produto Azzur

## Nota sobre o Código de 11 vs 12 Dígitos

Se o scanner continuar lendo apenas 11 dígitos (`74576080578`) em vez de 12 (`745760805778`), isso pode indicar:
1. O scanner está configurado para ler apenas 11 dígitos
2. O último dígito está sendo perdido na transmissão
3. O produto físico tem um código diferente

**Solução**: Crie o produto com o código que o scanner está lendo (`74576080578`) para garantir que funcione. Se necessário, você pode criar dois produtos com códigos diferentes apontando para o mesmo item físico.

