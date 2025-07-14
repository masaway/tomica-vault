import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return; // まだ認証状態を確認中

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // 未認証で認証グループ外にいる場合、ログイン画面に遷移
      console.log('AuthProvider - ログイン画面に遷移');
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // 認証済みで認証グループ内にいる場合、メイン画面に遷移
      console.log('AuthProvider - メイン画面に遷移');
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  // 認証状態を確認中はローディング画面を表示
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#4facfe', '#00f2fe']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="white" />
        </LinearGradient>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});