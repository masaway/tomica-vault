# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ルール
- 常に日本語で返答
- ドキュメントは日本語で作成すること

## カスタムスラッシュコマンド

### `/install-latest-build`
最新のビルドを確認し、既存のアプリをアンインストールして、最新ビルドをインストールします。

**使用方法:**
```bash
/install-latest-build
```

**機能:**
- 最新のAPKファイルを自動検出
- ファイル情報（作成日時、サイズ）を表示
- Androidデバイスの接続確認
- 既存アプリの自動アンインストール
- 最新ビルドのインストール
- オプションでアプリの自動起動

**実行されるスクリプト:**
- `/home/yoshiaki/work/tomica-vault/install-latest-build`


## 🚗 Project Overview
Tomica Vault is a React Native mobile application for managing Tomica toy car collections using NFC tags. The app allows users to track their toy cars, check them in/out, and manage their collection status. It's designed to be child-friendly with audio feedback and intuitive UI.

## 📱 Tech Stack
- **Frontend**: React Native with Expo (v53.0.9)
- **Navigation**: Expo Router with typed routes
- **Database**: Supabase (PostgreSQL)
- **UI Components**: Custom components with Linear Gradients
- **State Management**: React hooks (useState, useCallback)
- **Styling**: StyleSheet with theme support
- **Icons**: Expo Vector Icons (FontAwesome, Ionicons)
- **NFC**: NFCタグ reading/writing (enabled)
- **Platform**: iOS, Android, Web support
- **Node.js**: v22.15.1 (managed with Volta)

## 🏗️ Project Structure
```
tomica-vault/
├── package.json                    # Root package.json (minimal)
├── install-latest-build            # Custom script for installing latest build
├── docs/                          # Japanese documentation
│   ├── 企画書.md                  # Project proposal
│   ├── 設計書.md                  # Design specifications
│   └── ...
└── tomica-vault-app/              # Main application
    ├── app/                       # Expo Router pages
    │   ├── (tabs)/               # Tab navigation
    │   │   ├── _layout.tsx       # Tab layout configuration
    │   │   ├── index.tsx         # Home/Dashboard screen
    │   │   ├── add.tsx           # Add new Tomica
    │   │   ├── list.tsx          # Tomica list
    │   │   ├── search.tsx        # Search functionality
    │   │   └── settings.tsx      # Settings screen
    │   ├── _layout.tsx           # Root layout
    │   ├── details.tsx           # Tomica details screen
    │   ├── edit.tsx              # Edit Tomica screen
    │   └── nfc-reader.tsx        # NFC reading functionality
    ├── components/               # Reusable components
    │   ├── DashboardCard.tsx     # Statistics cards
    │   ├── TomicaItem.tsx        # List item component
    │   ├── NFCShortcut.tsx       # NFC quick access
    │   ├── RecentActivity.tsx    # Activity display
    │   └── ui/                   # UI components
    ├── hooks/                    # Custom React hooks
    │   ├── useTomica.ts          # Main data management hook
    │   ├── useNFC.ts             # NFC functionality hook
    │   ├── useNFCEnvironment.ts  # NFC environment detection
    │   ├── useColorScheme.ts     # Theme management
    │   └── useThemeColor.ts      # Color utilities
    ├── lib/                      # External services
    │   └── supabase.ts           # Supabase client setup
    ├── types/                    # TypeScript definitions
    │   └── supabase.ts           # Auto-generated DB types
    ├── mocks/                    # Mock data for development
    ├── constants/                # App constants
    └── assets/                   # Images and fonts
```

## 🎯 Key Features
1. **Dashboard**: Overview of collection statistics with gradient cards
2. **Tomica Management**: Add, edit, delete, and search Tomica cars
3. **Check-in/Check-out System**: Track when toys are taken out/returned
4. **"Missing" Detection**: Automatically detect toys that haven't been returned (48h+ rule)
5. **NFC Integration**: Read NFC tags attached to toys (enabled)
6. **Notifications**: Alert system for missing toys
7. **Theme Support**: Light/dark mode with custom colors

## 🗄️ Database Schema (Supabase)
Table: `owned_tomica`
- `id`: Primary key (number)
- `name`: Tomica name (string)
- `nfc_tag_uid`: NFC tag ID (number)
- `check_in_at`: Last check-in timestamp (ISO string)
- `checked_out_at`: Last check-out timestamp (ISO string)
- `purchase_date`: Purchase date (ISO string)
- `memo`: Notes (string)
- `scanned_at`: Last NFC scan (ISO string)
- `created_at`: Creation timestamp (ISO string)
- `updated_at`: Update timestamp (ISO string)
- `deleted_at`: Soft delete timestamp (ISO string)

