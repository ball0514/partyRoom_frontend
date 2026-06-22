import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "@/context/AuthProvider";

import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";

import Login from "@/views/Login";
import Dashboard from "@/views/Dashboard";
import Room from "@/views/Room";
import Playlists from "@/views/Playlists";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />

        {/* <div
        className="min-h-screen w-full relative flex flex-col items-center justify-center p-4
          bg-slate-950 
          bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] 
          from-indigo-950/40 via-slate-950 to-slate-950"
      > */}
        {/* 🎵 背景裝飾光暈 */}
        <div className="party-bg"></div>

        {/* 🎵 背景裝飾光暈 1：左上角淡淡的藍光
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

        🎵 背景裝飾光暈 2：右下角淡淡的紫紅光
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" /> */}

        <main className="min-h-[calc(100vh-60px)]">
          <Routes>
            {/* 當使用者進入根目錄時，自動導向登入頁 */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 登入頁面 */}
            <Route path="/login" element={<Login />} />

            {/* 大廳頁面 */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* 房間頁面 */}
            <Route path="/room/:roomId" element={<Room />} />

            {/* 歌單頁面 */}
            <Route path="/playlists" element={<Playlists />} />
          </Routes>
        </main>
        {/* </div> */}
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </AuthProvider>
  );
}
