<!-- # React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
``` -->

# 🎵 PartyRoom - 實時共聽系統

PartyRoom 是一個讓使用者能與朋友同步觀看 YouTube 影片、即時聊天並管理個人歌單的 Web 應用程式。透過 Socket.io 實現低延遲的播放狀態同步，讓你即使身在各地，也能享受共聽音樂的樂趣。

## 🚀 核心功能

- **實時同步播放**：房間內的所有人觀看進度完全同步，支援跳轉、切換歌曲。
- **即時聊天室**：基於 Socket.io 的即時訊息系統，與房間內好友互動。
- **個人化歌單管理**：整合 Firebase 實現歌單的 CRUD 管理，隨時收藏你喜歡的影片。
- **深色模式介面**：現代化的深色主題 UI，提供最佳的影音觀影體驗。

## 🛠️ 技術棧 (Tech Stack)

### 前端 (Frontend)

- **React + TypeScript**: 提供強型別的開發體驗。
- **Tailwind CSS**: 高效能的 UI 設計與響應式佈局。
- **React Player / YouTube Iframe API**: 嵌入式影片播放核心。

### 後端 (Backend)

- **Node.js + Express**: 高效能伺服器處理。
- **Socket.io**: 實現低延遲的雙向即時通訊。

### 資料庫 (Database & Auth)

- **Firebase Firestore**: 歌單與使用者資料的持久化儲存。
- **Firebase Auth**: Google 一鍵快速登入。

## 📂 專案架構

```text
party-room/
├── frontend/             # React 前端專案
│   ├── src/
│   │   ├── components/   # 全域 UI 元件 (Modal, Navbar)
│   │   ├── services/     # API 服務層 (PlaylistService)
│   │   ├── contexts/     # AuthContext 等全域狀態
│   │   └── views/        # Dashboard, Room 頁面
├── backend/              # Node.js 伺服器
│   ├── server.js         # Socket 事件處理核心
└── README.md
```

## ⚙️ 安裝與執行

### 前置準備

1. 確保已安裝 Node.js (建議 v18 以上)。
2. 在 Firebase Console 建立專案，取得 Firebase Config。

### 步驟

1. 建立 party-room 資料夾
2. 進入 party-room 資料夾，分別建立 frontend、backend 資料夾

3. Clone 專案 & 安裝套件

```bash
# 安裝後端
cd backend
git clone [https://github.com/ball0514/partyRoom_backend](https://github.com/ball0514/partyRoom_backend)
npm install

# 安裝前端
cd frontend
git clone [https://github.com/ball0514/partyRoom_frontend](https://github.com/ball0514/partyRoom_frontend)
npm install
```

4. 設定環境變數
   在 frontend 與 backend 資料夾中分別建立 .env 檔案，填入 Firebase 設定與伺服器 Port。

5. 啟動專案

```Bash
# 啟動後端
cd backend && npm run dev

# 啟動前端
cd frontend && npm run dev
```

## 💡 開發初衷

本專案參考[PartyTu](https://partytu.app/) 的概念，練習使用前端 React + TypeScript 以及後端 socket.io 等技術。旨在解決遠端互動時「音訊同步困難」的痛點，透過指令式同步架構，將複雜的網路串流需求簡化為高效能的指令傳遞。這是一個持續演進的專案，歡迎任何建議與 Pull Request。
