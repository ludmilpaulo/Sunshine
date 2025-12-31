# Como Criar o Usuário Sunshine no PythonAnywhere

O usuário "sunshine" precisa ser criado no banco de dados do PythonAnywhere para que você possa fazer login no frontend.

## Passo a Passo

### 1. Acesse o Console do PythonAnywhere

1. Faça login no PythonAnywhere: https://www.pythonanywhere.com
2. Vá para a aba **Consoles**
3. Clique em **Bash** para abrir um console

### 2. Navegue até o diretório do projeto

```bash
cd ~/Sunshine/backend
# ou o caminho onde seu projeto está localizado
```

### 3. Execute o comando para criar o usuário

```bash
python3 manage.py create_sunshine_user
```

### 4. Verifique se o usuário foi criado

```bash
python3 manage.py shell
```

No shell Python, execute:

```python
from django.contrib.auth import get_user_model
from shop.models import UserProfile

User = get_user_model()
user = User.objects.filter(username='sunshine').first()

if user:
    print(f"✓ Usuário encontrado: {user.username}")
    print(f"  Is Superuser: {user.is_superuser}")
    print(f"  Is Active: {user.is_active}")
    
    profile = UserProfile.objects.filter(user=user).first()
    if profile:
        print(f"  Operation Type: {profile.operation_type}")
    else:
        print("  ⚠ UserProfile não encontrado!")
else:
    print("✗ Usuário não encontrado!")
```

### 5. Teste o Login

Agora você pode fazer login no frontend com:
- **Usuário**: `sunshine`
- **Senha**: `Maitland@2025`

## Alternativa: Criar via Django Admin

Se preferir, você também pode criar o usuário via Django Admin:

1. Acesse: `https://sunshinebar.pythonanywhere.com/admin`
2. Faça login com um superusuário existente
3. Vá em **Users** → **Add user**
4. Crie o usuário:
   - Username: `sunshine`
   - Password: `Maitland@2025`
   - Marque: **Superuser status** e **Staff status**
   - Clique em **Save**
5. Depois, vá em **User profiles** → **Add user profile**
6. Selecione o usuário `sunshine` e escolha **Operation type**: `Both`
7. Salve

## Notas Importantes

- O usuário precisa ter `is_active=True` para fazer login
- O usuário precisa ter um `UserProfile` com `operation_type=BOTH` para ter acesso completo
- Se você já criou o usuário mas não consegue fazer login, verifique se o `UserProfile` existe

## Solução de Problemas

Se ainda não conseguir fazer login após criar o usuário:

1. Verifique se o usuário está ativo:
   ```python
   user.is_active = True
   user.save()
   ```

2. Verifique se o UserProfile existe:
   ```python
   from shop.models import UserProfile
   profile, created = UserProfile.objects.get_or_create(
       user=user,
       defaults={'operation_type': UserProfile.OperationType.BOTH}
   )
   ```

3. Verifique se a senha está correta:
   ```python
   user.check_password('Maitland@2025')  # Deve retornar True
   ```

