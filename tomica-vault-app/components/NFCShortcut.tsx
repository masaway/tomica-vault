import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function NFCShortcut() {
  const insets = useSafeAreaInsets();
  
  const handleNFCPress = () => {
    router.push('/nfc-reader');
  };

  return (
    <TouchableOpacity 
      style={[styles.nfcButton, { bottom: insets.bottom + 20 }]}
      onPress={handleNFCPress}
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
  nfcButtonDisabled: {
    backgroundColor: '#ccc',
    elevation: 2,
    shadowOpacity: 0.1,
  },
  nfcButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  nfcButtonTextDisabled: {
    color: '#999',
  },
}); 