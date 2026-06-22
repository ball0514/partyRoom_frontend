import { db } from "@/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";
import type { Playlist, PlaylistItem } from "@/types";

/* 新增/建立個人歌單 */
export const createPlaylist = async (userId: string, name: string) => {
  const newDocRef = doc(collection(db, "users", userId, "playlists"));
  await setDoc(newDocRef, {
    name,
    songs: [],
    createdAt: serverTimestamp(),
  });
  return newDocRef.id;
};

/* 檢視/讀取所有歌單 */
export const getPlaylists = async (userId: string): Promise<Playlist[]> => {
  const colRef = collection(db, "users", userId, "playlists");
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Playlist,
  );
};

/* 編輯歌單：新增歌曲 */
export const addSongToPlaylist = async (
  userId: string,
  playlistId: string,
  song: PlaylistItem,
) => {
  const docRef = doc(db, "users", userId, "playlists", playlistId);
  await updateDoc(docRef, {
    songs: arrayUnion(song),
  });
};

/* 編輯歌單：刪除歌曲 */
export const removeSongFromPlaylist = async (
  userId: string,
  playlistId: string,
  song: PlaylistItem,
) => {
  const docRef = doc(db, "users", userId, "playlists", playlistId);
  await updateDoc(docRef, {
    songs: arrayRemove(song),
  });
};

/* 更新歌單名稱 */
export const updatePlaylistName = async (
  userId: string,
  playlistId: string,
  newName: string,
) => {
  const docRef = doc(db, "users", userId, "playlists", playlistId);
  await updateDoc(docRef, { name: newName });
};

/* 刪除歌單 */
export const deletePlaylist = async (userId: string, playlistId: string) => {
  const docRef = doc(db, "users", userId, "playlists", playlistId);
  await deleteDoc(docRef);
};
