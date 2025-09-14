@echo off
chcp 65001 >nul
echo === 陪玩管理系统自动部署脚本 ===
echo.

REM 检查是否在项目根目录
if not exist "package.json" (
    echo 错误: 请在项目根目录运行此脚本
    pause
    exit /b 1
)

REM 设置变量
set NGINX_DIR=C:\nginx
set PROJECT_DIR=%~dp0
set DEPLOY_DIR=%NGINX_DIR%\html\peiwan

echo 1. 检查环境...
echo 项目目录: %PROJECT_DIR%
echo Nginx目录: %NGINX_DIR%
echo 部署目录: %DEPLOY_DIR%
echo.

REM 检查Nginx是否存在
if not exist "%NGINX_DIR%" (
    echo 错误: Nginx未安装在 %NGINX_DIR%
    echo 请先安装Nginx到 %NGINX_DIR%
    pause
    exit /b 1
)

echo 2. 安装前端依赖...
call npm install
if errorlevel 1 (
    echo 错误: 依赖安装失败
    pause
    exit /b 1
)
echo.

echo 3. 构建前端项目...
call npm run build
if errorlevel 1 (
    echo 错误: 构建失败
    pause
    exit /b 1
)
echo.

echo 4. 创建部署目录...
if not exist "%DEPLOY_DIR%" (
    mkdir "%DEPLOY_DIR%"
    echo 创建目录: %DEPLOY_DIR%
)
echo.

echo 5. 复制构建文件...
xcopy /E /I /Y "%PROJECT_DIR%dist\*" "%DEPLOY_DIR%\"
if errorlevel 1 (
    echo 错误: 文件复制失败
    pause
    exit /b 1
)
echo.

echo 6. 复制Nginx配置文件...
copy /Y "%PROJECT_DIR%nginx.conf" "%NGINX_DIR%\conf\peiwan.conf"
if errorlevel 1 (
    echo 警告: Nginx配置文件复制失败，请手动复制
) else (
    echo Nginx配置文件已复制到: %NGINX_DIR%\conf\peiwan.conf
)
echo.

echo 7. 检查Nginx配置...
cd /d "%NGINX_DIR%"
nginx.exe -t
if errorlevel 1 (
    echo 错误: Nginx配置文件有误
    pause
    exit /b 1
)
echo.

echo 8. 重新加载Nginx配置...
nginx.exe -s reload
if errorlevel 1 (
    echo 警告: Nginx重新加载失败，尝试启动Nginx...
    start nginx.exe
    timeout /t 2 /nobreak >nul
)
echo.

echo 9. 验证部署...
echo 正在检查服务状态...
timeout /t 3 /nobreak >nul

REM 检查Nginx是否运行
tasklist /fi "imagename eq nginx.exe" | find "nginx.exe" >nul
if errorlevel 1 (
    echo 警告: Nginx未运行，请手动启动:
    echo   cd /d "%NGINX_DIR%"
    echo   start nginx.exe
) else (
    echo ✓ Nginx正在运行
)

echo.
echo === 部署完成! ===
echo.
echo 访问地址:
echo - 前端应用: http://www.peiwan.cloud
echo - 后端API: http://www.peiwan.cloud/api
echo.
echo 常用命令:
echo - 启动Nginx: cd /d "%NGINX_DIR%" ^&^& start nginx.exe
echo - 停止Nginx: cd /d "%NGINX_DIR%" ^&^& nginx.exe -s stop
echo - 重新加载: cd /d "%NGINX_DIR%" ^&^& nginx.exe -s reload
echo - 检查配置: cd /d "%NGINX_DIR%" ^&^& nginx.exe -t
echo.
echo 注意事项:
echo 1. 确保后端服务运行在8080端口
echo 2. 检查防火墙设置，确保80端口可访问
echo 3. 查看Nginx日志: %NGINX_DIR%\logs\
echo.

pause