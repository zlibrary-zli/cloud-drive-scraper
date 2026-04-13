import requests
from bs4 import BeautifulSoup
import pandas as pd
import argparse
import logging
import time
import re

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("NS211Scraper")

class NS211Scraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://www.ns211.com/"
        })
        self.base_url = "https://www.ns211.com"

    def fetch_game_links(self, page=1, category="switch"):
        """抓取列表页的所有游戏链接"""
        url = f"{self.base_url}/{category}/page/{page}" if page > 1 else f"{self.base_url}/{category}"
        logger.info(f"正在抓取列表页: {url}")
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            
            articles = soup.select("article")
            links = []
            for a in articles:
                a_tag = a.find("a")
                if a_tag and a_tag.get("href"):
                    links.append(a_tag.get("href"))
            
            # 去重
            return list(dict.fromkeys(links))
        except Exception as e:
            logger.error(f"抓取列表页失败: {url} - {e}")
            return []

    def fetch_game_detail(self, url):
        """抓取游戏详情页"""
        logger.info(f"正在抓取详情页: {url}")
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            
            # 1. 标题
            title_tag = soup.find("h1", class_="article-title") or soup.find("h1")
            title = title_tag.text.strip() if title_tag else "未知标题"
            
            # 2. 页面信息
            info = ""
            content_div = soup.find(class_="article-content")
            if content_div:
                ps = content_div.find_all("p")
                info_texts = []
                for p in ps:
                    text = p.text.strip()
                    # 过滤掉一些无关的提示文本
                    if text and "免费获取下载链接" not in text and "赞助会员免扫码" not in text and "提取码" not in text:
                        info_texts.append(text)
                info = " ".join(info_texts) # 拼接为摘要
            
            # 3. 标签（从文章meta信息中提取）
            tags = []
            meta_div = soup.find(class_="entry-meta")
            if meta_div:
                for a in meta_div.find_all("a"):
                    text = a.text.strip()
                    # 排除作者名等非标签信息（通常分类/标签在后面）
                    if text and text not in ["逍遥", "admin", "admin", "作者"]:
                        tags.append(text)
            tags_str = ", ".join(tags)
            
            # 4. 网盘链接与提取码
            drives = {
                "baidu": "",
                "quark": "",
                "xunlei": ""
            }
            
            # 查找所有a标签，定位包含 go? 的下载链接
            for a in soup.find_all("a"):
                href = a.get("href", "")
                if "go?" in href:
                    parent = a.parent
                    parent_text = parent.text.replace("\n", " ").replace("\r", " ").strip()
                    # 清理多余空格
                    parent_text = re.sub(r"\s+", " ", parent_text)
                    
                    # 尝试正则提取具体的提取码，让显示更干净
                    code_match = re.search(r"提取码[：:]\s*([a-zA-Z0-9]+)", parent_text)
                    code_str = f" (提取码: {code_match.group(1)})" if code_match else ""
                    
                    link_info = f"{href}{code_str}"
                    
                    # 根据链接文字或者href判断属于哪个网盘
                    if "百度" in a.text or "baidu" in a.text or "type=1" in href or ("type=" not in href and "post_id" in href):
                        if not drives["baidu"]:
                            drives["baidu"] = link_info
                    elif "夸克" in a.text or "quark" in a.text or "type=5" in href:
                        if not drives["quark"]:
                            drives["quark"] = link_info
                    elif "迅雷" in a.text or "xunlei" in a.text or "type=4" in href:
                        if not drives["xunlei"]:
                            drives["xunlei"] = link_info

            return {
                "标题": title,
                "页面信息": info,
                "夸克网盘": drives["quark"],
                "百度网盘": drives["baidu"],
                "迅雷网盘": drives["xunlei"],
                "标签": tags_str,
                "页面链接": url
            }
            
        except Exception as e:
            logger.error(f"抓取详情页失败: {url} - {e}")
            return None

    def run(self, pages=1, category="switch", output_file="ns211_games.xlsx"):
        all_data = []
        for page in range(1, pages + 1):
            links = self.fetch_game_links(page, category)
            if not links:
                logger.info("未找到更多链接，提前结束。")
                break
                
            for link in links:
                data = self.fetch_game_detail(link)
                if data:
                    all_data.append(data)
                time.sleep(1) # 适度延时防封
                
        if all_data:
            df = pd.DataFrame(all_data)
            # 调整列顺序
            columns = ["标题", "页面信息", "夸克网盘", "百度网盘", "迅雷网盘", "标签", "页面链接"]
            df = df[columns]
            df.to_excel(output_file, index=False)
            logger.info(f"爬取完成！共抓取 {len(all_data)} 条数据，已保存至 {output_file}")
        else:
            logger.warning("未能抓取到任何数据！")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="NS211 游戏网站爬虫导出Excel")
    parser.add_argument("--pages", "-p", type=int, default=1, help="爬取的页数")
    parser.add_argument("--category", "-c", type=str, default="switch", help="分类目录（如 switch, pcgame, moni 等）")
    parser.add_argument("--output", "-o", type=str, default="ns211_games.xlsx", help="输出的Excel文件名")
    args = parser.parse_args()

    scraper = NS211Scraper()
    scraper.run(pages=args.pages, category=args.category, output_file=args.output)
