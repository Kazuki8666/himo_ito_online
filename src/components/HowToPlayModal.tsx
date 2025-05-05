// /src/components/HowToPlayModal.tsx
import { useEffect, useRef } from 'react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // モーダル外のクリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg p-6 max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">遊び方</h2>
          <button 
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
          >
            ✕
          </button>
        </div>
        
        <ol className="list-decimal pl-5 space-y-2">
          <li>ホストがルームを作成し、参加者はルームIDを使って参加します。</li>
          <li>ホストが「ゲーム開始」ボタンを押すと、全員にランダムな数字とお題が配られます。</li>
          <li>各プレイヤーは自分の数字に合った発言をします（数字が大きいほどよりお題に合った発言）。</li>
          <li>全員の発言が完了すると、ホストは発言を「数字の大きい順」に並び替えます。</li>
          <li>正しく並び替えられたら全員の勝利！間違えたら失敗...</li>
        </ol>
        
        <p className="mt-4 text-sm italic">ポイント: 皆が共通認識を持ちやすいものを発言しましょう。</p>
      </div>
    </div>
  );
}