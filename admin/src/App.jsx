import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Dashboard />
      </div>
    </Router>
  );
}

export default App;
