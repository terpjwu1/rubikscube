'use client';

import { useState } from 'react';
import { useCubeStore } from '@/app/store/cubeStore';

interface SolveStep {
  title: string;
  description: string;
  moves: string[];
}

const BEGINNER_METHOD: SolveStep[] = [
  {
    title: "White Cross",
    description: "Create a white cross on the top face, ensuring the edge pieces match their side colors.",
    moves: ["F", "R", "U", "L", "D"],
  },
  {
    title: "White Corners",
    description: "Place the white corners in their correct positions while keeping the cross intact.",
    moves: ["R U R'", "U R U' R'"],
  },
  {
    title: "Middle Layer Edges",
    description: "Solve the middle layer edges using the appropriate algorithm for each piece.",
    moves: ["U R U' R' U' F' U F", "U' L' U L U F U' F'"],
  },
  {
    title: "Yellow Cross",
    description: "Create a yellow cross on the bottom face using the algorithm if needed.",
    moves: ["F R U R' U' F'"],
  },
  {
    title: "Yellow Edges",
    description: "Position the yellow edges correctly while maintaining the cross.",
    moves: ["R U R' U R U2 R'"],
  },
  {
    title: "Yellow Corners",
    description: "Position and orient the yellow corners to complete the cube.",
    moves: ["U R U' L' U R' U' L"],
  },
];

export default function Guide() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const toggleGuide = () => setIsOpen(!isOpen);
  
  const nextStep = () => {
    if (currentStep < BEGINNER_METHOD.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed top-6 left-6">
      <button
        onClick={toggleGuide}
        className="gumroad-button-primary"
      >
        {isOpen ? '✕ Hide Guide' : '📖 Show Guide'}
      </button>
      
      {isOpen && (
        <div className="mt-4 gumroad-panel p-6 w-80">
          <h3 className="text-lg font-semibold text-white mb-4">Beginner's Method</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-white">
                  Step {currentStep + 1}: {BEGINNER_METHOD[currentStep].title}
                </h4>
                <span className="text-sm text-[#A1A1AA]">
                  {currentStep + 1} / {BEGINNER_METHOD.length}
                </span>
              </div>
              <p className="text-[#A1A1AA] text-sm">
                {BEGINNER_METHOD[currentStep].description}
              </p>
              <div className="bg-[#2D3139] p-3 rounded-lg">
                <p className="font-mono text-sm text-white">
                  {BEGINNER_METHOD[currentStep].moves.join(", ")}
                </p>
              </div>
            </div>
            <div className="flex justify-between gap-3">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="gumroad-button-secondary flex-1"
              >
                ← Previous
              </button>
              <button
                onClick={nextStep}
                disabled={currentStep === BEGINNER_METHOD.length - 1}
                className="gumroad-button-secondary flex-1"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 