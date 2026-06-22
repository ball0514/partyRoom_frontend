import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import AutoImport from "unplugin-auto-import/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    AutoImport({
      // 宣告你想要自動引入的函式庫
      imports: [
        "react", // 自動引入 useState, useEffect, useRef 等
        "react-router-dom", // 自動引入 useNavigate, useLocation, useParams 等
      ],
      // 產生一個 TypeScript 宣告檔，讓編輯器不會報錯
      dts: "src/auto-imports.d.ts",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups", // 允許彈出視窗通訊
    },
  },
});
