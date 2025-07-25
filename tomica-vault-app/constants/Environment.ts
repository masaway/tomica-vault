import Constants from 'expo-constants';
import { Platform } from 'react-native';

// 環境判定
export const IS_EXPO_GO = Constants.appOwnership === 'expo';
export const IS_DEVELOPMENT_BUILD = Constants.executionEnvironment === 'standalone' || (Constants.appOwnership as string) === 'standalone';
export const IS_DEV = __DEV__;

// 環境情報の取得
export const getEnvironmentInfo = () => {
  return {
    isExpoGo: IS_EXPO_GO,
    isDevelopmentBuild: IS_DEVELOPMENT_BUILD,
    isDev: IS_DEV,
    platform: Platform.OS,
    buildType: IS_EXPO_GO ? 'Expo Go' : IS_DEVELOPMENT_BUILD ? 'Development Build' : 'Preview Build',
    appOwnership: Constants.appOwnership,
  };
};

// デバッグ用の環境情報表示
export const logEnvironmentInfo = () => {
  const info = getEnvironmentInfo();
  console.log('=== Environment Info ===');
  console.log('Build Type:', info.buildType);
  console.log('Platform:', info.platform);
  console.log('App Ownership:', info.appOwnership);
  console.log('Is Dev:', info.isDev);
  console.log('=======================');
};