import type { SubmitEvent } from "react";

import YouTube from "react-youtube";
import type { YouTubeProps, YouTubePlayer } from "react-youtube";

import { auth, getPlaylistById } from "@/firebase";
// 🌟 引入 Firebase Auth 相關功能
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";

import type { RoomMessage, RoomData, Playlist, PlaylistItem } from "@/types";
import {
  getPlaylists,
  createPlaylist,
  addSongToPlaylist,
} from "@/services/playlistService";

import {
  Undo2,
  Copy,
  List,
  ListMusic,
  Plus,
  UsersRound,
  Crown,
  MessageCircle,
  SendHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import SearchResults from "@/components/SearchResults";

import { io, Socket } from "socket.io-client";

// 建立連線
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
const socket: Socket = io(SOCKET_URL);

export default function Room() {
  const navigate = useNavigate();

  // 檢查登入資訊
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // 抓取網址參數
  const { roomId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSong = decodeURIComponent(searchParams.get("song") ?? "");
  const initialPlaylistId = searchParams.get("playlistId");

  // 初始化 Ref (狀態標記)
  const hasInitialized = useRef(false);
  const playerRef = useRef<YouTubePlayer | null>(null);

  // 房間相關狀態
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);

  // 初始化開房邏輯：選擇進入方式
  useEffect(() => {
    if (hasInitialized.current) return;

    // 【情境 A：從搜尋框開房】
    if (initialSong) {
      hasInitialized.current = true;

      const song = JSON.parse(initialSong);
      Promise.resolve().then(() => {
        socket.emit("enterPartyWithSong", { roomId, song });
        setSearchParams({});
      });
    }

    // 【情境 B：從收藏歌單開房】
    // 必須確保：有歌單 ID、使用者已登入、而且 Socket 已經連線成功了才發送
    if (initialPlaylistId && currentUser && isConnected) {
      hasInitialized.current = true;

      const loadPlaylistIntoRoom = async () => {
        // 去資料庫把歌單裡的歌曲陣列撈出來
        const songs = await getPlaylistById(currentUser.uid, initialPlaylistId);

        if (songs.length > 0) {
          socket.emit("enterPartyWithPlaylist", { roomId, songs });
        }
        setSearchParams({});
      };

      loadPlaylistIntoRoom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSong, initialPlaylistId, currentUser, isConnected, roomId]);

  // 集中管理的 Socket 事件監聽邏輯
  useEffect(() => {
    // 🌟 防護：如果執行時已經連線，就直接觸發加入房間
    if (socket.connected) {
      socket.emit("enterParty", { roomId, user: currentUser });
      socket.emit("getMessages", roomId);
    }

    const onConnect = () => {
      setIsConnected(true);
      socket.emit("enterParty", { roomId, user: currentUser });
    };

    const onRoomDataSync = (data: RoomData) => setRoomData(data);

    // 影片相關
    const onVideoChanged = (data: RoomData) => {
      setRoomData(data);
      playerRef.current?.playVideo();
    };
    const onVideoPlayed = (data: RoomData) => {
      setRoomData(data);
      playerRef.current?.playVideo();
    };
    const onVideoPaused = (data: RoomData) => {
      setRoomData(data);
      playerRef.current?.pauseVideo();
    };

    // 訊息相關
    const onHistoryMessages = (msgs: RoomMessage[]) => setMessages(msgs);
    const onReceiveMessage = (msg: RoomMessage) =>
      setMessages((prev) => [...prev, msg]);

    // 監聽
    // 原本的連線監聽 (處理初次載入，或是斷線重連的情況)
    socket.on("connect", onConnect);
    socket.on("roomDataSync", onRoomDataSync);

    // 監聽影片事件
    socket.on("videoChanged", onVideoChanged);
    socket.on("videoPlayed", onVideoPlayed);
    socket.on("videoPaused", onVideoPaused);

    // 監聽訊息事件
    socket.on("historyMessages", onHistoryMessages);
    socket.on("receiveMessage", onReceiveMessage);

    // 清理函式 (集中卸載)
    return () => {
      socket.emit("exitParty", { roomId });
      socket.off("connect", onConnect);
      socket.off("roomDataSync", onRoomDataSync);
      socket.off("videoChanged", onVideoChanged);
      socket.off("videoPlayed", onVideoPlayed);
      socket.off("videoPaused", onVideoPaused);
      socket.off("historyMessages", onHistoryMessages);
      socket.off("receiveMessage", onReceiveMessage);
    };
  }, [roomId, currentUser]);

  // --- 🌟 播放器控制邏輯 ---
  const onPlayerReady: YouTubeProps["onReady"] = (event) => {
    playerRef.current = event.target;
  };

  const onPlayerStateChange: YouTubeProps["onStateChange"] = (event) => {
    const currentTime = event.target.getCurrentTime();
    if (event.data === 1) {
      // 播放
      socket.emit("playVideo", { roomId, timestamp: currentTime });
    } else if (event.data === 2) {
      // 暫停
      socket.emit("pauseVideo", { roomId, timestamp: currentTime });
    } else if (event.data === 0) {
      // 🌟 影片播完 (Ended)
      // 影片播完時，請後端切換下一首歌
      socket.emit("playNext", roomId);
    }
  };

  const [chatInput, setChatInput] = useState("");
  const handleSendMessage = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault(); // 防止表單提交導致頁面重新整理

    if (!chatInput.trim()) return; // 避免傳送空訊息

    // 封裝訊息資料
    const messageData = {
      roomId,
      user: currentUser,
      text: chatInput,
    };

    // 發送給後端
    socket.emit("sendMessage", messageData);

    // 清空輸入框
    setChatInput("");
  };

  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  // 載入歌單
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

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<PlaylistItem | null>(null);

  const [newPlaylistName, setNewPlaylistName] = useState("");
  const handleCreate = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !auth.currentUser) return;

    try {
      const dialogContent = e.currentTarget.closest(
        '[data-slot="dialog-content"]',
      );

      await createPlaylist(auth.currentUser.uid, newPlaylistName);
      loadPlaylists();

      if (dialogContent) {
        dialogContent.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
      }
      setIsDialogOpen(false);

      if (selectedSong) {
        setIsDialogOpen(true);
      }

      toast.success(`已成功新增歌單【${newPlaylistName}】`);
      setNewPlaylistName("");
    } catch (error) {
      console.error("新增歌單失敗:", error);
      toast.error("新增失敗，請稍後再試");
    }
  };

  // 新增歌曲
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist>({
    id: "",
    name: "",
    songs: [],
  });
  const handleAddSongToPlaylist = async (
    e: SubmitEvent<HTMLFormElement>,
    playlist: Playlist,
    songToAdd: PlaylistItem,
  ) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      const dialogContent = e.currentTarget.closest(
        '[data-slot="dialog-content"]',
      );

      await addSongToPlaylist(auth.currentUser.uid, playlist.id, songToAdd);

      setPlaylists((prev) =>
        prev.map((list) =>
          list.id === playlist.id
            ? {
                ...list,
                songs: [...(list.songs ?? []), songToAdd],
              }
            : list,
        ),
      );

      if (dialogContent) {
        dialogContent.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
      }

      if (selectedSong) {
        setSelectedSong(null);
      }

      toast.success(`已成功新增歌曲至收藏歌單【${playlist.name}】`);
    } catch (error) {
      console.error("新增歌曲失敗:", error);
      toast.error("新增失敗，請稍後再試");
    }
  };

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="violet">房間代碼 {roomId}</Badge>
            {/* <Badge variant="pink">{room.members.length} 位共聽中</Badge> */}
          </div>
          <h1 className="text-3xl font-black">
            {currentUser?.displayName ?? "訪客"}的派對
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <Undo2 />
            返回大廳
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard?.writeText(roomId ?? "");
              toast.success("已複製房間代碼");
            }}
          >
            <Copy />
            複製代碼
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="violet" className="lg:hidden">
                <List />
                清單/成員
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[92vw] overflow-y-auto sm:max-w-md">
              <SheetHeader>
                <SheetTitle>
                  {currentUser?.displayName ?? "訪客"}的派對
                </SheetTitle>
                <SheetDescription>派對資訊</SheetDescription>
              </SheetHeader>
              <div className="space-y-4">
                <section className="rounded-lg border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ListMusic className="size-5 text-cyan-200" />
                      <h2 className="text-lg font-bold text-white">播放清單</h2>
                    </div>
                    <Badge variant="neon">
                      {roomData?.playlist?.length || 0} 首
                    </Badge>
                  </div>
                  <ScrollArea className="h-[360px] pr-3">
                    <div className="space-y-3">
                      {roomData?.playlist.map((item, index) => {
                        const isPlaying =
                          item.videoId === roomData.currentVideoId;

                        return (
                          <div
                            key={`${item?.videoId}-${index}`}
                            onClick={() => {
                              if (!isPlaying) {
                                socket.emit("playSpecific", {
                                  roomId,
                                  index,
                                });
                              }
                            }}
                            className={`flex items-center gap-3 rounded-md border p-3 ${isPlaying ? "border-violet-300/40 bg-violet-400/10 shadow-[0_0_24px_rgba(139,92,246,0.25)]" : "border-white/5 bg-white/[0.03] cursor-pointer"}`}
                          >
                            <img
                              src={item?.thumbnail}
                              alt={item?.title}
                              className="w-20 h-14 object-cover rounded"
                            />
                            <div className="flex-1">
                              <p
                                className={`text-sm line-clamp-2 ${isPlaying ? "" : "text-slate-300"}`}
                              >
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: item?.title,
                                  }}
                                />
                              </p>
                            </div>

                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsDialogOpen(true);
                                setSelectedSong(item);
                              }}
                              className="shrink-0"
                            >
                              <Plus />
                              <span className="sr-only">加入收藏歌單</span>
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </section>
                <section className="rounded-lg border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <UsersRound className="size-5 text-pink-200" />
                      <h2 className="text-lg font-bold text-white">派對成員</h2>
                    </div>
                    <Badge variant="pink">
                      {roomData?.members.length || 0} 人
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {roomData?.members.map((member) => (
                      <div
                        key={member.uid}
                        className="flex items-center gap-3 rounded-md border border-white/5 bg-white/[0.03] p-3"
                      >
                        <Avatar className="size-10 border border-white/10">
                          <AvatarImage
                            src={member.photoURL}
                            alt={member.displayName}
                          ></AvatarImage>

                          <AvatarFallback>
                            {member.displayName?.charAt(0) || "訪客"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-white">
                            {member.displayName}
                          </p>
                        </div>
                        {member.uid === roomData?.members[0].uid && (
                          <Badge
                            variant="outline"
                            className="border-amber-300/30 text-amber-100"
                          >
                            <Crown className="size-3" />
                            房主
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* 左側：播放器與搜尋 */}
        <div className="space-y-6">
          {/* 影片播放器區塊 */}
          <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800">
            {roomData?.currentVideoId ? (
              <YouTube
                videoId={roomData.currentVideoId}
                opts={{
                  width: "100%",
                  height: "100%",
                  playerVars: { autoplay: 1, controls: 1 },
                }}
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
                className="w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                點播一首歌來開始吧！
              </div>
            )}
          </div>

          <Tabs defaultValue="discover">
            <TabsList>
              <TabsTrigger value="discover">點歌</TabsTrigger>
              <TabsTrigger value="chat">派對訊息</TabsTrigger>
            </TabsList>
            <TabsContent value="discover">
              <section className="rounded-lg border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl">
                <SearchResults socket={socket} />
              </section>
            </TabsContent>
            <TabsContent value="chat">
              <section className="rounded-lg border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl">
                <div className="mb-4 flex items-center gap-2">
                  <MessageCircle className="size-5 text-pink-200" />
                  <h2 className="text-lg font-bold text-white">派對訊息</h2>
                </div>
                <div className="flex flex-col space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`w-max-4/5 rounded-md border border-white/5 bg-white/[0.03] p-3 ${message.uid === currentUser?.uid ? "ms-auto" : "me-auto"}`}
                    >
                      <p
                        className={`text-sm font-semibold ${message.uid === currentUser?.uid ? "text-end text-pink-100" : "text-cyan-100"}`}
                      >
                        {message.displayName}
                      </p>
                      <p
                        className={`mt-1 text-slate-300 ${message.uid === currentUser?.uid ? "text-end" : ""}`}
                      >
                        {message.text}
                      </p>
                    </div>
                  ))}
                </div>
                <Separator className="my-4 bg-white/10" />
                <form
                  className="flex gap-2"
                  onSubmit={(e) => handleSendMessage(e)}
                >
                  <Input
                    value={chatInput}
                    placeholder="輸入訊息..."
                    onChange={(e) => {
                      setChatInput(e.target.value);
                    }}
                  />
                  <Button type="submit" variant="violet">
                    <SendHorizontal />
                    送出
                  </Button>
                </form>
              </section>
            </TabsContent>
          </Tabs>
        </div>

        {/* 右側：播放清單 (Queue) */}
        <aside className="hidden space-y-6 lg:block">
          <section className="rounded-lg border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ListMusic className="size-5 text-cyan-200" />
                <h2 className="text-lg font-bold text-white">播放清單</h2>
              </div>
              <Badge variant="neon">{roomData?.playlist?.length || 0} 首</Badge>
            </div>
            <ScrollArea className="h-[360px] pr-3">
              <div className="space-y-3">
                {roomData?.playlist.map((item, index) => {
                  const isPlaying = item.videoId === roomData.currentVideoId;
                  return (
                    <div
                      key={`${item?.videoId}-${index}`}
                      onClick={() => {
                        if (!isPlaying) {
                          socket.emit("playSpecific", {
                            roomId,
                            index,
                          });
                        }
                      }}
                      className={`flex items-center gap-3 rounded-md border p-3 ${isPlaying ? "border-violet-300/40 bg-violet-400/10 shadow-[0_0_24px_rgba(139,92,246,0.25)]" : "border-white/5 bg-white/[0.03] cursor-pointer"}`}
                    >
                      <span
                        className={`font-mono text-sm pt-1 ${isPlaying ? "text-violet-300" : "text-slate-400"}`}
                      >
                        {(index + 1).toString().padStart(2, "0")}
                      </span>
                      <img
                        src={item?.thumbnail}
                        alt={item?.title}
                        className="w-20 h-14 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p
                          className={`text-sm line-clamp-2 ${isPlaying ? "" : "text-slate-300"}`}
                        >
                          <span
                            dangerouslySetInnerHTML={{
                              __html: item?.title,
                            }}
                          />
                        </p>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDialogOpen(true);
                          setSelectedSong(item);
                        }}
                        className="shrink-0"
                      >
                        <Plus />
                        <span className="sr-only">加入收藏歌單</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </section>
          <section className="rounded-lg border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <UsersRound className="size-5 text-pink-200" />
                <h2 className="text-lg font-bold text-white">派對成員</h2>
              </div>
              <Badge variant="pink">{roomData?.members.length || 0} 人</Badge>
            </div>
            <div className="space-y-3">
              {roomData?.members.map((member) => (
                <div
                  key={member.uid}
                  className="flex items-center gap-3 rounded-md border border-white/5 bg-white/[0.03] p-3"
                >
                  <Avatar className="size-10 border border-white/10">
                    <AvatarImage
                      src={member.photoURL}
                      alt={member.displayName}
                    ></AvatarImage>

                    <AvatarFallback>
                      {member.displayName?.charAt(0) || "訪客"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">
                      {member.displayName}
                    </p>
                  </div>
                  {member.uid === roomData?.members[0].uid && (
                    <Badge
                      variant="outline"
                      className="border-amber-300/30 text-amber-100"
                    >
                      <Crown className="size-3" />
                      房主
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {playlists.length > 0 ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>選擇歌單</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                handleAddSongToPlaylist(e, selectedPlaylist, selectedSong!);
                setIsDialogOpen(false);
              }}
              className="space-y-4"
            >
              {playlists.map((item) => {
                return (
                  <div key={item.id}>
                    <input
                      type="radio"
                      name="targetPlaylist"
                      value={item.id}
                      id={item.id}
                      className="me-2"
                      checked={selectedPlaylist.id === item.id}
                      onChange={() => setSelectedPlaylist(item)}
                    />
                    <label htmlFor={item.id}>{item.name}</label>
                  </div>
                );
              })}
              <DialogFooter>
                <Button type="submit">儲存</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        ) : (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>建立新歌單</DialogTitle>
              <DialogDescription>
                先取一個名字，稍後可以加入更多歌曲。
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                value={newPlaylistName}
                onChange={(event) => setNewPlaylistName(event.target.value)}
                placeholder="例如：Party Time"
              />
              <DialogFooter>
                <Button type="submit">新增</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
}
