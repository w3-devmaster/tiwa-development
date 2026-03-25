'use client';
import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getChatMessages } from '@/lib/api';
import { chatMessages as mockMessages } from '@/data/mockData';
import { useAppStore } from '@/store/useAppStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6769';

interface ChatMsg {
  sender: string;
  senderType: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export function useChat(roomId: string) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const useMock = useAppStore((s) => s.useMockData);

  useEffect(() => {
    if (useMock) {
      setMessages(
        mockMessages.map((m) => ({
          sender: m.name || m.sender,
          senderType: m.sender as 'user' | 'agent',
          content: m.text,
          timestamp: new Date(),
        })),
      );
      return;
    }

    // Load history
    getChatMessages(roomId)
      .then((msgs) => {
        setMessages(
          msgs.map((m: any) => ({
            sender: m.sender,
            senderType: m.senderType,
            content: m.content,
            timestamp: new Date(m.timestamp),
          })),
        );
      })
      .catch(() => {});

    // Connect socket for real-time
    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    setSocket(s);

    s.on('chat:message', (msg: any) => {
      if (msg.roomId === roomId) {
        setMessages((prev) => [
          ...prev,
          {
            sender: msg.sender,
            senderType: msg.senderType,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
          },
        ]);
      }
    });

    return () => {
      s.disconnect();
    };
  }, [roomId, useMock]);

  const sendMessage = useCallback(
    (content: string) => {
      const msg: ChatMsg = {
        sender: 'You',
        senderType: 'user',
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, msg]);
      if (socket) {
        socket.emit('chat:send', { roomId, sender: 'You', content });
      }
    },
    [socket, roomId],
  );

  return { messages, sendMessage };
}
