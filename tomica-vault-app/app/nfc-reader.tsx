import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState, useCallback } from 'react';
import ReactLogo from '../assets/images/react-logo.png';
import { useNFC } from '@/hooks/useNFC';
import { useNFCEnvironment } from '@/hooks/useNFCEnvironment';
import { useTomica, Tomica } from '@/hooks/useTomica';
import { logEnvironmentInfo } from '@/constants/Environment';
import NFCModal from '@/components/NFCModal';

export default function NFCReaderScreen() {
  const { nfcState, startAutoScan, stopAutoScan } = useNFC();
  const { environmentName, isNFCAvailable } = useNFCEnvironment();
  const { getTomicaByNfcTagId, updateNfcScanTime, updateTomica } = useTomica();
  
  // モーダル状態管理
  const [modalVisible, setModalVisible] = useState(false);
  const [scannedTomicaList, setScannedTomicaList] = useState<Tomica[]>([]);
  const [isScreenFocused, setIsScreenFocused] = useState(false);

  // 画面フォーカス時にのみNFC機能を有効化
  useFocusEffect(
    useCallback(() => {
      console.log('NFC Reader画面がフォーカスされました');
      setIsScreenFocused(true);
      
      // 環境情報をログ出力
      logEnvironmentInfo();
      
      // 画面フォーカス時に自動スキャンを開始
      if (nfcState.isSupported) {
        startAutoScan();
      }
      
      // 画面離脱時に自動スキャンを停止
      return () => {
        console.log('NFC Reader画面からフォーカスが外れました');
        setIsScreenFocused(false);
        stopAutoScan();
      };
    }, [nfcState.isSupported, startAutoScan, stopAutoScan])
  );

  // NFCタグ検出時の処理
  const handleNfcTagDetected = useCallback(async (tagId: string) => {
    try {
      console.log('NFCタグを検出:', tagId);
      
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
        
        console.log('おもちゃが見つかりました:', foundTomica.name);
      } else {
        // おもちゃが見つからない場合
        setScannedTomicaList([]);
        setModalVisible(true);
        console.log('おもちゃが見つかりませんでした、新規登録が必要です');
      }
    } catch (error) {
      console.error('NFCタグ処理エラー:', error);
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
      console.log('画面フォーカス中にNFCタグを検出:', nfcState.lastResult.id);
      handleNfcTagDetected(nfcState.lastResult.id);
    } else if (nfcState.lastResult && !isScreenFocused) {
      console.log('画面がフォーカスされていないため、NFCタグ処理をスキップ:', nfcState.lastResult.id);
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
      console.error('チェックアウトエラー:', error);
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
      console.error('チェックインエラー:', error);
      Alert.alert('エラー', 'チェックインに失敗しました');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>NFC読み取り</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
            <Image
              source={ReactLogo}
              style={{ width: 80, height: 80 }}
              contentFit="contain"
            />
            {nfcState.isAutoScanning && (
              <View style={styles.scanningOverlay}>
                <Text style={styles.scanningText}>読み取り待機中...</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.instruction}>
            NFCタグをスマートフォンの背面に近づけてください
          </Text>
          
          <Text style={styles.subInstruction}>
            {nfcState.isAutoScanning 
              ? 'タグを近づけると自動的に読み取ります' 
              : 'NFC機能を準備中...'}
          </Text>

          {/* 自動スキャン状態表示 */}
          {nfcState.isAutoScanning && (
            <View style={styles.autoScanStatus}>
              <Ionicons name="radio" size={24} color="#4A90E2" />
              <Text style={styles.autoScanText}>自動スキャン中</Text>
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

        {/* 読み取り結果表示 - 画面中央に配置 */}
        {nfcState.lastResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>読み取り結果</Text>
            
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>タグID:</Text>
              <Text style={styles.resultValue}>{nfcState.lastResult.id}</Text>
            </View>
            
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>タイプ:</Text>
              <Text style={styles.resultValue}>{nfcState.lastResult.type}</Text>
            </View>
            
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>読み取り時刻:</Text>
              <Text style={styles.resultValue}>
                {new Date(nfcState.lastResult.timestamp).toLocaleString('ja-JP')}
              </Text>
            </View>

            {/* 詳細データ表示 */}
            {nfcState.lastResult.data && (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsTitle}>詳細データ:</Text>
                <ScrollView 
                  style={styles.detailsScroll}
                  showsVerticalScrollIndicator={true}
                >
                  <Text style={styles.detailsText}>
                    {nfcState.lastResult.data}
                  </Text>
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* NFCモーダル */}
      <NFCModal
        visible={modalVisible}
        onClose={handleCloseModal}
        tomicaList={scannedTomicaList}
        onCheckOut={handleCheckOut}
        onCheckIn={handleCheckIn}
        scannedNfcTagId={nfcState.lastResult?.id}
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
  resultContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  resultItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    minWidth: 80,
  },
  resultValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  detailsContainer: {
    marginTop: 12,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  detailsScroll: {
    maxHeight: 120,
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  detailsText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
}); 