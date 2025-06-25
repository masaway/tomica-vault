import { StyleSheet, View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { useTomica } from '../../hooks/useTomica';
import { NFCShortcut } from '../../components/NFCShortcut';
import { DashboardCard } from '../../components/DashboardCard';
import { RecentActivity } from '../../components/RecentActivity';
import { QuickActions } from '../../components/QuickActions';
import { useThemeColor } from '../../hooks/useThemeColor';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { stats, loading, error, fetchStats } = useTomica();
  const [refreshing, setRefreshing] = useState(false);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const gradientStart = useThemeColor({}, 'gradientStart');
  const gradientEnd = useThemeColor({}, 'gradientEnd');

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const navigateToList = () => {
    router.push('/(tabs)/list');
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <Text style={[styles.loadingText, { color: textColor }]}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <LinearGradient
        colors={[gradientStart, tintColor, gradientEnd]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.title}>トミカコレクション</Text>
        <Text style={styles.subtitle}>あなたのトミカワールド</Text>
      </LinearGradient>

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
                  title="総コレクション"
                  value={stats.total}
                  icon="car-sport"
                  gradientColors={['#FF6B6B', '#FF8E53']}
                  onPress={navigateToList}
                />
                <DashboardCard
                  title="外出中"
                  value={stats.checkedOut}
                  icon="car"
                  gradientColors={['#4ECDC4', '#44A08D']}
                />
              </View>
              <View style={styles.statsRow}>
                <DashboardCard
                  title="帰宅中"
                  value={stats.checkedIn}
                  icon="home"
                  gradientColors={['#9C88FF', '#8976D4']}
                />
                <DashboardCard
                  title="使用率"
                  value={stats.total > 0 ? `${Math.round((stats.checkedOut / stats.total) * 100)}%` : '0%'}
                  icon="stats-chart"
                  gradientColors={['#F093FB', '#F5576C']}
                />
              </View>
            </View>

            <QuickActions />
            
            <RecentActivity activities={stats.recentActivity} />
          </>
        )}
      </ScrollView>

      <NFCShortcut />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.9,
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
});
