"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <h1 className="text-4xl font-bold mb-6 text-purple-600">himo</h1>
      
      {/* 遊び方ボタン */}
      <button
        onClick={() => setShowHowToPlay(!showHowToPlay)}
        className="mb-6 px-4 py-2 rounded-full bg-white text-blue-600 shadow-md hover:bg-blue-50"
      >
        {showHowToPlay ? "遊び方を閉じる" : "遊び方を見る"}
      </button>
      
      {/* 遊び方の説明 */}
      {showHowToPlay && (
        <div className="w-full max-w-md bg-white p-6 rounded-xl mb-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-blue-600">遊び方</h2>
          <ol className="list-decimal pl-5 space-y-3">
            <li>ホストがルームを作成し、参加者はルームIDを使って参加します。</li>
            <li>ホストが「ゲーム開始」ボタンを押すと、全員にランダムな数字とお題が配られます。</li>
            <li>各プレイヤーは自分の数字に合った発言をします（数字が大きいほどお題に合った発言）。</li>
            <li>全員の発言が完了すると、ホストは発言を「数字の大きい順」に並び替えます。</li>
            <li>正しく並び替えられたら全員の勝利！間違えたら失敗...</li>
          </ol>
          <div className="mt-6 p-4 rounded-lg bg-blue-50">
            <p className="text-sm italic">
              <span className="font-semibold">ポイント:</span>皆が共通認識を持ちやすいものを発言しましょう。
            </p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => router.push("/create-room")}
          className="bg-gradient-to-r from-green-400 to-teal-400 text-white px-4 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl hover:bg-green-600"
        >
          新しくルームを作る
        </button>
        
        <button
          onClick={() => router.push("/join-room")}
          className="bg-gradient-to-r from-blue-400 to-purple-400 text-white px-4 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl hover:bg-blue-600"
        >
          既存ルームに参加する
        </button>
      </div>
      <p className="mt-12 text-center text-sm text-gray-500">
        This game is inspired by the party game &quot;ito&quot;, published by Arclight Inc.
        It is a non-commercial, fan-made project and is not affiliated with or endorsed by Arclight.
      </p>
    </div>
  );
}