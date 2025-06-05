import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

type Tomica = {
  id: number;
  name: string;
  situation: string;
  lastUpdatedDate: string;
  updatedBy: string;
};

export default function DetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tomica = JSON.parse(params.tomica as string) as Tomica;

  const getSituationStyle = (situation: string) => {
    switch (situation) {
      case '外出中':
        return styles.situationOut;
      case '帰宅中':
        return styles.situationReturning;
      case '家出中':
        return styles.situationMissing;
      default:
        return styles.situationOut;
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'トミカの削除',
      `${tomica.name}とお別れしますか？`,
      [
        {
          text: '引き留める',
          style: 'cancel',
        },
        {
          text: '別れを告げる',
          style: 'destructive',
          onPress: () => {
            // TODO: 実際の削除処理を実装
            console.log('Delete tomica:', tomica.id);
            router.back();
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    router.push({
      pathname: '/edit',
      params: { tomica: JSON.stringify(tomica) }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'トミカ詳細',
          headerLeft: () => (
            <Text 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              戻る
            </Text>
          ),
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={handleEdit}
              >
                <FontAwesome name="pencil" size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={handleDelete}
              >
                <FontAwesome name="trash" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ),
        }} 
      />
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本情報</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>名前</Text>
            <Text style={styles.value}>{tomica.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>登録ID</Text>
            <Text style={styles.value}>T{tomica.id.toString().padStart(3, '0')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>NFC ID</Text>
            <Text style={styles.value}>NFC{tomica.id.toString().padStart(6, '0')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>状況</Text>
            <Text style={[styles.value, getSituationStyle(tomica.situation)]}>
              {tomica.situation}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>移動履歴</Text>
          <View style={styles.historyItem}>
            <Text style={styles.historyDate}>{tomica.lastUpdatedDate}</Text>
            <Text style={styles.historyText}>{tomica.situation}に変更</Text>
            <Text style={styles.historyUser}>更新者: {tomica.updatedBy}</Text>
          </View>
          <View style={styles.historyItem}>
            <Text style={styles.historyDate}>2024-03-10</Text>
            <Text style={styles.historyText}>帰宅中に変更</Text>
            <Text style={styles.historyUser}>更新者: 田中太郎</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>登録情報</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>登録日</Text>
            <Text style={styles.value}>2024-01-01</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>最終更新日</Text>
            <Text style={styles.value}>{tomica.lastUpdatedDate}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>メモ</Text>
          <Text style={styles.notes}>
            特別な限定版の{tomica.name}です。状態は良好です。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    width: 100,
    fontSize: 16,
    color: '#666',
  },
  value: {
    flex: 1,
    fontSize: 16,
  },
  situationOut: {
    color: '#e65100',
    fontWeight: 'bold',
  },
  situationReturning: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  situationMissing: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  historyItem: {
    marginBottom: 16,
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
  },
  historyText: {
    fontSize: 16,
    marginTop: 4,
  },
  historyUser: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  notes: {
    fontSize: 16,
    lineHeight: 24,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
}); 