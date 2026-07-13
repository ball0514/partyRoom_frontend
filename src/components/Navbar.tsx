import { useAuth } from "@/context/AuthContext";
import { logout } from "@/firebase";

import { Music } from "lucide-react";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const { user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // 🌟 關鍵邏輯：如果現在在登入頁，就回傳 null (不渲染任何東西)
  if (location.pathname === "/login") {
    return null;
  }

  // 只有在非登入頁 (例如 /room 或未來的其他頁面) 才會顯示以下畫面
  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md border border-violet-300/20 bg-violet-400/10 text-violet-200 shadow-[0_0_24px_rgba(139,92,246,0.25)]">
              <Music className="size-5" />
            </span>
            <span className="text-xl font-black tracking-normal text-white sm:text-2xl">
              Party Room
            </span>
          </Link>

          {/* 使用者狀態與登出按鈕 */}
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img
                  src={
                    user.photoURL ||
                    "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
                      user.uid
                  }
                  alt="avatar"
                  className="w-8 h-8 rounded-full border border-slate-700"
                />
                <span className="text-sm font-semibold text-slate-300">
                  {user.isAnonymous ? "訪客" : user.displayName}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="text-sm text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer hover:border-red-900/50 hover:bg-red-950/30 transition-colors"
              >
                登出
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
