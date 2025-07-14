import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useDataMigration() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 移行が必要なデータがあるかチェック
  const checkMigrationNeeded = useCallback(async () => {
    if (!user) return false;

    try {
      // 所有権のないおもちゃレコードがあるかチェック
      const { data: orphanedTomica, error } = await supabase
        .from('owned_tomica')
        .select(`
          id,
          name,
          user_tomica_ownership(tomica_id)
        `)
        .is('deleted_at', null)
        .is('user_tomica_ownership.tomica_id', null);

      if (error) {
        console.error('移行チェックエラー:', error);
        return false;
      }

      return (orphanedTomica?.length || 0) > 0;
    } catch (err) {
      console.error('移行チェック例外:', err);
      return false;
    }
  }, [user]);

  // 現在のユーザーにデータを移行
  const migrateDataToCurrentUser = useCallback(async () => {
    if (!user) {
      throw new Error('ログインが必要です');
    }

    setLoading(true);
    setError(null);

    try {
      // 所有権のないおもちゃレコードを取得
      const { data: orphanedTomica, error: fetchError } = await supabase
        .from('owned_tomica')
        .select(`
          id,
          name,
          created_at,
          user_tomica_ownership(tomica_id)
        `)
        .is('deleted_at', null)
        .is('user_tomica_ownership.tomica_id', null);

      if (fetchError) {
        throw fetchError;
      }

      if (!orphanedTomica || orphanedTomica.length === 0) {
        console.log('移行が必要なデータはありません');
        return { migratedCount: 0 };
      }

      console.log(`${orphanedTomica.length}件のおもちゃを移行します`);

      // 所有権レコードを一括作成
      const ownershipRecords = orphanedTomica.map(tomica => ({
        user_id: user.id,
        tomica_id: tomica.id,
        is_shared_with_family: false,
        created_at: tomica.created_at,
        updated_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('user_tomica_ownership')
        .insert(ownershipRecords);

      if (insertError) {
        throw insertError;
      }

      console.log(`${orphanedTomica.length}件のトミカを正常に移行しました`);
      
      return { 
        migratedCount: orphanedTomica.length,
        migratedTomica: orphanedTomica 
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'データ移行中にエラーが発生しました';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 移行状況の詳細を取得
  const getMigrationStatus = useCallback(async () => {
    try {
      // 総トミカ数
      const { count: totalTomica } = await supabase
        .from('owned_tomica')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

      // 所有権があるトミカ数
      const { count: ownedTomica } = await supabase
        .from('user_tomica_ownership')
        .select('*', { count: 'exact', head: true });

      // ユーザー数
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      return {
        totalTomica: totalTomica || 0,
        ownedTomica: ownedTomica || 0,
        orphanedTomica: (totalTomica || 0) - (ownedTomica || 0),
        userCount: userCount || 0,
      };
    } catch (err) {
      console.error('移行状況取得エラー:', err);
      return {
        totalTomica: 0,
        ownedTomica: 0,
        orphanedTomica: 0,
        userCount: 0,
      };
    }
  }, []);

  return {
    loading,
    error,
    checkMigrationNeeded,
    migrateDataToCurrentUser,
    getMigrationStatus,
  };
}