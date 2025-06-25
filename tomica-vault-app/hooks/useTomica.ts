import { useState, useCallback } from 'react';
import { supabase, TOMICA_TABLE } from '../lib/supabase';
import { Database } from '../types/supabase';

export type Tomica = Database['public']['Tables']['owned_tomica']['Row'];

export interface TomicaStats {
  total: number;
  checkedOut: number;
  checkedIn: number;
  recentActivity: {
    name: string;
    action: 'チェックイン' | 'チェックアウト';
    timestamp: string;
  }[];
}

export function useTomica() {
  const [tomicaList, setTomicaList] = useState<Tomica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TomicaStats | null>(null);

  // トミカ一覧を取得
  const fetchTomicaList = useCallback(async () => {
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
  }, []);

  // トミカを検索
  const searchTomica = useCallback(async (query: string) => {
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
  }, []);

  // トミカの詳細を取得
  const getTomicaById = useCallback(async (id: number) => {
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
  }, []);

  // 統計情報を計算
  const calculateStats = useCallback((tomicaData: Tomica[]): TomicaStats => {
    const total = tomicaData.length;
    let checkedOut = 0;
    let checkedIn = 0;
    const recentActivity: TomicaStats['recentActivity'] = [];

    tomicaData.forEach(tomica => {
      const { check_in_at, checked_out_at } = tomica;
      
      // チェック状態を判定
      if (check_in_at === null) {
        checkedOut++;
      } else if (checked_out_at === null) {
        checkedIn++;
      } else {
        const checkedInDate = new Date(check_in_at).getTime();
        const checkedOutDate = new Date(checked_out_at).getTime();
        if (checkedInDate > checkedOutDate) {
          checkedIn++;
        } else {
          checkedOut++;
        }
      }

      // 最近のアクティビティを追加
      if (check_in_at) {
        recentActivity.push({
          name: tomica.name,
          action: 'チェックイン',
          timestamp: check_in_at
        });
      }
      if (checked_out_at) {
        recentActivity.push({
          name: tomica.name,
          action: 'チェックアウト',
          timestamp: checked_out_at
        });
      }
    });

    // 最近のアクティビティを時間順でソート（最新5件）
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return {
      total,
      checkedOut,
      checkedIn,
      recentActivity: recentActivity.slice(0, 5)
    };
  }, []);

  // 統計情報を取得
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(TOMICA_TABLE)
        .select('*')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      const calculatedStats = calculateStats(data || []);
      setStats(calculatedStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [calculateStats]);

  // トミカを更新
  const updateTomica = async (id: number, updates: {
    name: string;
    situation: '外出中' | '帰宅中';
    notes: string;
  }) => {
    try {
      setLoading(true);
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
    stats,
    fetchTomicaList,
    searchTomica,
    getTomicaById,
    fetchStats,
    calculateStats,
    updateTomica,
  };
} 