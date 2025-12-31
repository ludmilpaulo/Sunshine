# Como Criar o Produto Azzur Agua de Mesa no PythonAnywhere

O produto "Azzur Agua de Mesa" com código de barras "74576080578" precisa ser criado no banco de dados de produção.

## Opção 1: Usando o Comando Django (Recomendado)

1. Acesse o **Bash Console** no PythonAnywhere
2. Navegue até o diretório do projeto:
   ```bash
   cd ~/Sunshine/backend
   ```
3. Execute o comando para criar o produto:
   ```bash
   python3 manage.py create_azzur_product
   ```

Isso criará o produto "Azzur Agua de Mesa" com:
- Código de barras principal: `745760805778` (12 dígitos - código correto)
- Código de barras alternativo: `74576080578` (11 dígitos - caso o scanner leia incorretamente)
- Nome: "Azzur Agua de Mesa"
- Preço: 100.00 AOA
- Custo: 60.00 AOA
- Estoque inicial: 100 unidades

## Opção 2: Usando o Django Admin

1. Acesse: `https://sunshinebar.pythonanywhere.com/admin`
2. Faça login com suas credenciais de admin
3. Vá em **Shop > Products**
4. Clique em **Add Product**
5. Preencha os campos:
   - **Name**: `Azzur Agua de Mesa`
   - **Barcode**: `745760805778` (12 dígitos - código correto do produto)
   - **SKU**: `AZZUR-001` (opcional)
   - **Price**: `100.00`
   - **Cost**: `60.00`
   - **Tax rate**: `0.00`
   - **Active**: ✓ (marcado)
6. Clique em **Save**
7. Depois, vá em **Shop > Inventories**
8. Clique em **Add Inventory**
9. Selecione o produto "Azzur Agua de Mesa"
10. Defina **Qty on hand**: `100`
11. Clique em **Save**

## Opção 3: Usando a Interface Web (Frontend)

1. Acesse: `https://sunshinebar.vercel.app/products`
2. Faça login como admin
3. Clique em **Adicionar Produto**
4. Escaneie o código de barras `745760805778` ou digite manualmente
5. Preencha os campos:
   - **Nome**: `Azzur Agua de Mesa`
   - **Código de Barras**: `745760805778` (12 dígitos)
   - **Preço**: `100.00`
   - **Custo**: `60.00`
   - **Taxa de Imposto**: `0.00`
   - **Estoque Inicial**: `100`
6. Clique em **Salvar**

## Verificação

Após criar o produto, teste escaneando o código `745760805778` (ou `74576080578` se o scanner ler 11 dígitos) no POS:
- Acesse: `https://sunshinebar.vercel.app/pos`
- Escaneie o código de barras
- O produto deve aparecer no carrinho

## Nota Importante

O código de barras correto do produto é **`745760805778`** (12 dígitos). O comando `create_azzur_product` cria o produto com este código principal e também cria um produto com o código `74576080578` (11 dígitos) como fallback, caso o scanner leia incorretamente.

## Testando a Busca

Após criar o produto, você pode testar a busca localmente (se tiver o banco de dados local configurado):

```bash
cd ~/Sunshine/backend
python manage.py shell < test_barcode_search.py
```

Isso mostrará todas as estratégias de busca e se o produto é encontrado com diferentes códigos.