## 🔧 Available Scripts
**重要**: 以下のコマンドは全て `tomica-vault-app/` ディレクトリで実行してください。

```bash
# Development
npm start                 # Start Expo development server
npm run android          # Run on Android emulator
npm run ios             # Run on iOS simulator  
npm run web             # Run on web browser

# Code Quality
npm run lint            # Run ESLint

# Database
npm run generate-types  # Generate TypeScript types from Supabase

# Build
eas build --platform android --profile preview --local  # Local Android build

# Project Management
npm run reset-project   # Reset project (custom script)
```

## 🎨 UI/UX Patterns
- **Gradient Cards**: Used for statistics and dashboard elements
- **Tab Navigation**: Bottom tabs with FontAwesome icons
- **Japanese UI**: Interface primarily in Japanese
- **Modal Dialogs**: For notifications and confirmations
- **Pull-to-refresh**: Available on list screens
- **Loading States**: Comprehensive loading/error handling
- **Theme Colors**: Custom color system with light/dark support

## 📊 Core Architecture

### Data Management (`hooks/useTomica.ts`)
中心的なデータ管理フック。全てのデータ操作はこのフックを通して実行する：
- `fetchTomicaList()`: 全トミカ取得
- `searchTomica(query)`: 名前検索
- `getTomicaById(id)`: 特定トミカ取得
- `updateTomica(id, updates)`: トミカ状態更新
- `fetchStats()`: ダッシュボード統計取得
- `calculateStats()`: 統計計算

### NFC Integration (`hooks/useNFC.ts`)
NFC機能の管理フック：
- `readNfcTag()`: NFCタグ読み取り
- `nfcState`: NFC状態の管理
- 環境に応じたモック/実機切り替え

### Status Logic
トミカの状態は以下のルールで判定：
- **外出中**: `checked_out_at` が `check_in_at` より新しい
- **帰宅中**: `check_in_at` が `checked_out_at` より新しい
- **家出中**: 外出中かつ48時間経過（JST基準）

### Database Operations
- Supabaseクライアント: `lib/supabase.ts`
- 論理削除: `deleted_at` フィールドを使用
- タイムスタンプ: JST（+09:00）で保存

## 🔒 Environment Variables
Required environment variables:
- `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

## 🚀 Development Workflow
1. **Start Development**: `cd tomica-vault-app && npm start`
2. **Database Changes**: Run `npm run generate-types` after schema updates
3. **Testing**: Use Expo Go app for quick testing
4. **Platform Testing**: Use `npm run android/ios` for platform-specific testing
5. **Code Quality**: Run `npm run lint` before committing changes
6. **Build and Install**: Use `/install-latest-build` command after building

## 📝 Code Style Guidelines
- TypeScript strict mode enabled
- Expo ESLint configuration
- Functional components with hooks
- Custom hook pattern for data management
- StyleSheet for component styling
- Absolute imports with `@/` prefix

## 🎭 Mock Data
Mock data available in `mocks/` directory for development:
- `data.ts`: Sample Tomica data
- `types.ts`: Mock type definitions
- `api.ts`: Mock API responses

## 🔄 Future Enhancements
1. **NFC Integration**: Full NFC tag writing capability
2. **User Authentication**: Google Auth integration
3. **Family Sharing**: Multiple users per collection
4. **Barcode Scanning**: Alternative to NFC
5. **Audio Feedback**: Sound effects for interactions
6. **AR Markers**: Alternative to NFC tags

## 🐛 Known Issues & Considerations
- NFC functionality depends on device support
- Metal toys may interfere with NFC reading
- Child-friendly design considerations needed
- 48-hour "missing" rule may need adjustment
- Timezone handling for JST

## 📚 Japanese Documentation
Key Japanese terms used in the app:
- トミカ (Tomica): Brand name for toy cars
- 外出中 (Gaishutsu-chū): Currently out/checked out
- 帰宅中 (Kitaku-chū): At home/checked in
- 家出中 (Iade-chū): Missing/runaway (48+ hours out)
- 新規登録 (Shinki-tōroku): New registration
- 一覧 (Ichiran): List view
- 検索 (Kensaku): Search

## 🎯 Development Tips
1. Use `useTomica` hook for all data operations
2. Follow the existing gradient card pattern for UI consistency
3. Implement proper loading states for all async operations
4. Use the theme system for consistent colors
5. Test on both iOS and Android platforms
6. Consider child-friendly UI patterns
7. Handle JST timezone properly for timestamps
8. Use soft deletes (deleted_at) instead of hard deletes
9. Use `/install-latest-build` command for quick deployment testing

This application is designed to be a fun, child-friendly tool for managing toy car collections with modern React Native practices and a clean, intuitive interface.