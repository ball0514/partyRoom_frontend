import type { SubmitEvent } from "react";

import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

import type { Playlist, PlaylistItem } from "@/types";
import {
  getPlaylists,
  createPlaylist,
  updatePlaylistName,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
} from "@/services/playlistService";

import { Undo2, Plus, Disc3, Radio, EllipsisVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import SearchResults from "@/components/SearchResults";

// 隨機產生一個 6 碼的房間 ID (例如: x7k9p2)
const generateRoomId = () => Math.random().toString(36).substring(2, 8);

export default function Playlists() {
  const navigate = useNavigate();

  // 檢查登入資訊
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      } else if (user.isAnonymous) {
        navigate("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const [menuOpenId, setMenuOpenId] = useState<string>("");

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

  // 新增歌單
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

  // 編輯歌單名稱
  const [playlistName, setPlaylistName] = useState("");
  const handleUpdate = async (e: SubmitEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      const dialogContent = e.currentTarget.closest(
        '[data-slot="dialog-content"]',
      );

      await updatePlaylistName(auth.currentUser.uid, id, playlistName);
      loadPlaylists();

      if (dialogContent) {
        dialogContent.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
      }

      toast.success(`已成功修改歌單名單為【${playlistName}】`);
      setPlaylistName("");
    } catch (error) {
      console.error("修改歌單失敗:", error);
      toast.error("修改失敗，請稍後再試");
    }
  };

  // 刪除歌單
  const handleDelete = async (
    e: SubmitEvent<HTMLFormElement>,
    playlist: Playlist,
  ) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await deletePlaylist(auth.currentUser.uid, playlist.id);
      loadPlaylists();
      toast.success(`已成功刪除收藏歌單【${playlist.name}】`);

      setMenuOpenId("");
    } catch (error) {
      console.error("刪除失敗:", error);
      toast.error("刪除失敗，請稍後再試");
    }
  };

  // 用歌單創建房間
  const handleCreateRoomWithPlaylist = (playlistId: string) => {
    const newRoomId = generateRoomId();
    // 將歌單 ID 當作網址參數帶到新房間
    navigate(`/room/${newRoomId}?playlistId=${playlistId}`);
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

      setMenuOpenId("");

      if (selectedSong) {
        setSelectedSong(null);
      }

      toast.success(`已成功新增歌曲至收藏歌單【${playlist.name}】`);
    } catch (error) {
      console.error("新增歌曲失敗:", error);
      toast.error("新增失敗，請稍後再試");
    }
  };

  // 移除歌曲
  const handleRemoveSong = async (
    e: SubmitEvent<HTMLFormElement>,
    playlist: Playlist,
    songToRemove: PlaylistItem,
  ) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      const dialogContent = e.currentTarget.closest(
        '[data-slot="dialog-content"]',
      );

      await removeSongFromPlaylist(
        auth.currentUser.uid,
        playlist.id,
        songToRemove,
      );

      setPlaylists((prev) =>
        prev.map((list) =>
          list.id === playlist.id
            ? {
                ...list,
                songs: list.songs?.filter(
                  (s) => s.videoId !== songToRemove.videoId,
                ),
              }
            : list,
        ),
      );

      if (dialogContent) {
        dialogContent.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
      }

      setMenuOpenId("");

      toast.success(`已成功從收藏歌單【${playlist.name}】移除歌曲`);
    } catch (error) {
      console.error("移除歌曲失敗:", error);
      toast.error("移除失敗，請稍後再試");
    }
  };

  // 搜尋歌曲並新增至歌單
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<PlaylistItem | null>(null);

  const handleOpenDialog = (item: PlaylistItem) => {
    setSelectedSong(item); // 存下這首歌
    setIsDialogOpen(true);
  };

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-black text-white">歌單管理</h1>
          <p className="mt-3 text-slate-400">
            整理派對曲庫，從任何歌單一鍵開房。
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <Undo2 />
            返回大廳
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="lg"
                variant={playlists.length > 0 ? "violet" : "default"}
              >
                <Plus />
                建立歌單
              </Button>
            </DialogTrigger>
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
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <section className="rounded-lg border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl">
          <h2 className="mb-4 text-xl font-black text-white">歌曲素材庫</h2>
          <SearchResults onOpenDialog={handleOpenDialog} />
        </section>

        <section className="space-y-4">
          {playlists.map((playlist) => (
            <Card key={playlist.id} className="bg-slate-900/60">
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>
                    <div className="flex items-center">
                      <Disc3 className="size-6 me-2" />
                      {playlist.name}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {playlist.songs?.length || 0} 首歌曲
                  </CardDescription>
                </div>
                <div className="flex items-center">
                  {(playlist.songs?.length ?? 0) > 0 && (
                    <Button
                      onClick={() => handleCreateRoomWithPlaylist(playlist.id)}
                    >
                      <Radio />
                      用此歌單開派對
                    </Button>
                  )}
                  <div className="relative">
                    {/* 選單按鈕 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(
                          menuOpenId === playlist.id ? "" : playlist.id,
                        );
                      }}
                      className="text-slate-400 hover:text-white ms-2 px-2 py-1 rounded hover:bg-slate-700"
                    >
                      <EllipsisVertical />
                    </button>

                    {/* 下拉選單內容 */}
                    {menuOpenId === playlist.id && (
                      <>
                        {/* 遮罩：點擊選單外區域時關閉選單 */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId("");
                          }}
                        />

                        <div className="absolute right-0 mt-2 w-32 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-20">
                          <Dialog>
                            <DialogTrigger asChild>
                              <button
                                onClick={() => {
                                  setPlaylistName(playlist.name ?? "");
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600 hover:rounded-t-lg"
                              >
                                編輯名稱
                              </button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>編輯名稱</DialogTitle>
                                <DialogDescription>
                                  換個更酷的名字。
                                </DialogDescription>
                              </DialogHeader>
                              <form
                                onSubmit={(e) => handleUpdate(e, playlist.id)}
                                className="space-y-4"
                              >
                                <Input
                                  value={playlistName}
                                  onChange={(event) =>
                                    setPlaylistName(event.target.value)
                                  }
                                  placeholder="例如：Party Time"
                                />
                                <DialogFooter>
                                  <Button type="submit">儲存</Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <Dialog>
                            <DialogTrigger asChild>
                              <button className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-600 hover:rounded-b-lg">
                                刪除歌單
                              </button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>刪除歌單</DialogTitle>
                              </DialogHeader>
                              <form
                                onSubmit={(e) => {
                                  handleDelete(e, playlist);
                                }}
                                className="space-y-4"
                              >
                                <p>確定刪除【{playlist.name}】歌單嗎?</p>
                                <DialogFooter>
                                  <Button
                                    variant="ghost"
                                    type="submit"
                                    className="bg-red-500 hover:bg-red-700"
                                  >
                                    刪除
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {playlist.songs?.map((song) => (
                    <div
                      key={song.videoId}
                      className="flex items-center justify-between gap-3 rounded-md border border-white/5 bg-white/[0.03] p-3"
                    >
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
                      <div className="relative">
                        {/* 選單按鈕 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(
                              menuOpenId === playlist.id + song.videoId
                                ? ""
                                : playlist.id + song.videoId,
                            );
                          }}
                          className="text-slate-400 hover:text-white ms-2 px-2 py-1 rounded hover:bg-slate-700"
                        >
                          <EllipsisVertical />
                        </button>

                        {/* 下拉選單內容 */}
                        {menuOpenId === playlist.id + song.videoId && (
                          <>
                            {/* 遮罩：點擊選單外區域時關閉選單 */}
                            <div
                              className="fixed inset-0 z-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId("");
                              }}
                            />

                            <div className="absolute right-0 mt-2 w-48 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-20">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600 hover:rounded-t-lg">
                                    新增歌曲至其他歌單
                                  </button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>選擇歌單</DialogTitle>
                                  </DialogHeader>
                                  <form
                                    onSubmit={(e) =>
                                      handleAddSongToPlaylist(
                                        e,
                                        selectedPlaylist,
                                        song,
                                      )
                                    }
                                    className="space-y-4"
                                  >
                                    {playlists
                                      .filter((item) => item.id !== playlist.id)
                                      .map((item) => {
                                        return (
                                          <div>
                                            <input
                                              type="radio"
                                              name="targetPlaylist"
                                              value={item.id}
                                              id={item.id}
                                              className="me-2"
                                              checked={
                                                selectedPlaylist.id === item.id
                                              }
                                              onChange={() =>
                                                setSelectedPlaylist(item)
                                              }
                                            />
                                            <label htmlFor={item.id}>
                                              {item.name}
                                            </label>
                                          </div>
                                        );
                                      })}
                                    <DialogFooter>
                                      <Button type="submit">儲存</Button>
                                    </DialogFooter>
                                  </form>
                                </DialogContent>
                              </Dialog>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-600 hover:rounded-b-lg">
                                    移除歌曲
                                  </button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>移除歌曲</DialogTitle>
                                  </DialogHeader>
                                  <form
                                    onSubmit={(e) => {
                                      handleRemoveSong(e, playlist, song);
                                    }}
                                    className="space-y-4"
                                  >
                                    <p>確定移除【{song.title}】嗎?</p>
                                    <DialogFooter>
                                      <Button
                                        variant="ghost"
                                        type="submit"
                                        className="bg-red-500 hover:bg-red-700"
                                      >
                                        移除
                                      </Button>
                                    </DialogFooter>
                                  </form>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
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
