import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { NFCShortcut } from '../../components/NFCShortcut';
import { useTomica, Tomica } from '@/hooks/useTomica';
import { TomicaItem } from '../../components/TomicaItem';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';

// 状態の型を共通化
export type Situation = '家出中' | '外出中' | '帰宅中';

// トミカの状態を判断する関数
const determineTomicaSituation = (tomica: Tomica): Situation => {
  const { check_in_at, checked_out_at } = tomica;

  if (check_in_at === null) {
    if (checked_out_at) {
      const checkedOutDate = new Date(checked_out_at).getTime();
      const now = Date.now();
      if (now - checkedOutDate >= 48 * 60 * 60 * 1000) {
        return '家出中';
      }
    }
    return '外出中';
  }
  if (checked_out_at === null) return '帰宅中';

  const checkedInDate = new Date(check_in_at).getTime();
  const checkedOutDate = new Date(checked_out_at).getTime();

  if (checkedInDate > checkedOutDate) {
    return '帰宅中';
  } else {
    const now = Date.now();
    if (now - checkedOutDate >= 48 * 60 * 60 * 1000) {
      return '家出中';
    }
    return '外出中';
  }
};

// 状態の表示順を定義
export const situationOrder: Record<Situation, number> = {
  '家出中': 0,
  '外出中': 1,
  '帰宅中': 2,
};

export default function ListScreen() {
  const { tomicaList, loading, error, fetchTomicaList } = useTomica();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | '帰宅中' | '外出中'>('all');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');

  // 画面フォーカス時に最新リスト取得
  useFocusEffect(
    React.useCallback(() => {
      fetchTomicaList();
    }, [])
  );

  // TomicaItem用のitem生成
  const toTomicaItemProps = (item: Tomica) => ({
    id: item.id,
    name: item.name,
    situation: determineTomicaSituation(item),
    nfc_tag_uid: item.nfc_tag_uid,
    check_in_at: item.check_in_at,
    checked_out_at: item.checked_out_at,
    lastUpdatedDate: item.updated_at ? item.updated_at : '',
    updatedBy: '' // DBにないので空文字
  });

  const renderItem = ({ item }: { item: Tomica }) => (
    <TomicaItem item={toTomicaItemProps(item)} />
  );

  // フィルタ適用
  const filteredList = tomicaList.filter(item => {
    if (filter === 'all') return true;
    if (filter === '外出中') {
      // 外出中と家出中の両方を含める
      const situation = determineTomicaSituation(item);
      return situation === '外出中' || situation === '家出中';
    }
    return determineTomicaSituation(item) === filter;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* フィルタカード */}
      <View style={styles.filterRow}>
        {['all', '帰宅中', '外出中'].map((key) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.filterCard,
              filter === key && styles.filterCardActive
            ]}
            onPress={() => setFilter(key as typeof filter)}
          >
            <Text style={[
              styles.filterCardText,
              filter === key && styles.filterCardTextActive
            ]}>
              {key === 'all' ? 'すべて' : key}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* リスト本体 */}
      {loading ? (
        <View style={styles.center}>
          <Text style={{ color: textColor }}>読み込み中...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredList.sort((a, b) => {
            const situationA = determineTomicaSituation(a);
            const situationB = determineTomicaSituation(b);
            return situationOrder[situationA] - situationOrder[situationB];
          })}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}
      <NFCShortcut />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: 'red',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  filterCard: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    backgroundColor: '#eee',
    borderRadius: 8,
    alignItems: 'center',
  },
  filterCardActive: {
    backgroundColor: '#4A90E2',
  },
  filterCardText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  filterCardTextActive: {
    color: '#fff',
  },
}); 