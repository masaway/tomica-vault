import { StyleSheet, View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTomica } from '../../hooks/useTomica';
import { Image } from 'expo-image';
import { NFCShortcut } from '../../components/NFCShortcut';
import { TomicaItem } from '../../components/TomicaItem';

export default function HomeScreen() {
  const { tomicaList, loading, error } = useTomica();

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>トミカコレクション</Text>
      </View>
      <NFCShortcut />
      <FlatList
        data={tomicaList}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  item: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemContent: {
    marginLeft: 16,
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemSeries: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
  },
});
