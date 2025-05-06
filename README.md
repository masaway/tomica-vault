# tomica-vault
所有トミカの管理を行うためのアプリケーション。 NFCタグを使用して、現在の所有状況を管理する。

## 環境構築手順

### 必要なツール
- Visual Studio Code
- Docker
- Remote - Containers 拡張機能（VS Code Marketplace からインストール可能）
- Git

### 手順
1. **リポジトリのクローン**
   ```bash
   git clone <リポジトリのURL>
   cd tomica-vault
   ```

2. **VS Code でプロジェクトを開く**
   - VS Code を起動し、`tomica-vault` ディレクトリを開きます。

3. **`.env` ファイルの設定**
   - プロジェクトのルートディレクトリにある `.env` ファイルを編集する必要があります。

   #### 手順
   1. **ローカル IP アドレスを調べる**
      - Windows の場合:
        1. コマンドプロンプトを開きます。
        2. 以下のコマンドを実行します。
           ```bash
           ipconfig
           ```
        3. 表示された情報の中から「IPv4 アドレス」を探します。
      - macOS/Linux の場合:
        1. ターミナルを開きます。
        2. 以下のコマンドを実行します：
           ```bash
           ifconfig
           ```
        3. `inet` の後に続くアドレスがローカル IP アドレスです。

   2. **`.env` ファイルを編集する**
      - プロジェクトのルートディレクトリにある `.env` ファイルをテキストエディタで開きます。
      - 以下のように、取得したローカル IP アドレスを記載します。
        ```env
        REACT_NATIVE_PACKAGER_HOSTNAME=あなたのローカルIPアドレス
        ```

   3. **保存する**
      - 編集が完了したら、ファイルを保存します。

   #### 注意事項
   - `.env` ファイルは機密情報を含む可能性があるため、他人と共有しないでください。
   - `.env` ファイルが存在しない場合は、新規作成してください。

4. **Remote - Containers を使用して dev container を起動**
   - VS Code のコマンドパレット（`Ctrl+Shift+P`）を開き、`Remote-Containers: Reopen in Container` を選択します。

5. **開発サーバーの起動**
   - dev container 内で以下のコマンドを実行します。
     ```bash
     npm start
     ```

### 注意事項
- Docker が正しくインストールされ、起動していることを確認してください。
- Remote - Containers 拡張機能がインストールされていない場合、VS Code Marketplace からインストールしてください。
