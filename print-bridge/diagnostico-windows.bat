@echo off
chcp 65001 >nul
echo ========================================
echo DIAGNÓSTICO IMPRESSORA WINDOWS 10
echo ========================================
echo.

echo [1] Verificando Print Bridge...
curl -s http://localhost:3333/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERRO: Print Bridge não está rodando!
    echo Execute: npm run dev
    echo.
    pause
    exit /b 1
)
echo ✅ OK: Print Bridge está rodando
curl -s http://localhost:3333/health
echo.
echo.

echo [2] Listando impressoras disponíveis...
curl -s http://localhost:3333/printers
echo.
echo.

echo [3] Verificando arquivo .env...
if exist .env (
    echo ✅ OK: Arquivo .env encontrado
    echo.
    echo Conteúdo do .env:
    type .env
    echo.
) else (
    echo ❌ ERRO: Arquivo .env não encontrado!
    echo Crie o arquivo .env com as configurações da impressora
    echo.
)
echo.

echo [4] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERRO: Node.js não está instalado!
    echo Baixe em: https://nodejs.org/
    echo.
) else (
    echo ✅ OK: Node.js instalado
    node --version
    echo.
)
echo.

echo [5] Verificando dependências...
if exist node_modules (
    echo ✅ OK: Dependências instaladas
    echo.
) else (
    echo ❌ ERRO: Dependências não instaladas!
    echo Execute: npm install
    echo.
)
echo.

echo [6] Verificando porta 3333...
netstat -ano | findstr :3333 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ OK: Porta 3333 está em uso (Print Bridge rodando)
    netstat -ano | findstr :3333
    echo.
) else (
    echo ⚠️  AVISO: Porta 3333 não está em uso
    echo.
)
echo.

echo ========================================
echo DIAGNÓSTICO CONCLUÍDO
echo ========================================
echo.
echo Se houver erros, siga as instruções acima.
echo Para mais ajuda, consulte: WINDOWS10_TROUBLESHOOTING.md
echo.
pause

