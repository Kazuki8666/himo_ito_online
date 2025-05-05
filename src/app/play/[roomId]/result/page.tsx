"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  writeBatch,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";

interface Player {
  id: string;
  name: string;
  number: number;
  message: string;
}

export default function ResultPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const [orderedPlayers, setOrderedPlayers] = useState<Player[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [topic, setTopic] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      if (!roomId) return;
      const roomSnap = await getDoc(doc(db, "rooms", roomId));
      const sortedOrder: string[] = roomSnap.data()?.sortedOrder ?? [];
      const roomData = roomSnap.data();
      if (roomData?.topic) {
        setTopic(roomData.topic);
      }
      
      const playerSnap = await getDocs(collection(db, "rooms", roomId, "players"));
      const allPlayers: { [id: string]: Player } = {};
      playerSnap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        allPlayers[docSnap.id] = {
          id: docSnap.id,
          name: data.name,
          message: data.message,
          number: data.number,
        };
      });
      const ordered = sortedOrder.map((id) => allPlayers[id]).filter(Boolean);
      setOrderedPlayers(ordered);
      const numbers = ordered.map((p) => p.number);
      const isSorted = numbers.every((n, i, arr) => i === 0 || arr[i - 1] >= n); // 大きい→小さい
      setIsCorrect(isSorted);
    };
    fetchResult();
  }, [roomId]);

  // フェーズ監視を追加
  useEffect(() => {
    if (!roomId) return;
    
    const roomRef = doc(db, "rooms", roomId);
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        // フェーズが"lobby"に変わったら全プレイヤーがロビーに遷移
        if (data.phase === "lobby") {
          router.push(`/play/${roomId}/lobby`);
        }
      }
    });
    
    // クリーンアップ関数
    return () => unsubscribe();
  }, [roomId, router]);

  const handlePlayAgain = async () => {
    if (!roomId) return;
    
    try {
      // まずphaseを"lobby"に変更
      // これにより他のプレイヤーも自動的にロビーに遷移する
      await updateDoc(doc(db, "rooms", roomId), {
        phase: "lobby",
        sortedOrder: null,
        gameStarted: false,
      });
      
      // プレイヤーデータをリセット
      const playersRef = collection(db, "rooms", roomId, "players");
      const snap = await getDocs(playersRef);
      const batch = writeBatch(db);
      
      snap.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          message: "",
          number: null,
        });
      });
      
      await batch.commit();
      router.push(`/play/${roomId}/lobby`);
    } catch (err) {
      console.error("リセットエラー:", err);
      alert("エラーが発生しました");
    }
  };

  const handleReturnToTop = async () => {
    if (!roomId) return;
    const playersRef = collection(db, "rooms", roomId, "players");
    const snap = await getDocs(playersRef);
    const batch = writeBatch(db);
    snap.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    batch.delete(doc(db, "rooms", roomId));
    await batch.commit();
    router.push("/");
  };

  if (isCorrect === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-pulse">
            <div className="h-12 w-12 mx-auto mb-4 bg-blue-200 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-xl font-medium text-gray-700">結果を計算中...</p>
            <p className="mt-2 text-gray-500">もう少しお待ちください</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-md">
        <div className={`text-center mb-8 ${isCorrect ? 'animate-bounce' : ''}`}>
          {isCorrect ? (
            <div className="bg-green-100 border-2 border-green-300 rounded-xl p-6 shadow-lg">
              <div className="text-6xl mb-2">🎉</div>
              <h1 className="text-3xl font-bold text-green-600 mb-2">正解！</h1>
              <p className="text-green-700">正解の並びです！全員の勝利です！</p>
            </div>
          ) : (
            <div className="bg-red-100 border-2 border-red-300 rounded-xl p-6 shadow-lg">
              <div className="text-6xl mb-2">😢</div>
              <h1 className="text-3xl font-bold text-red-600 mb-2">惜しい！</h1>
              <p className="text-red-700">残念ながら並びに失敗しました。</p>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {topic && (
            <div className="mb-4 text-center">
              <p className="text-sm text-gray-600">今回のお題：</p>
              <p className="text-xl font-bold text-purple-800">「{topic}」</p>
            </div>
          )}
          
          <h2 className="text-lg font-semibold mb-4 text-center text-gray-700">
            発言と数字の正解
          </h2>
          
          <ul className="w-full space-y-3 mb-6">
            {orderedPlayers.map((player, index) => (
              <li
                key={player.id}
                className={`border rounded-lg p-4 flex justify-between items-center shadow-sm
                ${index === 0 ? 'bg-yellow-50 border-yellow-200' : ''}
                ${index === orderedPlayers.length - 1 ? 'bg-blue-50 border-blue-200' : ''}
                ${index !== 0 && index !== orderedPlayers.length - 1 ? 'bg-white' : ''}`}
              >
                <div className="flex-1">
                  <p className="text-gray-800">{player.message}</p>
                  <p className="text-gray-500 text-sm">{player.name}</p>
                </div>
                <div className="ml-4">
                  <div className="bg-blue-100 rounded-full h-10 w-10 flex items-center justify-center">
                    <span className="font-bold text-blue-800">{player.number}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={handlePlayAgain}
              className="bg-gradient-to-r from-green-400 to-teal-400 text-white px-4 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              もう一戦する
            </button>
            
            <button
              onClick={handleReturnToTop}
              className="bg-white text-gray-600 px-4 py-3 rounded-xl font-medium border border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              トップページに戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}