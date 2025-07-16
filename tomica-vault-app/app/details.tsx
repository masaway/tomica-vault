import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTomica, Tomica } from '@/hooks/useTomica';
import { useAuth } from '@/hooks/useAuth';
import { determineTomicaSituation, Situation } from '@/utils/tomicaUtils';

// 日付を日本語形式でフォーマットする関数
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('ja-JP');
};

// 基本情報セクション
const BasicInfoSection = ({ tomica }: { tomica: Tomica }) => {
  const situation = determineTomicaSituation(tomica);
  let situationStyle;
  switch (situation) {
    case '外出中':
      situationStyle = styles.situationOut;
      break;
    case '家出中':
      situationStyle = styles.situationMissing;
      break;
    case '帰宅中':
    default:
      situationStyle = styles.situationReturning;
      break;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>基本情報</Text>
      <View style={styles.infoRow}>
        <Text style={styles.label}>名前</Text>
        <Text style={styles.value}>{tomica.name}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>登録ID</Text>
        <Text style={styles.value}>{tomica.id}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>NFC ID</Text>
        <Text style={styles.value}>{tomica.nfc_tag_uid}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>状況</Text>
        <Text style={[styles.value, situationStyle]}>{situation}</Text>
      </View>
    </View>
  );
};

// 移動履歴セクション
const MovementHistorySection = ({ tomica }: { tomica: Tomica }) => {
  const situation = determineTomicaSituation(tomica);

  // 最新の帰宅中と外出中のデータを取得
  const latestCheckIn = tomica.check_in_at ? new Date(tomica.check_in_at) : null;
  const latestCheckOut = tomica.checked_out_at ? new Date(tomica.checked_out_at) : null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>移動履歴</Text>
      
      {/* 最新の帰宅中のデータを表示 */}
      {latestCheckIn && (
        <View style={styles.historyItem}>
          <Text style={styles.historyDate}>{latestCheckIn.toLocaleString('ja-JP')}</Text>
          <Text style={styles.historyText}>帰宅中に変更</Text>
          <Text style={styles.historyUser}>更新者: {''}</Text>
        </View>
      )}

      {/* 最新の外出中のデータを表示 */}
      {latestCheckOut && (
        <View style={styles.historyItem}>
          <Text style={styles.historyDate}>{latestCheckOut.toLocaleString('ja-JP')}</Text>
          <Text style={styles.historyText}>外出中に変更</Text>
          <Text style={styles.historyUser}>更新者: {''}</Text>
        </View>
      )}
    </View>
  );
};

// 登録情報セクション
const RegistrationInfoSection = ({ tomica }: { tomica: Tomica }) => {
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '未設定';
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>登録情報</Text>
      <View style={styles.infoRow}>
        <Text style={styles.label}>登録日</Text>
        <Text style={styles.value}>{formatDate(tomica.created_at)}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>最終更新日</Text>
        <Text style={styles.value}>{formatDate(tomica.updated_at)}</Text>
      </View>
    </View>
  );
};

// メモセクション
const MemoSection = ({ tomica }: { tomica: Tomica }) => (
  tomica.memo && (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>メモ</Text>
      <Text style={styles.notes}>{tomica.memo}</Text>
    </View>
  )
);

export default function DetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { getTomicaById } = useTomica();
  const [tomica, setTomica] = useState<Tomica | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTomicaDetails = async () => {
      if (authLoading) return;
      if (!user) { setLoading(false); return; }
      const id = Number(params.id);
      const data = await getTomicaById(id);
      setTomica(data);
      setLoading(false);
    };
    fetchTomicaDetails();
  }, [params.id, user, authLoading, getTomicaById]);

  const handleDelete = () => {
    if (!tomica) return;
    Alert.alert(
      'おもちゃの削除',
      `${tomica.name}とお別れしますか？`,
      [
        { text: '引き留める', style: 'cancel' },
        { text: '別れを告げる', style: 'destructive', onPress: () => { router.back(); } },
      ],
    );
  };
  const handleEdit = () => {
    if (!tomica) return;
    router.push({ pathname: '/edit', params: { tomica: JSON.stringify(tomica) } });
  };

  // カスタムヘッダー
  const CustomHeader = () => (
    <SafeAreaView edges={['top']} style={{ backgroundColor: '#000' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 56,
          paddingHorizontal: 16,
          backgroundColor: '#000',
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical: 8, paddingRight: 16 }}>
          <Text style={{ color: '#007AFF', fontSize: 16 }}>戻る</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>おもちゃ詳細</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={handleEdit} style={{ marginRight: 16 }}>
            <FontAwesome name="pencil" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <FontAwesome name="trash" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  // Stack.Screenでカスタムヘッダーを指定
  return (
    <>
      <Stack.Screen options={{ header: () => <CustomHeader /> }} />
      <SafeAreaView style={styles.container}>
        {loading ? (
          <View style={styles.center}><Text>読み込み中...</Text></View>
        ) : !tomica ? (
          <View style={styles.center}><Text>おもちゃが見つかりませんでした</Text></View>
        ) : (
          <ScrollView style={styles.content}>
            {/* ここから下は元の画面内容。ヘッダー部分（戻る・タイトル・編集・削除）は削除済み */}
            <BasicInfoSection tomica={tomica} />
            <MovementHistorySection tomica={tomica} />
            <RegistrationInfoSection tomica={tomica} />
            <MemoSection tomica={tomica} />
          </ScrollView>
        )}
      </SafeAreaView>
    </>
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
    justifyContent: 'space-between',
  },
  backButtonContainer: {
    flex: 1,
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 2,
    textAlign: 'center',
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
    backgroundColor: '#fff3e0', // 薄いオレンジ
    color: '#ff9800',           // オレンジ
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  situationReturning: {
    color: '#2e7d32',
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  situationMissing: {
    backgroundColor: '#ffebee', // 薄い赤
    color: '#d32f2f',           // 赤
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
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
    flex: 1,
    justifyContent: 'flex-end',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 