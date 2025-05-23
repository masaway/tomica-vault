import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Tables } from '@/types/supabase';
import { router } from 'expo-router';

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
      <TouchableOpacity 
        style={styles.nfcButton}
        onPress={() => router.push('/nfc-reader')}
      >
        <Text style={styles.nfcButtonText}>NFC</Text>
      </TouchableOpacity>
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
  nfcButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  nfcButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 