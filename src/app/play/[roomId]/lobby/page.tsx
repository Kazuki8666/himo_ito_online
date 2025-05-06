"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc,
  onSnapshot,
  collection,
  getDocs,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import HowToPlayButton from "@/components/HowToPlayButton";

export default function LobbyPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const [players, setPlayers] = useState<string[]>([]);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [hostName, setHostName] = useState<string | null>(null);
  const [phase, setPhase] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null); 

  useEffect(() => {
    const name = sessionStorage.getItem("playerName");
    if (name) setPlayerName(name);
  }, []);

  // 参加者一覧をリアルタイム取得
  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(collection(db, "rooms", roomId, "players"), (snap) => {
      const names = snap.docs.map((doc) => doc.id);
      setPlayers(names);
    });
    return () => unsub();
  }, [roomId]);

  // ホスト名とフェーズを取得
  useEffect(() => {
    if (!roomId) return;
    const roomRef = doc(db, "rooms", roomId);
    const unsub = onSnapshot(roomRef, (snap) => {
      const data = snap.data();
      if (data?.hostName) {
        setHostName(data.hostName);
      }
      if (data?.phase) {
        setPhase(data.phase);
      }
      if (data?.roomName) {
        setRoomName(data.roomName); // 部屋名を取得
      }
    });
    return () => unsub();
  }, [roomId]);

  // ホスト以外だけ phase を監視して input に遷移 - 元のコードのまま維持
  useEffect(() => {
    if (!roomId || !playerName || !hostName || playerName === hostName) return;
    if (phase === "input") {
      router.push(`/play/${roomId}/input`);
    }
  }, [roomId, playerName, hostName, phase, router]);

  // ホストが「ゲーム開始」ボタンを押すと、トピック生成＋番号割り当て＋phase更新
  const handleStart = async () => {
    if (!roomId || !playerName) return;
    const topicOptions = [
      "人気な果物",
      "行ってみたい国",
      "人気な映画",
      "苦手なもの",
      "人気なゲーム",
      "欲しい能力",
      "幸せな瞬間",
      "よく無くしがちなもの",
      "人気なおにぎりの具",
      "コンビニでよく買うもの",
      "１万円以上するけど買って後悔しないもの",
      "新入社員あるある",
      "言われたらショックな言葉",
      "人気なドラマ",
      "取得が難しい資格",
    ];
    const randomTopic = topicOptions[Math.floor(Math.random() * topicOptions.length)];
    try {
      // トピック設定
      await updateDoc(doc(db, "rooms", roomId), { topic: randomTopic });
      // 各プレイヤーにランダムな数字を付与
      const playerDocs = await getDocs(collection(db, "rooms", roomId, "players"));
      for (const player of playerDocs.docs) {
        const randomNumber = Math.floor(Math.random() * 100) + 1;
        await setDoc(
          doc(db, "rooms", roomId, "players", player.id),
          { number: randomNumber },
          { merge: true }
        );
      }
      // フェーズ変更
      await updateDoc(doc(db, "rooms", roomId), { phase: "input" });
      // ホストは明示的に遷移
      router.push(`/play/${roomId}/input`);
    } catch (err) {
      console.error("ゲーム開始エラー:", err);
      alert("ゲーム開始に失敗しました");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-md">
        <HowToPlayButton />
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4 text-center">
          {roomName && (
            <div className="mb-4">
              <span className="text-gray-600 text-sm">ルーム名</span>
              <h2 className="text-2xl font-bold text-purple-600">{roomName}</h2>
            </div>
          )}
          
          <h1 className="text-2xl font-bold mb-6 text-blue-600">待機ルーム</h1>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">参加者一覧</h2>
            <div className="bg-blue-50 rounded-lg p-3">
              <ul className="divide-y divide-blue-100">
                {players.map((name, i) => (
                  <li 
                    key={i} 
                    className={`py-3 text-lg ${name === hostName ? 'font-bold text-blue-600' : 'text-gray-700'}`}
                  >
                    {name} {name === hostName && <span className="text-xs bg-blue-100 px-2 py-1 rounded-full ml-2">ホスト</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {playerName === hostName ? (
            <div className="flex flex-col items-center">
              <p className="mb-4 text-gray-600 text-sm">
                全員の参加を待って、ゲームを開始してください
              </p>
              <button
                onClick={handleStart}
                className="bg-gradient-to-r from-green-400 to-teal-400 text-white px-6 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 w-full"
              >
                ゲーム開始！
              </button>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 rounded-lg text-center">
              <p className="text-yellow-700">
                ホストがゲームを開始するのを待っています...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}