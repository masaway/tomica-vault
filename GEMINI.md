# GEMINI.md

## Project Overview

This is a mobile application called "Tomica Vault" built with React Native and Expo. It uses Supabase for its backend, including database, authentication, and storage. The application is designed to manage a collection of Tomica toy cars, and includes features like NFC tag reading.

The project is structured as a monorepo, with the main application code located in the `tomica-vault-app` directory and the Supabase backend configuration in the `supabase` directory.

**Key Technologies:**

*   **Frontend:** React Native, Expo, TypeScript
*   **Backend:** Supabase (PostgreSQL, Auth, Storage)
*   **Package Manager:** npm
*   **Node.js Version Manager:** volta

## Building and Running

### Prerequisites

*   Node.js (managed with [Volta](https://volta.sh/))
*   npm
*   Expo CLI
*   Android Studio or Xcode for emulators/simulators

### Setup

1.  **Install Dependencies:**
    ```bash
    cd tomica-vault-app
    npm install
    ```

2.  **Run the Application:**
    *   **Start the development server:**
        ```bash
        npx expo start
        ```
    *   **Run on Android:**
        ```bash
        npm run android
        ```
    *   **Run on iOS:**
        ```bash
        npm run ios
        ```

### Other Commands

*   **Lint the code:**
    ```bash
    npm run lint
    ```
*   **Generate Supabase type definitions:**
    ```bash
    npm run generate-types
    ```
    This command generates TypeScript definitions from your Supabase database schema and saves them to `types/supabase.ts`.

## Development Conventions

*   **File-based Routing:** The project uses Expo Router for navigation. All screens are located in the `tomica-vault-app/app` directory.
*   **Supabase Integration:** The application is tightly integrated with Supabase. The Supabase configuration is located in the `supabase` directory.
*   **Type Safety:** The project uses TypeScript. Remember to regenerate Supabase types (`npm run generate-types`) after any database schema changes.
*   **NFC Functionality:** The application includes features for reading NFC tags.
*   **Project Reset:** A script is available to reset the project to a clean state:
    ```bash
    npm run reset-project
    ```
