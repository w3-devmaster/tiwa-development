'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSettings,
  setProviderKey,
  setGeminiServiceAccount,
  setGeminiOAuthCredentials,
  setSettingsDefaults,
  removeProvider,
  clearAllSettings,
  testProvider,
  getGoogleAuthUrl,
  handleGoogleCallback,
} from '@/lib/api';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    refetchOnWindowFocus: true,
  });
}

export function useSetProviderKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, apiKey }: { provider: string; apiKey: string }) =>
      setProviderKey(provider, apiKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['orchestratorStatus'] });
    },
  });
}

export function useSetGeminiServiceAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serviceAccount: Record<string, unknown>) =>
      setGeminiServiceAccount(serviceAccount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['orchestratorStatus'] });
    },
  });
}

export function useSetGeminiOAuthCredentials() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, clientSecret }: { clientId: string; clientSecret: string }) =>
      setGeminiOAuthCredentials(clientId, clientSecret),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}

export function useSetDefaults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { model?: string; maxTokens?: number }) =>
      setSettingsDefaults(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}

export function useRemoveProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: string) => removeProvider(provider),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['orchestratorStatus'] });
    },
  });
}

export function useClearAllSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clearAllSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['orchestratorStatus'] });
    },
  });
}

export function useTestProvider() {
  return useMutation({
    mutationFn: (provider: string) => testProvider(provider),
  });
}

export function useGoogleAuthUrl() {
  return useMutation({
    mutationFn: (redirectUri: string) => getGoogleAuthUrl(redirectUri),
  });
}

export function useGoogleCallback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, redirectUri }: { code: string; redirectUri: string }) =>
      handleGoogleCallback(code, redirectUri),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['orchestratorStatus'] });
    },
  });
}
