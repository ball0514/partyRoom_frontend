import { Socket } from "socket.io-client";

import type { SubmitEvent } from "react";
import type { PlaylistItem, YouTubeSearchItem } from "@/types";

// import { db } from "@/firebase";
// import { doc, setDoc, arrayUnion } from "firebase/firestore";
// import type { User } from "firebase/auth";

import { ListMusic, MicVocal, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  socket?: Socket;
  onOpenDialog?: (item: PlaylistItem) => void;
}

// 隨機產生一個 6 碼的房間 ID (例如: x7k9p2)
const generateRoomId = () => Math.random().toString(36).substring(2, 8);

export default function SearchResults({ socket, onOpenDialog }: Props) {
  const location = useLocation();
  const navigate = useNavigate();

  const { roomId } = useParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PlaylistItem[]>([]);

  // --- 🌟 YouTube API 搜尋邏輯 ---
  const executeSearch = useCallback(async (queryToSearch: string) => {
    if (!queryToSearch.trim()) return;

    setIsSearching(true);
    const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=50&q=${encodeURIComponent(queryToSearch)}&key=${API_KEY}`,
      );
      const data = await response.json();

      if (data.items) {
        const results: PlaylistItem[] = data.items
          .filter((item: YouTubeSearchItem) => item.id.videoId)
          .map((item: YouTubeSearchItem) => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium.url,
          }));
        setSearchResults(results);
      }
    } catch (error) {
      console.error("搜尋失敗:", error);
      alert("搜尋失敗，請檢查 API 金鑰或網路連線");
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearch = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleCreateRoomWithSong = (item: PlaylistItem) => {
    if (searchQuery.trim()) {
      const newRoomId = generateRoomId();
      navigate(
        `/room/${newRoomId}?song=${encodeURIComponent(JSON.stringify(item))}`,
      );
    }
  };

  // const handleSaveToPersonalList = async (item: PlaylistItem) => {
  //   if (!user || user.isAnonymous) {
  //     toast.warning("請先使用 Google 帳號登入，才能儲存歌單喔！");
  //     return;
  //   }

  //   try {
  //     const docRef = doc(db, "users", user.uid, "playlists", "my-favorites");
  //     // 🌟 使用 setDoc + { merge: true }
  //     // 這樣就算文件不存在，Firebase 也會自動幫你建立它
  //     await setDoc(
  //       docRef,
  //       {
  //         name: "我的最愛", // 初始名稱
  //         songs: arrayUnion(item), // 將歌曲加入陣列
  //       },
  //       { merge: true },
  //     );

  //     toast.success("已成功收藏到我的最愛！");
  //   } catch (error) {
  //     console.error("儲存失敗:", error);
  //     alert("儲存失敗，請確認網路連線");
  //   }
  // };

  const handleAddToQueue = (item: PlaylistItem) => {
    socket?.emit("addToQueue", { roomId, item });
    // setSearchResults([]); // 點歌後清空搜尋結果
    setSearchQuery("");

    toast.success("已加入播放清單");
  };

  return (
    <>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜尋 YouTube 影片..."
          className="h-12"
        />
        <Button
          type="submit"
          size="lg"
          className="shrink-0"
          disabled={isSearching}
        >
          {isSearching ? "搜尋中..." : "搜尋"}
        </Button>
      </form>

      {/* 搜尋結果列表 */}
      {searchResults.length > 0 && (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ListMusic className="size-5 text-cyan-200" />
              <h2 className="text-lg font-bold text-white">搜尋結果</h2>
            </div>
            <Badge variant="neon">{searchResults.length || 0} 首</Badge>
          </div>
          <ScrollArea className="h-[360px] pr-3">
            <div className="space-y-3">
              {searchResults.map((item, index) => (
                <div
                  key={`${item.videoId}-${index}`}
                  className="flex items-center gap-3 p-3 rounded-md border border-white/5 bg-white/[0.03]"
                >
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-24 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm line-clamp-2 text-slate-300">
                      <span
                        dangerouslySetInnerHTML={{
                          __html: item.title,
                        }}
                      />
                    </p>
                  </div>

                  {location.pathname === `/dashboard` && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleCreateRoomWithSong(item)}
                      className="shrink-0"
                    >
                      <MicVocal />
                      <span className="sr-only">用此首歌開房</span>
                    </Button>
                  )}
                  {location.pathname === `/playlists` && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onOpenDialog?.(item)}
                      // onClick={() => handleSaveToPersonalList(item)}
                      className="shrink-0"
                    >
                      <Plus />
                      <span className="sr-only">加入收藏歌單</span>
                    </Button>
                  )}
                  {location.pathname === `/room/${roomId}` && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleAddToQueue(item)}
                      className="shrink-0"
                    >
                      <Plus />
                      <span className="sr-only">加入播放清單</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      )}
    </>
  );
}
