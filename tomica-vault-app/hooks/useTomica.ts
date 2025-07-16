import { determineTomicaSituation } from '@/utils/tomicaUtils';
import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { useAuth } from './useAuth';

export type Tomica = Database['public']['Tables']['owned_tomica']['Row'];

export interface TomicaStats {
  total: number;
  checkedOut: number;
  checkedIn: number;
  missing: number;
  recentActivity: {
    name: string;
    action: 'チェックイン' | 'チェックアウト' | 'まいご' | 'タッチ';
    timestamp: string;
  }[];
}

export function useTomica() {
  const { user, loading: authLoading } = useAuth();
  const [tomicaList, setTomicaList] = useState<Tomica[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TomicaStats | null>(null);

  // 共通のエラーハンドリング
  const handleError = (err: unknown) => {
    setError(err instanceof Error ? err.message : 'エラーが発生しました');
  };

  // 認証チェック
  const checkAuth = () => {
    console.log('checkAuth - authLoading:', authLoading, 'user:', user ? user.id : 'null');
    if (authLoading) {
      throw new Error('認証状態を確認中です');
    }
    if (!user) {
      console.error('認証エラー: ユーザーがnull');
      throw new Error('ログインが必要です');
    }
    return user.id;
  };

  // スキーマ更新済みフラグ
  const isSchemaUpdated = () => {
    return true; // フェーズ1のマイグレーション完了
  };

  // おもちゃ一覧を取得
  const fetchTomicaList = useCallback(async () => {
    // 認証ローディング中は処理を行わない
    if (authLoading) {
      console.log('fetchTomicaList - まだ認証確認中');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const userId = checkAuth(); // 認証チェック
      console.log('fetchTomicaList - userId:', userId);
      
      // まず所有権テーブルからユーザーのおもちゃIDを取得
      const { data: ownershipData, error: ownershipError } = await supabase
        .from('user_tomica_ownership')
        .select('tomica_id')
        .eq('user_id', userId);
      
      if (ownershipError) {
        console.error('所有権取得エラー:', ownershipError);
        throw ownershipError;
      }
      
      console.log('ユーザーの所有権:', ownershipData);
      
      if (!ownershipData || ownershipData.length === 0) {
        console.log('所有権なし - 空の配列を返す');
        setTomicaList([]);
        return;
      }
      
      const tomicaIds = ownershipData.map(o => o.tomica_id);
      console.log('取得するおもちゃID:', tomicaIds);
      
      // 次におもちゃの詳細を取得
      const { data, error } = await supabase
        .from('owned_tomica')
        .select('*')
        .in('id', tomicaIds)
        .is('deleted_at', null)
        .order('name', { ascending: true });
      
      if (error) {
        console.error('おもちゃ取得エラー:', error);
        throw error;
      }
      
      console.log('取得したおもちゃ:', data);
      setTomicaList(data || []);
    } catch (err) {
      console.error('fetchTomicaList エラー:', err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  // おもちゃを検索
  const searchTomica = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const userId = checkAuth(); // 認証チェック
      
      // まず所有権テーブルからユーザーのおもちゃIDを取得
      const { data: ownershipData, error: ownershipError } = await supabase
        .from('user_tomica_ownership')
        .select('tomica_id')
        .eq('user_id', userId);
      
      if (ownershipError) throw ownershipError;
      
      if (!ownershipData || ownershipData.length === 0) {
        setTomicaList([]);
        return;
      }
      
      const tomicaIds = ownershipData.map(o => o.tomica_id);
      
      // 次におもちゃの詳細を検索
      const { data, error } = await supabase
        .from('owned_tomica')
        .select('*')
        .in('id', tomicaIds)
        .ilike('name', `%${query}%`)
        .is('deleted_at', null)
        .order('name', { ascending: true });
      
      if (error) throw error;
      setTomicaList(data || []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // おもちゃの詳細を取得
  const getTomicaById = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const userId = checkAuth(); // 認証チェック
      
      // 所有権チェック
      const { data: ownershipData, error: ownershipError } = await supabase
        .from('user_tomica_ownership')
        .select('tomica_id')
        .eq('user_id', userId)
        .eq('tomica_id', id)
        .single();
      
      if (ownershipError || !ownershipData) {
        throw new Error('このおもちゃにアクセスする権限がありません');
      }
      
      // おもちゃの詳細を取得
      const { data, error } = await supabase
        .from('owned_tomica')
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
  }, [user]);

  // NFCタグIDでおもちゃを検索
  const getTomicaByNfcTagId = useCallback(async (nfcTagUid: string) => {
    setLoading(true);
    setError(null);
    try {
      const userId = checkAuth(); // 認証チェック
      
      // まず所有権テーブルからユーザーのおもちゃIDを取得
      const { data: ownershipData, error: ownershipError } = await supabase
        .from('user_tomica_ownership')
        .select('tomica_id')
        .eq('user_id', userId);
      
      if (ownershipError) throw ownershipError;
      
      if (!ownershipData || ownershipData.length === 0) {
        return null;
      }
      
      const tomicaIds = ownershipData.map(o => o.tomica_id);
      
      // 次にNFCタグUIDでおもちゃを検索
      const { data, error } = await supabase
        .from('owned_tomica')
        .select('*')
        .in('id', tomicaIds)
        .eq('nfc_tag_uid', nfcTagUid)
        .is('deleted_at', null)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // データが見つからない場合
          return null;
        }
        throw error;
      }
      
      return data;
    } catch (err) {
      // NFCタグが見つからない場合はnullを返す（エラーではない）
      if (err instanceof Error && err.message.includes('JSON object requested, multiple (or no) rows returned')) {
        return null;
      }
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // NFCスキャン日時を更新
  const updateNfcScanTime = useCallback(async (id: number) => {
    setError(null);
    try {
      const userId = checkAuth(); // 認証チェック
      
      // 所有権チェック
      const { data: ownershipData, error: ownershipError } = await supabase
        .from('user_tomica_ownership')
        .select('tomica_id')
        .eq('user_id', userId)
        .eq('tomica_id', id)
        .single();
      
      if (ownershipError || !ownershipData) {
        throw new Error('このおもちゃを更新する権限がありません');
      }
      
      const now = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00');
      const { error } = await supabase
        .from('owned_tomica')
        .update({
          scanned_at: now,
          updated_at: now,
        })
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  }, [user]);

  // 統計情報を計算
  const calculateStats = useCallback((tomicaData: Tomica[]): TomicaStats => {
    const total = tomicaData.length;
    let checkedOut = 0;
    let checkedIn = 0;
    let missing = 0;
    const recentActivity: TomicaStats['recentActivity'] = [];

    tomicaData.forEach(tomica => {
      const { scanned_at } = tomica;
      const situation = determineTomicaSituation(tomica);

      // 状態に基づいて統計を集計
      switch (situation) {
        case 'まいご':
          missing++;
          break;
        case 'おでかけ':
          checkedOut++;
          break;
        case 'おうち':
          checkedIn++;
          break;
      }

      // スキャン履歴をRecentActivityに追加
      if (scanned_at) {
        recentActivity.push({
          name: tomica.name,
          action: 'タッチ',
          timestamp: scanned_at,
        });
      }
    });

    // スキャン履歴を最新5件に絞り込み
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      total,
      checkedOut,
      checkedIn,
      missing,
      recentActivity: recentActivity.slice(0, 5),
    };
  }, []);

  // 統計情報を取得
  const fetchStats = useCallback(async () => {
    // 認証ローディング中は処理を行わない
    if (authLoading) {
      console.log('fetchStats - まだ認証確認中');
      return;
    }
    
    try {
      const userId = checkAuth(); // 認証チェック
      setLoading(true);
      
      // まず所有権テーブルからユーザーのおもちゃIDを取得
      const { data: ownershipData, error: ownershipError } = await supabase
        .from('user_tomica_ownership')
        .select('tomica_id')
        .eq('user_id', userId);
      
      if (ownershipError) throw ownershipError;
      
      if (!ownershipData || ownershipData.length === 0) {
        setStats({
          total: 0,
          checkedOut: 0,
          checkedIn: 0,
          missing: 0,
          recentActivity: [],
        });
        return;
      }
      
      const tomicaIds = ownershipData.map(o => o.tomica_id);
      
      // 次におもちゃの詳細を取得
      const { data, error } = await supabase
        .from('owned_tomica')
        .select('*')
        .in('id', tomicaIds)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      const calculatedStats = calculateStats(data || []);
      setStats(calculatedStats);
    } catch (err) {
      console.error('fetchStats エラー:', err);
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [calculateStats, user, authLoading]);

  // 新規おもちゃを追加
  const addTomica = useCallback(
    async (tomicaData: {
      name: string;
      notes?: string;
      nfcTagUid: string; // 必須に変更
    }) => {
      setLoading(true);
      setError(null);
      try {
        const userId = checkAuth(); // 認証チェック

        // NFCタグIDの重複チェック（ユーザー別）
        // まず所有権テーブルからユーザーのおもちゃIDを取得
        const { data: userTomicaIds, error: ownershipError } = await supabase
          .from('user_tomica_ownership')
          .select('tomica_id')
          .eq('user_id', userId);
        
        if (ownershipError) {
          console.error('所有権取得エラー:', ownershipError);
          throw ownershipError;
        }
        
        if (userTomicaIds && userTomicaIds.length > 0) {
          const tomicaIds = userTomicaIds.map(o => o.tomica_id);
          
          // ユーザーの所有するおもちゃでNFCタグの重複チェック
          const { data: existingData, error: checkError } = await supabase
            .from('owned_tomica')
            .select('id, name')
            .in('id', tomicaIds)
            .eq('nfc_tag_uid', tomicaData.nfcTagUid)
            .is('deleted_at', null);
            
          if (checkError) {
            console.error('重複チェックエラー:', checkError);
            throw checkError;
          }
          
          if (existingData && existingData.length > 0) {
            throw new Error(`このNFCタグは既に「${existingData[0].name}」に登録されています`);
          }
        }

        // JSTで保存
        const now = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00');
        
        const insertData = {
          name: tomicaData.name,
          memo: tomicaData.notes || null,
          nfc_tag_uid: tomicaData.nfcTagUid,
          check_in_at: now, // 新規登録時は帰宅中として登録
          checked_out_at: null,
          purchase_date: now,
          created_at: now,
          updated_at: now,
        };

        console.log('挿入データ:', insertData);

        // トランザクション的におもちゃと所有権を同時に作成
        const { data: tomicaResult, error: tomicaError } = await supabase
          .from('owned_tomica')
          .insert(insertData)
          .select()
          .single();

        if (tomicaError) {
          console.error('おもちゃ作成エラー:', tomicaError);
          throw tomicaError;
        }

        // 所有権レコードを作成
        const { error: insertOwnershipError } = await supabase
          .from('user_tomica_ownership')
          .insert({
            user_id: userId,
            tomica_id: tomicaResult.id,
            is_shared_with_family: false,
          });

        if (insertOwnershipError) {
          console.error('所有権作成エラー:', insertOwnershipError);
          // おもちゃレコードをロールバック
          await supabase
            .from('owned_tomica')
            .delete()
            .eq('id', tomicaResult.id);
          throw insertOwnershipError;
        }

        console.log('作成成功:', tomicaResult);

        // リストを更新
        setTomicaList((prev) => [...prev, tomicaResult]);
        return tomicaResult;
      } catch (err) {
        console.error('addTomica エラー:', err);
        handleError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // おもちゃを更新
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
        const userId = checkAuth(); // 認証チェック

        // 所有権チェック
        const { data: ownershipData, error: ownershipError } = await supabase
          .from('user_tomica_ownership')
          .select('tomica_id')
          .eq('user_id', userId)
          .eq('tomica_id', id)
          .single();
        
        if (ownershipError || !ownershipData) {
          throw new Error('このおもちゃを更新する権限がありません');
        }

        // JSTで保存
        const now = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00');
        const timeUpdates =
          updates.situation === '帰宅中'
            ? { check_in_at: now, checked_out_at: null }
            : { checked_out_at: now, check_in_at: null };

        const { error: updateError } = await supabase
          .from('owned_tomica')
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
          .from('owned_tomica')
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
    [user]
  );

  // おもちゃを削除（論理削除）
  const deleteTomica = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);
      try {
        const userId = checkAuth(); // 認証チェック

        // 所有権チェック
        const { data: ownershipData, error: ownershipError } = await supabase
          .from('user_tomica_ownership')
          .select('tomica_id')
          .eq('user_id', userId)
          .eq('tomica_id', id)
          .single();

        if (ownershipError || !ownershipData) {
          throw new Error('このおもちゃを削除する権限がありません');
        }

        // JSTで削除日時を保存
        const now = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00');
        const { error: updateError } = await supabase
          .from('owned_tomica')
          .update({ deleted_at: now, updated_at: now })
          .eq('id', id);
        if (updateError) throw updateError;

        // ローカルリストからも削除
        setTomicaList((prev) => prev.filter((t) => t.id !== id));
        return true;
      } catch (err) {
        handleError(err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return {
    tomicaList,
    loading,
    error,
    stats,
    fetchTomicaList,
    searchTomica,
    getTomicaById,
    getTomicaByNfcTagId,
    updateNfcScanTime,
    fetchStats,
    calculateStats,
    addTomica,
    updateTomica,
    deleteTomica, // 追加
  };
} 