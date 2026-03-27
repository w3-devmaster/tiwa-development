'use client';
import { useQuery } from '@tanstack/react-query';
import { getServiceStatuses } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

export function useServiceStatus() {
  const useMock = useAppStore((s) => s.useMockData);
  return useQuery({
    queryKey: ['serviceStatus'],
    queryFn: async () => {
      if (useMock) {
        return [
          { name: 'api', label: 'API Server', status: 'online', details: 'Running', restartable: false },
          { name: 'database', label: 'Database', status: 'online', details: 'Connected', restartable: true },
          { name: 'websocket', label: 'WebSocket', status: 'online', details: '1 client', restartable: true },
          { name: 'ai_provider', label: 'AI Provider', status: 'degraded', details: 'No providers', restartable: true },
          { name: 'workers', label: 'Workers', status: 'degraded', details: 'No workers', restartable: true },
        ];
      }
      return getServiceStatuses();
    },
    refetchInterval: 10000,
  });
}
