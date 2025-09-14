@echo off
chcp 65001 >nul
echo === 启动陪玩管理系统 ===
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

REM 检查Nginx是否已经运行
tasklist /fi "imagename eq nginx.exe" | find "nginx.exe" >nul
if not errorlevel 1 (
    echo Nginx已经在运行中
    echo.
    echo 访问地址:
    echo - 前端: http://localhost
    echo - 后端API: http://localhost/api
    echo.
    echo 停止Nginx: nginx.exe -s stop
    pause
    exit /b 0
)

echo 启动Nginx...
start nginx.exe

timeout /t 3 /nobreak >nul

REM 检查启动是否成功
tasklist /fi "imagename eq nginx.exe" | find "nginx.exe" >nul
if errorlevel 1 (
    echo 错误: Nginx启动失败
    echo 请检查配置文件: nginx.exe -t
    echo 查看错误日志: type logs\error.log
    pause
    exit /b 1
)

echo ✓ Nginx启动成功
echo.
echo 访问地址:
echo - 前端应用: http://localhost
echo - 后端API: http://localhost/api
echo.
echo 常用命令:
echo - 停止Nginx: nginx.exe -s stop
echo - 重新加载: nginx.exe -s reload
echo - 检查配置: nginx.exe -t
echo - 查看日志: type logs\access.log
echo.
echo 提示: 请确保后端服务运行在8080端口
echo.

pause