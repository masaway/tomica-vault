import { StyleSheet, View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Tables } from '@/types/supabase';
import { NFCShortcut } from '../../components/NFCShortcut';

type OwnedTomica = Tables<'owned_tomica'>;

export default function ListScreen() {
  const [tomicaList, setTomicaList] = useState<OwnedTomica[]>([]);

  useEffect(() => {
    fetchTomicaList();
  }, []);

  const fetchTomicaList = async () => {
    const { data, error } = await supabase
      .from('owned_tomica')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tomica list:', error);
      return;
    }

    setTomicaList(data || []);
  };

  const renderItem = ({ item }: { item: OwnedTomica }) => (
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
      <FlatList
        data={tomicaList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
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
}); 