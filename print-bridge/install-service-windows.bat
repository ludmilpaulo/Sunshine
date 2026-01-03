@echo off
chcp 65001 >nul
echo ========================================
echo INSTALAR PRINT BRIDGE COMO SERVIÇO WINDOWS
echo ========================================
echo.

REM Verificar se NSSM está instalado
where nssm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ NSSM não está instalado!
    echo.
    echo NSSM é necessário para instalar como serviço do Windows.
    echo.
    echo Opção 1: Baixar NSSM
    echo 1. Acesse: https://nssm.cc/download
    echo 2. Baixe a versão win64
    echo 3. Extraia para C:\nssm
    echo 4. Adicione C:\nssm\win64 ao PATH ou use caminho completo
    echo.
    echo Opção 2: Usar caminho completo
    echo Edite este script e altere "nssm" para "C:\nssm\win64\nssm.exe"
    echo.
    pause
    exit /b 1
)

echo ✅ NSSM encontrado
echo.

REM Obter caminhos
set SCRIPT_DIR=%~dp0
set NODE_PATH=
set PRINT_BRIDGE_PATH=%SCRIPT_DIR%dist\index.js

REM Tentar encontrar Node.js
where node >nul 2>&1
if %errorlevel% equ 0 (
    for /f "delims=" %%i in ('where node') do set NODE_PATH=%%i
    echo ✅ Node.js encontrado: %NODE_PATH%
) else (
    echo ❌ Node.js não encontrado no PATH!
    echo.
    set /p NODE_PATH="Digite o caminho completo do node.exe (ex: C:\Program Files\nodejs\node.exe): "
    if not exist "%NODE_PATH%" (
        echo ❌ Arquivo não encontrado: %NODE_PATH%
        pause
        exit /b 1
    )
)

echo.
echo Configuração:
echo   Node.js: %NODE_PATH%
echo   Print Bridge: %PRINT_BRIDGE_PATH%
echo   Diretório: %SCRIPT_DIR%
echo.

REM Verificar se dist/index.js existe
if not exist "%PRINT_BRIDGE_PATH%" (
    echo ❌ Arquivo não encontrado: %PRINT_BRIDGE_PATH%
    echo.
    echo Compilando Print Bridge...
    call npm run build
    if %errorlevel% neq 0 (
        echo ❌ Erro ao compilar!
        pause
        exit /b 1
    )
)

echo.
set /p CONFIRM="Deseja instalar Print Bridge como serviço? (S/N): "
if /i not "%CONFIRM%"=="S" (
    echo Cancelado.
    pause
    exit /b 0
)

echo.
echo Instalando serviço...
echo.

REM Remover serviço existente se houver
nssm remove PrintBridge confirm >nul 2>&1

REM Instalar serviço
nssm install PrintBridge "%NODE_PATH%" "%PRINT_BRIDGE_PATH%"
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar serviço!
    pause
    exit /b 1
)

REM Configurar diretório de trabalho
nssm set PrintBridge AppDirectory "%SCRIPT_DIR%"
nssm set PrintBridge DisplayName "Print Bridge Service"
nssm set PrintBridge Description "Serviço Print Bridge para impressão de recibos"
nssm set PrintBridge Start SERVICE_AUTO_START
nssm set PrintBridge AppStdout "%SCRIPT_DIR%print-bridge.log"
nssm set PrintBridge AppStderr "%SCRIPT_DIR%print-bridge-error.log"

echo.
echo ✅ Serviço instalado com sucesso!
echo.
echo Configurações:
echo   Nome: PrintBridge
echo   Tipo: Automático (inicia com Windows)
echo   Logs: %SCRIPT_DIR%print-bridge.log
echo.

set /p START="Deseja iniciar o serviço agora? (S/N): "
if /i "%START%"=="S" (
    echo.
    echo Iniciando serviço...
    nssm start PrintBridge
    if %errorlevel% equ 0 (
        echo ✅ Serviço iniciado!
        timeout /t 2 /nobreak >nul
        echo.
        echo Testando...
        curl -s http://localhost:3333/health
        echo.
    ) else (
        echo ❌ Erro ao iniciar serviço!
        echo Verifique os logs: %SCRIPT_DIR%print-bridge-error.log
    )
)

echo.
echo ========================================
echo INSTALAÇÃO CONCLUÍDA
echo ========================================
echo.
echo Comandos úteis:
echo   Iniciar:   nssm start PrintBridge
echo   Parar:     nssm stop PrintBridge
echo   Reiniciar: nssm restart PrintBridge
echo   Remover:   nssm remove PrintBridge confirm
echo   Status:    nssm status PrintBridge
echo.
pause

