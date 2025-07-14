import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { useNFCEnvironment } from './useNFCEnvironment';

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
  const [nfcState, setNfcState] = useState<NFCState>({
    isScanning: false,
    isSupported: false,
    lastResult: null,
    error: null,
    isAutoScanning: false,
  });

  useEffect(() => {
    let NfcManager: any = null;
    
    const initNFC = async () => {
      try {
        // 公式ドキュメントに従った正しい実装
        NfcManager = require('react-native-nfc-manager').default;
        const { NfcTech } = require('react-native-nfc-manager');
        
        console.log('NFC Manager を初期化します');
        console.log('NfcTech定数:', NfcTech);
        
        // NFC対応確認
        const supported = await NfcManager.isSupported();
        console.log('NFC対応状況:', supported);
        
        if (supported) {
          // NFC初期化（公式ドキュメントの推奨方法）
          await NfcManager.start();
          
          setNfcState(prev => ({ ...prev, isSupported: true }));
          console.log('NFC機能が初期化されました');
        } else {
          setNfcState(prev => ({ 
            ...prev, 
            isSupported: false, 
            error: 'この端末はNFC機能をサポートしていません' 
          }));
          console.log('NFC機能がサポートされていません');
        }
      } catch (error: any) {
        console.error('NFC初期化エラー:', error);
        console.error('エラーの詳細:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        setNfcState(prev => ({ 
          ...prev, 
          isSupported: false, 
          error: `NFC機能の初期化に失敗しました: ${error.message}` 
        }));
      }
    };

    initNFC();

    // クリーンアップ（公式ドキュメント推奨）
    return () => {
      if (NfcManager) {
        try {
          // 個別にイベントリスナーをクリア（安全な方法）
          const { NfcEvents } = require('react-native-nfc-manager');
          
          try {
            NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
          } catch (e) {
            console.log('DiscoverTagイベントの初期化時クリアに失敗:', e);
          }
          
          try {
            NfcManager.setEventListener(NfcEvents.SessionClosed, null);
          } catch (e) {
            console.log('SessionClosedイベントの初期化時クリアに失敗:', e);
          }
          
          try {
            NfcManager.setEventListener(NfcEvents.StateChanged, null);
          } catch (e) {
            console.log('StateChangedイベントの初期化時クリアに失敗:', e);
          }
          
          // NfcManagerには stop() メソッドは存在しない
          // cancelTechnologyRequest() で十分
          console.log('NFC機能をクリーンアップしました');
        } catch (error) {
          console.error('NFC機能のクリーンアップでエラー:', error);
        }
      }
    };
  }, []);

  // 自動スキャン機能
  const startAutoScan = useCallback(async () => {
    if (!nfcState.isSupported) {
      console.log('NFC機能がサポートされていません');
      return;
    }

    if (nfcState.isAutoScanning) {
      console.log('既に自動スキャンが開始されています');
      return;
    }

    try {
      const NfcManager = require('react-native-nfc-manager').default;
      const { NfcEvents } = require('react-native-nfc-manager');
      
      console.log('自動NFCスキャンを開始します');
      
      // 既存のイベントリスナーを確実にクリア
      try {
        NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
        NfcManager.setEventListener(NfcEvents.SessionClosed, null);
        NfcManager.setEventListener(NfcEvents.StateChanged, null);
      } catch (e) {
        console.log('既存イベントリスナーのクリアに失敗（通常は問題なし）:', e);
      }
      
      setNfcState(prev => ({ ...prev, isAutoScanning: true, error: null }));
      
      // タグ検出イベントリスナーを設定
      NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: any) => {
        console.log('自動スキャンでタグを検出:', tag);
        
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
      });
      
      // セッションクローズイベントリスナーを設定
      NfcManager.setEventListener(NfcEvents.SessionClosed, () => {
        console.log('NFCセッションがクローズされました');
        setNfcState(prev => ({ ...prev, isAutoScanning: false }));
      });
      
      // エラーイベントリスナーを設定
      NfcManager.setEventListener(NfcEvents.StateChanged, (state: any) => {
        console.log('NFC状態が変更されました:', state);
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
      console.log('自動スキャンが開始されました');
      
    } catch (error: any) {
      console.error('自動スキャン開始エラー:', error);
      setNfcState(prev => ({ 
        ...prev, 
        isAutoScanning: false,
        error: `自動スキャンの開始に失敗しました: ${error.message}` 
      }));
    }
  }, [nfcState.isSupported, nfcState.isAutoScanning]);

  // 自動スキャン停止
  const stopAutoScan = useCallback(async () => {
    console.log('自動NFCスキャンの停止を試みます');

    try {
      const NfcManager = require('react-native-nfc-manager').default;
      const { NfcEvents } = require('react-native-nfc-manager');
      
      console.log('自動NFCスキャンを停止します');
      
      // 全てのイベントリスナーを削除（存在チェック付き）
      try {
        NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      } catch (e) {
        console.log('DiscoverTagイベントのクリアに失敗:', e);
      }
      
      try {
        NfcManager.setEventListener(NfcEvents.SessionClosed, null);
      } catch (e) {
        console.log('SessionClosedイベントのクリアに失敗:', e);
      }
      
      try {
        NfcManager.setEventListener(NfcEvents.StateChanged, null);
      } catch (e) {
        console.log('StateChangedイベントのクリアに失敗:', e);
      }
      
      // 自動スキャン停止
      try {
        await NfcManager.unregisterTagEvent();
      } catch (e) {
        console.log('unregisterTagEventに失敗:', e);
      }
      
      // 進行中の技術リクエストもキャンセル
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch (e) {
        console.log('技術リクエストのキャンセルに失敗（通常は問題なし）:', e);
      }
      
      // 状態を確実にリセット
      setNfcState(prev => ({ 
        ...prev, 
        isAutoScanning: false,
        error: null 
      }));
      console.log('自動スキャンが停止されました');
      
    } catch (error: any) {
      console.error('自動スキャン停止エラー:', error);
      // エラーが発生してもスキャン状態はリセット
      setNfcState(prev => ({ 
        ...prev, 
        isAutoScanning: false,
        error: null // エラーメッセージは設定しない（停止処理なので）
      }));
    }
  }, []);

  const readNfcTag = async (): Promise<NFCReadResult | null> => {
    if (!nfcState.isSupported) {
      Alert.alert('エラー', 'NFC機能が利用できません');
      return null;
    }

    setNfcState(prev => ({ ...prev, isScanning: true, error: null }));

    try {
      const NfcManager = require('react-native-nfc-manager').default;
      const { NfcTech } = require('react-native-nfc-manager');
      
      console.log('NFC読み取りを開始します');
      console.log('NfcTech定数:', NfcTech);
      
      // 公式ドキュメントに従った正しい実装
      // 1. NDEF技術タイプをリクエスト（最も一般的）
      await NfcManager.requestTechnology(NfcTech.Ndef);
      console.log('NDEF技術タイプをリクエストしました');
      
      // 2. タグ情報を取得
      const tag = await NfcManager.getTag();
      console.log('取得したタグ情報:', tag);
      
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
        
        console.log('NFC読み取り成功:', result);
        return result;
      } else {
        throw new Error('NFCタグの読み取りに失敗しました');
      }
    } catch (error: any) {
      console.error('NFC読み取りエラー:', error);
      
      // NDEFが失敗した場合、NfcAを試行
      if (error.message?.includes('no tech request available') || 
          error.message?.includes('NDEF')) {
        console.log('NDEFに失敗、NfcAを試行します');
        
        try {
          const NfcManager = require('react-native-nfc-manager').default;
          const { NfcTech } = require('react-native-nfc-manager');
          
          await NfcManager.requestTechnology(NfcTech.NfcA);
          console.log('NfcA技術タイプをリクエストしました');
          
          const tag = await NfcManager.getTag();
          console.log('NfcAでタグを取得:', tag);
          
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
            
            console.log('NfcAでNFC読み取り成功:', result);
            return result;
          }
        } catch (nfcAError) {
          console.error('NfcAでも失敗:', nfcAError);
        }
      }
      
      const errorMessage = error.message || 'NFCタグの読み取り中にエラーが発生しました';
      
      setNfcState(prev => ({ 
        ...prev, 
        isScanning: false, 
        error: errorMessage 
      }));
      
      console.error('エラーの詳細:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      return null;
    } finally {
      try {
        const NfcManager = require('react-native-nfc-manager').default;
        await NfcManager.cancelTechnologyRequest();
        console.log('NFC技術リクエストをキャンセルしました');
      } catch (error) {
        console.error('NFC技術リクエストのキャンセルでエラー:', error);
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
  const [nfcState, setNfcState] = useState<NFCState>({
    isScanning: false,
    isSupported: true, // モックでは常にサポート
    lastResult: null,
    error: null,
    isAutoScanning: false,
  });

  // モック用の自動スキャン機能
  const startAutoScan = useCallback(async () => {
    if (nfcState.isAutoScanning) {
      console.log('既にモック自動スキャンが開始されています');
      return;
    }

    console.log('モック自動NFCスキャンを開始します');
    setNfcState(prev => ({ ...prev, isAutoScanning: true, error: null }));
    
    // モック：5秒後に自動的にタグを検出
    setTimeout(() => {
      const mockResult: NFCReadResult = {
        id: 'MOCK_AUTO_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        data: JSON.stringify({
          id: 'MOCK_AUTO_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
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

      console.log('モック自動スキャンでタグを検出:', mockResult);
    }, 5000);
  }, [nfcState.isAutoScanning]);

  // モック用の自動スキャン停止
  const stopAutoScan = useCallback(async () => {
    if (!nfcState.isAutoScanning) {
      console.log('モック自動スキャンは開始されていません');
      return;
    }

    console.log('モック自動NFCスキャンを停止します');
    setNfcState(prev => ({ ...prev, isAutoScanning: false }));
  }, [nfcState.isAutoScanning]);

  const readNfcTag = async (): Promise<NFCReadResult | null> => {
    setNfcState(prev => ({ ...prev, isScanning: true, error: null }));

    // モック読み取り処理（1-2秒の遅延を再現）
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    try {
      // モックデータを生成
      const mockResult: NFCReadResult = {
        id: 'MOCK_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        data: JSON.stringify({
          id: 'MOCK_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
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

      console.log('モックNFC読み取り成功:', mockResult);
      return mockResult;
    } catch (error) {
      const errorMessage = 'モックNFC読み取りでエラーが発生しました';
      
      setNfcState(prev => ({ 
        ...prev, 
        isScanning: false, 
        error: errorMessage 
      }));
      
      console.error('モックNFC読み取りエラー:', error);
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