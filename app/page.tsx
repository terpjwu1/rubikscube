import Cube from './components/RubiksCube/Cube';
import Controls from './components/RubiksCube/Controls';
import MoveHistory from './components/RubiksCube/MoveHistory';
import Guide from './components/RubiksCube/Guide';

export default function Home() {
  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FF90E8]/10 to-transparent pointer-events-none" />
      <Cube />
      <Controls />
      <MoveHistory />
      <Guide />
    </main>
  );
} 