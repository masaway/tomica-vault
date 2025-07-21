/**
 * おもちゃパトロール - アプリアイコンの青系テーマに統一
 * ダークモードは使用せず、常に明るいテーマで表示
 */

// アプリアイコンの背景色をベースとした色合い
const iconBackgroundColor = '#87CEEB'; // スカイブルー（アプリアイコン背景）
const secondaryColor = '#4ECDC4'; // 爽やかなターコイズ
const accentColor = '#FFE66D'; // 明るいイエロー
const playfulBlue = '#4A90FF'; // 深いブルー

export const Colors = {
  light: {
    text: '#2D3748', // 読みやすい濃いグレー
    background: '#F0F8FF', // アリスブルー（薄い青系背景）
    tint: iconBackgroundColor, // アプリアイコン背景色
    icon: '#718096',
    tabIconDefault: '#A0AEC0',
    tabIconSelected: iconBackgroundColor, // アプリアイコン背景色
    cardBackground: '#FAFCFF', // 薄い青がかった白
    gradientStart: iconBackgroundColor, // スカイブルー
    gradientEnd: secondaryColor, // ターコイズ
    // 子供向け追加色
    success: '#48BB78', // 明るいグリーン
    warning: '#ED8936', // 明るいオレンジ
    danger: '#F56565', // 優しい赤
    playful: accentColor, // 楽しい黄色
    calm: secondaryColor, // 落ち着いたブルーグリーン
  },
  // ダークモードは使用しないが、念のため同じ値を設定
  dark: {
    text: '#2D3748',
    background: '#F0F8FF',
    tint: iconBackgroundColor,
    icon: '#718096',
    tabIconDefault: '#A0AEC0',
    tabIconSelected: iconBackgroundColor,
    cardBackground: '#FAFCFF',
    gradientStart: iconBackgroundColor,
    gradientEnd: secondaryColor,
    success: '#48BB78',
    warning: '#ED8936',
    danger: '#F56565',
    playful: accentColor,
    calm: secondaryColor,
  },
};
