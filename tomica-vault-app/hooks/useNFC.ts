import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { useNFCEnvironment } from './useNFCEnvironment';
import { useAudio } from './useAudio';

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

// Development Build用のNFC実装
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
        
        // 最新ドキュメントに従った実装：まずstart()を呼び出す
        await NfcManager.start();
        
        // start()後にNFC対応状況を確認
        const supported = await NfcManager.isSupported();
        
        if (supported) {
          isInitialized = true;
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

  // 自動スキャン機能
  const startAutoScan = useCallback(async () => {
    const currentState = nfcStateRef.current;
    
    if (!currentState.isSupported || currentState.isAutoScanning) {
      return;
    }

    try {
      const NfcManager = require('react-native-nfc-manager').default;
      const { NfcEvents } = require('react-native-nfc-manager');
      
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
      
      // タグ検出イベントリスナーを設定
      NfcManager.setEventListener(NfcEvents.DiscoverTag, async (tag: any) => {
        
        const result: NFCReadResult = {
          id: tag.id || 'unknown',
          data: JSON.stringify(tag, null, 2),
          type: tag.techTypes?.[0] || 'auto-detected',
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
      });
      
      // セッションクローズイベントリスナーを設定
      NfcManager.setEventListener(NfcEvents.SessionClosed, () => {
        setNfcState(prev => ({ ...prev, isAutoScanning: false }));
      });
      
      // エラーイベントリスナーを設定
      NfcManager.setEventListener(NfcEvents.StateChanged, (state: any) => {
        if (state === 'off') {
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
      const NfcManager = require('react-native-nfc-manager').default;
      const { NfcEvents } = require('react-native-nfc-manager');
      
      // 全てのイベントリスナーを削除
      try {
        NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
        NfcManager.setEventListener(NfcEvents.SessionClosed, null);
        NfcManager.setEventListener(NfcEvents.StateChanged, null);
        await NfcManager.unregisterTagEvent();
        await NfcManager.cancelTechnologyRequest();
      } catch (e) {
        // エラーは無視
      }
      
      // 状態をリセット
      setNfcState(prev => ({ 
        ...prev, 
        isAutoScanning: false,
        error: null 
      }));
      
    } catch (error: any) {
      // エラーが発生してもスキャン状態はリセット
      setNfcState(prev => ({ 
        ...prev, 
        isAutoScanning: false,
        error: null
      }));
    }
  }, []);

  const readNfcTag = async (): Promise<NFCReadResult | null> => {
    const currentState = nfcStateRef.current;
    
    if (!currentState.isSupported) {
      Alert.alert('エラー', 'NFC機能が利用できません');
      return null;
    }

    setNfcState(prev => ({ ...prev, isScanning: true, error: null }));

    try {
      const NfcManager = require('react-native-nfc-manager').default;
      const { NfcTech } = require('react-native-nfc-manager');
      
      // NDEF技術タイプをリクエスト
      await NfcManager.requestTechnology(NfcTech.Ndef);
      
      // タグ情報を取得
      const tag = await NfcManager.getTag();
      
      if (tag) {
        const result: NFCReadResult = {
          id: tag.id || 'unknown',
          data: JSON.stringify(tag, null, 2),
          type: tag.techTypes?.[0] || 'Ndef',
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
      // NDEFが失敗した場合、NfcAを試行
      if (error.message?.includes('no tech request available') || 
          error.message?.includes('NDEF')) {
        try {
          const NfcManager = require('react-native-nfc-manager').default;
          const { NfcTech } = require('react-native-nfc-manager');
          
          await NfcManager.requestTechnology(NfcTech.NfcA);
          const tag = await NfcManager.getTag();
          
          if (tag) {
            const result: NFCReadResult = {
              id: tag.id || 'unknown',
              data: JSON.stringify(tag, null, 2),
              type: 'NfcA',
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
        } catch (nfcAError) {
          // NfcAも失敗
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
      try {
        const NfcManager = require('react-native-nfc-manager').default;
        await NfcManager.cancelTechnologyRequest();
      } catch (error) {
        // エラーは無視
      }
    }
  };

  return {
    nfcState,
    readNfcTag,
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