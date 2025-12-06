
import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/app/integrations/supabase/client';

export type LLMParamsJSON = {
  prompt: string;
  images?: string[];
  system?: string;
  temperature?: number;
  max_tokens?: number;
  format?: 'text' | 'markdown' | 'json';
  model?: string;
};

export type LLMResult = {
  text: string;
  duration_ms: number;
  model: string;
  input_images: number;
  tokens?: { prompt?: number; completion?: number; total?: number };
  format?: string;
};

type State =
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: LLMResult; error: null }
  | { status: 'error'; data: null; error: string };

export function useLLM() {
  const [state, setState] = useState<State>({ status: 'idle', data: null, error: null });
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => setState({ status: 'idle', data: null, error: null }), []);
  const abort = useCallback(() => { abortRef.current?.abort(); abortRef.current = null; }, []);

  const generateText = useCallback(async (params: LLMParamsJSON): Promise<LLMResult | null> => {
    const prompt = (params.prompt ?? '').trim();
    if (prompt.length < 3) {
      setState({ status: 'error', data: null, error: 'Prompt must be at least 3 characters.' });
      return null;
    }
    setState({ status: 'loading', data: null, error: null });
    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const { data, error } = await supabase.functions.invoke('generate-text', {
        body: {
          prompt,
          images: params.images ?? [],
          system: params.system,
          temperature: params.temperature,
          max_tokens: params.max_tokens,
          format: params.format,
          model: params.model,
        },
      });

      if (error) throw new Error(error.message || 'Function error');

      const result = data as LLMResult;
      setState({ status: 'success', data: result, error: null });
      return result;
    } catch (e: any) {
      if (e?.name === 'AbortError') return null;
      setState({ status: 'error', data: null, error: e?.message ?? 'Unknown error' });
      return null;
    } finally {
      abortRef.current = null;
    }
  }, []);

  const loading = state.status === 'loading';
  const error = state.status === 'error' ? state.error : null;
  const data = state.status === 'success' ? state.data : null;

  return { generateText, loading, error, data, reset, abort };
}
