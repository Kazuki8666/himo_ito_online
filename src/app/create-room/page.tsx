"use client";
import { useState } from "react";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import HowToPlayButton from "@/components/HowToPlayButton";

export default function CreateRoomPage() {
  const [hostName, setHostName] = useState("");
  const [roomName, setRoomName] = useState("");
  const router = useRouter();

  const handleCreateRoom = async () => {
    if (!hostName || !roomName) {
      alert("すべて入力してください！");
      return;
    }

    try {
      // 名前をsessionStorageに保存
      if (typeof window !== "undefined") {
        sessionStorage.setItem("playerName", hostName);
      }

      const docRef = await addDoc(collection(db, "rooms"), {
        hostName,
        roomName,
        createdAt: new Date(),
        phase: "input",
      });

      // ✅ ホストもプレイヤーとして登録
      await setDoc(doc(db, "rooms", docRef.id, "players", hostName), {
        name: hostName,
        createdAt: new Date(),
      });

      // 成功したら待機ページに遷移
      router.push(`/play/${docRef.id}/lobby`);
    } catch (error) {
      console.error("ルーム作成失敗", error);
      alert("ルーム作成に失敗しました");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-purple-600 mb-2">ルーム作成</h1>
          <p className="text-gray-600">新しいゲームルームを作成しましょう</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <HowToPlayButton />
          
          <div className="mb-6 mt-4">
            <label htmlFor="hostName" className="block text-sm font-medium text-gray-700 mb-1">
              あなたの名前
            </label>
            <input
              id="hostName"
              type="text"
              placeholder="ニックネームを入力"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
              ルーム名
            </label>
            <input
              id="roomName"
              type="text"
              placeholder="ルーム名を入力"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <button
            onClick={handleCreateRoom}
            className="w-full bg-gradient-to-r from-blue-400 to-purple-400 text-white py-3 px-4 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
          >
            ルームを作成する
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