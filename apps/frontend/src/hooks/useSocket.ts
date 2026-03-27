'use client';
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/useAppStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6769';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const qc = useQueryClient();
  const setConnectionStatus = useAppStore((s) => s.setConnectionStatus);
  const useMock = useAppStore((s) => s.useMockData);

  useEffect(() => {
    if (useMock) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnectionStatus('connected'));
    socket.on('disconnect', () => setConnectionStatus('disconnected'));
    socket.on('reconnecting', () => setConnectionStatus('reconnecting'));

    // Invalidate caches on real-time events
    socket.on('agent:status', () => {
      qc.invalidateQueries({ queryKey: ['agents'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    });
    socket.on('task:update', () => {
      qc.invalidateQueries({ queryKey: ['taskBoard'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    });
    socket.on('workflow:update', () => {
      qc.invalidateQueries({ queryKey: ['workflows'] });
    });
    socket.on('worker:update', () => {
      qc.invalidateQueries({ queryKey: ['workers'] });
    });
    socket.on('service:restart', (data: { name: string; progress: number; phase: string }) => {
      const store = useAppStore.getState();
      if (store.restartingService === data.name) {
        store.setRestarting(data.name, data.progress, data.phase);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [useMock, qc, setConnectionStatus]);

  const getSocket = useCallback(() => socketRef.current, []);
  return { getSocket };
}
