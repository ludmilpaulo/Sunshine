# 🚀 Guia Passo a Passo - Deploy Completo

## Parte 1: Configurar Backend no PythonAnywhere

### Passo 1: Acessar o Console do PythonAnywhere

1. Acesse https://www.pythonanywhere.com
2. Faça login na sua conta
3. Clique em **Consoles** no menu superior
4. Clique em **Bash** para abrir um terminal

### Passo 2: Navegar até o Diretório do Projeto

```bash
cd ~/Sunshine/backend
# ou o caminho onde seu projeto está
pwd  # Verifica o caminho atual
ls   # Lista os arquivos
```

### Passo 3: Criar o Arquivo .env

```bash
# Criar o arquivo .env
nano .env
```

**Cole o seguinte conteúdo no arquivo:**

```env
# Django Settings
SECRET_KEY=django-insecure-change-me-to-a-random-secret-key-here
DEBUG=False
ALLOWED_HOSTS=sunshinebar.pythonanywhere.com

# Database Configuration - MySQL PythonAnywhere
DB_ENGINE=mysql
DB_NAME=sunshinebar$default
DB_USER=sunshinebar
DB_PASSWORD=maitland@2026
DB_HOST=sunshinebar.mysql.pythonanywhere-services.com
DB_PORT=3306

# CORS Settings - Adicione seu domínio Vercel aqui
CORS_ALLOWED_ORIGINS=https://sunshine-pos.vercel.app,https://seu-dominio.vercel.app
CORS_ALLOW_ALL_ORIGINS=False

# Frontend URL
FRONTEND_URL=https://sunshine-pos.vercel.app

# Email Settings
DEFAULT_FROM_EMAIL=noreply@sunshinebar.com
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

**Para salvar no nano:**
- Pressione `Ctrl + O` (salvar)
- Pressione `Enter` (confirmar)
- Pressione `Ctrl + X` (sair)

### Passo 4: Instalar Dependências

```bash
# Instalar todas as dependências
pip3.10 install --user -r requirements.txt
```

**Se mysqlclient falhar, use PyMySQL:**

```bash
# Instalar PyMySQL como alternativa
pip3.10 install --user PyMySQL
```

**Depois, edite o arquivo settings.py:**

```bash
nano config/settings.py
```

**Adicione no início do arquivo (logo após os imports):**

```python
# Adicione isso logo após os imports no topo do arquivo
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass
```

### Passo 5: Executar Migrations

```bash
python3.10 manage.py migrate
```

### Passo 6: Criar Usuários de Teste

```bash
python3.10 manage.py create_test_users
```

### Passo 7: Coletar Arquivos Estáticos

```bash
python3.10 manage.py collectstatic --noinput
```

### Passo 8: Configurar WSGI

1. No dashboard do PythonAnywhere, clique em **Web**
2. Clique em **WSGI configuration file**
3. Edite o arquivo e substitua o conteúdo por:

```python
import os
import sys

# Adicione o caminho do seu projeto
path = '/home/sunshinebar/Sunshine/backend'
if path not in sys.path:
    sys.path.insert(0, path)

# Configure o Django
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

**⚠️ IMPORTANTE:** Substitua `/home/sunshinebar/Sunshine/backend` pelo caminho real do seu projeto.

Para descobrir o caminho exato:
```bash
pwd  # No console do PythonAnywhere, dentro da pasta backend
```

### Passo 9: Configurar Static Files

1. No dashboard do PythonAnywhere, vá em **Web**
2. Role até **Static files**
3. Adicione:
   - **URL**: `/static/`
   - **Directory**: `/home/sunshinebar/Sunshine/backend/staticfiles`

**⚠️ IMPORTANTE:** Substitua pelo caminho real do seu projeto.

### Passo 10: Recarregar a Aplicação

1. No dashboard do PythonAnywhere, vá em **Web**
2. Clique no botão verde **Reload** para reiniciar a aplicação

### Passo 11: Testar o Backend

No console do PythonAnywhere:

```bash
curl https://sunshinebar.pythonanywhere.com/api/auth/login/ \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"test1234"}'
```

Se retornar um token, está funcionando! ✅

---

## Parte 2: Configurar Frontend no Vercel

### Passo 1: Acessar o Dashboard do Vercel

1. Acesse https://vercel.com
2. Faça login na sua conta
3. Selecione seu projeto **Sunshine** (ou crie um novo conectando ao GitHub)

