import { StyleSheet, View, Text, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import { useNFC } from '@/hooks/useNFC';
import { useNFCEnvironment } from '@/hooks/useNFCEnvironment';
import { useTomica, Tomica } from '@/hooks/useTomica';
import { useThemeColor } from '@/hooks/useThemeColor';
import { logEnvironmentInfo } from '@/constants/Environment';
import NFCModal from '@/components/NFCModal';

export default function NFCReaderScreen() {
  const { nfcState, startAutoScan, stopAutoScan } = useNFC();
  const { environmentName, isNFCAvailable } = useNFCEnvironment();
  const { getTomicaByNfcTagId, updateNfcScanTime, updateTomica, toggleSleepMode } = useTomica();
  
  // テーマカラーを取得
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const gradientStart = useThemeColor({}, 'gradientStart');
  const gradientEnd = useThemeColor({}, 'gradientEnd');
  
  // モーダル状態管理
  const [modalVisible, setModalVisible] = useState(false);
  const [scannedTomicaList, setScannedTomicaList] = useState<Tomica[]>([]);
  const [isScreenFocused, setIsScreenFocused] = useState(false);

  // 画面フォーカス時にのみNFC機能を有効化
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      
      // 画面離脱時に自動スキャンを停止
      return () => {
        setIsScreenFocused(false);
        stopAutoScan();
      };
    }, [])
  );

  // NFC機能の準備完了時に自動スキャンを開始
  useEffect(() => {
    const startScan = async () => {
      if (isScreenFocused && nfcState.isSupported && !nfcState.isAutoScanning) {
        await startAutoScan();
      }
    };
    
    startScan();
  }, [isScreenFocused, nfcState.isSupported, nfcState.isAutoScanning]);

  // NFCタグ検出時の処理
  const handleNfcTagDetected = useCallback(async (tagId: string) => {
    try {
      // tag_idでおもちゃを検索
      const foundTomica = await getTomicaByNfcTagId(tagId);
      
      if (foundTomica) {
        // スキャン日時を更新
        await updateNfcScanTime(foundTomica.id);
        
        // 連続スキャン対応: 既存のリストに追加または更新
        setScannedTomicaList(prevList => {
          const existingIndex = prevList.findIndex(t => t.id === foundTomica.id);
          if (existingIndex >= 0) {
            // 既に存在する場合は更新
            const updatedList = [...prevList];
            updatedList[existingIndex] = foundTomica;
            return updatedList;
          } else {
            // 新しい場合は追加
            return [...prevList, foundTomica];
          }
        });
        
        // モーダルを表示
        setModalVisible(true);
      } else {
        // おもちゃが見つからない場合
        setScannedTomicaList([]);
        setModalVisible(true);
      }
    } catch (error) {
      Alert.alert(
        'エラー',
        'NFCタグの処理中にエラーが発生しました',
        [{ text: 'OK' }]
      );
    }
  }, [getTomicaByNfcTagId, updateNfcScanTime]);

  // NFCタグ検出時の処理（画面フォーカス時のみ）
  useEffect(() => {
    if (nfcState.lastResult && isScreenFocused) {
      handleNfcTagDetected(nfcState.lastResult.id);
    }
  }, [nfcState.lastResult, isScreenFocused, handleNfcTagDetected]);


  // モーダルを閉じる
  const handleCloseModal = () => {
    setModalVisible(false);
    // モーダルを閉じる際にリストをクリア（連続スキャンの終了）
    setTimeout(() => {
      setScannedTomicaList([]);
    }, 300); // アニメーション後にクリア
  };

  // チェックアウト処理
  const handleCheckOut = async (tomica: Tomica) => {
    try {
      const result = await updateTomica(tomica.id, {
        name: tomica.name,
        situation: '外出中',
        notes: tomica.memo || '',
      });
      
      if (result) {
        Alert.alert(
          '持ち出し登録完了',
          `${tomica.name}を持ち出し登録しました`,
          [{ text: 'OK' }]
        );
        handleCloseModal();
      }
    } catch (error) {
      Alert.alert('エラー', 'チェックアウトに失敗しました');
    }
  };

  // チェックイン処理
  const handleCheckIn = async (tomica: Tomica) => {
    try {
      const result = await updateTomica(tomica.id, {
        name: tomica.name,
        situation: '帰宅中',
        notes: tomica.memo || '',
      });
      
      if (result) {
        Alert.alert(
          '帰宅登録完了',
          `${tomica.name}を帰宅登録しました`,
          [{ text: 'OK' }]
        );
        handleCloseModal();
      }
    } catch (error) {
      Alert.alert('エラー', 'チェックインに失敗しました');
    }
  };

  // カスタムヘッダー
  const CustomHeader = () => (
    <SafeAreaView edges={['top']} style={{ backgroundColor: gradientStart }}>
      <LinearGradient
        colors={[gradientStart, tintColor, gradientEnd]}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 56,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical: 8, paddingRight: 16 }}>
          <Text style={{ color: '#007AFF', fontSize: 16 }}>戻る</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>おもちゃタッチ</Text>
        <View style={{ width: 50 }} />
      </LinearGradient>
    </SafeAreaView>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={gradientStart} 
        translucent={modalVisible}
      />
      <View style={[styles.container, { backgroundColor }]}>
        <CustomHeader />
      
      <View style={styles.content}>
        {/* 環境情報表示 */}
        <View style={styles.environmentInfo}>
          <Text style={styles.environmentText}>
            環境: {environmentName}
          </Text>
          {!isNFCAvailable && (
            <Text style={styles.mockNotice}>
              ※ モックモードで動作中
            </Text>
          )}
          {isNFCAvailable && (
            <Text style={styles.realModeNotice}>
              ※ 実機モードで動作中
            </Text>
          )}
        </View>

        {/* NFC読み取りエリア */}
        <View style={styles.nfcArea}>
          <View style={styles.nfcIconContainer}>
            <Ionicons 
              name="scan" 
              size={100} 
              color={nfcState.isAutoScanning ? "#4A90E2" : "#999"} 
            />
            {nfcState.isAutoScanning && (
              <View style={styles.scanningOverlay}>
                <Text style={styles.scanningText}>タッチまちだよ...</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.instruction}>
            おもちゃをスマホにタッチしてね
          </Text>
          
          <Text style={styles.subInstruction}>
            {nfcState.isAutoScanning 
              ? '' 
              : nfcState.isSupported
              ? 'NFC機能が利用可能です'
              : nfcState.error 
              ? `エラー: ${nfcState.error}`
              : 'NFC機能を準備中...'}
          </Text>

          {/* 自動スキャン状態表示 */}
          {nfcState.isAutoScanning && (
            <View style={styles.autoScanStatus}>
              <Ionicons name="radio" size={24} color="#4A90E2" />
              <Text style={styles.autoScanText}>じどうタッチ中</Text>
            </View>
          )}

          {/* エラー表示 */}
          {nfcState.error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#ff4444" />
              <Text style={styles.errorText}>{nfcState.error}</Text>
            </View>
          )}
        </View>

      </View>

      {/* NFCモーダル */}
      <NFCModal
        visible={modalVisible}
        onClose={handleCloseModal}
        tomicaList={scannedTomicaList}
        onCheckOut={handleCheckOut}
        onCheckIn={handleCheckIn}
        onToggleSleep={async (tomica: Tomica) => {
          try {
            await toggleSleepMode(tomica.id, !tomica.is_sleeping);
            // モーダルを閉じて画面を更新
            handleCloseModal();
            Alert.alert('成功', `${tomica.name}の状態を変更しました`);
          } catch (error) {
            Alert.alert('エラー', '状態の変更に失敗しました');
          }
        }}
        scannedNfcTagId={nfcState.lastResult?.id}
      />
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  environmentInfo: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  environmentText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  mockNotice: {
    fontSize: 12,
    color: '#ff8c00',
    fontStyle: 'italic',
    marginTop: 4,
  },
  realModeNotice: {
    fontSize: 12,
    color: '#4A90E2',
    fontStyle: 'italic',
    marginTop: 4,
  },
  nfcArea: {
    alignItems: 'center',
    marginBottom: 16,
  },
  nfcIconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 75,
    backgroundColor: 'rgba(74, 144, 226, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instruction: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subInstruction: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  autoScanStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  autoScanText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
}); 