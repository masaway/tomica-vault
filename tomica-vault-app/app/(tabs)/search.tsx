// app/(tabs)/search.tsx
import { StyleSheet, View, Text, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NFCShortcut } from '../../components/NFCShortcut';
import { TomicaItem } from '../../components/TomicaItem';

// 固定のサンプルデータ
const SAMPLE_DATA = [
  { 
    id: 1, 
    name: 'トヨタ クラウン', 
    situation: '外出中', 
    lastUpdatedDate: '2024-03-15',
    updatedBy: '井上裕樹'
  },
  { 
    id: 2, 
    name: '日産 スカイライン', 
    situation: '帰宅中', 
    lastUpdatedDate: '2024-03-10',
    updatedBy: '田中太郎'
  },
  { 
    id: 3, 
    name: 'ホンダ シビック', 
    situation: '家出中', 
    lastUpdatedDate: '2024-03-05',
    updatedBy: '佐藤花子'
  },
  { 
    id: 4, 
    name: 'スバル インプレッサ', 
    situation: '外出中', 
    lastUpdatedDate: '2024-02-28',
    updatedBy: '鈴木一郎'
  },
  { 
    id: 5, 
    name: 'マツダ RX-7', 
    situation: '帰宅中', 
    lastUpdatedDate: '2024-02-20',
    updatedBy: '高橋次郎'
  },
];

export default function SearchScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>検索</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="トミカを検索..."
          placeholderTextColor="#999"
        />
      </View>
      <View style={styles.content}>
        <FlatList
          data={SAMPLE_DATA}
          renderItem={({ item }) => (
            <TomicaItem item={item} />
          )}
          keyExtractor={(item) => item.id.toString()}
        />
      </View>
      <NFCShortcut />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
});