### Passo 2: Configurar Variáveis de Ambiente

1. No dashboard do projeto, clique em **Settings**
2. No menu lateral, clique em **Environment Variables**
3. Clique em **Add New**

**Adicione as seguintes variáveis:**

#### Variável 1:
- **Name**: `NEXT_PUBLIC_API_BASE_URL`
- **Value**: `https://sunshinebar.pythonanywhere.com/api`
- **Environment**: Selecione todas (Production, Preview, Development)
- Clique em **Save**

#### Variável 2 (Opcional - se usar Print Bridge):
- **Name**: `NEXT_PUBLIC_PRINT_BRIDGE_URL`
- **Value**: `http://localhost:3333` (ou a URL do seu Print Bridge)
- **Environment**: Development (apenas para desenvolvimento local)
- Clique em **Save**

### Passo 3: Verificar Configuração do Projeto

1. No dashboard, clique em **Settings**
2. Clique em **General**
3. Verifique:
   - **Root Directory**: `frontend` ✅
   - **Framework Preset**: `Next.js` ✅
   - **Build Command**: `yarn build` (ou deixe vazio para auto-detecção)
   - **Output Directory**: `.next` (ou deixe vazio para auto-detecção)
   - **Install Command**: `yarn install` (ou deixe vazio para auto-detecção)

### Passo 4: Fazer Deploy

1. Vá em **Deployments**
2. Se já houver um deployment, clique nos **3 pontos** → **Redeploy**
3. Ou faça um novo commit no GitHub que o Vercel detectará automaticamente

### Passo 5: Verificar Deploy

1. Após o deploy, clique no deployment
2. Verifique os logs para garantir que não há erros
3. Acesse a URL do seu projeto (ex: `https://sunshine-pos.vercel.app`)

---

## Parte 3: Testar a Aplicação Completa

### Teste 1: Login

1. Acesse seu site no Vercel
2. Tente fazer login com:
   - **Admin**: `admin / test1234`
   - **Manager**: `manager / test1234`
   - **Staff**: `staff / test1234`

### Teste 2: Criar Produto (Admin)

1. Faça login como admin
2. Vá em **Produtos**
3. Clique em **Adicionar Produto**
4. Preencha os dados e salve

### Testo 3: Fazer uma Venda (POS)

1. Faça login como staff ou admin
2. Vá em **Ponto de Venda**
3. Escaneie ou adicione produtos
4. Finalize a venda

---

## 🔧 Troubleshooting

### Erro: "ModuleNotFoundError: No module named 'mysqlclient'"

**Solução:**
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

### Erro: "Access denied for user"

**Verifique:**
- Username correto: `sunshinebar`
- Password correto: `maitland@2026`
- Database name: `sunshinebar$default` (com o `$`)

### Erro CORS no Frontend

**Solução:**
1. No PythonAnywhere, edite o `.env`:
   ```
   CORS_ALLOWED_ORIGINS=https://seu-dominio-vercel.vercel.app
   ```
2. Recarregue a aplicação no PythonAnywhere

### Erro 500 no PythonAnywhere

**Verifique os logs:**
1. No dashboard do PythonAnywhere, vá em **Web**
2. Clique em **Error log**
3. Leia as mensagens de erro para identificar o problema

### Frontend não conecta ao Backend

**Verifique:**
1. Variável `NEXT_PUBLIC_API_BASE_URL` está configurada no Vercel
2. URL está correta: `https://sunshinebar.pythonanywhere.com/api`
3. Backend está acessível (teste com curl)
4. CORS está configurado corretamente

---

## ✅ Checklist Final

### PythonAnywhere:
- [ ] Arquivo `.env` criado e configurado
- [ ] Dependências instaladas
- [ ] Migrations executadas
- [ ] Usuários de teste criados
- [ ] Static files coletados
- [ ] WSGI configurado
- [ ] Static files configurados no dashboard
- [ ] Aplicação recarregada
- [ ] Teste de login funcionando

### Vercel:
- [ ] Variável `NEXT_PUBLIC_API_BASE_URL` configurada
- [ ] Root Directory configurado como `frontend`
- [ ] Deploy realizado com sucesso
- [ ] Site acessível
- [ ] Login funcionando

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs de erro no PythonAnywhere
2. Verifique os logs de build no Vercel
3. Teste o backend diretamente com curl
4. Verifique se todas as variáveis de ambiente estão corretas

