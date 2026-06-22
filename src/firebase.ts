import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

// 讀取 .env 裡面的環境變數
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 匯出 Auth (身分驗證) 與 Firestore (資料庫) 實體，供其他元件使用
export const auth = getAuth(app);
export const db = getFirestore(app);

// 設定 Google 登入的提供者
const googleProvider = new GoogleAuthProvider();

// 封裝登入與登出功能
export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const loginAsGuest = () => signInAnonymously(auth);
export const logout = () => signOut(auth);

// 獲取google使用者儲存的歌單列表
export const getUserPlaylists = async (userId: string) => {
  try {
    // 把歌單存在 users/{userId}/playlists 底下
    const playlistsCol = collection(db, "users", userId, "playlists");
    const playlistSnapshot = await getDocs(playlistsCol);
    const playlistList = playlistSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return playlistList;
  } catch (error) {
    console.error("讀取歌單失敗:", error);
    return [];
  }
};

// 根據 playlistId 獲取該歌單詳細的歌曲陣列
export const getPlaylistById = async (userId: string, playlistId: string) => {
  try {
    const docRef = doc(db, "users", userId, "playlists", playlistId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // 資料庫裡該文件有一個欄位叫做 songs，存放陣列
      return docSnap.data().songs || [];
    }
    return [];
  } catch (error) {
    console.error("讀取歌單詳細資料失敗:", error);
    return [];
  }
};
