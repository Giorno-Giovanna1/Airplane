@echo off
chcp 65001 >nul
echo ========================================
echo   订阅管理系统 - 一键启动
echo ========================================
echo.

:: 检查 Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Python，请先安装 Python 3.8+
    pause
    exit /b 1
)

:: 检查 Node
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js 16+
    pause
    exit /b 1
)

:: 安装后端依赖
echo [1/4] 安装后端依赖...
cd /d "%~dp0backend"
pip install -r requirements.txt -q

:: 启动后端
echo [2/4] 启动后端服务 (端口 8000)...
start "后端服务" cmd /k "cd /d "%~dp0backend" && python main.py"

:: 安装前端依赖
echo [3/4] 安装前端依赖...
cd /d "%~dp0frontend"
if not exist node_modules (
    call npm install
) else (
    echo   依赖已安装，跳过
)

:: 启动前端
echo [4/4] 启动前端服务 (端口 3000)...
start "前端服务" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================
echo   启动完成！
echo   前端: http://localhost:3000
echo   后端: http://localhost:8000
echo   管理员: admin@admin.com / admin123
echo ========================================
echo.
pause
