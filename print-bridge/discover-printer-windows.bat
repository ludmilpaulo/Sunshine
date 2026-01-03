@echo off
chcp 65001 >nul
echo ========================================
echo DESCOBRIR IMPRESSORA NA REDE
echo ========================================
echo.

REM Verificar se Print Bridge está rodando
curl -s http://localhost:3333/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Print Bridge não está rodando!
    echo.
    echo Iniciando Print Bridge em segundo plano...
    start /B node dist\index.js > print-bridge-discovery.log 2>&1
    timeout /t 3 /nobreak >nul
    
    curl -s http://localhost:3333/health >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Erro ao iniciar Print Bridge
        pause
        exit /b 1
    )
    
    echo ✅ Print Bridge iniciado
    echo.
)

echo 🔍 Descobrindo impressora na rede...
echo.

REM Tentar auto-discovery
curl -s http://localhost:3333/discover > discover-result.json

findstr /C:"success" /C:"true" discover-result.json >nul
if %errorlevel% equ 0 (
    echo ✅ Impressora encontrada!
    echo.
    type discover-result.json
    echo.
    
    REM Extrair IP (básico - pode precisar ajuste)
    for /f "tokens=2 delims=:" %%a in ('findstr "ip" discover-result.json') do (
        set PRINTER_IP=%%a
        set PRINTER_IP=!PRINTER_IP:"=!
        set PRINTER_IP=!PRINTER_IP:,=!
        set PRINTER_IP=!PRINTER_IP: =!
    )
    
    if defined PRINTER_IP (
        echo ========================================
        echo CONFIGURAÇÃO SUGERIDA
        echo ========================================
        echo.
        echo Adicione ao arquivo .env:
        echo.
        echo PRINTER_LAN_IP=%PRINTER_IP%
        echo PRINTER_LAN_PORT=9100
        echo.
        
        set /p CREATE_ENV="Deseja criar/atualizar o arquivo .env? (S/N): "
        if /i "%CREATE_ENV%"=="S" (
            if not exist .env (
                echo PORT=3333 > .env
            )
            
            findstr /C:"PRINTER_LAN_IP" .env >nul
            if %errorlevel% equ 0 (
                powershell -Command "(Get-Content .env) -replace 'PRINTER_LAN_IP=.*', 'PRINTER_LAN_IP=%PRINTER_IP%' | Set-Content .env"
            ) else (
                echo PRINTER_LAN_IP=%PRINTER_IP% >> .env
            )
            
            findstr /C:"PRINTER_LAN_PORT" .env >nul
            if %errorlevel% neq 0 (
                echo PRINTER_LAN_PORT=9100 >> .env
            )
            
            echo ✅ Arquivo .env atualizado!
            echo.
            echo Conteúdo do .env:
            type .env
        )
    )
) else (
    echo ❌ Nenhuma impressora encontrada automaticamente
    echo.
    echo Tentativas alternativas:
    echo.
    echo 1. Verificando impressoras configuradas...
    curl -s http://localhost:3333/printers
    echo.
    echo.
    echo 2. Para descobrir manualmente:
    echo    a) Acesse o menu da impressora e procure por 'Network Settings'
    echo    b) Anote o endereço IP
    echo    c) Teste a conexão: ping ^<IP^>
    echo    d) Teste a porta: telnet ^<IP^> 9100
    echo    e) Adicione ao .env: PRINTER_LAN_IP=^<IP^>
    echo.
)

del discover-result.json 2>nul

echo.
echo ========================================
echo DESCOBERTA CONCLUÍDA
echo ========================================
echo.
pause

