import { StyleSheet, View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { NFCShortcut } from '../../components/NFCShortcut';
import { useTomica, Tomica } from '@/hooks/useTomica';

export default function ListScreen() {
  const { tomicaList, loading, error, fetchTomicaList } = useTomica();

  useEffect(() => {
    fetchTomicaList();
  }, []);

  const renderItem = ({ item }: { item: Tomica }) => (
    <View style={styles.item}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemDate}>
        購入日: {item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : '未設定'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>トミカ一覧</Text>
      </View>
      {loading ? (
        <View style={styles.center}>
          <Text>読み込み中...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={tomicaList}
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
  },
  list: {
    padding: 16,
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: 'red',
  },
}); 