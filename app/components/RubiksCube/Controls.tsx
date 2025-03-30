'use client';

import { useEffect } from 'react';
import { useCubeStore, Face } from '@/app/store/cubeStore';

// Type for face keys without null
type FaceKey = Exclude<Face, null>;

export default function Controls() {
  const { 
    rotateFace, 
    undoMove, 
    resetCube, 
    autoSolve, 
    randomize, 
    isSolving,
    selectedFace,
    selectFace
  } = useCubeStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isSolving) return;
      
      const key = event.key.toUpperCase();
      const isShift = event.shiftKey;
      
      // Handle face selection with letter keys
      if (['F', 'B', 'R', 'L', 'U', 'D'].includes(key)) {
        event.preventDefault();
        const faceKey = key as FaceKey;
        // If a face is already selected and we press its key again,
        // rotate it clockwise (or counter-clockwise with shift)
        if (selectedFace === faceKey) {
          rotateFace(isShift ? `${faceKey}'` : faceKey);
        } else {
          // Select the new face
          selectFace(faceKey);
        }
        return;
      }

      // Handle rotation with arrow keys when a face is selected
      if (selectedFace && (key === 'ARROWLEFT' || key === 'ARROWRIGHT')) {
        event.preventDefault();
        rotateFace(key === 'ARROWLEFT' ? `${selectedFace}'` : selectedFace);
        return;
      }
      
      // Other controls
      switch (key) {
        case 'Z':
          event.preventDefault();
          undoMove();
          break;
        case 'ESCAPE':
          event.preventDefault();
          resetCube();
          selectFace(null);
          break;
        case 'SPACE':
          event.preventDefault();
          if (selectedFace) {
            selectFace(null);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rotateFace, undoMove, resetCube, isSolving, selectedFace, selectFace]);

  const handleFaceClick = (face: FaceKey) => {
    if (selectedFace === face) {
      // Clicking the same face button again will rotate it clockwise
      rotateFace(face);
    } else {
      selectFace(face);
    }
  };

  const handleRotate = (isCounterClockwise: boolean) => {
    if (!selectedFace) return;
    rotateFace(isCounterClockwise ? `${selectedFace}'` : selectedFace);
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-xl">
      <div className="gumroad-panel p-6 space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-white">Controls</h3>
          <div className="text-[#A1A1AA] text-sm space-y-1">
            <p>1. Select a face to rotate (F, B, R, L, U, D)</p>
            <p>2. Use arrow keys or buttons to rotate repeatedly</p>
            <p>Z to undo, ESC to reset, Space to deselect</p>
          </div>
        </div>
        
        <div className="grid grid-cols-6 gap-3">
          {[
            ['F', 'Front'], ['B', 'Back'], ['R', 'Right'],
            ['L', 'Left'], ['U', 'Up'], ['D', 'Down']
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleFaceClick(key as FaceKey)}
              disabled={isSolving}
              className={`text-sm px-4 py-2 transition-all duration-200 ${
                selectedFace === key 
                ? 'gumroad-button-primary scale-105 ring-2 ring-primary ring-opacity-30' 
                : 'gumroad-button-secondary hover:scale-105'
              }`}
              title={`${label} (${key})`}
            >
              {key}
            </button>
          ))}
        </div>

        {selectedFace && (
          <div className="flex flex-col gap-3">
            <div className="flex justify-center gap-3">
              <button
                onClick={() => handleRotate(true)}
                disabled={isSolving}
                className="gumroad-button-primary text-sm px-4 py-2 flex items-center gap-2 transition-all duration-200 hover:scale-105"
                title="Press Left Arrow"
              >
                ← Rotate Counter-Clockwise
              </button>
              <button
                onClick={() => handleRotate(false)}
                disabled={isSolving}
                className="gumroad-button-primary text-sm px-4 py-2 flex items-center gap-2 transition-all duration-200 hover:scale-105"
                title="Press Right Arrow"
              >
                Rotate Clockwise →
              </button>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => selectFace(null)}
                disabled={isSolving}
                className="gumroad-button-secondary text-sm px-4 py-2 flex items-center gap-2 transition-all duration-200 hover:scale-105"
                title="Press Space"
              >
                Exit Selection Mode
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              undoMove();
            }}
            disabled={isSolving}
            className="gumroad-button-secondary text-sm px-4 py-2 transition-all duration-200 hover:scale-105"
            title="Press Z"
          >
            Undo
          </button>
          <button
            onClick={() => {
              resetCube();
              selectFace(null);
            }}
            disabled={isSolving}
            className="gumroad-button-danger text-sm px-4 py-2 transition-all duration-200 hover:scale-105"
            title="Press ESC"
          >
            Reset
          </button>
          <button
            onClick={() => {
              randomize();
              selectFace(null);
            }}
            disabled={isSolving}
            className="gumroad-button-secondary text-sm px-4 py-2 transition-all duration-200 hover:scale-105"
          >
            Scramble
          </button>
          <button
            onClick={() => {
              autoSolve();
              selectFace(null);
            }}
            disabled={isSolving}
            className="gumroad-button-primary text-sm px-4 py-2 transition-all duration-200 hover:scale-105"
          >
            {isSolving ? 'Solving...' : 'Solve'}
          </button>
        </div>
      </div>
    </div>
  );
} 