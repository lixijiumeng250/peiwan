# Windows Nginx 部署指南

## 1. 环境准备

### 1.1 安装 Nginx
1. 下载 Nginx for Windows: https://nginx.org/en/download.html
2. 选择稳定版本，如 `nginx-1.25.3.zip`
3. 解压到 `C:\nginx\` 目录

### 1.2 安装 Node.js
1. 下载 Node.js: https://nodejs.org/
2. 选择 LTS 版本安装
3. 安装完成后验证：
   ```cmd
   node -v
   npm -v
   ```

## 2. 项目构建

### 2.1 安装依赖
```cmd
cd 项目目录
npm install
```

### 2.2 构建项目
```cmd
npm run build
```

### 2.3 构建后文件
构建完成后，会在 `dist` 目录下生成静态文件

## 3. Nginx 配置

### 3.1 创建 Nginx 配置文件
在 `C:\nginx\conf\` 目录下创建 `peiwan.conf` 文件：

```nginx
# 陪玩管理系统配置
server {
    listen 80;
    server_name localhost;

    # 前端静态文件
    location / {
        root   C:/nginx/html/peiwan;
        index  index.html index.htm;
        try_files $uri $uri/ /index.html;

        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API 反向代理到后端 8080 端口
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 支持 WebSocket
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 错误页面
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root   html;
    }
}
```

### 3.2 修改主配置文件
编辑 `C:\nginx\conf\nginx.conf`，在 `http` 块内添加：
```nginx
http {
    # ... 其他配置 ...

    # 引入陪玩系统配置
    include C:/nginx/conf/peiwan.conf;

    # ... 其他配置 ...
}
```

## 4. 部署步骤

### 4.1 复制构建文件
```cmd
# 创建 Nginx 静态文件目录
mkdir C:\nginx\html\peiwan

# 复制构建后的文件到 Nginx 目录
xcopy /E /I /Y dist\* C:\nginx\html\peiwan\
```

### 4.2 启动 Nginx
```cmd
cd C:\nginx
start nginx.exe
```

### 4.3 验证 Nginx 状态
```cmd
tasklist /fi "imagename eq nginx.exe"
```

### 4.4 常用 Nginx 命令
```cmd
# 停止 Nginx
nginx.exe -s stop

# 重新加载配置
nginx.exe -s reload

# 退出 Nginx
nginx.exe -s quit

# 检查配置文件语法
nginx.exe -t
```

## 5. 后端服务配置

### 5.1 确保后端服务运行在 8080 端口
- Spring Boot 应用: 确保配置文件中 `server.port=8080`
- Node.js 应用: 确保监听 8080 端口

### 5.2 验证后端服务
```cmd
# 测试后端服务是否正常运行
curl http://localhost:8080/api/health
```

## 6. 防火墙配置

### 6.1 开放端口
1. 打开 Windows 防火墙设置
2. 选择"高级设置"
3. 创建入站规则：
   - 端口: 80 (HTTP)
   - 端口: 8080 (后端API - 可选，如需外部访问)

## 7. 服务管理

### 7.1 创建 Windows 服务 (可选)
使用 NSSM (Non-Sucking Service Manager) 将 Nginx 安装为 Windows 服务：

1. 下载 NSSM: https://nssm.cc/download
2. 安装 Nginx 服务：
   ```cmd
   nssm install Nginx "C:\nginx\nginx.exe"
   nssm start Nginx
   ```

### 7.2 创建启动脚本
创建 `start-peiwan.bat` 文件：
```batch
@echo off
echo Starting Peiwan System...

cd /d C:\nginx
echo Starting Nginx...
nginx.exe

echo Starting backend server...
cd /d "后端项目目录"
npm start

echo System started successfully!
pause
```

## 8. 故障排除

### 8.1 常见问题
1. **端口被占用**
   ```cmd
   netstat -ano | findstr :80
   netstat -ano | findstr :8080
   ```

2. **Nginx 启动失败**
   - 检查配置文件: `nginx.exe -t`
   - 查看错误日志: `C:\nginx\logs\error.log`

3. **静态文件 404**
   - 检查文件路径是否正确
   - 确认 Nginx 有权限访问文件

### 8.2 日志查看
- Nginx 访问日志: `C:\nginx\logs\access.log`
- Nginx 错误日志: `C:\nginx\logs\error.log`

## 9. 生产环境优化

### 9.1 SSL 配置 (HTTPS)
```nginx
server {
    listen 443 ssl http2;
    server_name localhost;

    ssl_certificate C:/nginx/ssl/cert.pem;
    ssl_certificate_key C:/nginx/ssl/key.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ... 其他配置 ...
}
```

### 9.2 性能优化
```nginx
# 启用 gzip 压缩
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml;
gzip_min_length 1000;

# 缓存配置
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 10. 访问系统

部署完成后，可以通过以下地址访问：
- 前端应用: http://localhost
- 后端API: http://localhost/api

---

## 快速部署脚本

创建 `deploy.bat` 文件：
```batch
@echo off
echo === Peiwan System Deployment Script ===

echo 1. Building frontend...
cd /d "%~dp0"
call npm run build

echo 2. Copying files to Nginx...
if not exist "C:\nginx\html\peiwan" mkdir C:\nginx\html\peiwan
xcopy /E /I /Y dist\* C:\nginx\html\peiwan\

echo 3. Testing Nginx configuration...
cd /d C:\nginx
nginx.exe -t

echo 4. Reloading Nginx...
nginx.exe -s reload

echo 5. Deployment completed!
echo.
echo Access URLs:
echo - Frontend: http://localhost
echo - Backend API: http://localhost/api
echo.

pause
```