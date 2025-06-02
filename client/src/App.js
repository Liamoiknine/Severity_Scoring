import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Calculator from './pages/Calculator';
import Visualization from './pages/Visualization';

// Loads pages according to routes
function App() {
  return (
      <Routes>
        <Route path="/" element={<Visualization />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/visualization" element={<Visualization />} />
      </Routes>
  );
}

export default App;