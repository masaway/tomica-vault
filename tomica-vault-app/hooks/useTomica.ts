import { useState } from 'react';
import { supabase, TOMICA_TABLE } from '../lib/supabase';
import { Database } from '../types/supabase';

export type Tomica = Database['public']['Tables']['owned_tomica']['Row'];

export function useTomica() {
  const [tomicaList, setTomicaList] = useState<Tomica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // トミカ一覧を取得
  const fetchTomicaList = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(TOMICA_TABLE)
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (error) throw error;
      setTomicaList(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // トミカを検索
  const searchTomica = async (query: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(TOMICA_TABLE)
        .select('*')
        .or(`name.ilike.%${query}%,series.ilike.%${query}%`)
        .order('name', { ascending: true });

      if (error) throw error;
      setTomicaList(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // トミカの詳細を取得
  const getTomicaById = async (id: number) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(TOMICA_TABLE)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    tomicaList,
    loading,
    error,
    fetchTomicaList,
    searchTomica,
    getTomicaById,
  };
} 