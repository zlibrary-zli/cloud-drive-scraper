---
title: Cloud Drive Scraper
emoji: 🚀
colorFrom: green
colorTo: blue
sdk: docker
app_port: 8000
---

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

由于某些平台（如 Render）近期要求新用户绑定信用卡，我为你推荐完全**无需信用卡**的免费部署方案。

### 方案 A: 使用 Hugging Face Spaces (完全免费、无绑卡要求、一键克隆)
Hugging Face Spaces 是一个免费的微型服务器平台，它原生地支持 Docker 并且完全不要求信用卡。我已经为你写好了相关的配置头信息。
1. 注册并登录 [Hugging Face](https://huggingface.co/join)。
2. 点击右上角的个人头像，选择 **New Space**。
3. **Space name** 填 `cloud-drive-scraper`。
4. **License** 选 `MIT`。
5. **Select the Space SDK** 选择 **Docker**，然后选 **Blank**。
6. 点击最下方的 **Create Space**。
7. 在跳转后的页面中，找到 `Files and versions` 标签页，点击 `Add file` -> `Upload files`。
8. 把你本地（或者你 GitHub 仓库下载的）整个项目里的所有代码文件拖进去上传并提交。
9. 上传完毕后，Hugging Face 会自动识别到 `Dockerfile` 和 `README.md` 中的端口配置开始构建。只要右上角的绿点（Running）亮起，你的控制台就可以直接在公网访问啦！

### 方案 B: 使用 Claw Cloud Run (阿里云海外版架构、国内访问极快、免绑卡)
[Claw Cloud Run](https://console.run.claw.cloud/) 是近期非常火爆的容器云平台，对中国大陆访问非常友好（因为底层是阿里云国际线路，推荐选新加坡或日本节点）。
**【最新福利】**：只要你的 GitHub 账号注册时间超过 180 天，直接使用 GitHub 登录，**每个月都会永久免费赠送 $5 的额度**，完全不需要绑定信用卡！这 $5 足够让这个爬虫平台 24 小时运行了。
1. 打开 [Claw Cloud Run](https://console.run.claw.cloud/) 并使用你的老 GitHub 账号登录。
2. 登录后创建一个新应用（App），选择你的 `cloud-drive-scraper` 仓库。
3. 它会自动识别到 `Dockerfile` 进行构建。
4. 为了防止超出免费额度，建议在配置页面（Update）把 CPU 调小到 `0.5核`，内存调到 `512MB`，足够爬虫跑了。

### 方案 C: 本地或云服务器使用 Docker 一键启动
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