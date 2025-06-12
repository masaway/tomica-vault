import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import ReactLogo from '@assets/images/react-logo.png';

export default function NFCReaderScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>NFC読み取り</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.nfcIconContainer}>
          <Image
            source={ReactLogo}
            style={{ width: 100, height: 100 }}
            contentFit="contain"
          />
        </View>
        <Text style={styles.instruction}>
          NFCタグをスマートフォンの背面に近づけてください
        </Text>
        <Text style={styles.subInstruction}>
          トミカのNFCタグを読み取ると、自動的に登録画面に移動します
        </Text>
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  nfcIconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  instruction: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subInstruction: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 