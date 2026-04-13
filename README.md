# Cloud Drive Scraper (网盘爬虫控制台)

这是一个具有极客赛博风格 Web 界面的网盘爬虫管理平台，用于自动化爬取公开网盘链接（如百度网盘、夸克网盘、迅雷网盘），并支持智能去重、实时日志监控和 Markdown 图文渲染预览，最后可一键导出为 Excel 文件。

## 🌟 核心特性
- **实时终端监控**：后端通过 Server-Sent Events (SSE) 实时向前端输出仿命令行的滚动日志。
- **直链破解提取**：绕过原网页扫码和跳转，直接通过后端模拟请求提取带提取码的网盘直链。
- **富文本图文渲染**：前端使用 `react-markdown` 自动渲染游戏图文详情和封面。
- **智能防重复**：内置本地库缓存机制，二次运行自动跳过已存在的游戏数据。
- **一键 Docker 部署**：前后端解耦开发，最后通过 Docker 多阶段构建打成一个极简的镜像。

---

## 🚀 部署指南 (如何免费部署并测试)

由于爬虫脚本需要访问外网并执行 HTTP 请求，推荐使用以下平台免费部署。

### 方案 A: 使用 Render.com (免费、最推荐)
Render 允许直接绑定 GitHub 仓库，并通过 Dockerfile 免费自动构建和部署。
1. 注册并登录 [Render.com](https://render.com/)。
2. 点击 **New** -> **Web Service**，选择连接你刚才创建的这个 GitHub 仓库。
3. **Environment** 选择 `Docker`。
4. **Build Command** 和 **Start Command** 留空（Render 会自动读取项目根目录的 `Dockerfile`）。
5. 实例类型选择 **Free** 免费实例。
6. 点击 **Create Web Service**。大约等待几分钟，Render 就会为你生成一个免费的 `https://your-app.onrender.com` 公网地址供你直接访问控制台！

### 方案 B: 本地或云服务器使用 Docker 一键启动
如果你有自己的服务器（如阿里云、腾讯云、甚至你自己的电脑），只需要安装 Docker。
```bash
# 1. 克隆代码
git clone https://github.com/YOUR_USERNAME/cloud-drive-scraper.git
cd cloud-drive-scraper

# 2. 一键启动 (后台运行)
docker-compose up -d --build

# 3. 访问控制台
# 浏览器打开 http://localhost:8000
```
> **数据持久化说明**：在 Docker 模式下，爬取的缓存数据和 Excel 文件会保存在当前目录下的 `data/` 文件夹中，防止容器重启导致数据丢失。

---

## 💻 本地开发指南
本项目基于 FastAPI 和 React (Vite) 搭建，前后端分离。

**1. 启动后端 (Python)**
```bash
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**2. 启动前端 (Node.js)**
```bash
cd frontend
npm install
npm run dev
```

## 免责声明
本项目仅供学习交流使用，请勿用于非法用途，爬取数据请遵守相关网站的 robots.txt 协议及法律法规。