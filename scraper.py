import re
import sys
import logging
import requests
from bs4 import BeautifulSoup
import argparse

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("CloudDriveScraper")

# 定义一些常见网盘的正则表达式
PATTERNS = {
    "baidu": r"pan\.baidu\.com/s/[A-Za-z0-9_-]+",
    "aliyun": r"aliyundrive\.com/s/[A-Za-z0-9_-]+",
    "quark": r"pan\.quark\.cn/s/[A-Za-z0-9_-]+"
}

class Scraper:
    def __init__(self, headers=None):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
        } if not headers else headers)

    def fetch_page(self, url):
        """抓取网页内容"""
        try:
            logger.info(f"开始抓取网页: {url}")
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            logger.error(f"抓取失败: {e}")
            return None

    def extract_links(self, html):
        """从 HTML 文本中提取网盘链接"""
        found_links = {}
        for drive_name, pattern in PATTERNS.items():
            matches = re.findall(pattern, html)
            if matches:
                # 去重
                found_links[drive_name] = list(set(["https://" + match for match in matches]))
        return found_links

    def run(self, url):
        html = self.fetch_page(url)
        if not html:
            return
        
        links = self.extract_links(html)
        if not links:
            logger.info("未找到任何网盘链接。")
            return

        logger.info("提取到以下网盘链接:")
        for drive_name, urls in links.items():
            logger.info(f"[{drive_name.upper()}]:")
            for u in urls:
                logger.info(f"  - {u}")

def main():
    parser = argparse.ArgumentParser(description="简单的公开网盘链接爬取工具")
    parser.add_argument("--url", "-u", required=True, help="目标网页的URL")
    args = parser.parse_args()

    scraper = Scraper()
    scraper.run(args.url)

if __name__ == "__main__":
    main()
