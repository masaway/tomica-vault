import { useState, useCallback } from 'react';
import { supabase, TOMICA_TABLE } from '../lib/supabase';
import { Database } from '../types/supabase';

export type Tomica = Database['public']['Tables']['owned_tomica']['Row'];

export function useTomica() {
  const [tomicaList, setTomicaList] = useState<Tomica[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 共通のエラーハンドリング
  const handleError = (err: unknown) => {
    setError(err instanceof Error ? err.message : 'エラーが発生しました');
  };

  // トミカ一覧を取得
  const fetchTomicaList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from(TOMICA_TABLE)
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true });
      if (error) throw error;
      setTomicaList(data || []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // トミカを検索
  const searchTomica = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from(TOMICA_TABLE)
        .select('*')
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true });
      if (error) throw error;
      setTomicaList(data || []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // トミカの詳細を取得
  const getTomicaById = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from(TOMICA_TABLE)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // トミカを更新
  const updateTomica = useCallback(
    async (
      id: number,
      updates: {
        name: string;
        situation: '外出中' | '帰宅中';
        notes: string;
      }
    ) => {
      setLoading(true);
      setError(null);
      try {
        const now = new Date().toISOString();
        const timeUpdates =
          updates.situation === '帰宅中'
            ? { check_in_at: now, checked_out_at: null }
            : { checked_out_at: now, check_in_at: null };

        const { error: updateError } = await supabase
          .from(TOMICA_TABLE)
          .update({
            name: updates.name,
            memo: updates.notes,
            ...timeUpdates,
            updated_at: now,
          })
          .eq('id', id);
        if (updateError) throw updateError;

        // 最新データ取得
        const { data, error: fetchError } = await supabase
          .from(TOMICA_TABLE)
          .select('*')
          .eq('id', id)
          .single();
        if (fetchError) throw fetchError;

        setTomicaList((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...data } : t))
        );
        return data;
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    tomicaList,
    loading,
    error,
    fetchTomicaList,
    searchTomica,
    getTomicaById,
    updateTomica,
  };
} 