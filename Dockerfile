# 阶段 1: 编译前端静态文件
FROM node:20-alpine AS build-frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
# 修改 vite config 使其能够被 Python 托管
RUN npm run build

# 阶段 2: 构建 Python 运行环境并整合前端静态文件
FROM python:3.11-slim
WORKDIR /app

# 复制 Python 依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制 Python 源码
COPY main.py .
COPY ns211_scraper.py .

# 复制构建好的前端静态文件到 static 目录
COPY --from=build-frontend /app/frontend/dist /app/static

# 创建数据存储目录
RUN mkdir -p /app/data

# 暴露 FastAPI 端口
EXPOSE 8000

# 启动 Uvicorn (Host 必须是 0.0.0.0)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
