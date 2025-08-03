import { StyleSheet, View, Text, FlatList, TouchableOpacity, ScrollView, TextInput, Modal, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { NFCShortcut } from '../../components/NFCShortcut';
import { useTomica, Tomica, SortOrder } from '@/hooks/useTomica';
import { useAuth } from '@/hooks/useAuth';
import { TomicaItem } from '../../components/TomicaItem';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useFocusEffect } from '@react-navigation/native';
import { determineTomicaSituation, situationOrder, Situation } from '@/utils/tomicaUtils';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';


export default function ListScreen() {
  const { user, loading: authLoading } = useAuth();
  const { tomicaList, loading, error, fetchTomicaList, searchTomica, sortOrder, changeSortOrder } = useTomica();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'おうち' | 'おでかけ' | 'まいご' | 'おやすみ'>('all');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');
  const cardColor = useThemeColor({}, 'cardBackground');
  const { filter: urlFilter } = useLocalSearchParams<{ filter?: string }>();

  // URLパラメータからフィルターを設定
  useEffect(() => {
    if (urlFilter && (urlFilter === 'all' || urlFilter === 'おうち' || urlFilter === 'おでかけ' || urlFilter === 'まいご' || urlFilter === 'おやすみ')) {
      setFilter(urlFilter as typeof filter);
    }
  }, [urlFilter]);

  // 検索バーの入力を300msデバウンス
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(handler);
  }, [query]);

  // 検索クエリが空欄なら全件取得、入力があれば検索
  useEffect(() => {
    if (debouncedQuery.trim() !== '') {
      searchTomica(debouncedQuery);
    } else {
      fetchTomicaList();
    }
  }, [debouncedQuery, fetchTomicaList, searchTomica]);

  // 画面フォーカス時に最新リスト取得
  useFocusEffect(
    React.useCallback(() => {
      // 認証が完了してからデータを取得
      if (!authLoading && user) {
        console.log('リスト画面 - 認証完了、データを取得開始');
        fetchTomicaList();
      }
    }, [fetchTomicaList, authLoading, user])
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
    return determineTomicaSituation(item) === filter;
  });

  const getSortLabel = (order: SortOrder) => {
    if (order.column === 'name' && order.ascending) return '名前 昇順';
    if (order.column === 'name' && !order.ascending) return '名前 降順';
    if (order.column === 'updated_at' && order.ascending) return '更新日時 昇順';
    if (order.column === 'updated_at' && !order.ascending) return '更新日時 降順';
    return '並び替え';
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* 検索バーの高さ分スペース（半分の28pxに変更） */}
      <View style={{ height: 28 }} />
      {/* 検索バー */}
      <View style={styles.header}>
        <TextInput
          style={[
            styles.input,
            { borderColor: borderColor, backgroundColor: cardColor, color: textColor },
          ]}
          value={query}
          onChangeText={setQuery}
          placeholder="おもちゃ名で検索"
          placeholderTextColor={borderColor}
        />
      </View>
      {/* 並び替えボタン */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 16, marginTop: 4 }}>
        <Text style={{ color: textColor, marginRight: 8 }}>{getSortLabel(sortOrder)}</Text>
        <TouchableOpacity
          style={{ backgroundColor: cardColor, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: borderColor }}
          onPress={() => setSortModalVisible(true)}
        >
          <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 14 }}>変更</Text>
        </TouchableOpacity>
      </View>
      {/* 並び替えモーダル */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSortModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>並び替え</Text>
            <TouchableOpacity style={styles.sortOption} onPress={() => { changeSortOrder({ column: 'name', ascending: true }); setSortModalVisible(false); }}>
              <Text style={sortOrder.column === 'name' && sortOrder.ascending ? styles.selectedSort : styles.sortText}>名前 昇順</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sortOption} onPress={() => { changeSortOrder({ column: 'name', ascending: false }); setSortModalVisible(false); }}>
              <Text style={sortOrder.column === 'name' && !sortOrder.ascending ? styles.selectedSort : styles.sortText}>名前 降順</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sortOption} onPress={() => { changeSortOrder({ column: 'updated_at', ascending: true }); setSortModalVisible(false); }}>
              <Text style={sortOrder.column === 'updated_at' && sortOrder.ascending ? styles.selectedSort : styles.sortText}>更新日時 昇順</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sortOption} onPress={() => { changeSortOrder({ column: 'updated_at', ascending: false }); setSortModalVisible(false); }}>
              <Text style={sortOrder.column === 'updated_at' && !sortOrder.ascending ? styles.selectedSort : styles.sortText}>更新日時 降順</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      {/* フィルタカード */}
      <View style={styles.filterRow}>
        {['all', 'おうち', 'おでかけ', 'まいご', 'おやすみ'].map((key) => (
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
              {key === 'all' ? 'ぜんぶ' : key}
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
          data={filteredList}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            debouncedQuery.trim() !== '' ? (
              <Text style={{ textAlign: 'center', marginTop: 32 }}>該当データがありません</Text>
            ) : null
          }
        />
      )}
      <NFCShortcut />
    </View>
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
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    minWidth: 220,
    alignItems: 'stretch',
    elevation: 4,
  },
  sortOption: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sortText: {
    fontSize: 15,
    color: '#333',
  },
  selectedSort: {
    fontSize: 15,
    color: '#1976D2',
    fontWeight: 'bold',
  },
});
