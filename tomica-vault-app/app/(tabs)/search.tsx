// app/(tabs)/search.tsx
import { StyleSheet, View, Text, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { NFCShortcut } from '../../components/NFCShortcut';
import { TomicaItem } from '../../components/TomicaItem';
import { useEffect, useState } from 'react';
import { useTomica, Tomica } from '@/hooks/useTomica';
import { useThemeColor } from '../../hooks/useThemeColor';
import { determineTomicaSituation, situationOrder, Situation } from '@/utils/tomicaUtils';

export default function SearchScreen() {
  const { tomicaList, loading, error, searchTomica, fetchTomicaList } = useTomica();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');
  const cardColor = useThemeColor({}, 'cardBackground');

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


  const renderItem = ({ item }: { item: Tomica }) => (
    <TomicaItem
      item={{
        id: item.id,
        name: item.name,
        situation: determineTomicaSituation(item) as Situation,
        nfc_tag_uid: item.nfc_tag_uid,
        check_in_at: item.check_in_at,
        checked_out_at: item.checked_out_at,
        lastUpdatedDate: item.updated_at ?? '',
        updatedBy: (item as any).updated_by || '',
      }}
    />
  );

  // 家出中→外出中→帰宅中の順にソート
  const sortedTomicaList = [...tomicaList].sort((a, b) => {
    const situationA = determineTomicaSituation(a);
    const situationB = determineTomicaSituation(b);
    return situationOrder[situationA] - situationOrder[situationB];
  });

  return (
    <View style={[styles.container, { backgroundColor }]}>
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
      <View style={styles.content}>
        {error ? (
          <Text style={{ color: 'red' }}>{error}</Text>
        ) : (
          <FlatList
            data={debouncedQuery.trim() === '' ? [] : sortedTomicaList}
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
  content: {
    flex: 1,
  },
});