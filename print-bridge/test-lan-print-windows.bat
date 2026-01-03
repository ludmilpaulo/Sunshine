@echo off
chcp 65001 >nul
echo ========================================
echo TESTE DE IMPRESSÃO LAN
echo ========================================
echo.

REM Verificar se Print Bridge está rodando
curl -s http://localhost:3333/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Print Bridge não está rodando!
    echo.
    echo Iniciando Print Bridge...
    start /B node dist\index.js > print-bridge-test.log 2>&1
    timeout /t 3 /nobreak >nul
    
    curl -s http://localhost:3333/health >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Erro ao iniciar Print Bridge
        echo Verifique os logs: type print-bridge-test.log
        pause
        exit /b 1
    )
    
    echo ✅ Print Bridge iniciado
    echo.
) else (
    echo ✅ Print Bridge está rodando
    echo.
)

REM Obter IP da impressora
if "%1"=="" (
    REM Tentar descobrir do .env
    if exist .env (
        for /f "tokens=2 delims==" %%a in ('findstr "^PRINTER_LAN_IP=" .env') do set PRINTER_IP=%%a
        set PRINTER_IP=!PRINTER_IP:"=!
        set PRINTER_IP=!PRINTER_IP: =!
    )
    
    if "!PRINTER_IP!"=="" (
        echo Por favor, forneça o IP da impressora:
        echo   %0 ^<IP_DA_IMPRESSORA^>
        echo.
        echo Exemplo:
        echo   %0 192.168.1.50
        echo.
        pause
        exit /b 1
    )
) else (
    set PRINTER_IP=%1
)

REM Obter porta (padrão 9100)
if "%2"=="" (
    if exist .env (
        for /f "tokens=2 delims==" %%a in ('findstr "^PRINTER_LAN_PORT=" .env') do set PRINTER_PORT=%%a
        set PRINTER_PORT=!PRINTER_PORT:"=!
        set PRINTER_PORT=!PRINTER_PORT: =!
    )
    if "!PRINTER_PORT!"=="" set PRINTER_PORT=9100
) else (
    set PRINTER_PORT=%2
)

echo Configuração:
echo   IP: %PRINTER_IP%
echo   Porta: %PRINTER_PORT%
echo.

REM Testar conexão
echo 🔍 Testando conexão...
ping -n 1 -w 2000 %PRINTER_IP% >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Ping OK
) else (
    echo ⚠️  Ping falhou (pode ser normal se ping estiver desabilitado)
)

echo.
echo 🖨️  Enviando teste de impressão...
echo.

REM Criar arquivo JSON temporário
(
echo {
echo   "mode": "LAN",
echo   "lan": {
echo     "ip": "%PRINTER_IP%",
echo     "port": %PRINTER_PORT%
echo   },
echo   "receipt": {
echo     "shopName": "Test Shop",
echo     "saleNumber": "TEST-001",
echo     "date": "%date% %time%",
echo     "subtotal": "10.00",
echo     "tax": "0.00",
echo     "total": "10.00",
echo     "items": [
echo       {
echo         "name": "Test Item",
echo         "qty": 1,
echo         "unitPrice": "10.00",
echo         "total": "10.00"
echo       }
echo     ]
echo   },
echo   "cut": true,
echo   "openCashDrawer": false
echo }
) > test-print.json

REM Enviar para Print Bridge
curl -s -X POST http://localhost:3333/print -H "Content-Type: application/json" -d @test-print.json > test-response.json

REM Verificar resposta
findstr /C:"ok" /C:"true" test-response.json >nul
if %errorlevel% equ 0 (
    echo ✅ Impressão enviada com sucesso!
    echo.
    echo Resposta:
    type test-response.json
    echo.
    echo Verifique se a impressora imprimiu o recibo de teste.
) else (
    echo ❌ Erro ao imprimir
    echo.
    echo Resposta:
    type test-response.json
    echo.
    echo Verifique:
    echo   - Se a impressora está ligada
    echo   - Se o IP está correto
    echo   - Se a porta está correta
    echo   - Logs do Print Bridge: type print-bridge-test.log
)

del test-print.json test-response.json 2>nul

echo.
echo ========================================
echo TESTE CONCLUÍDO
echo ========================================
echo.
pause

