'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface WorkerOutputLine {
  taskId: string;
  workerId: string;
  chunk: string;
  stream: 'stdout' | 'stderr';
  timestamp: string;
}

const MAX_LINES = 500;

export function useWorkerOutput(taskId?: string) {
  const [output, setOutput] = useState<WorkerOutputLine[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(API_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('worker:output', (data: WorkerOutputLine) => {
      if (taskId && data.taskId !== taskId) return;
      setOutput((prev) => {
        const next = [...prev, data];
        return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [taskId]);

  const clear = useCallback(() => setOutput([]), []);

  return { output, clear };
}
