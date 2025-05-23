import { StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

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
        <Text>検索結果がここに表示されます</Text>
      </View>
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
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
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