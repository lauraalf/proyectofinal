import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Dashboard from './pages/Dashboard';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect } from 'react';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const interval = setInterval(() => {
      const newToken = localStorage.getItem('token');
      if (newToken !== token) {
        setToken(newToken);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [token]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route 
          path="/dashboard" 
          element={token ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;