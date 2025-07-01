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
    action: 'チェックイン' | 'チェックアウト' | '家出中';
    timestamp: string;
  }[];
}

export function useTomica() {
  const [tomicaList, setTomicaList] = useState<Tomica[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TomicaStats | null>(null);

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

  // 統計情報を計算
  const calculateStats = useCallback((tomicaData: Tomica[]): TomicaStats => {
    const total = tomicaData.length;
    let checkedOut = 0;
    let checkedIn = 0;
    const recentActivity: TomicaStats['recentActivity'] = [];

    tomicaData.forEach(tomica => {
      const { check_in_at, checked_out_at } = tomica;

      // 家出中判定
      let isMissing = false;
      let missingTimestamp: string | null = null;

      if (check_in_at === null && checked_out_at) {
        const checkedOutDate = new Date(checked_out_at).getTime();
        const now = Date.now();
        if (now - checkedOutDate >= 48 * 60 * 60 * 1000) {
          isMissing = true;
          // 家出中になったタイミング = checked_out_at + 48h
          missingTimestamp = new Date(checkedOutDate + 48 * 60 * 60 * 1000).toISOString();
        }
      } else if (check_in_at && checked_out_at) {
        const checkedInDate = new Date(check_in_at).getTime();
        const checkedOutDate = new Date(checked_out_at).getTime();
        if (checkedInDate < checkedOutDate) {
          const now = Date.now();
          if (now - checkedOutDate >= 48 * 60 * 60 * 1000) {
            isMissing = true;
            missingTimestamp = new Date(checkedOutDate + 48 * 60 * 60 * 1000).toISOString();
          }
        }
      }

      if (isMissing && missingTimestamp) {
        recentActivity.push({
          name: tomica.name,
          action: '家出中',
          timestamp: missingTimestamp,
        });
      }

      // 既存の集計
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
    });

    // 家出中通知のみ最新5件
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      total,
      checkedOut,
      checkedIn,
      recentActivity: recentActivity.slice(0, 5),
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
        // JSTで保存
        const now = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00');
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
    stats,
    fetchTomicaList,
    searchTomica,
    getTomicaById,
    fetchStats,
    calculateStats,
    updateTomica,
  };
} 