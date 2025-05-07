"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, setDoc, doc } from "firebase/firestore";
import HowToPlayButton from "@/components/HowToPlayButton";

export default function JoinRoomPage() {
  const [name, setName] = useState("");
  const [roomName, setRoomName] = useState("");
  const router = useRouter();

  const handleJoin = async () => {
    if (!name || !roomName) {
      alert("すべて入力してください！");
      return;
    }

    try {
      // ルームネームをFirestoreにて検索
      const q = query(collection(db, "rooms"), where("roomName", "==", roomName));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        alert("そのルーム名は見つかりませんでした！");
        return;
      }
      // 1件目のidを格納
      const roomDoc = querySnapshot.docs[0];
      const roomId = roomDoc.id;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("playerName", name);
        //バッファとして50ms待機
        await new Promise((r) => setTimeout(r, 50));
      }

      // プレイヤー情報を Firestore に登録
      await setDoc(doc(db, "rooms", roomId, "players", name), {
        name,
        createdAt: new Date(),
      });

      router.push(`/play/${roomId}/lobby`);
    } catch (err) {
      console.error("参加エラー:", err);
      alert("ルーム参加に失敗しました！");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">ルームに参加</h1>
          <p className="text-gray-600">既存のゲームルームに参加します</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <HowToPlayButton />
          
          <div className="mb-6 mt-4">
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-1">
              あなたの名前
            </label>
            <input
              id="playerName"
              type="text"
              placeholder="ニックネームを入力"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="roomNameInput" className="block text-sm font-medium text-gray-700 mb-1">
              ルーム名
            </label>
            <input
              id="roomNameInput"
              type="text"
              placeholder="参加するルーム名を入力"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <button
            onClick={handleJoin}
            className="w-full bg-gradient-to-r from-blue-400 to-purple-400 text-white py-3 px-4 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
          >
            ルームに参加する
          </button>
          
          <button
            onClick={() => router.push("/")}
            className="w-full mt-4 bg-white text-gray-600 py-2 px-4 rounded-xl font-medium border border-gray-300 hover:bg-gray-50 transition-all duration-200"
          >
            戻る
          </button>
        </div>
      </div>
    </div>
  );
}