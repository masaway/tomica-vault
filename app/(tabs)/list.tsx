import { StyleSheet, View, Text, FlatList, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useEffect, useState } from 'react';
import { useThemeColor } from '../../../hooks/useThemeColor';

export default function ListScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // 検索バーの色用
  const cardColor = useThemeColor({}, 'cardBackground');

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
  }, [debouncedQuery]);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* 検索バー */}
      <View style={{ padding: 16 }}>
        <TextInput
          style={{
            height: 40,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 16,
            borderColor: borderColor,
            backgroundColor: cardColor,
            color: textColor,
          }}
          value={query}
          onChangeText={setQuery}
          placeholder="おもちゃ名で検索"
          placeholderTextColor={borderColor}
        />
      </View>
      {/* フィルタカード */}
      {/* リスト ... */}
    </View>
  );
}