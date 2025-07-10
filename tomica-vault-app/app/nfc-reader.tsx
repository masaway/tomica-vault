import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect } from 'react';
import ReactLogo from '../assets/images/react-logo.png';
import { useNFC } from '@/hooks/useNFC';
import { useNFCEnvironment } from '@/hooks/useNFCEnvironment';
import { logEnvironmentInfo } from '@/constants/Environment';

export default function NFCReaderScreen() {
  const { nfcState, startAutoScan, stopAutoScan } = useNFC();
  const { environmentName, isNFCAvailable } = useNFCEnvironment();

  useEffect(() => {
    // 環境情報をログ出力
    logEnvironmentInfo();
    
    // ページアクセス時に自動スキャンを開始
    if (nfcState.isSupported) {
      startAutoScan();
    }
    
    // クリーンアップ時に自動スキャンを停止
    return () => {
      stopAutoScan();
    };
  }, [nfcState.isSupported, startAutoScan, stopAutoScan]);

  // 新しいタグが検出されたときのアラート表示
  useEffect(() => {
    if (nfcState.lastResult) {
      Alert.alert(
        'NFC読み取り成功',
        `タグID: ${nfcState.lastResult.id}\n\n詳細情報は画面下部に表示されます`,
        [{ text: 'OK' }]
      );
    }
  }, [nfcState.lastResult]);

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
              style={{ width: 100, height: 100 }}
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

        {/* 読み取り結果表示 */}
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
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
    marginBottom: 24,
  },
  nfcIconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 100,
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
    marginBottom: 24,
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
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  resultItem: {
    flexDirection: 'row',
    marginBottom: 8,
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
    marginTop: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  detailsScroll: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  detailsText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
}); 