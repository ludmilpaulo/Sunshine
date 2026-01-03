@echo off
chcp 65001 >nul
echo ========================================
echo CONFIGURAÇÃO IMPRESSORA USB - WINDOWS 10
echo ========================================
echo.
echo Este script irá ajudá-lo a configurar a impressora GO INFINITY USB
echo.

REM Verificar se Node.js está instalado
echo [1] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERRO: Node.js não está instalado!
    echo.
    echo Por favor, instale o Node.js de: https://nodejs.org/
    echo Baixe a versão LTS (Long Term Support)
    pause
    exit /b 1
)
echo ✅ Node.js instalado
node --version
echo.

REM Verificar se npm está instalado
echo [2] Verificando npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERRO: npm não está instalado!
    pause
    exit /b 1
)
echo ✅ npm instalado
npm --version
echo.

REM Instalar dependências se necessário
echo [3] Verificando dependências...
if not exist node_modules (
    echo Instalando dependências...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ ERRO: Falha ao instalar dependências!
        echo.
        echo No Windows, você pode precisar de:
        echo - Visual Studio Build Tools (para compilar módulos nativos)
        echo - Baixe de: https://visualstudio.microsoft.com/downloads/
        echo - Selecione "Build Tools for Visual Studio"
        pause
        exit /b 1
    )
    echo ✅ Dependências instaladas
) else (
    echo ✅ Dependências já instaladas
)
echo.

REM Iniciar Print Bridge para descobrir impressoras
echo [4] Iniciando Print Bridge para descobrir impressoras...
echo.
echo Por favor, aguarde enquanto o Print Bridge inicia...
echo.

start /B npm run dev >nul 2>&1

REM Aguardar Print Bridge iniciar
timeout /t 3 /nobreak >nul

REM Listar impressoras
echo [5] Listando impressoras disponíveis...
echo.
curl -s http://localhost:3333/printers
echo.
echo.

REM Criar arquivo .env
echo [6] Configurando arquivo .env...
echo.

REM Perguntar o nome da impressora
set /p PRINTER_NAME="Digite o nome EXATO da impressora (copie do Windows): "

if "%PRINTER_NAME%"=="" (
    echo.
    echo ⚠️  Nome da impressora não fornecido!
    echo.
    echo Para encontrar o nome da impressora:
    echo 1. Abra: Painel de Controle → Dispositivos e Impressoras
    echo 2. Localize a impressora GO INFINITY
    echo 3. Copie o nome EXATO (incluindo maiúsculas e espaços)
    echo.
    set /p PRINTER_NAME="Digite o nome da impressora: "
)

if "%PRINTER_NAME%"=="" (
    echo ❌ Nome da impressora é obrigatório!
    pause
    exit /b 1
)

REM Criar arquivo .env
(
echo PORT=3333
echo PRINTER_USB_NAME=%PRINTER_NAME%
echo.
echo # Configuração USB para Windows 10
echo # Impressora: GO INFINITY Thermal Receipt Printer 80mm
echo # Interface: USB
echo # Comandos: ESC/POS
) > .env

echo ✅ Arquivo .env criado com sucesso!
echo.
echo Conteúdo do .env:
type .env
echo.

REM Testar Print Bridge
echo [7] Testando Print Bridge...
echo.
curl -s http://localhost:3333/health
echo.
echo.

echo ========================================
echo CONFIGURAÇÃO CONCLUÍDA!
echo ========================================
echo.
echo Próximos passos:
echo 1. O Print Bridge está rodando em segundo plano
echo 2. Teste a impressora no sistema Sunshine
echo 3. Se precisar reiniciar o Print Bridge:
echo    - Pare o processo atual (Ctrl+C)
echo    - Execute: npm run dev
echo.
echo Para executar como serviço do Windows (produção):
echo - Consulte: WINDOWS10_TROUBLESHOOTING.md
echo.
pause

