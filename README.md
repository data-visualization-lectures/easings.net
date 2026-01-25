# easings.net

## 前提
- Node.js 20 を使用（`.nvmrc` で 20 を指定済み）
- Yarn 1.x

## セットアップ
```sh
nvm use 20
yarn install
```

## ビルド
```sh
yarn run build
```
成果物は `dist/` に出力されます。

## ローカル確認
```sh
yarn run start
```
ブラウザで `http://localhost:1234` を開きます。  
認証デバッグは `http://localhost:1234/?auth_debug` です。  
停止は `Ctrl+C` です。

## トラブルシュート
### deasync のバイナリが見つからない
```sh
xcode-select --install
npm rebuild deasync --build-from-source
```
