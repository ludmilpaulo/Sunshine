# URLs de Produção - Sunshine POS

## URLs Oficiais

### Backend (API)
- **URL**: `https://sunshinebar.pythonanywhere.com`
- **API Base**: `https://sunshinebar.pythonanywhere.com/api`
- **Admin**: `https://sunshinebar.pythonanywhere.com/admin`
- **Plataforma**: PythonAnywhere

### Frontend (Web App)
- **URL**: `https://sunshinebar.vercel.app`
- **Plataforma**: Vercel

## Configurações Necessárias

### Backend (PythonAnywhere)

**Variáveis de Ambiente (`.env`)**:
```env
ALLOWED_HOSTS=sunshinebar.pythonanywhere.com,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://sunshinebar.vercel.app,http://localhost:3000
DB_ENGINE=mysql
DB_NAME=sunshinebar$default
DB_USER=sunshinebar
DB_PASSWORD=maitland@2026
DB_HOST=sunshinebar.mysql.pythonanywhere-services.com
DB_PORT=3306
```

### Frontend (Vercel)

**Variáveis de Ambiente (Vercel Dashboard)**:
```
NEXT_PUBLIC_API_BASE_URL=https://sunshinebar.pythonanywhere.com/api
NEXT_PUBLIC_PRINT_BRIDGE_URL=http://SEU_IP_LOCAL:3333
```

## Verificação

### Backend
- ✅ URL: `https://sunshinebar.pythonanywhere.com`
- ✅ CORS configurado para aceitar `https://sunshinebar.vercel.app`
- ✅ Database: MySQL no PythonAnywhere

### Frontend
- ✅ URL: `https://sunshinebar.vercel.app`
- ✅ API Base: `https://sunshinebar.pythonanywhere.com/api`
- ✅ Print Bridge: Configurável via variável de ambiente

## Links Úteis

- **Frontend Live**: https://sunshinebar.vercel.app
- **Backend API**: https://sunshinebar.pythonanywhere.com/api
- **Backend Admin**: https://sunshinebar.pythonanywhere.com/admin
- **GitHub**: https://github.com/ludmilpaulo/Sunshine

## Credenciais Padrão

- **Superuser**: `sunshinebar`
- **Password**: `Maitland@2025`

## Notas

- As URLs estão hardcoded nos arquivos de configuração como fallback
- Variáveis de ambiente podem sobrescrever os valores padrão
- Print Bridge deve estar rodando localmente ou em servidor acessível

