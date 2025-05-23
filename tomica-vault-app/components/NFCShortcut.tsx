import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export function NFCShortcut() {
  return (
    <TouchableOpacity 
      style={styles.nfcButton}
      onPress={() => router.push('/nfc-reader')}
    >
      <Ionicons name="scan" size={24} color="#fff" />
      <Text style={styles.nfcButtonText}>NFC</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
}); 