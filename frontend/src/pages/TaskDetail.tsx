import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Download, X, FileText, Link as LinkIcon, Hash, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_BASE = 'http://localhost:8000/api';

const TaskDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/tasks/${id}/results`);
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleExport = () => {
    window.location.href = `${API_BASE}/tasks/${id}/export`;
  };

  const renderBadge = (link: string, name: string, colorClass: string) => {
    if (!link) return null;
    return (
      <a 
        href={link} 
        target="_blank" 
        rel="noreferrer" 
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-opacity-10 hover:bg-opacity-20 transition-colors",
          colorClass
        )}
        onClick={e => e.stopPropagation()}
      >
        <LinkIcon className="w-3 h-3" />
        {name}
      </a>
    );
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto relative">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8"
      >
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 rounded-full hover:bg-cyber-surface text-cyber-text-muted hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <FileText className="text-cyber-accent" />
              数据详情
            </h1>
            <p className="text-cyber-text-muted font-mono text-sm mt-1">ID: {id}</p>
          </div>
        </div>

        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-cyber-surface border border-cyber-accent text-cyber-accent px-5 py-2.5 rounded-xl hover:shadow-[0_0_15px_var(--color-cyber-accent-glow)] transition-all font-medium"
        >
          <Download className="w-4 h-4" />
          导出 Excel
        </button>
      </motion.div>

      {/* Main Table */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-panel rounded-2xl overflow-hidden border-cyber-border"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cyber-surface border-b border-cyber-border">
                <th className="py-4 px-6 text-cyber-text-muted font-medium text-sm">游戏名称</th>
                <th className="py-4 px-6 text-cyber-text-muted font-medium text-sm">标签</th>
                <th className="py-4 px-6 text-cyber-text-muted font-medium text-sm">直达链接</th>
                <th className="py-4 px-6 text-cyber-text-muted font-medium text-sm w-[300px]">网盘资源</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border">
              {loading ? (
                <tr><td colSpan={4} className="py-12 text-center text-cyber-text-muted animate-pulse">正在加载数据...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-cyber-text-muted">此任务没有抓取到数据。</td></tr>
              ) : (
                data.map((item, i) => (
                  <tr 
                    key={i} 
                    onClick={() => setSelectedItem(item)}
                    className="hover:bg-cyber-surface/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-5 px-6">
                      <div className="font-medium text-white group-hover:text-cyber-accent transition-colors line-clamp-2">
                        {item['标题']}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex flex-wrap gap-2">
                        {item['标签'].split(',').filter(Boolean).map((t: string, idx: number) => (
                          <span key={idx} className="inline-flex items-center gap-1 text-xs text-cyber-text-muted bg-cyber-bg border border-cyber-border px-2 py-1 rounded-md">
                            <Hash className="w-3 h-3 opacity-50" />
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <a 
                        href={item['页面链接']} 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-cyber-text-muted hover:text-white transition-colors"
                        title="打开原网页"
                      >
                        <Globe className="w-5 h-5" />
                      </a>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex flex-wrap gap-2">
                        {renderBadge(item['夸克网盘'], '夸克网盘', 'text-blue-400 border-blue-500/30 bg-blue-500')}
                        {renderBadge(item['百度网盘'], '百度网盘', 'text-red-400 border-red-500/30 bg-red-500')}
                        {renderBadge(item['迅雷网盘'], '迅雷网盘', 'text-blue-500 border-blue-600/30 bg-blue-600')}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Markdown Drawer Overlay */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] lg:w-[800px] bg-[#121218] border-l border-cyber-border z-50 flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex justify-between items-start p-6 border-b border-cyber-border bg-[#1a1a24]/80 backdrop-blur-md sticky top-0 z-10">
                <div className="pr-8">
                  <h2 className="text-xl font-bold text-white mb-2 leading-snug">{selectedItem['标题']}</h2>
                  <div className="flex flex-wrap gap-2">
                    {renderBadge(selectedItem['夸克网盘'], '夸克网盘直达', 'text-blue-400 border-blue-500/30 bg-blue-500')}
                    {renderBadge(selectedItem['百度网盘'], '百度网盘直达', 'text-red-400 border-red-500/30 bg-red-500')}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="p-2 rounded-full hover:bg-cyber-border text-cyber-text-muted hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Drawer Content - Markdown */}
              <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
                <article className="prose prose-invert max-w-none prose-a:text-cyber-accent hover:prose-a:text-green-400 prose-img:mx-auto">
                  <ReactMarkdown>
                    {selectedItem['页面信息'] || '*暂无详细介绍信息*'}
                  </ReactMarkdown>
                </article>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default TaskDetail;