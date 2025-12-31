# Configuração PythonAnywhere

## Configuração do Backend

### 1. Variáveis de Ambiente

Crie um arquivo `.env` no diretório `backend/` com as seguintes configurações:

```env
# Django Settings
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=False
ALLOWED_HOSTS=sunshinebar.pythonanywhere.com

# Database Configuration - MySQL PythonAnywhere
DB_ENGINE=mysql
DB_NAME=sunshinebar$default
DB_USER=sunshinebar
DB_PASSWORD=maitland@2026
DB_HOST=sunshinebar.mysql.pythonanywhere-services.com
DB_PORT=3306

# CORS Settings
CORS_ALLOWED_ORIGINS=https://sunshine-pos.vercel.app,https://your-vercel-domain.vercel.app
CORS_ALLOW_ALL_ORIGINS=False

# Frontend URL
FRONTEND_URL=https://sunshine-pos.vercel.app

# Email Settings
DEFAULT_FROM_EMAIL=noreply@sunshinebar.com
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### 2. Instalar Dependências

No console do PythonAnywhere:

```bash
cd ~/Sunshine/backend
pip3.10 install --user -r requirements.txt
```

**Nota:** Se `mysqlclient` falhar, tente:
```bash
pip3.10 install --user mysqlclient==2.2.0
```

Ou use PyMySQL como alternativa:
```bash
pip3.10 install --user PyMySQL
```

E adicione no início do `settings.py`:
```python
import pymysql
pymysql.install_as_MySQLdb()
```

### 3. Executar Migrations

```bash
cd ~/Sunshine/backend
python3.10 manage.py migrate
```

### 4. Criar Superusuário

```bash
python3.10 manage.py createsuperuser
```

### 5. Coletar Arquivos Estáticos

```bash
python3.10 manage.py collectstatic --noinput
```

### 6. Configurar WSGI

No arquivo WSGI do PythonAnywhere (`/var/www/sunshinebar_pythonanywhere_com_wsgi.py` ou similar):

```python
import os
import sys

# Adicione o caminho do projeto
path = '/home/sunshinebar/Sunshine/backend'
if path not in sys.path:
    sys.path.insert(0, path)

# Configure o Django
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

### 7. Configurar Static Files

No arquivo de configuração do PythonAnywhere, adicione:

```
Static files URL: /static/
Static files directory: /home/sunshinebar/Sunshine/backend/staticfiles
```

## Configuração do Frontend (Vercel)

### Variáveis de Ambiente

No dashboard do Vercel, adicione:

- `NEXT_PUBLIC_API_BASE_URL` = `https://sunshinebar.pythonanywhere.com/api`

## Testando a Conexão

### Testar Backend

```bash
curl https://sunshinebar.pythonanywhere.com/api/auth/login/ \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"test1234"}'
```

### Testar Database

No console do PythonAnywhere:

```bash
cd ~/Sunshine/backend
python3.10 manage.py shell
```

```python
from django.db import connection
cursor = connection.cursor()
cursor.execute("SELECT 1")
cursor.fetchone()
```

## Troubleshooting

### Erro: "No module named 'mysqlclient'"

Instale o mysqlclient ou use PyMySQL:
```bash
pip3.10 install --user PyMySQL
```

E adicione no início de `settings.py`:
```python
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass
```

### Erro: "Access denied for user"

Verifique:
- Username correto: `sunshinebar`
- Password correto: `maitland@2026`
- Database name: `sunshinebar$default` ou `sunshinebar$sunshinebar`

### Erro CORS

Adicione o domínio do Vercel em `CORS_ALLOWED_ORIGINS` no `.env`:
```
CORS_ALLOWED_ORIGINS=https://sunshine-pos.vercel.app,https://your-domain.vercel.app
```

### Erro 500 no PythonAnywhere

Verifique os logs em:
- **Error log** no dashboard do PythonAnywhere
- Console do PythonAnywhere: `tail -f ~/logs/sunshinebar.pythonanywhere.com.error.log`

