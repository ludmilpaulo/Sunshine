# Configuração de Produção - Sunshine POS

## URLs Configuradas

- **Backend API**: `https://sunshinebar.pythonanywhere.com/api`
- **Frontend**: `https://sunshine-pos.vercel.app` (ou seu domínio Vercel)
- **Database**: MySQL no PythonAnywhere

## Configuração do Backend (PythonAnywhere)

### 1. Criar arquivo `.env` em `backend/`

Copie o arquivo `backend/env.example` para `.env` e configure:

```env
SECRET_KEY=sua-chave-secreta-aqui
DEBUG=False
ALLOWED_HOSTS=sunshinebar.pythonanywhere.com

DB_ENGINE=mysql
DB_NAME=sunshinebar$default
DB_USER=sunshinebar
DB_PASSWORD=maitland@2026
DB_HOST=sunshinebar.mysql.pythonanywhere-services.com
DB_PORT=3306

CORS_ALLOWED_ORIGINS=https://sunshine-pos.vercel.app
CORS_ALLOW_ALL_ORIGINS=False

FRONTEND_URL=https://sunshine-pos.vercel.app
```

### 2. Instalar Dependências

```bash
cd ~/Sunshine/backend
pip3.10 install --user -r requirements.txt
```

**Se mysqlclient falhar:**
```bash
pip3.10 install --user PyMySQL
```

E adicione no início de `backend/config/settings.py`:
```python
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass
```

### 3. Executar Migrations

```bash
python3.10 manage.py migrate
```

### 4. Criar Usuários de Teste

```bash
python3.10 manage.py create_test_users
```

### 5. Coletar Static Files

```bash
python3.10 manage.py collectstatic --noinput
```

## Configuração do Frontend (Vercel)

### Variáveis de Ambiente no Vercel

No dashboard do Vercel, vá em **Settings** → **Environment Variables** e adicione:

```
NEXT_PUBLIC_API_BASE_URL = https://sunshinebar.pythonanywhere.com/api
```

## Testando

### Testar Backend

```bash
curl https://sunshinebar.pythonanywhere.com/api/auth/login/ \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"test1234"}'
```

### Testar Frontend

Acesse seu domínio Vercel e faça login com:
- **Admin**: `admin / test1234`
- **Manager**: `manager / test1234`
- **Staff**: `staff / test1234`

## Checklist de Deploy

- [ ] Backend `.env` configurado com MySQL
- [ ] Dependências instaladas no PythonAnywhere
- [ ] Migrations executadas
- [ ] Static files coletados
- [ ] WSGI configurado no PythonAnywhere
- [ ] CORS configurado para domínio Vercel
- [ ] Variável `NEXT_PUBLIC_API_BASE_URL` configurada no Vercel
- [ ] Teste de login funcionando
- [ ] Teste de criação de produto funcionando
- [ ] Teste de checkout funcionando

