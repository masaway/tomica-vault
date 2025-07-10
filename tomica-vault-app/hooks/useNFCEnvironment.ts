import { useMemo } from 'react';
import { getEnvironmentInfo } from '@/constants/Environment';

export const useNFCEnvironment = () => {
  const envInfo = getEnvironmentInfo();
  
  return useMemo(() => {
    // Expo Go環境では実際のNFC機能は使用できないため、モック実装を使用
    const shouldUseMockNFC = envInfo.isExpoGo;
    
    // Development BuildやStandaloneビルドでは実際のNFC機能を使用
    const isNFCAvailable = envInfo.isDevelopmentBuild || envInfo.appOwnership === 'standalone';
    
    return {
      // NFC機能の利用可否
      isNFCAvailable,
      
      // モック実装の使用判定
      shouldUseMockNFC,
      
      // 環境名
      environmentName: envInfo.buildType + (shouldUseMockNFC ? ' (モック)' : ' (実機)'),
      
      // プラットフォーム
      platform: envInfo.platform,
      
      // 開発環境かどうか
      isDev: envInfo.isDev,
    };
  }, [envInfo]);
};