import { useState, useEffect, useCallback } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url?: string;
  birth_date?: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
}

interface SignUpData {
  email: string;
  password: string;
  displayName?: string;
}

interface SignInData {
  email: string;
  password: string;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  });

  // プロファイル取得
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('プロファイル取得エラー:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('プロファイル取得例外:', error);
      return null;
    }
  };

  // 認証状態を更新（useCallbackで安定化）
  const updateAuthState = useCallback(async (session: Session | null) => {
    const newUserId = session?.user?.id || null;
    const currentUserId = authState.user?.id || null;
    
    // 同じユーザーIDの場合は更新をスキップ（無限ループ防止）
    if (newUserId === currentUserId && !authState.loading) {
      return;
    }
    
    try {
      if (session?.user) {
        // プロファイル取得は設定ページで実行するため、ここではスキップ
        setAuthState({
          user: session.user,
          session,
          profile: null,
          loading: false,
        });
      } else {
        setAuthState({
          user: null,
          session: null,
          profile: null,
          loading: false,
        });
      }
    } catch (error) {
      console.error('updateAuthState - エラー発生:', error);
      // エラーが発生してもloading状態は解除する
      setAuthState({
        user: session?.user || null,
        session: session || null,
        profile: null,
        loading: false,
      });
    }
  }, [authState.user?.id, authState.loading]);

  useEffect(() => {
    // 初期セッション取得
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('セッション取得エラー:', error);
      }
      await updateAuthState(session);
    };

    getInitialSession();

    // 認証状態の変更をリアルタイムで監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // 重要なイベントのみログ出力
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          console.log('認証状態変更:', event, session?.user?.email);
        }
        await updateAuthState(session);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [updateAuthState]);

  // サインアップ
  const signUp = async ({ email, password, displayName }: SignUpData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || 'ユーザー',
          },
        },
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('サインアップエラー:', error);
      return { data: null, error: error as AuthError };
    }
  };

  // サインイン
  const signIn = async ({ email, password }: SignInData) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('サインインエラー:', error);
      return { data: null, error: error as AuthError };
    }
  };

  // Googleログイン
  const signInWithGoogle = async () => {
    try {
      // WebBrowserの設定
      WebBrowser.maybeCompleteAuthSession();

      // リダイレクトURIを直接指定（Expo開発環境の自動生成を回避）
      const redirectTo = 'tomicavaultapp://auth/callback';

      console.log('Googleログイン開始 - redirectTo:', redirectTo);
      console.log('直接指定したリダイレクトURI:', redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('OAuth URL取得エラー:', error);
        throw error;
      }

      // OAuth認証URLをWebBrowserで開く
      if (data.url) {
        console.log('OAuth認証URL:', data.url);
        console.log('WebBrowser開始 - URL:', data.url);
        console.log('WebBrowser開始 - RedirectTo:', redirectTo);
        
        // iOS用の最適化された設定
        const browserOptions: WebBrowser.WebBrowserOpenOptions = {
          // iOS用設定
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.POPOVER,
          controlsColor: '#4facfe',
          // Android用設定  
          showTitle: true,
          toolbarColor: '#4facfe',
          secondaryToolbarColor: '#ffffff',
          enableBarCollapsing: false,
          // 共通設定
          showInRecents: true,
        };

        console.log('WebBrowser設定:', browserOptions);

        // タイムアウト付きでWebBrowserを実行
        const webBrowserPromise = WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo,
          browserOptions
        );

        // 30秒のタイムアウトを設定
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('認証がタイムアウトしました')), 30000);
        });

        console.log('WebBrowser呼び出し開始...');
        const result = await Promise.race([webBrowserPromise, timeoutPromise]) as WebBrowser.WebBrowserResult;
        console.log('WebBrowser完了');
        console.log('WebBrowser結果タイプ:', result.type);
        console.log('WebBrowser結果URL:', result.url);
        console.log('WebBrowser結果詳細:', JSON.stringify(result, null, 2));

        if (result.type === 'success' && result.url) {
          console.log('認証成功 URL:', result.url);
          
          // Supabaseのハッシュベースのトークン処理
          const url = result.url;
          let accessToken: string | null = null;
          let refreshToken: string | null = null;

          // URLパラメータから取得を試行
          try {
            const urlObj = new URL(url);
            accessToken = urlObj.searchParams.get('access_token');
            refreshToken = urlObj.searchParams.get('refresh_token');
          } catch (e) {
            console.log('URLパラメータ解析失敗、ハッシュから取得を試行');
          }

          // ハッシュから取得を試行（Supabaseの標準的な方法）
          if (!accessToken || !refreshToken) {
            const hashParams = new URLSearchParams(url.split('#')[1] || '');
            accessToken = hashParams.get('access_token');
            refreshToken = hashParams.get('refresh_token');
          }

          console.log('取得したトークン:', { 
            hasAccessToken: !!accessToken, 
            hasRefreshToken: !!refreshToken 
          });

          if (accessToken && refreshToken) {
            // セッションを設定
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error('セッション設定エラー:', sessionError);
              throw sessionError;
            }

            console.log('認証成功！ユーザー:', sessionData.user?.email);
            return { data: sessionData, error: null };
          } else {
            throw new Error('認証トークンが見つかりません');
          }
        }

        if (result.type === 'cancel') {
          console.log('ユーザーが認証をキャンセルしました');
          return { data: null, error: { message: 'User cancelled' } as AuthError };
        }

        if (result.type === 'dismiss') {
          console.log('認証ダイアログが閉じられました');
          return { data: null, error: { message: 'Authentication dismissed' } as AuthError };
        }

        throw new Error(`予期しない認証結果: ${result.type}`);
      }

      throw new Error('OAuth認証URLが取得できませんでした');
    } catch (error) {
      console.error('Googleログイン処理でエラーが発生:', error);
      
      // WebBrowser固有のエラーを詳細にログ出力
      if (error instanceof Error) {
        console.error('エラーメッセージ:', error.message);
        console.error('エラースタック:', error.stack);
        
        // 特定のエラータイプをチェック
        if (error.message.includes('タイムアウト')) {
          console.error('WebBrowser認証がタイムアウトしました');
        } else if (error.message.includes('WebAuthenticationSession')) {
          console.error('iOS WebAuthenticationSessionエラーが発生しました');
        }
      }
      
      return { data: null, error: error as AuthError };
    }
  };

  // サインアウト
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      return { error: null };
    } catch (error) {
      console.error('サインアウトエラー:', error);
      return { error: error as AuthError };
    }
  };

  // パスワードリセット
  const resetPassword = async (email: string) => {
    try {
      const redirectTo = Platform.OS === 'web' 
        ? `${window.location.origin}/reset-password`
        : 'tomicavaultapp://reset-password';

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
      return { data: null, error: error as AuthError };
    }
  };

  // パスワード更新
  const updatePassword = async (newPassword: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('パスワード更新エラー:', error);
      return { data: null, error: error as AuthError };
    }
  };

  // プロフィール更新（auth.users）
  const updateAuthProfile = async (updates: { email?: string; password?: string }) => {
    try {
      const { data, error } = await supabase.auth.updateUser(updates);

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      return { data: null, error: error as AuthError };
    }
  };

  // プロフィール更新（profiles テーブル）
  const updateUserProfile = async (updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>) => {
    if (!authState.user) {
      throw new Error('ログインが必要です');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', authState.user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 状態を更新
    setAuthState(prev => ({
      ...prev,
      profile: data,
    }));

    return data;
  };

  // ユーザーの認証方法を判定
  const getAuthProvider = (): 'email' | 'google' | 'unknown' => {
    if (!authState.user) {
      return 'unknown';
    }

    // app_metadataのproviderをチェック
    const provider = authState.user.app_metadata?.provider;
    if (provider === 'google') {
      return 'google';
    }
    if (provider === 'email') {
      return 'email';
    }

    // identitiesもチェック（より確実）
    const identities = authState.user.identities;
    if (identities && identities.length > 0) {
      const hasGoogle = identities.some(identity => identity.provider === 'google');
      if (hasGoogle) {
        return 'google';
      }
      const hasEmail = identities.some(identity => identity.provider === 'email');
      if (hasEmail) {
        return 'email';
      }
    }

    return 'unknown';
  };

  // OAuthユーザーかどうかを判定
  const isOAuthUser = (): boolean => {
    const provider = getAuthProvider();
    return provider !== 'email' && provider !== 'unknown';
  };

  // パスワードが設定されているかを判定
  const hasPassword = (): boolean => {
    // OAuthユーザーの場合、基本的にパスワードは設定されていない
    if (isOAuthUser()) {
      return false;
    }
    
    // emailユーザーの場合、パスワードが設定されている
    return getAuthProvider() === 'email';
  };

  // プロファイルを手動で設定する関数
  const setProfile = (profile: Profile | null) => {
    setAuthState(prev => ({
      ...prev,
      profile,
    }));
  };

  return {
    // 状態
    user: authState.user,
    session: authState.session,
    profile: authState.profile,
    loading: authState.loading,
    isAuthenticated: !!authState.user,
    
    // 認証関数
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile: updateAuthProfile,
    updateUserProfile,
    fetchProfile,
    setProfile,
    
    // 認証方法判定関数
    getAuthProvider,
    isOAuthUser,
    hasPassword,
  };
};