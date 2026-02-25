import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom';

function App() {
  console.log("App component rendering");
  return (
    <Router>
      <div className="bg-escape-dark text-white font-sans selection:bg-escape-accent selection:text-black w-full h-full absolute inset-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/game/:roomId" element={<GameRoom />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
