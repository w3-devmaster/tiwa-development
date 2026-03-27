'use client';
import { useState, useEffect, useRef } from 'react';
import { useRawAgents } from '@/hooks/useAgents';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6769';

interface LogEntry {
  id: string;
  agentName: string;
  message: string;
  level: string;
  timestamp: string;
}

export default function AgentDetailPanel({ agentId, onClose }: { agentId: string; onClose: () => void }) {
  const { data: agents } = useRawAgents();
  const agent = agents?.find((a: any) => a.id === agentId);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

    socket.on('log:entry', (log: any) => {
      if (log.agentId === agentId || log.agentName === agent?.name) {
        setLogs((prev) => [...prev.slice(-99), {
          id: log.id || Date.now().toString(),
          agentName: log.agentName || '',
          message: log.message || '',
          level: log.level || 'info',
          timestamp: log.timestamp || new Date().toISOString(),
        }]);
      }
    });

    socket.on('task:update', (task: any) => {
      if (task.assignedAgentId === agentId || task.assignedAgent?.id === agentId) {
        setLogs((prev) => [...prev.slice(-99), {
          id: Date.now().toString(),
          agentName: agent?.name || '',
          message: `Task "${task.title}" updated to ${task.status}`,
          level: 'info',
          timestamp: new Date().toISOString(),
        }]);
      }
    });

    return () => { socket.disconnect(); };
  }, [agentId, agent?.name]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!agent) return null;

  const avatar = agent.displayConfig?.avatar || { bg: 'linear-gradient(135deg,#6c5ce7,#a29bfe)', letter: agent.name?.[0] || '?' };
  const role = agent.displayConfig?.role || agent.role || 'Agent';

  const statusColor = agent.status === 'working' || agent.status === 'busy' ? '#fdcb6e'
    : agent.status === 'error' ? '#e17055'
    : '#00b894';

  return (
    <div className="fixed top-0 right-0 h-full w-[400px] bg-[#111422] border-l border-[#2a2e45] z-50 flex flex-col shadow-[-8px_0_30px_rgba(0,0,0,.5)]">
      {/* Header */}
      <div className="p-4 border-b border-[#2a2e45] flex items-center gap-3">
        <button
          onClick={onClose}
          className="text-[#7b7f9e] hover:text-white transition-colors text-sm"
        >
          ✕
        </button>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white"
          style={{ background: avatar.bg }}
        >
          {avatar.letter}
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">{agent.name}</div>
          <div className="text-[10px] text-[#7b7f9e]">{role}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
          <span className="text-[10px] text-[#7b7f9e] capitalize">{agent.status || 'idle'}</span>
        </div>
      </div>

      {/* Agent info */}
      <div className="p-4 border-b border-[#2a2e45] space-y-2">
        <div className="flex gap-4 text-xs">
          <span className="text-[#7b7f9e]">Department: <span className="text-[#e4e6f0]">{agent.department}</span></span>
          <span className="text-[#7b7f9e]">Model: <span className="text-[#e4e6f0]">{agent.model}</span></span>
        </div>
        {agent.task && (
          <div className="bg-[#0a0c14] border border-[#2a2e45] rounded-lg p-2.5">
            <div className="text-[9px] text-[#7b7f9e] uppercase tracking-wider mb-1">Current Task</div>
            <div className="text-xs text-[#e4e6f0]">{agent.task}</div>
          </div>
        )}
        {agent.skills && agent.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {agent.skills.map((skill: any) => (
              <span key={skill.id} className="text-[9px] px-2 py-0.5 rounded-md bg-[#6c5ce722] text-[#a29bfe] font-medium">
                {skill.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Logs */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-2 text-[10px] text-[#7b7f9e] uppercase tracking-wider font-semibold border-b border-[#2a2e45]">
          Realtime Logs
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {logs.length === 0 && (
            <div className="text-center py-8 text-[#555878] text-xs">
              Waiting for activity...
            </div>
          )}
          {logs.map((log) => (
            <div key={log.id} className="text-xs bg-[#0a0c14] rounded-lg px-3 py-2 border border-[#2a2e45]">
              <div className="flex items-center justify-between mb-0.5">
                <span className={`font-semibold ${
                  log.level === 'error' ? 'text-[#e17055]' : log.level === 'warn' ? 'text-[#fdcb6e]' : 'text-[#00b894]'
                }`}>
                  {log.level.toUpperCase()}
                </span>
                <span className="text-[9px] text-[#555878]">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-[#c8cad8]">{log.message}</p>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
