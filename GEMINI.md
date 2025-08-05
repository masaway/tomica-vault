
## Project Overview

This is a React Native mobile application called "おもちゃパトロール" (Toy Patrol) built with Expo. It's designed to help users manage their Tomica toy collection. The app uses Supabase for its backend, handling data storage and authentication.

The core functionality revolves around tracking the status of each Tomica toy. Users can see if a toy is "at home" (おうち), "out" (おでかけ), "missing" (まいご), or "sleeping" (おやすみ). A key feature is the use of NFC tags to quickly update a toy's status.

**Key Technologies:**

*   **Frontend:** React Native with Expo
*   **Routing:** Expo Router (file-based)
*   **Backend:** Supabase (Database, Auth)
*   **UI Components:** Custom React Native components, Expo Vector Icons
*   **State Management:** React Hooks and Context API (`useTomica`, `useAuth`)
*   **NFC:** `react-native-nfc-manager`

## Building and Running

### Prerequisites

*   Node.js (using Volta is recommended)
*   npm
*   Expo CLI
*   Android Studio or Xcode for emulators/simulators

### Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Generate Supabase types:**
    This step is crucial after any database schema changes.
    ```bash
    npm run generate-types
    ```

### Running the App

*   **Start the development server:**
    ```bash
    npx expo start
    ```
    This will provide options to run the app on an emulator, simulator, or a physical device using the Expo Go app.

*   **Run on Android:**
    ```bash
    npm run android
    ```

*   **Run on iOS:**
    ```bash
    npm run ios
    ```

## Development Conventions

*   **File-based Routing:** The app uses Expo Router, so the file structure in the `app` directory defines the navigation.
*   **Custom Hooks:** Logic for features like authentication (`useAuth`) and Tomica data management (`useTomica`) is encapsulated in custom hooks.
*   **Supabase Integration:** The Supabase client is initialized in `lib/supabase.ts`. All interactions with the Supabase backend should go through this client.
*   **Type Safety:** The project uses TypeScript and generates types from the Supabase schema. It's important to keep these types updated.
*   **UI Components:** Reusable UI components are located in the `components` directory.
*   **Styling:** Styles are defined using `StyleSheet.create`. The app also uses a theme-based color system (`useThemeColor`).
*   **Localization:** The UI text is in Japanese. Any new UI text should also be in Japanese.
