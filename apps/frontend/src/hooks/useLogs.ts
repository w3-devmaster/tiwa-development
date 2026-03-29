'use client';
import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getLogs } from '@/lib/api';
import { apiLogToLogEntry } from '@/lib/adapters';
import { logEntries as mockLogs, LogEntry } from '@/data/mockData';
import { useAppStore } from '@/store/useAppStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6769';
const MAX_LOGS = 40;

export function useLiveLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const useMock = useAppStore((s) => s.useMockData);

  useEffect(() => {
    if (useMock) {
      // Same behavior as current BottomPanel mock - cycle through mockLogs
      setLogs(mockLogs.slice(0, 6));
      let idx = 6;
      const timer = setInterval(() => {
        setLogs((prev) => {
          const next = [...prev, mockLogs[idx % mockLogs.length]];
          idx++;
          return next.slice(-MAX_LOGS);
        });
      }, 3500);
      return () => clearInterval(timer);
    }

    // Load initial logs
    getLogs(undefined, 20)
      .then((data) => {
        setLogs(data.reverse().map(apiLogToLogEntry));
      })
      .catch(() => {});

    // Real-time log events
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.on('log:entry', (log: any) => {
      setLogs((prev) => [...prev, apiLogToLogEntry(log)].slice(-MAX_LOGS));
    });

    return () => {
      socket.disconnect();
    };
  }, [useMock]);

  const filterByDept = useCallback(
    (dept: string) => {
      if (dept === 'all') return logs;
      const deptMap: Record<string, string> = {
        planner: 'pl',
        architect: 'ar',
        builder: 'bu',
        tester: 'te',
        reviewer: 'rv',
        devops: 'dv',
      };
      return logs.filter((l) => l.dept === deptMap[dept]);
    },
    [logs],
  );

  return { logs, filterByDept };
}
