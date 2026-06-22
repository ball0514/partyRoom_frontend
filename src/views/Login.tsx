import { onAuthStateChanged } from "firebase/auth";
import { auth, loginWithGoogle, loginAsGuest } from "@/firebase";

import { Music, Sparkles, Headphones } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Login() {
  const navigate = useNavigate();

  // 監聽登入狀態：如果發現已經登入，就自動跳轉到房間頁面
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/dashboard"); // 登入成功，跳轉到 /room
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  return (
    <section className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:px-8">
      <div className="relative flex flex-col items-center md:items-start">
        <h1 className="mb-4 lg:mb-0 flex items-center max-w-3xl text-4xl font-black leading-tight lg:text-7xl">
          <span className="me-3 grid size-15 place-items-center rounded-md border border-violet-300/20 bg-violet-400/10 text-violet-200 shadow-[0_0_24px_rgba(139,92,246,0.25)]">
            <Music className="size-10" />
          </span>
          Party Room
        </h1>
        <h2 className="text-3xl text-violet-400">讓每個人都在同一拍</h2>
        <div className="equalizer my-5" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, index) => (
            <span key={index} style={{ animationDelay: `${index * 70}ms` }} />
          ))}
        </div>
      </div>

      <Card className="overflow-hidden border-cyan-300/20 bg-slate-900/70 shadow-[0_0_48px_rgba(59,130,246,0.22)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="size-5" />
            開始派對
          </CardTitle>
          <CardDescription>選擇登入模式即可進入大廳空間。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-4 flex flex-col gap-3">
            <button
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-slate-900 font-semibold rounded-lg transition-all duration-300 shadow-white/5 hover:shadow-[0_0_15px_3px_rgba(255,255,255,0.15)] hover:shadow-white/20"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-5 h-5"
              />
              使用 Google 帳號登入
            </button>
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">
                或
              </span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>
            <Button size="lg" variant="violet" onClick={loginAsGuest}>
              <Headphones />
              以訪客身分快速進入
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
