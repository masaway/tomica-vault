import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { useNFCEnvironment } from './useNFCEnvironment';
import { useAudio } from './useAudio';

// React Native Reanimatedの動的インポート（パフォーマンス最適化）
let runOnUIImport: any = null;
try {
  const reanimatedModule = require('react-native-reanimated');
  runOnUIImport = reanimatedModule.runOnUI;
} catch (e) {
  // Reanimatedが利用できない場合はnullのまま
}

// NFC読み取り結果の型定義
export interface NFCReadResult {
  id: string;
  data?: string;
  type?: string;
  timestamp: number;
}

// NFC読み取り状態の型定義
export interface NFCState {
  isScanning: boolean;
  isSupported: boolean;
  lastResult: NFCReadResult | null;
  error: string | null;
  isAutoScanning: boolean;
}

// Development Build用のNFC実装（幅広いタグ対応・性能最適化版）
const useNFCReal = () => {
  const { playSuccessSound, audioState, waitForReady } = useAudio();
  const [nfcState, setNfcState] = useState<NFCState>({
    isScanning: false,
    isSupported: false,
    lastResult: null,
    error: null,
    isAutoScanning: false,
  });
  
  // 状態参照用のref
  const nfcStateRef = useRef(nfcState);
  
  // iOS特有の問題対応：重複リクエスト防止とセッション管理
  const lastScanTime = useRef<number>(0);
  const SCAN_THROTTLE_MS = Platform.OS === 'ios' ? 1000 : 500; // iOSではより長い間隔
  const isSessionActive = useRef<boolean>(false); // セッション状態管理
  
  // パフォーマンス監視
  const scanPerformance = useRef({
    totalScans: 0,
    successfulScans: 0,
    averageScanTime: 0,
    lastScanDuration: 0
  });
  
  // 高速化：NFC Manager インスタンスキャッシュ
  const nfcManagerCache = useRef<{
    instance: any | null;
    NfcTech: any | null;
    NfcEvents: any | null;
  }>({
    instance: null,
    NfcTech: null,
    NfcEvents: null
  });
  
  // 状態更新時にrefも更新
  useEffect(() => {
    nfcStateRef.current = nfcState;
  }, [nfcState]);

  useEffect(() => {
    let NfcManager: any = null;
    let isInitialized = false;
    
    const initNFC = async () => {
      try {
        // react-native-nfc-managerの存在確認
        let NfcManagerModule;
        try {
          NfcManagerModule = require('react-native-nfc-manager');
        } catch (moduleError) {
          throw new Error('NFC モジュールがインストールされていません');
        }
        
        // 公式ドキュメントに従った正しい実装
        NfcManager = NfcManagerModule.default;
        
        // 高速化：モジュールをキャッシュ
        nfcManagerCache.current.instance = NfcManager;
        nfcManagerCache.current.NfcTech = NfcManagerModule.NfcTech;
        nfcManagerCache.current.NfcEvents = NfcManagerModule.NfcEvents;
        
        // 最新ドキュメントに従った実装：まずstart()を呼び出す
        await NfcManager.start();
        
        // start()後にNFC対応状況を確認
        const supported = await NfcManager.isSupported();
        
        if (supported) {
          isInitialized = true;
          
          // iOS特有の問題対応：より詳細な初期化ログ
          if (Platform.OS === 'ios') {
            console.log('iOS NFC初期化成功 - Core NFC対応');
            // iOS用の初期化後クリーンアップ
            try {
              await NfcManager.cancelTechnologyRequest();
            } catch (e) {
              // 初期化時のクリーンアップエラーは無視
            }
          } else {
            console.log('Android NFC初期化成功 - 幅広いタグ対応モード');
          }
          
          setNfcState(prev => ({ ...prev, isSupported: true }));
        } else {
          setNfcState(prev => ({ 
            ...prev, 
            isSupported: false, 
            error: 'この端末はNFC機能をサポートしていません' 
          }));
        }
      } catch (error: any) {
        setNfcState(prev => ({ 
          ...prev, 
          isSupported: false, 
          error: `NFC機能の初期化に失敗しました: ${error.message}` 
        }));
      }
    };

    initNFC();

    // クリーンアップ
    return () => {
      if (NfcManager && isInitialized) {
        try {
          const { NfcEvents } = require('react-native-nfc-manager');
          NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
          NfcManager.setEventListener(NfcEvents.SessionClosed, null);
          NfcManager.setEventListener(NfcEvents.StateChanged, null);
          NfcManager.unregisterTagEvent();
        } catch (error) {
          // エラーは無視（クリーンアップ時）
        }
      }
    };
  }, []);

  // 高速化：キャッシュされたNFC Managerを取得するヘルパー
  const getCachedNfcManager = () => {
    if (nfcManagerCache.current.instance) {
      return {
        NfcManager: nfcManagerCache.current.instance,
        NfcTech: nfcManagerCache.current.NfcTech,
        NfcEvents: nfcManagerCache.current.NfcEvents
      };
    }
    // フォールバック：requireで取得
    const NfcManagerModule = require('react-native-nfc-manager');
    return {
      NfcManager: NfcManagerModule.default,
      NfcTech: NfcManagerModule.NfcTech,
      NfcEvents: NfcManagerModule.NfcEvents
    };
  };

  // 自動スキャン機能
  const startAutoScan = useCallback(async () => {
    const currentState = nfcStateRef.current;
    
    if (!currentState.isSupported || currentState.isAutoScanning) {
      return;
    }

    try {
      const { NfcManager, NfcEvents } = getCachedNfcManager();
      
      // 既存のイベントリスナーをクリア
      try {
        await NfcManager.unregisterTagEvent();
        NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
        NfcManager.setEventListener(NfcEvents.SessionClosed, null);
        NfcManager.setEventListener(NfcEvents.StateChanged, null);
      } catch (e) {
        // エラーは無視
      }
      
      setNfcState(prev => ({ ...prev, isAutoScanning: true, error: null }));
      
      // iOS特有の問題対応：タグ検出イベントリスナーを設定
      NfcManager.setEventListener(NfcEvents.DiscoverTag, async (tag: any) => {
        // iOS特有の問題対応：重複処理防止
        if (Platform.OS === 'ios' && isSessionActive.current) {
          console.log('iOS: タグ検出時にセッション既に活性中、処理をスキップ');
          return;
        }
        isSessionActive.current = true;
        // タグタイプの詳細分析
        const techTypes = tag.techTypes || [];
        const primaryTech = techTypes[0] || 'Unknown';
        
        // タグの詳細情報を構築
        const tagDetails = {
          id: tag.id,
          techTypes: techTypes,
          ndefMessage: tag.ndefMessage,
          maxSize: tag.maxSize,
          isWritable: tag.isWritable,
          type: tag.type,
          platform: Platform.OS,
          scanTimestamp: new Date().toISOString(),
          atqa: tag.atqa, // Android固有
          sak: tag.sak,   // Android固有
          uid: tag.uid,   // iOS固有
        };
        
        const result: NFCReadResult = {
          id: tag.id || 'unknown',
          data: JSON.stringify(tagDetails, null, 2),
          type: `${primaryTech}${techTypes.length > 1 ? ` (+${techTypes.length - 1})` : ''}`,
          timestamp: Date.now(),
        };
        
        setNfcState(prev => ({ 
          ...prev, 
          lastResult: result,
          error: null 
        }));

        // スキャン成功音を再生
        if (audioState.isEnabled) {
          try {
            const isReady = await waitForReady();
            if (isReady) {
              await playSuccessSound();
            }
          } catch (error) {
            // 音声再生エラーは無視
          }
        }
        
        // iOS特有の問題対応：処理完了後にセッション状態をリセット
        if (Platform.OS === 'ios') {
          isSessionActive.current = false;
        }
      });
      
      // iOS特有の問題対応：セッションクローズイベントリスナーを設定
      NfcManager.setEventListener(NfcEvents.SessionClosed, () => {
        console.log(`${Platform.OS}: NFCセッションがクローズされました`);
        isSessionActive.current = false;
        setNfcState(prev => ({ ...prev, isAutoScanning: false }));
      });
      
      // iOS特有の問題対応：状態変更イベントリスナーを設定
      NfcManager.setEventListener(NfcEvents.StateChanged, (state: any) => {
        console.log(`${Platform.OS}: NFC状態変更:`, state);
        if (state === 'off') {
          isSessionActive.current = false;
          setNfcState(prev => ({ 
            ...prev, 
            isAutoScanning: false,
            error: 'NFC機能が無効になりました' 
          }));
        }
      });
      
      // 自動スキャン開始
      await NfcManager.registerTagEvent();
      
    } catch (error: any) {
      setNfcState(prev => ({ 
        ...prev, 
        isAutoScanning: false,
        error: `自動スキャンの開始に失敗しました: ${error.message}` 
      }));
    }
  }, [audioState.isEnabled, audioState.isLoaded, audioState.isPlaying, playSuccessSound, waitForReady]);

  // 自動スキャン停止
  const stopAutoScan = useCallback(async () => {
    try {
      const { NfcManager, NfcEvents } = getCachedNfcManager();
      
      // iOS特有の問題対応：全てのイベントリスナーを削除
      try {
        NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
        NfcManager.setEventListener(NfcEvents.SessionClosed, null);
        NfcManager.setEventListener(NfcEvents.StateChanged, null);
        await NfcManager.unregisterTagEvent();
        await NfcManager.cancelTechnologyRequest();
        
        // iOS特有の問題対応：停止時の追加クリーンアップ
        if (Platform.OS === 'ios') {
          isSessionActive.current = false;
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (e) {
        // エラーは無視（クリーンアップ時）
      }
      
      // 状態をリセット
      setNfcState(prev => ({ 
        ...prev, 
        isAutoScanning: false,
        error: null 
      }));
      
    } catch (error: any) {
      // iOS特有の問題対応：エラー発生時のセッション状態リセット
      if (Platform.OS === 'ios') {
        isSessionActive.current = false;
      }
      
      // エラーが発生してもスキャン状態はリセット
      setNfcState(prev => ({ 
        ...prev, 
        isAutoScanning: false,
        error: null
      }));
    }
  }, []);

  // 超高速スキャン用の関数（タイムアウト大幅短縮・性能最適化）
  const quickScanNfcTag = async (timeoutMs: number = 2000): Promise<NFCReadResult | null> => {
    const currentState = nfcStateRef.current;
    
    if (!currentState.isSupported) {
      Alert.alert('エラー', 'NFC機能が利用できません');
      return null;
    }

    // iOS特有の問題対応：重複スキャン防止とセッション状態確認
    const now = Date.now();
    if (currentState.isScanning || 
        (now - lastScanTime.current) < SCAN_THROTTLE_MS || 
        isSessionActive.current) {
      console.log('スキャンスロットル中 / セッション活性中:', {
        timeSinceLastScan: now - lastScanTime.current,
        isSessionActive: isSessionActive.current,
        platform: Platform.OS
      });
      return null;
    }
    lastScanTime.current = now;
    isSessionActive.current = true;

    setNfcState(prev => ({ ...prev, isScanning: true, error: null }));
    
    // パフォーマンス監視開始
    const scanStartTime = performance.now();
    scanPerformance.current.totalScans++;

    try {
      const { NfcManager, NfcTech } = getCachedNfcManager();
      
      // iOS特有の問題対応：既存セッションのクリーンアップ
      if (Platform.OS === 'ios') {
        try {
          await NfcManager.cancelTechnologyRequest();
          // iOS用の追加待機時間
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (e) {
          // クリーンアップエラーは無視
        }
      }
      
      // タイムアウト付きでスキャンを実行
      const result = await Promise.race([
        (async () => {
          // iOS特有の問題対応：プラットフォーム別のテクノロジー選択
          const techArray = Platform.OS === 'ios' ? [
            NfcTech.Ndef,            // iOSでは最初にNDEFを試す
            NfcTech.NfcA,            // ISO14443-A（Core NFCで最も安定）
            NfcTech.IsoDep,          // ISO14443-4（安定性重視）
            NfcTech.NfcF,            // FeliCa（日本固有、iOS Core NFC対応）
          ] : [
            NfcTech.NfcA,            // Android：最も一般的（優先度最高）
            NfcTech.Ndef,            // NDEF形式（優先度高）
            NfcTech.MifareUltralight, // MIFARE Ultralight（よく使用）
            NfcTech.MifareClassic,   // MIFARE Classic
            NfcTech.IsoDep,          // ISO14443-4
            NfcTech.NfcV,            // ISO15693
            NfcTech.NfcF,            // FeliCa（日本固有）
            NfcTech.NfcB,            // ISO14443 Type B
            NfcTech.NdefFormatable   // フォーマット可能タグ
          ];
          
          await NfcManager.requestTechnology(techArray);
          
          const tag = await NfcManager.getTag();
          
          if (tag) {
            const techTypes = tag.techTypes || [];
            const primaryTech = techTypes[0] || 'Quick';
            
            const tagDetails = {
              id: tag.id,
              techTypes: techTypes,
              ndefMessage: tag.ndefMessage,
              maxSize: tag.maxSize,
              isWritable: tag.isWritable,
              type: tag.type,
              platform: Platform.OS,
              scanTimestamp: new Date().toISOString(),
              atqa: tag.atqa,
              sak: tag.sak,
              uid: tag.uid,
              scanMode: 'quick',
            };
            
            return {
              id: tag.id || 'unknown',
              data: JSON.stringify(tagDetails, null, 2),
              type: `${primaryTech}${techTypes.length > 1 ? ` (+${techTypes.length - 1})` : ''}`,
              timestamp: Date.now(),
            };
          }
          return null;
        })(),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error(`Quick scan timeout (${timeoutMs}ms)`)), timeoutMs)
        )
      ]);

      if (result) {
        // パフォーマンス監視完了（成功）
        const scanEndTime = performance.now();
        const scanDuration = scanEndTime - scanStartTime;
        scanPerformance.current.successfulScans++;
        scanPerformance.current.lastScanDuration = scanDuration;
        scanPerformance.current.averageScanTime = 
          (scanPerformance.current.averageScanTime * (scanPerformance.current.successfulScans - 1) + scanDuration) / 
          scanPerformance.current.successfulScans;
        
        console.log(`クイックスキャン完了: ${scanDuration.toFixed(1)}ms | 平均: ${scanPerformance.current.averageScanTime.toFixed(1)}ms | 成功率: ${((scanPerformance.current.successfulScans / scanPerformance.current.totalScans) * 100).toFixed(1)}%`);
        
        setNfcState(prev => ({ 
          ...prev, 
          isScanning: false, 
          lastResult: result,
          error: null 
        }));
        
        // スキャン成功音を再生
        if (audioState.isEnabled) {
          (async () => {
            try {
              const isReady = await waitForReady();
              if (isReady) {
                await playSuccessSound();
              }
            } catch (error) {
              // 音声エラーは無視
            }
          })();
        }
        return result;
      }
      
      throw new Error('タグが検出されませんでした');
      
    } catch (error: any) {
      const errorMessage = error.message || 'クイックスキャン中にエラーが発生しました';
      
      // iOS特有の問題対応：エラー詳細のロギング
      if (Platform.OS === 'ios') {
        console.log('iOS NFC エラー詳細:', {
          error: error.message,
          code: error.code,
          nativeStackIOS: error.nativeStackIOS,
          sessionActive: isSessionActive.current
        });
      }
      
      setNfcState(prev => ({ 
        ...prev, 
        isScanning: false, 
        error: errorMessage 
      }));
      
      return null;
    } finally {
      isSessionActive.current = false;
      try {
        const { NfcManager } = getCachedNfcManager();
        await NfcManager.cancelTechnologyRequest();
        
        // iOS特有の問題対応：追加のクリーンアップ待機時間
        if (Platform.OS === 'ios') {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        // エラーは無視
      }
    }
  };

  const readNfcTag = async (): Promise<NFCReadResult | null> => {
    const currentState = nfcStateRef.current;
    
    if (!currentState.isSupported) {
      Alert.alert('エラー', 'NFC機能が利用できません');
      return null;
    }

    // iOS特有の問題対応：重複スキャン防止とセッション状態確認
    const now = Date.now();
    if (currentState.isScanning || 
        (now - lastScanTime.current) < SCAN_THROTTLE_MS || 
        isSessionActive.current) {
      console.log('通常スキャンスロットル中 / セッション活性中:', {
        timeSinceLastScan: now - lastScanTime.current,
        isSessionActive: isSessionActive.current,
        platform: Platform.OS
      });
      return null;
    }
    lastScanTime.current = now;
    isSessionActive.current = true;

    setNfcState(prev => ({ ...prev, isScanning: true, error: null }));

    try {
      const { NfcManager, NfcTech } = getCachedNfcManager();
      
      // iOS特有の問題対応：既存セッションのクリーンアップ
      if (Platform.OS === 'ios') {
        try {
          await NfcManager.cancelTechnologyRequest();
          // iOS用の追加待機時間
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (e) {
          // クリーンアップエラーは無視
        }
      }
      
      // iOS特有の問題対応：プラットフォーム別のテクノロジー選択
      const techArray = Platform.OS === 'ios' ? [
        NfcTech.Ndef,            // iOSでは最初にNDEFを試す
        NfcTech.NfcA,            // ISO14443-A（Core NFCで最も安定）
        NfcTech.IsoDep,          // ISO14443-4（安定性重視）
        NfcTech.NfcF,            // FeliCa（日本固有、iOS Core NFC対応）
      ] : [
        NfcTech.NfcA,            // Android：最も一般的（優先度最高）
        NfcTech.Ndef,            // NDEF形式（優先度高）
        NfcTech.MifareUltralight, // MIFARE Ultralight（よく使用）
        NfcTech.MifareClassic,   // MIFARE Classic
        NfcTech.IsoDep,          // ISO14443-4
        NfcTech.NfcV,            // ISO15693
        NfcTech.NfcF,            // FeliCa（日本固有）
        NfcTech.NfcB,            // ISO14443 Type B
        NfcTech.NdefFormatable   // フォーマット可能タグ
      ];
      
      await NfcManager.requestTechnology(techArray);
      
      // タグ情報を取得
      const tag = await NfcManager.getTag();
      
      if (tag) {
        // タグタイプの詳細分析
        const techTypes = tag.techTypes || [];
        const primaryTech = techTypes[0] || 'Universal';
        
        // タグの詳細情報を構築
        const tagDetails = {
          id: tag.id,
          techTypes: techTypes,
          ndefMessage: tag.ndefMessage,
          maxSize: tag.maxSize,
          isWritable: tag.isWritable,
          type: tag.type,
          platform: Platform.OS,
          scanTimestamp: new Date().toISOString(),
          atqa: tag.atqa, // Android固有
          sak: tag.sak,   // Android固有
          uid: tag.uid,   // iOS固有
          scanMode: 'manual',
        };
        
        const result: NFCReadResult = {
          id: tag.id || 'unknown',
          data: JSON.stringify(tagDetails, null, 2),
          type: `${primaryTech}${techTypes.length > 1 ? ` (+${techTypes.length - 1})` : ''}`,
          timestamp: Date.now(),
        };
        
        setNfcState(prev => ({ 
          ...prev, 
          isScanning: false, 
          lastResult: result,
          error: null 
        }));
        
        // スキャン成功音を再生
        if (audioState.isEnabled) {
          (async () => {
            try {
              const isReady = await waitForReady();
              if (isReady) {
                await playSuccessSound();
              }
            } catch (error) {
              // 音声エラーは無視
            }
          })();
        }
        return result;
      } else {
        throw new Error('NFCタグの読み取りに失敗しました');
      }
    } catch (error: any) {
      // iOS特有の問題対応：エラー詳細のロギング
      if (Platform.OS === 'ios') {
        console.log('iOS NFC メイン読み取りエラー詳細:', {
          error: error.message,
          code: error.code,
          nativeStackIOS: error.nativeStackIOS,
          sessionActive: isSessionActive.current
        });
      }
      
      // 複数テクノロジーでの読み取りが失敗した場合、個別に試行
      console.log('複数テクノロジー読み取り失敗、個別試行を開始:', error.message);
      
      // iOS特有の問題対応：プラットフォーム別フォールバック戦略
      const fallbackTechs = Platform.OS === 'ios' ? [
        { tech: 'Ndef', name: 'Ndef' },                   // iOS：NDEF最優先
        { tech: 'NfcA', name: 'NfcA' },                   // ISO14443-A（Core NFC安定）
        { tech: 'IsoDep', name: 'IsoDep' },               // ISO14443-4（iOS対応良好）
        { tech: 'NfcF', name: 'NfcF' },                   // FeliCa（日本固有、iOS対応）
      ] : [
        { tech: 'NfcA', name: 'NfcA' },                   // Android：最高優先度
        { tech: 'MifareUltralight', name: 'MifareUltralight' }, // 一般的
        { tech: 'Ndef', name: 'Ndef' },                   // NDEF対応
        { tech: 'MifareClassic', name: 'MifareClassic' },  // 交通系
        { tech: 'IsoDep', name: 'IsoDep' },               // ISO準拠
        { tech: 'NfcV', name: 'NfcV' },                   // 長距離タグ
        { tech: 'NfcF', name: 'NfcF' },                   // FeliCa
        { tech: 'NdefFormatable', name: 'NdefFormatable' } // 最後の手段
      ];
      
      for (const { tech, name } of fallbackTechs) {
        try {
          const { NfcManager } = getCachedNfcManager();
          
          // 高速化：フォールバック時はより短いタイムアウト
          const tagResult = await Promise.race([
            (async () => {
              await NfcManager.requestTechnology(tech);
              return await NfcManager.getTag();
            })(),
            new Promise<null>((_, reject) => 
              setTimeout(() => reject(new Error(`Fallback timeout for ${name}`)), 1500)
            )
          ]);
          
          const tag = tagResult;
          
          if (tag) {
            // フォールバック時のタグ詳細情報
            const techTypes = tag.techTypes || [name];
            const tagDetails = {
              id: tag.id,
              techTypes: techTypes,
              ndefMessage: tag.ndefMessage,
              maxSize: tag.maxSize,
              isWritable: tag.isWritable,
              type: tag.type,
              platform: Platform.OS,
              scanTimestamp: new Date().toISOString(),
              atqa: tag.atqa,
              sak: tag.sak,
              uid: tag.uid,
              scanMode: 'fallback',
              fallbackTech: name,
            };
            
            const result: NFCReadResult = {
              id: tag.id || 'unknown',
              data: JSON.stringify(tagDetails, null, 2),
              type: `${name}${techTypes.length > 1 ? ` (+${techTypes.length - 1})` : ''}`,
              timestamp: Date.now(),
            };
            
            setNfcState(prev => ({ 
              ...prev, 
              isScanning: false, 
              lastResult: result,
              error: null 
            }));
            
            // スキャン成功音を再生
            if (audioState.isEnabled) {
              (async () => {
                try {
                  const isReady = await waitForReady();
                  if (isReady) {
                    await playSuccessSound();
                  }
                } catch (error) {
                  // 音声エラーは無視
                }
              })();
            }
            
            return result;
          }
        } catch (techError) {
          console.log(`${name}での読み取り失敗:`, (techError as Error).message);
          // 次のテクノロジーを試行
          continue;
        } finally {
          try {
            const { NfcManager } = getCachedNfcManager();
            await NfcManager.cancelTechnologyRequest();
            
            // iOS特有の問題対応：フォールバック時のクリーンアップ待機
            if (Platform.OS === 'ios') {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          } catch (e) {
            // クリーンアップエラーは無視
          }
        }
      }
      
      const errorMessage = error.message || 'NFCタグの読み取り中にエラーが発生しました';
      
      setNfcState(prev => ({ 
        ...prev, 
        isScanning: false, 
        error: errorMessage 
      }));
      
      return null;
    } finally {
      isSessionActive.current = false;
      try {
        const { NfcManager } = getCachedNfcManager();
        await NfcManager.cancelTechnologyRequest();
        
        // iOS特有の問題対応：追加のクリーンアップ待機時間
        if (Platform.OS === 'ios') {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        // エラーは無視
      }
    }
  };

  return {
    nfcState,
    readNfcTag,
    quickScanNfcTag,
    startAutoScan,
    stopAutoScan,
  };
};

// Expo Go用のモック実装
const useNFCMock = () => {
  const { playSuccessSound, audioState, waitForReady } = useAudio();
  const [nfcState, setNfcState] = useState<NFCState>({
    isScanning: false,
    isSupported: true, // モックでは常にサポート
    lastResult: null,
    error: null,
    isAutoScanning: false,
  });
  
  // 状態参照用のref
  const nfcStateRef = useRef(nfcState);
  
  // 状態更新時にrefも更新
  useEffect(() => {
    nfcStateRef.current = nfcState;
  }, [nfcState]);

  // モック用の自動スキャン機能
  const startAutoScan = useCallback(async () => {
    const currentState = nfcStateRef.current;
    
    if (currentState.isAutoScanning) {
      return;
    }

    setNfcState(prev => ({ ...prev, isAutoScanning: true, error: null }));
    
    // モック：5秒後に自動的にタグを検出
    setTimeout(() => {
      const mockResult: NFCReadResult = {
        id: '12345',
        data: JSON.stringify({
          id: '12345',
          type: 'MockNFC_Auto',
          platform: Platform.OS,
          timestamp: new Date().toISOString(),
          message: 'これはExpo Go用の自動スキャンモックデータです',
        }, null, 2),
        type: 'MockNFC_Auto',
        timestamp: Date.now(),
      };

      setNfcState(prev => ({ 
        ...prev, 
        lastResult: mockResult,
        error: null 
      }));

      // スキャン成功音を再生
      if (audioState.isEnabled) {
        (async () => {
          try {
            const isReady = await waitForReady();
            if (isReady) {
              await playSuccessSound();
            }
          } catch (error) {
            // 音声エラーは無視
          }
        })();
      }
    }, 5000);
  }, []);

  // モック用の自動スキャン停止
  const stopAutoScan = useCallback(async () => {
    setNfcState(prev => ({ ...prev, isAutoScanning: false }));
  }, []);

  const readNfcTag = async (): Promise<NFCReadResult | null> => {
    setNfcState(prev => ({ ...prev, isScanning: true, error: null }));

    // モック読み取り処理（1-2秒の遅延を再現）
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    try {
      // モックデータを生成
      const mockResult: NFCReadResult = {
        id: '12345',
        data: JSON.stringify({
          id: '12345',
          type: 'MockNFC',
          platform: Platform.OS,
          timestamp: new Date().toISOString(),
          message: 'これはExpo Go用のモックデータです',
        }, null, 2),
        type: 'MockNFC',
        timestamp: Date.now(),
      };

      setNfcState(prev => ({ 
        ...prev, 
        isScanning: false, 
        lastResult: mockResult,
        error: null 
      }));

      // スキャン成功音を再生
      if (audioState.isEnabled) {
        (async () => {
          try {
            const isReady = await waitForReady();
            if (isReady) {
              await playSuccessSound();
            }
          } catch (error) {
            // 音声エラーは無視
          }
        })();
      }
      return mockResult;
    } catch (error) {
      setNfcState(prev => ({ 
        ...prev, 
        isScanning: false, 
        error: 'モックNFC読み取りでエラーが発生しました' 
      }));
      
      return null;
    }
  };

  return {
    nfcState,
    readNfcTag,
    quickScanNfcTag: readNfcTag, // モックでは同じ関数を使用
    startAutoScan,
    stopAutoScan,
  };
};

// 環境に応じたNFC実装を提供
export const useNFC = () => {
  const { isNFCAvailable, shouldUseMockNFC } = useNFCEnvironment();
  
  if (shouldUseMockNFC) {
    return useNFCMock();
  } else {
    return useNFCReal();
  }
};