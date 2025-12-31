# ⚡ Comandos Rápidos - Copy & Paste

## PythonAnywhere - Configuração Rápida

### 1. Criar .env
```bash
cd ~/Sunshine/backend
cat > .env << 'EOF'
SECRET_KEY=django-insecure-change-me-to-a-random-secret-key-here
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

DEFAULT_FROM_EMAIL=noreply@sunshinebar.com
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EOF
```

### 2. Instalar Dependências
```bash
pip3.10 install --user -r requirements.txt
```

### 3. Se mysqlclient falhar, use PyMySQL:
```bash
pip3.10 install --user PyMySQL
```

E adicione no início de `config/settings.py`:
```python
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass
```

### 4. Migrations e Setup
```bash
python3.10 manage.py migrate
python3.10 manage.py create_test_users
python3.10 manage.py collectstatic --noinput
```

### 5. Testar Backend
```bash
curl https://sunshinebar.pythonanywhere.com/api/auth/login/ \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"test1234"}'
```

---

## Vercel - Configuração Rápida

### Variáveis de Ambiente

No dashboard do Vercel → Settings → Environment Variables:

**Adicionar:**
- **Name**: `NEXT_PUBLIC_API_BASE_URL`
- **Value**: `https://sunshinebar.pythonanywhere.com/api`
- **Environment**: All (Production, Preview, Development)

---

## Verificar Caminho do Projeto no PythonAnywhere

```bash
cd ~/Sunshine/backend
pwd
# Use o resultado para configurar o WSGI
```

