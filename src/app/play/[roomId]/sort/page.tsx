"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";
import HowToPlayButton from "@/components/HowToPlayButton";

interface Player {
  id: string;
  message: string;
}

export default function SortPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [topic, setTopic] = useState<string | null>(null);

  // 名前取得
  useEffect(() => {
    const name = sessionStorage.getItem("playerName");
    if (name) setPlayerName(name);
  }, []);

  // ホストかどうか判定
  useEffect(() => {
    const checkHost = async () => {
      if (!roomId || !playerName) return;
      const roomRef = doc(db, "rooms", roomId);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        const hostName = roomSnap.data()?.hostName;
        if (playerName === hostName) {
          setIsHost(true);
        }
        // トピックも取得
        if (roomSnap.data()?.topic) {
          setTopic(roomSnap.data().topic);
        }
      }
    };
    checkHost();
  }, [roomId, playerName]);

  // ルーム情報を監視（フェーズ変更を検知）
  useEffect(() => {
    if (!roomId) return;
    const roomRef = doc(db, "rooms", roomId);
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        // フェーズが"result"に変わったら全プレイヤーが結果画面に遷移
        if (data.phase === "result") {
          router.push(`/play/${roomId}/result`);
        }
      }
    });
    // クリーンアップ関数
    return () => unsubscribe();
  }, [roomId, router]);

  // Firestore から発言取得
  useEffect(() => {
    const fetchMessages = async () => {
      if (!roomId) return;
      const snap = await getDocs(collection(db, "rooms", roomId, "players"));
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        message: doc.data().message,
      }));
      setPlayers(data);
    };
    fetchMessages();
  }, [roomId]);

  // 並び替え処理
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newPlayers = Array.from(players);
    const [moved] = newPlayers.splice(result.source.index, 1);
    newPlayers.splice(result.destination.index, 0, moved);
    setPlayers(newPlayers);
  };

  // 並び順を Firestore に保存 → 結果ページへ遷移
  const handleConfirmOrder = async () => {
    if (!roomId) return;
    try {
      const sortedIds = players.map((p) => p.id);
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, {
        sortedOrder: sortedIds,
        phase: "result", // フェーズも進める
      });
      // この後、全員がリスナーを通じて自動的に遷移する
    } catch (err) {
      console.error("並び順確定エラー:", err);
      alert("保存に失敗しました");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-md">
        <HowToPlayButton />
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-4 text-blue-600">並び替え</h1>
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
                <div className="text-base text-blue-900 leading-relaxed space-y-2 text-left">
                    <div>
                    <span className="font-bold">1.</span> 数字が大きい発言が上に、小さい発言が下になるように、皆で話し合って並び替えてください。
                    </div>
                    <div>
                    <span className="font-bold">2.</span> 並び替えが確定したら、ホストが並び替え確定ボタンを押しましょう！
                    </div>
                </div>
            </div>

            
            {topic && (
              <div className="bg-purple-100 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-700 mb-1">今回のお題：</p>
                <p className="text-xl font-bold text-purple-800">「{topic}」</p>
              </div>
            )}
          </div>
          <div className="mb-6">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="players">
                {(provided) => (
                  <ul
                    className="w-full space-y-3"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {players.map((player, index) => (
                      <Draggable key={player.id} draggableId={player.id} index={index}>
                        {(provided) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                          >
                            <div className="flex items-center">
                              <div className="mr-3 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-gray-800">{player.message}</p>
                              </div>
                            </div>
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
          </div>
          
          {isHost && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                全ての発言を数字順に並び替えたら確定ボタンを押してください
              </p>
              <button
                onClick={handleConfirmOrder}
                disabled={players.length === 0}
                className={`w-full py-3 px-4 rounded-xl text-white font-medium shadow-md
                ${players.length === 0 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-gradient-to-r from-green-400 to-teal-400 hover:shadow-lg transition-all duration-200"}`}
              >
                並び順を確定する
              </button>
            </div>
          )}
          <div className="mb-6">
            <p className="text-xs text-gray-500 text-center mb-3">
              <br />
              ※並び替えができない場合はページを再読み込みしてください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}