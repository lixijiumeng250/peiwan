@echo off
chcp 65001 >nul
echo === 停止陪玩管理系统 ===
echo.

set NGINX_DIR=C:\nginx

REM 检查Nginx是否存在
if not exist "%NGINX_DIR%" (
    echo 错误: Nginx未安装在 %NGINX_DIR%
    pause
    exit /b 1
)

REM 切换到Nginx目录
cd /d "%NGINX_DIR%"

REM 检查Nginx是否运行
tasklist /fi "imagename eq nginx.exe" | find "nginx.exe" >nul
if errorlevel 1 (
    echo Nginx未运行
    pause
    exit /b 0
)

echo 停止Nginx...
nginx.exe -s stop

timeout /t 3 /nobreak >nul

REM 检查是否成功停止
tasklist /fi "imagename eq nginx.exe" | find "nginx.exe" >nul
if not errorlevel 1 (
    echo 警告: Nginx停止失败，强制关闭进程...
    taskkill /f /im nginx.exe
    timeout /t 2 /nobreak >nul
)

echo ✓ Nginx已停止
echo.

pause