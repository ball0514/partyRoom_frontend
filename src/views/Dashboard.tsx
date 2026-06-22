import type { SubmitEvent } from "react";

import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

import type { Playlist } from "@/types";
import { getPlaylists } from "@/services/playlistService";

import {
  House,
  UsersRound,
  ListMusic,
  Disc3,
  Music2,
  Radio,
  ChevronRight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import SearchResults from "@/components/SearchResults";

// 隨機產生一個 6 碼的房間 ID (例如: x7k9p2)
const generateRoomId = () => Math.random().toString(36).substring(2, 8);

export default function Dashboard() {
  const navigate = useNavigate();

  // 檢查登入資訊
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // 建立專屬房間
  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    navigate(`/room/${newRoomId}`);
  };

  // 加入朋友房間
  const [roomCode, setRoomCode] = useState("");
  const handleJoinRoom = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (roomCode.trim()) {
      navigate(`/room/${roomCode.trim()}`);
    }
  };

  // 載入歌單
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const loadPlaylists = async () => {
    if (auth.currentUser) {
      const data = await getPlaylists(auth.currentUser.uid);
      setPlaylists(data);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadPlaylists();
      }
    });

    // 組件卸載時，清除監聽器避免記憶體洩漏
    return () => unsubscribe();
  }, []);

  // 用歌單建立房間
  const handleCreateRoomWithPlaylist = (playlistId: string) => {
    const newRoomId = generateRoomId();
    // 將歌單 ID 當作網址參數帶到新房間
    navigate(`/room/${newRoomId}?playlistId=${playlistId}`);
  };

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="text-center space-y-2 mb-12">
        <h1 className="text-4xl font-">歡迎來到 Party Room</h1>
        <p className="text-slate-400">
          建立專屬包廂、輸入代碼加入朋友房間，或搜尋音樂直接開播
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-slate-900/70">
          <CardContent className="flex min-h-72 flex-col items-center justify-between p-6 text-center sm:p-8">
            <div className="mb-6">
              <div className="mx-auto mb-5 grid size-20 place-items-center rounded-full bg-blue-500/20 text-blue-100">
                <House className="size-9" />
              </div>
              <h2 className="text-2xl">建立專屬房間</h2>
              <p className="mt-4 text-slate-400">
                當個房主，建立一個全新派對，並邀請朋友加入。
              </p>
            </div>

            <Button
              variant="destructive"
              className="w-full h-12 bg-cyan-500 shadow-[0_0_24px_rgba(34,211,238,0.22)] hover:bg-cyan-400/20"
              onClick={handleCreateRoom}
            >
              立即建立房間
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70">
          <CardContent className="flex min-h-72 flex-col items-center justify-between p-6 text-center sm:p-8">
            <div className="mb-6">
              <div className="mx-auto mb-5 grid size-20 place-items-center rounded-full bg-pink-500/20 text-pink-100">
                <UsersRound className="size-9" />
              </div>
              <h2 className="text-2xl">加入朋友房間</h2>
              <p className="mt-4 text-slate-400">
                輸入朋友給你的房間代碼，立刻加入派對。
              </p>
            </div>

            <form onSubmit={handleJoinRoom} className="w-full flex gap-3">
              <Input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="輸入房間代碼..."
                className="h-12"
              />
              <Button
                variant="pink"
                type="submit"
                size="lg"
                className="shrink-0"
                disabled={!roomCode.trim()}
              >
                加入
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 border-blue-400/20 bg-gradient-to-br from-blue-950/70 to-violet-950/55">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-white">
              不想等？直接點歌開房！
            </h2>
            <p className="mt-2 text-slate-300">
              搜尋想聽的 YouTube 音樂，系統會自動建立新房間並準備播放。
            </p>
          </div>
          <SearchResults />
        </CardContent>
      </Card>

      {!auth.currentUser?.isAnonymous && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <section>
            <div
              className={`mb-4 flex items-center gap-2 ${playlists.length > 0 && "justify-between"}`}
            >
              <div className="flex items-center gap-2">
                <ListMusic className="size-6 text-violet-200" />
                <h2 className="text-2xl font-black text-white">我的收藏歌單</h2>
              </div>
              <Button variant="outline" onClick={() => navigate("/playlists")}>
                前往管理
                <ChevronRight />
              </Button>
            </div>
            {playlists.length > 0 && (
              <div className="space-y-3">
                {playlists.map((playlist) => (
                  <Card key={playlist.id} className="bg-slate-900/60">
                    <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid size-12 shrink-0 place-items-center rounded-md bg-violet-400/10 text-violet-200">
                          <Disc3 className="size-6" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-bold text-white">
                            {playlist.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <Music2 className="size-3.5" />
                              {playlist?.songs?.length || 0} 首
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() =>
                          handleCreateRoomWithPlaylist(playlist.id)
                        }
                        className="w-full sm:w-auto"
                      >
                        <Radio />
                        用此歌單開派對
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {playlists.length > 0 && (
            <section className="rounded-lg border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl min-w-0">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black text-white">
                  {playlists[0].name}
                </h2>
                <Badge variant="violet">
                  {playlists[0].songs?.length || 0}
                </Badge>
              </div>
              <div className="space-y-3">
                {playlists[0].songs?.slice(0, 3).map((song) => (
                  <div
                    key={song.videoId}
                    className="rounded-md border border-white/5 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={song.thumbnail}
                          alt={song.title}
                          className="w-20 h-14 object-cover rounded"
                        />
                        <p className="truncate font-bold text-white">
                          {song.title}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </section>
  );
}
