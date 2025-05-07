"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import HowToPlayButton from "@/components/HowToPlayButton";

export default function InputPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [myNumber, setMyNumber] = useState<number | null>(null);

  // マウント完了フラグ
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // sessionStorageからプレイヤー名を取得
  useEffect(() => {
    if (hasMounted) {
      const name = sessionStorage.getItem("playerName");
      if (name) setPlayerName(name);
    }
  }, [hasMounted]);

  // Firestoreからお題と自分の番号を取得
  useEffect(() => {
    const fetchTopicAndNumber = async () => {
      if (!roomId || !playerName) return;
      const roomRef = doc(db, "rooms", roomId);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) return;
      const data = roomSnap.data();
      if (data?.topic) {
        setTopic(data.topic);
      }
      const playerRef = doc(db, "rooms", roomId, "players", playerName);
      const playerSnap = await getDoc(playerRef);
      if (playerSnap.exists()) {
        const number = playerSnap.data().number;
        if (typeof number === "number") {
          setMyNumber(number);
        }
      }
    };
    fetchTopicAndNumber();
  }, [roomId, playerName]);

  // 自分のプレイヤー情報をリアルタイム監視
  useEffect(() => {
    if (!roomId || !playerName) return;
    const playerRef = doc(db, "rooms", roomId, "players", playerName);
    const unsub = onSnapshot(playerRef, (snap) => {
      const data = snap.data();
      if (data?.number !== undefined) {
        setMyNumber(data.number);
      }
    });
    return () => unsub();
  }, [roomId, playerName]);

  // お題のリアルタイム取得
  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(doc(db, "rooms", roomId), (docSnap) => {
      const data = docSnap.data();
      if (data?.topic) setTopic(data.topic);
    });
    return () => unsub();
  }, [roomId]);

  // sortに遷移
  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(doc(db, "rooms", roomId), (docSnap) => {
      const data = docSnap.data();
      if (data?.phase === "sort") {
        router.push(`/play/${roomId}/sort`);
      }
    });
    return () => unsub();
  }, [roomId, router]);

  useEffect(() => {
    const checkHost = async () => {
      if (!roomId || !playerName) return;
      const roomRef = doc(db, "rooms", roomId);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        const hostName = roomSnap.data().hostName;
        if (playerName === hostName) {
          setIsHost(true);
        }
      }
    };
    checkHost();
  }, [roomId, playerName]);

  const handleSubmit = async () => {
    if (!playerName || !message || !roomId) {
      alert("発言が未入力です");
      return;
    }
    try {
      await setDoc(doc(db, "rooms", roomId, "players", playerName), {
        name: playerName,
        message,
        createdAt: new Date(),
      }, { merge: true });
      setSubmitted(true);
    } catch (err) {
      console.error("送信エラー:", err);
      alert("送信に失敗しました");
    }
  };

  const goToSortPage = async () => {
    if (!roomId) return;
    try {
      await updateDoc(doc(db, "rooms", roomId), { phase: "sort" });
    } catch (err) {
      console.error("phase 更新失敗:", err);
    }
  };

  if (!hasMounted || !playerName || !topic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-pulse">
            <div className="h-12 w-12 mx-auto mb-4 bg-blue-200 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xl font-medium text-gray-700">ゲームデータを読み込み中...</p>
            <p className="mt-2 text-gray-500">ホストがゲームを開始するまでお待ちください</p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md w-full">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4 text-gray-800">送信完了！</h1>
          <p className="text-lg text-gray-600 mb-6">他のプレイヤーの入力を待っています...</p>
          
          {isHost && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-4">全員の入力が完了したら次の画面へ進みましょう</p>
              <button
                onClick={goToSortPage}
                className="w-full bg-gradient-to-r from-blue-400 to-purple-400 text-white px-4 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                並び替え画面へ進む
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-md">
        <HowToPlayButton />
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2 text-blue-600">今回のお題：</h1>
            <div className="bg-purple-100 rounded-lg p-3 mb-4">
              <p className="text-2xl font-bold text-purple-800">{topic}</p>
            </div>
            
            {myNumber !== null && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  あなたの数字に合った発言をしてください（数字は他の人には見えません）
                </p>
                <div className="bg-blue-100 rounded-full py-2 px-4 inline-block">
                  <p className="text-xl font-bold text-blue-800">
                    あなたの数字：{myNumber}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mb-6">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              あなたの発言
            </label>
            <textarea
              id="message"
              placeholder="お題に沿った発言を入力"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none h-32"
            />
          </div>
          
          <div className="text-center">
            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-blue-400 to-purple-400 text-white px-4 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              発言を送信
            </button>
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
          <p className="text-sm text-yellow-800">
            <span className="font-bold">ポイント：</span> 
            皆が共通認識を持ちやすいものを発言しましょう。
          </p>
        </div>
      </div>
    </div>
  );
}