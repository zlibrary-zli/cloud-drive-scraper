import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Play, SquareTerminal, Activity, Database, CheckCircle2, XCircle, BarChart3, FastForward, Hash } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:8000/api';

const Dashboard = () => {
  const [pages, setPages] = useState(1);
  const [category, setCategory] = useState('switch');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalTasks: 0, totalCrawled: 0, totalSkipped: 0, totalUnique: 0 });
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Fetch task history and stats
  const fetchTasksAndStats = async () => {
    try {
      const [tasksRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/tasks`),
        axios.get(`${API_BASE}/stats`)
      ]);
      setTasks(tasksRes.data.reverse()); // newest first
      setStats(statsRes.data);
    } catch (e) {
      console.error('Failed to fetch data', e);
    }
  };

  useEffect(() => {
    fetchTasksAndStats();
    const interval = setInterval(fetchTasksAndStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    if (status === 'running') return;
    try {
      setLogs(['> 初始化爬虫任务...']);
      setStatus('running');
      const res = await axios.post(`${API_BASE}/tasks/start`, { pages, category });
      const newTaskId = res.data.task_id;
      setTaskId(newTaskId);
      
      // Connect to SSE stream
      const eventSource = new EventSource(`${API_BASE}/tasks/${newTaskId}/stream`);
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.status === 'EOF') {
          eventSource.close();
          setStatus('completed');
          fetchTasksAndStats();
        } else if (data.log) {
          setLogs(prev => [...prev, data.log]);
        }
      };
      
      eventSource.onerror = () => {
        eventSource.close();
        setStatus('failed');
      };
      
    } catch (error) {
      console.error(error);
      setLogs(prev => [...prev, '> 任务启动失败。']);
      setStatus('failed');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Column: Config & History */}
      <div className="space-y-6 lg:col-span-1">
        
        {/* Stats Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-5 rounded-2xl flex flex-wrap gap-4 justify-between items-center"
        >
          <div className="text-center flex-1">
            <div className="text-cyber-text-muted text-xs mb-1 flex justify-center items-center gap-1"><Database className="w-3 h-3"/> 总抓取</div>
            <div className="text-2xl font-bold text-white">{stats.totalCrawled}</div>
          </div>
          <div className="text-center flex-1 border-l border-r border-cyber-border/50 px-2">
            <div className="text-cyber-text-muted text-xs mb-1 flex justify-center items-center gap-1"><FastForward className="w-3 h-3"/> 已跳过</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.totalSkipped}</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-cyber-text-muted text-xs mb-1 flex justify-center items-center gap-1"><Hash className="w-3 h-3"/> 去重资源</div>
            <div className="text-2xl font-bold text-cyber-accent">{stats.totalUnique}</div>
          </div>
        </motion.div>

        {/* Config Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-2xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <Activity className="text-cyber-accent w-6 h-6" />
            <h2 className="text-xl font-semibold text-white">控制面板</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-cyber-text-muted text-sm mb-2">爬取页数 (Pages)</label>
              <input 
                type="number" 
                min={1} 
                max={50}
                value={pages}
                onChange={(e) => setPages(Number(e.target.value))}
                className="w-full bg-cyber-surface border border-cyber-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyber-accent focus:shadow-[0_0_15px_var(--color-cyber-accent-glow)] transition-all"
              />
            </div>
            
            <div>
              <label className="block text-cyber-text-muted text-sm mb-2">游戏分类 (Category)</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-cyber-surface border border-cyber-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyber-accent focus:shadow-[0_0_15px_var(--color-cyber-accent-glow)] transition-all appearance-none"
              >
                <option value="switch">Switch游戏</option>
                <option value="pcgame">PC游戏</option>
                <option value="moni">模拟游戏</option>
              </select>
            </div>

            <button 
              onClick={handleStart}
              disabled={status === 'running'}
              className={`w-full mt-4 flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all duration-300 ${
                status === 'running' 
                ? 'bg-cyber-surface text-cyber-text-muted cursor-not-allowed border border-cyber-border' 
                : 'bg-cyber-accent text-black hover:shadow-[0_0_20px_var(--color-cyber-accent-glow)] hover:-translate-y-1'
              }`}
            >
              {status === 'running' ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-cyber-text-muted border-t-transparent animate-spin"></div>
                  运行中...
                </div>
              ) : (
                <>
                  <Play className="w-5 h-5" fill="currentColor" />
                  启动爬虫
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* History Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel rounded-2xl overflow-hidden flex flex-col h-[280px]"
        >
          <div className="p-5 border-b border-cyber-border flex items-center gap-3">
            <Database className="text-cyber-text-muted w-5 h-5" />
            <h3 className="font-medium text-white">历史任务</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {tasks.length === 0 ? (
              <div className="text-center text-cyber-text-muted py-8 text-sm">暂无记录</div>
            ) : (
              tasks.map(t => (
                <a 
                  key={t.id} 
                  href={`/tasks/${t.id}`}
                  className="block p-4 rounded-xl border border-transparent hover:border-cyber-border hover:bg-cyber-surface transition-colors group cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-cyber-text-muted font-mono">{t.id.substring(0,8)}</span>
                    {t.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-cyber-accent" />}
                    {t.status === 'running' && <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />}
                    {t.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-white text-sm font-medium">{t.category} - {t.pages}页</div>
                      <div className="text-xs text-cyber-text-muted mt-1">{new Date(t.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-xl font-bold text-cyber-accent group-hover:scale-110 transition-transform">
                      {t.count}
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Right Column: Terminal Logs */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="lg:col-span-2 glass-panel rounded-2xl flex flex-col h-[760px] overflow-hidden border-cyber-border/50"
      >
        {/* Terminal Header */}
        <div className="bg-[#0a0a0f] px-4 py-3 flex items-center border-b border-cyber-border/50">
          <div className="flex gap-2 mr-4">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
          </div>
          <div className="flex items-center gap-2 text-cyber-text-muted text-sm font-mono flex-1 justify-center -ml-12">
            <SquareTerminal className="w-4 h-4" />
            scraper-console ~ /bin/zsh
          </div>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 bg-[#050508] p-6 overflow-y-auto font-mono text-sm leading-relaxed">
          {logs.length === 0 ? (
            <div className="text-cyber-text-muted opacity-50 flex h-full items-center justify-center">
              等待任务启动...
            </div>
          ) : (
            <div className="space-y-1 pb-4">
              {logs.map((log, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className={`break-words ${
                    log.includes('INFO') ? 'text-cyber-accent' : 
                    log.includes('ERROR') ? 'text-[#ff5f56]' : 
                    log.includes('WARNING') ? 'text-[#ffbd2e]' : 
                    'text-cyber-text'
                  }`}
                >
                  {log}
                </motion.div>
              ))}
              {status === 'running' && (
                <div className="flex items-center text-cyber-accent mt-2">
                  <span className="animate-pulse">_</span>
                </div>
              )}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;