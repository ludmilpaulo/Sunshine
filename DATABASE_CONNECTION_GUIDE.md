# Guia de Conexão ao Banco de Dados de Produção

Este guia explica como conectar o Django backend ao banco de dados MySQL de produção no PythonAnywhere.

## 📋 Informações do Banco de Dados

**Credenciais do Banco de Dados:**
- **Host:** `sunshinebar.mysql.pythonanywhere-services.com`
- **Database:** `sunshinebar`
- **Username:** `sunshinebar`
- **Password:** `Maitland@2025`
- **Port:** `3306`

## 🔧 Configuração no PythonAnywhere

### Passo 1: Acessar o PythonAnywhere

1. Acesse https://www.pythonanywhere.com
2. Faça login com suas credenciais
3. Vá para o **Dashboard**

### Passo 2: Criar/Editar o Arquivo `.env`

1. No Dashboard, clique em **Files**
2. Navegue até a pasta do seu projeto Django (geralmente `/home/sunshinebar/mysite/` ou similar)
3. Procure pelo arquivo `.env` ou crie um novo

### Passo 3: Configurar Variáveis de Ambiente

Crie ou edite o arquivo `.env` com o seguinte conteúdo:

```env
# Django Settings
SECRET_KEY=sua-chave-secreta-aqui-altere-em-producao
DEBUG=False
ALLOWED_HOSTS=sunshinebar.pythonanywhere.com,localhost,127.0.0.1

# Database Configuration - MySQL PythonAnywhere
DB_ENGINE=mysql
DB_NAME=sunshinebar
DB_USER=sunshinebar
DB_PASSWORD=Maitland@2025
DB_HOST=sunshinebar.mysql.pythonanywhere-services.com
DB_PORT=3306

# CORS Settings
CORS_ALLOWED_ORIGINS=https://sunshinebar.vercel.app,http://localhost:3000
CORS_ALLOW_ALL_ORIGINS=False

# Frontend URL
FRONTEND_URL=https://sunshinebar.vercel.app

# Email Settings
DEFAULT_FROM_EMAIL=noreply@sunshinebar.com
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### Passo 4: Verificar Instalação do mysqlclient

O Django precisa do `mysqlclient` para conectar ao MySQL. Verifique se está instalado:

1. Abra um **Bash console** no PythonAnywhere
2. Execute:
```bash
pip3.10 install --user mysqlclient
```

Ou se já estiver no ambiente virtual:
```bash
source /home/sunshinebar/mysite/venv/bin/activate
pip install mysqlclient
```

### Passo 5: Testar a Conexão

1. No **Bash console**, navegue até a pasta do projeto:
```bash
cd /home/sunshinebar/mysite
```

2. Ative o ambiente virtual (se usar):
```bash
source venv/bin/activate
```

3. Teste a conexão com o Django shell:
```bash
python manage.py shell
```

4. No shell do Django, teste a conexão:
```python
from django.db import connection
cursor = connection.cursor()
cursor.execute("SELECT 1")
result = cursor.fetchone()
print("✅ Conexão bem-sucedida!" if result else "❌ Erro na conexão")
exit()
```

### Passo 6: Executar Migrações

Se a conexão funcionar, execute as migrações:

```bash
python manage.py migrate
```

### Passo 7: Reiniciar a Aplicação Web

1. No Dashboard, vá para **Web**
2. Clique em **Reload** para reiniciar a aplicação
3. Verifique os logs para garantir que não há erros

## 🔍 Verificação da Conexão

### Verificar se o Banco de Dados está Acessível

No **Bash console** do PythonAnywhere:

```bash
mysql -h sunshinebar.mysql.pythonanywhere-services.com -u sunshinebar -p'Maitland@2025' sunshinebar -e "SELECT 1;"
```

Se retornar `1`, a conexão está funcionando!

### Verificar Tabelas no Banco

```bash
mysql -h sunshinebar.mysql.pythonanywhere-services.com -u sunshinebar -p'Maitland@2025' sunshinebar -e "SHOW TABLES;"
```

## 🐛 Solução de Problemas

### Erro: "Can't connect to MySQL server"

**Causa:** O host do banco de dados pode estar incorreto ou o banco não está acessível.

**Solução:**
1. Verifique se o host está correto: `sunshinebar.mysql.pythonanywhere-services.com`
2. Certifique-se de que está usando o host correto (não `localhost`)
3. Verifique se o banco de dados MySQL foi criado no PythonAnywhere

### Erro: "Access denied for user"

**Causa:** Credenciais incorretas.

**Solução:**
1. Verifique o username: `sunshinebar`
2. Verifique a senha: `Maitland@2025`
3. Certifique-se de que não há espaços extras no arquivo `.env`

### Erro: "Unknown database"

**Causa:** O banco de dados não existe ou o nome está incorreto.

**Solução:**
1. Verifique o nome do banco: `sunshinebar`
2. No PythonAnywhere, vá para **Databases** e verifique se o banco existe
3. Se não existir, crie um novo banco MySQL

### Erro: "No module named 'mysqlclient'"

**Causa:** O pacote `mysqlclient` não está instalado.

**Solução:**
```bash
pip3.10 install --user mysqlclient
```

Ou no ambiente virtual:
```bash
source venv/bin/activate
pip install mysqlclient
```

### Erro: "django.db.utils.OperationalError"

**Causa:** Problemas de conexão ou configuração.

**Solução:**
1. Verifique todas as variáveis de ambiente no `.env`
2. Certifique-se de que `DB_ENGINE=mysql` está definido
3. Reinicie a aplicação web após alterar o `.env`

## 📝 Checklist de Configuração

- [ ] Arquivo `.env` criado na pasta do projeto
- [ ] Variável `DB_ENGINE=mysql` configurada
- [ ] Credenciais do banco de dados corretas
- [ ] `mysqlclient` instalado
- [ ] Teste de conexão bem-sucedido
- [ ] Migrações executadas
- [ ] Aplicação web reiniciada
- [ ] Logs verificados sem erros

## 🔐 Segurança

⚠️ **IMPORTANTE:**
- Nunca commite o arquivo `.env` no Git
- Mantenha as credenciais seguras
- Use `DEBUG=False` em produção
- Configure um `SECRET_KEY` forte e único

## 📞 Suporte

Se ainda tiver problemas:

1. Verifique os logs da aplicação web no PythonAnywhere
2. Verifique os logs do console Bash
3. Teste a conexão MySQL diretamente usando o comando `mysql`
4. Verifique se o banco de dados MySQL está ativo no PythonAnywhere

## 🔄 Atualizar Configuração

Se precisar atualizar as credenciais:

1. Edite o arquivo `.env` no PythonAnywhere
2. Salve as alterações
3. Reinicie a aplicação web (clique em **Reload**)
4. Verifique os logs para garantir que não há erros

---

**Última atualização:** Dezembro 2024

