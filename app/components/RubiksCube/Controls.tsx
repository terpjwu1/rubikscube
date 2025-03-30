'use client';

import { useEffect } from 'react';
import { useCubeStore } from '@/app/store/cubeStore';

export default function Controls() {
  const { rotateFace, undoMove, resetCube, autoSolve, isSolving } = useCubeStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isSolving) return;
      
      const key = event.key.toUpperCase();
      const isShift = event.shiftKey;
      
      if (['F', 'B', 'R', 'L', 'U', 'D'].includes(key)) {
        rotateFace(isShift ? `${key}\'` : key);
      }
      
      switch (key) {
        case 'Z':
          undoMove();
          break;
        case 'ESCAPE':
          resetCube();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rotateFace, undoMove, resetCube, isSolving]);

  const handleButtonClick = (move: string) => {
    rotateFace(move);
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-2xl">
      <div className="gumroad-panel p-6 space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-white mb-2">Controls</h3>
          <p className="text-[#A1A1AA] text-sm">Use keyboard controls (F, B, R, L, U, D)</p>
          <p className="text-[#A1A1AA] text-sm">Hold Shift for counter-clockwise rotation</p>
          <p className="text-[#A1A1AA] text-sm">Z to undo, ESC to reset</p>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {[
            ['F', 'Front'], ['B', 'Back'], ['R', 'Right'],
            ['L', 'Left'], ['U', 'Up'], ['D', 'Down']
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleButtonClick(key)}
              disabled={isSolving}
              className="gumroad-button-secondary"
            >
              {label} ({key})
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => undoMove()}
            disabled={isSolving}
            className="gumroad-button-secondary"
          >
            ↩ Undo (Z)
          </button>
          <button
            onClick={() => resetCube()}
            disabled={isSolving}
            className="gumroad-button-danger"
          >
            ⟲ Reset (ESC)
          </button>
          <button
            onClick={() => autoSolve()}
            disabled={isSolving}
            className="gumroad-button-primary"
          >
            {isSolving ? '🔄 Solving...' : '✨ Auto Solve'}
          </button>
        </div>
      </div>
    </div>
  );
} 