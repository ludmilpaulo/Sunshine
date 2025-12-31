# Configuração do Vercel

## Problema Resolvido
O erro "No Output Directory named 'public' found" foi corrigido configurando o Vercel para usar o diretório correto do Next.js.

## Configuração Atual

O arquivo `vercel.json` na raiz do projeto está configurado assim:

```json
{
  "buildCommand": "yarn build",
  "outputDirectory": ".next",
  "installCommand": "yarn install",
  "framework": "nextjs"
}
```

**Importante:** 
- A propriedade `rootDirectory` deve ser configurada no dashboard do Vercel (Settings → General → Root Directory) como `frontend`
- Como o `rootDirectory` está configurado no dashboard, os comandos no `vercel.json` são executados automaticamente dentro da pasta `frontend`, então não precisam do `cd frontend`

## Configuração no Vercel Dashboard

Se ainda houver problemas, configure manualmente no Vercel Dashboard:

1. Acesse seu projeto no Vercel
2. Vá em **Settings** → **General**
3. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `yarn build` (ou `npm run build`)
   - **Output Directory**: `.next` (deixe vazio se usar detecção automática)
   - **Install Command**: `yarn install` (ou `npm install`)

## Framework Detection

O Vercel deve detectar automaticamente que é um projeto Next.js. Se não detectar:

1. Vá em **Settings** → **General**
2. Em **Framework Preset**, selecione **Next.js**

## Variáveis de Ambiente

Certifique-se de configurar as variáveis de ambiente no Vercel:

1. Vá em **Settings** → **Environment Variables**
2. Adicione:
   - `NEXT_PUBLIC_API_BASE_URL` - URL da sua API backend
   - `NEXT_PUBLIC_PRINT_BRIDGE_URL` - URL do Print Bridge (opcional)

## Notas Importantes

- O Next.js 13+ (App Router) usa `.next` como output directory, não `public`
- O Vercel detecta automaticamente projetos Next.js
- O `rootDirectory` deve apontar para a pasta `frontend` onde está o `package.json`
- O build command já está configurado para rodar dentro da pasta `frontend`

## Troubleshooting

Se ainda houver erros:

1. Verifique se o `package.json` está na pasta `frontend`
2. Verifique se o `next.config.js` está na pasta `frontend`
3. Verifique os logs de build no Vercel para mais detalhes
4. Certifique-se de que todas as dependências estão no `package.json`

