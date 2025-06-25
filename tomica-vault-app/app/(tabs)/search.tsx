// app/(tabs)/search.tsx
import { StyleSheet, View, Text, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NFCShortcut } from '../../components/NFCShortcut';
import { TomicaItem } from '../../components/TomicaItem';
import { useEffect, useState } from 'react';
import { useTomica, Tomica } from '@/hooks/useTomica';
import { useThemeColor } from '../../hooks/useThemeColor';

export default function SearchScreen() {
  const { tomicaList, loading, error, searchTomica, fetchTomicaList } = useTomica();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const cardColor = useThemeColor({}, 'card');

  // 入力後300ms何もなければdebouncedQueryを更新
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.trim() !== '') {
      searchTomica(debouncedQuery);
    }
    // 空欄のときは何もしない
  }, [debouncedQuery]);

  const determineTomicaSituation = (tomica: Tomica): '外出中' | '帰宅中' => {
    const { check_in_at, checked_out_at } = tomica;
    if (check_in_at === null) return '外出中';
    if (checked_out_at === null) return '帰宅中';
    const checkedInDate = new Date(check_in_at).getTime();
    const checkedOutDate = new Date(checked_out_at).getTime();
    return checkedInDate > checkedOutDate ? '帰宅中' : '外出中';
  };

  const renderItem = ({ item }: { item: Tomica }) => (
    <TomicaItem
      item={{
        id: item.id,
        name: item.name,
        situation: determineTomicaSituation(item),
        nfc_tag_uid: String(item.nfc_tag_uid),
        check_in_at: item.check_in_at,
        checked_out_at: item.checked_out_at,
        lastUpdatedDate: item.updated_at ?? '',
        updatedBy: (item as any).updated_by || '',
      }}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Text style={[styles.title, { color: textColor }]}>検索</Text>
        <TextInput
          style={[
            styles.searchInput,
            {
              borderColor: borderColor,
              backgroundColor: cardColor,
              color: textColor,
            },
          ]}
          placeholder="トミカを検索..."
          placeholderTextColor={borderColor}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <View style={styles.content}>
        {loading ? (
          <Text>読み込み中...</Text>
        ) : error ? (
          <Text style={{ color: 'red' }}>{error}</Text>
        ) : (
          <FlatList
            data={debouncedQuery.trim() === '' ? [] : tomicaList}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            ListEmptyComponent={
              debouncedQuery.trim() === ''
                ? null
                : <Text style={{ textAlign: 'center', marginTop: 32 }}>該当データがありません</Text>
            }
          />
        )}
      </View>
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
    marginBottom: 16,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
  },
});