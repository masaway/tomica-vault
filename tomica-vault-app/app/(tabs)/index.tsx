import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, Modal, TouchableOpacity, Animated, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useTomica } from '../../hooks/useTomica';
import { useAuth } from '../../hooks/useAuth';
import { NFCShortcut } from '../../components/NFCShortcut';
import { DashboardCard } from '../../components/DashboardCard';
import { RecentActivity } from '../../components/RecentActivity';
import { PlayfulLoadingSpinner } from '../../components/PlayfulLoadingSpinner';
import { useThemeColor } from '../../hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const { user, loading: authLoading } = useAuth();
  const { stats, loading, error, fetchStats } = useTomica();
  const [refreshing, setRefreshing] = useState(false);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const gradientStart = useThemeColor({}, 'gradientStart');
  const gradientEnd = useThemeColor({}, 'gradientEnd');
  const [modalVisible, setModalVisible] = useState(false);
  const [lastRead, setLastRead] = useState<string | null>(null);
  
  // ヘッダータイトルのふわふわアニメーション
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  // アニメーション制御用のキー（画面フォーカス時にインクリメント）
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    // 認証が完了してからデータを取得
    if (!authLoading && user) {
      console.log('ホーム画面 - 認証完了、データを取得開始');
      fetchStats();
    }
  }, [fetchStats, authLoading, user]);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('notification_last_read');
      if (stored) setLastRead(stored);
    })();
    
    // ヘッダータイトルの浮遊アニメーション開始
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    floatAnimation.start();

    return () => {
      floatAnimation.stop();
    };
  }, [floatAnim]);

  // ホーム画面にフォーカスしたときにアニメーションをリセットし、データを更新
  useFocusEffect(
    useCallback(() => {
      setAnimationKey(prev => prev + 1);
      // 認証が完了していてユーザーが存在する場合のみデータを更新
      if (!authLoading && user) {
        console.log('ホーム画面フォーカス - データを更新');
        fetchStats();
      }
    }, [authLoading, user, fetchStats])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const navigateToList = (filter?: string) => {
    if (filter) {
      router.push(`/(tabs)/list?filter=${filter}`);
    } else {
      router.push('/(tabs)/list?filter=all');
    }
  };

  const unreadCount = stats && lastRead
    ? stats.recentActivity.filter(a => new Date(a.timestamp) > new Date(lastRead)).length
    : stats?.recentActivity.length || 0;

  const handleOpenModal = async () => {
    if (stats && stats.recentActivity.length > 0) {
      const latest = stats.recentActivity[0].timestamp;
      await AsyncStorage.setItem('notification_last_read', latest);
      setLastRead(latest);
    }
    setModalVisible(true);
  };

  // カスタムヘッダー
  const CustomHeader = () => (
    <View style={{ backgroundColor: gradientStart }}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={gradientStart} 
        translucent={false}
      />
      <SafeAreaView edges={['top']} style={{ backgroundColor: gradientStart }}>
        <LinearGradient
          colors={[gradientStart, tintColor, gradientEnd]}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 56,
            paddingHorizontal: 16,
            paddingVertical: 12,
            position: 'relative',
          }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Animated.Text 
            style={[
              styles.headerTitle,
              {
                transform: [{
                  translateY: floatAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -3]
                  })
                }]
              }
            ]}
          >
            おもちゃパトロール
          </Animated.Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={handleOpenModal}
          accessibilityLabel="通知"
        >
          <Ionicons name="notifications-outline" size={24} color="#fff" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        </LinearGradient>
      </SafeAreaView>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { backgroundColor }]}>
          <CustomHeader />
          <View style={styles.loadingContainer}>
            <PlayfulLoadingSpinner size={60} color={tintColor} />
            <Text style={[styles.loadingText, { color: textColor }]}>じゅんびちゅう...</Text>
          </View>
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { backgroundColor }]}>
          <CustomHeader />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor }]}>
        <CustomHeader />

      <ScrollView
        style={[styles.content, { backgroundColor }]}
        contentContainerStyle={[styles.contentContainer, { backgroundColor }]}
        showsVerticalScrollIndicator={false}
        bounces={true}
        overScrollMode="never"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tintColor} />
        }
      >
        {stats && (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                <DashboardCard
                  title="おもちゃ図鑑"
                  value={stats.total}
                  icon="car-sport"
                  gradientColors={['#FF6B9D', '#FFE66D']}
                  onPress={() => navigateToList()}
                  subtitle={`ねんねちゅう: ${stats.sleeping}`}
                  delay={0}
                  animationKey={animationKey}
                />
                <DashboardCard
                  title="おでかけ中"
                  value={stats.checkedOut}
                  icon="car"
                  gradientColors={['#4ECDC4', '#4A90FF']}
                  onPress={() => navigateToList('おでかけ')}
                  delay={100}
                  animationKey={animationKey}
                />
              </View>
              <View style={styles.statsRow}>
                <DashboardCard
                  title="おうちにいるよ"
                  value={stats.checkedIn}
                  icon="home"
                  gradientColors={['#48BB78', '#4ECDC4']}
                  onPress={() => navigateToList('おうち')}
                  delay={200}
                  animationKey={animationKey}
                />
                <DashboardCard
                  title="まいごさん"
                  value={stats.missing}
                  icon="warning"
                  gradientColors={['#F56565', '#FF6B9D']}
                  onPress={() => navigateToList('まいご')}
                  delay={300}
                  animationKey={animationKey}
                />
              </View>
            </View>

            <RecentActivity activities={stats.recentActivity} animationKey={animationKey} />
          </>
        )}
      </ScrollView>

      <NFCShortcut />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>通知</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={tintColor} />
              </TouchableOpacity>
            </View>
            {stats && stats.recentActivity.length > 0 ? (
              <ScrollView style={{ maxHeight: 350 }}>
                {stats.recentActivity.map((item, idx) => (
                  <View key={idx} style={styles.notificationCard}>
                    <View style={styles.notificationIconWrap}>
                      <Ionicons name="alert-circle" size={28} color="#e74c3c" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notificationTitle}>
                        {item.name} が <Text style={{ color: '#e74c3c', fontWeight: 'bold' }}>まいごさん</Text> になりました
                      </Text>
                      <Text style={styles.notificationDate}>
                        {new Date(item.timestamp).toLocaleString('ja-JP')}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyNotification}>
                <Ionicons name="notifications-off" size={48} color="#ccc" style={{ marginBottom: 8 }} />
                <Text style={{ color: '#888' }}>まいごさんの通知はありません</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  notificationButton: {
    position: 'absolute',
    right: 16,
    paddingVertical: 8,
    paddingLeft: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '100%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsContainer: {
    paddingHorizontal: 12,
    paddingTop: 0,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
  },
  badge: {
    backgroundColor: 'red',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    width: '80%',
    maxHeight: '80%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  notificationIconWrap: {
    marginRight: 12,
    backgroundColor: '#fdecea',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 2,
  },
  notificationDate: {
    fontSize: 12,
    color: '#888',
  },
  emptyNotification: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});
