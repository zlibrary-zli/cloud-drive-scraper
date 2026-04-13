#!/bin/bash
# deploy.sh - 用于在私人服务器上一键更新代码并重启服务的脚本

echo "====================================="
echo "🚀 开始更新 Cloud Drive Scraper"
echo "====================================="

# 1. 拉取最新代码
echo "=> 正在从 GitHub 拉取最新代码..."
git pull origin master

if [ $? -ne 0 ]; then
    echo "❌ Git 拉取失败，请检查网络或冲突！"
    exit 1
fi
echo "✅ 代码拉取成功"

# 2. 检查 Docker 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️ 未找到 docker-compose，尝试使用 docker compose"
    DOCKER_CMD="docker compose"
else
    DOCKER_CMD="docker-compose"
fi

# 3. 重新构建并启动服务
echo "=> 正在通过 Docker 重新构建并启动服务 (这可能需要几分钟)..."
$DOCKER_CMD up -d --build

if [ $? -ne 0 ]; then
    echo "❌ 容器启动失败！"
    exit 1
fi

echo "====================================="
echo "🎉 部署完成！"
echo "=> 服务已在后台运行，可以通过 http://服务器IP:8000 访问控制台"
echo "=> 提示: 爬取数据已挂载在 data/ 目录，不会丢失"
echo "====================================="
