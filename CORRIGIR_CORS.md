# Como Corrigir o Erro de CORS no PythonAnywhere

O erro de CORS ocorre porque o backend não está permitindo requisições do domínio `https://sunshinebar.vercel.app`.

## Problema Identificado

```
Access to XMLHttpRequest at 'https://sunshinebar.pythonanywhere.com/api/auth/login/' 
from origin 'https://sunshinebar.vercel.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solução

### 1. Acesse o Console do PythonAnywhere

1. Faça login no PythonAnywhere: https://www.pythonanywhere.com
2. Vá para a aba **Consoles**
3. Clique em **Bash** para abrir um console

### 2. Edite o arquivo `.env`

```bash
cd ~/Sunshine/backend
nano .env
```

### 3. Atualize a variável `CORS_ALLOWED_ORIGINS`

Encontre a linha:
```bash
CORS_ALLOWED_ORIGINS=https://sunshine-pos.vercel.app,http://localhost:3000
```

E altere para:
```bash
CORS_ALLOWED_ORIGINS=https://sunshine-pos.vercel.app,https://sunshinebar.vercel.app,http://localhost:3000
```

### 4. Salve o arquivo

- Pressione `Ctrl + X` para sair
- Pressione `Y` para confirmar
- Pressione `Enter` para salvar

### 5. Recarregue a aplicação

1. Vá para a aba **Web** no PythonAnywhere
2. Clique no botão **Reload** para recarregar a aplicação

### 6. Teste novamente

Agora você pode testar o login em https://sunshinebar.vercel.app/login

## Verificação

Para verificar se está funcionando, você pode testar com curl:

```bash
curl -X POST https://sunshinebar.pythonanywhere.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -H "Origin: https://sunshinebar.vercel.app" \
  -d '{"username":"sunshinebar","password":"Maitland@2025"}'
```

Se funcionar, você verá os tokens JWT na resposta.

## Notas Importantes

- O domínio deve estar exatamente como aparece na URL (com https://)
- Não adicione barra no final (não use `https://sunshinebar.vercel.app/`)
- Após alterar o `.env`, sempre recarregue a aplicação no PythonAnywhere
- Se ainda não funcionar, verifique se há espaços extras na lista de origens

