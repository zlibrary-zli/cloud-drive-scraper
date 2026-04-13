import os
import json
import asyncio
import logging
from datetime import datetime
from uuid import uuid4
from fastapi import FastAPI, BackgroundTasks, Request
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from ns211_scraper import NS211Scraper

app = FastAPI(title="NS211 Scraper API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)

# Global task state and log queues
tasks_db = {}
task_logs = {} # { task_id: asyncio.Queue() }

def save_tasks_db():
    with open(os.path.join(DATA_DIR, "tasks.json"), "w") as f:
        json.dump(tasks_db, f, indent=2)

def load_tasks_db():
    global tasks_db
    path = os.path.join(DATA_DIR, "tasks.json")
    if os.path.exists(path):
        with open(path, "r") as f:
            tasks_db = json.load(f)

load_tasks_db()

class QueueLogHandler(logging.Handler):
    def __init__(self, task_id):
        super().__init__()
        self.task_id = task_id

    def emit(self, record):
        msg = self.format(record)
        if self.task_id in task_logs:
            queue = task_logs[self.task_id]
            # using run_coroutine_threadsafe if called from sync code
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.call_soon_threadsafe(queue.put_nowait, msg)
                else:
                    queue.put_nowait(msg)
            except Exception:
                queue.put_nowait(msg)

def run_scraper(task_id: str, pages: int, category: str):
    logger = logging.getLogger("NS211Scraper")
    handler = QueueLogHandler(task_id)
    handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    
    tasks_db[task_id]["status"] = "running"
    save_tasks_db()
    
    scraper = NS211Scraper()
    output_file = os.path.join(DATA_DIR, f"results_{task_id}.xlsx")
    
    try:
        # Patch the scraper run to capture data directly instead of just saving
        all_data = []
        for page in range(1, pages + 1):
            links = scraper.fetch_game_links(page, category)
            if not links:
                logger.info("未找到更多链接，提前结束。")
                break
                
            for link in links:
                data = scraper.fetch_game_detail(link)
                if data:
                    all_data.append(data)
                time.sleep(1) # 延时
                
        if all_data:
            df = pd.DataFrame(all_data)
            columns = ["标题", "页面信息", "夸克网盘", "百度网盘", "迅雷网盘", "标签", "页面链接"]
            df = df[columns]
            df.to_excel(output_file, index=False)
            
            # Save JSON for frontend display
            json_path = os.path.join(DATA_DIR, f"results_{task_id}.json")
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(all_data, f, ensure_ascii=False, indent=2)
                
            logger.info(f"爬取完成！共抓取 {len(all_data)} 条数据。")
            tasks_db[task_id]["status"] = "completed"
            tasks_db[task_id]["count"] = len(all_data)
        else:
            logger.warning("未能抓取到任何数据！")
            tasks_db[task_id]["status"] = "completed"
            tasks_db[task_id]["count"] = 0
            
    except Exception as e:
        logger.error(f"任务出错: {e}")
        tasks_db[task_id]["status"] = "failed"
    finally:
        tasks_db[task_id]["finished_at"] = datetime.now().isoformat()
        save_tasks_db()
        logger.removeHandler(handler)
        # signal end of stream
        if task_id in task_logs:
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.call_soon_threadsafe(task_logs[task_id].put_nowait, "EOF")
            except:
                pass

@app.post("/api/tasks/start")
async def start_task(payload: dict, background_tasks: BackgroundTasks):
    pages = payload.get("pages", 1)
    category = payload.get("category", "switch")
    
    task_id = str(uuid4())
    tasks_db[task_id] = {
        "id": task_id,
        "category": category,
        "pages": pages,
        "status": "pending",
        "count": 0,
        "created_at": datetime.now().isoformat(),
        "finished_at": None
    }
    save_tasks_db()
    
    task_logs[task_id] = asyncio.Queue()
    
    background_tasks.add_task(run_scraper, task_id, pages, category)
    
    return {"success": True, "task_id": task_id}

@app.get("/api/tasks")
async def get_tasks():
    return list(tasks_db.values())

@app.get("/api/tasks/{task_id}/stream")
async def task_log_stream(task_id: str, request: Request):
    if task_id not in task_logs:
        # Create a dummy queue if requested after finish
        task_logs[task_id] = asyncio.Queue()
        await task_logs[task_id].put("Task logs not available or already finished.\nEOF")

    async def event_generator():
        queue = task_logs[task_id]
        while True:
            if await request.is_disconnected():
                break
            msg = await queue.get()
            if msg == "EOF":
                yield f"data: {json.dumps({'status': 'EOF'})}\n\n"
                break
            yield f"data: {json.dumps({'log': msg})}\n\n"
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/tasks/{task_id}/results")
async def get_task_results(task_id: str):
    json_path = os.path.join(DATA_DIR, f"results_{task_id}.json")
    if os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

@app.get("/api/tasks/{task_id}/export")
async def export_task_results(task_id: str):
    excel_path = os.path.join(DATA_DIR, f"results_{task_id}.xlsx")
    if os.path.exists(excel_path):
        return FileResponse(excel_path, filename=f"NS211_Results_{task_id[:8]}.xlsx")
    return {"error": "File not found"}
