'use client';

import { useCubeStore } from '@/app/store/cubeStore';

export default function MoveHistory() {
  const { moves } = useCubeStore();

  return (
    <div className="fixed top-6 right-6 w-64">
      <div className="gumroad-panel p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Move History</h3>
        <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2D3139] scrollbar-track-[#12151A]">
          {moves.length === 0 ? (
            <p className="text-[#A1A1AA] text-sm italic">No moves yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {moves.map((move, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-[#2D3139] text-white rounded text-sm font-mono"
                >
                  {move}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 