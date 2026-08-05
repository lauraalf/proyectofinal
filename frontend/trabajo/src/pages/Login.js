import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('https://proyectofinal-jjla.onrender.com/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Error al iniciar sesión');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));

      navigate('/dashboard');
    } catch (err) {
      setError('Error de conexión al servidor');
      console.error(err);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center" 
         style={{ 
           background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
         }}>
      <div className="row justify-content-center w-100">
        <div className="col-md-5 col-lg-4">
          <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
            <div className="card-header bg-white border-0 text-center py-4">
              <div className="mb-2">
                <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fs-6">
                  RRHH
                </span>
              </div>
              <h3 className="fw-bold mb-1" style={{ color: '#2d3748' }}>
                Sistema de Recursos Humanos
              </h3>
              <p className="text-muted small mb-0">Gestion de Ausencias y Vacaciones</p>
            </div>
            <div className="card-body px-4 pb-4">
              {error && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold small text-uppercase text-muted">
                    Correo Electronico
                  </label>
                  <input
                    type="email"
                    className="form-control form-control-lg rounded-3"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="nombre@empresa.com"
                    required
                    style={{ backgroundColor: '#f7fafc', border: '1px solid #e2e8f0' }}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold small text-uppercase text-muted">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    className="form-control form-control-lg rounded-3"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    required
                    style={{ backgroundColor: '#f7fafc', border: '1px solid #e2e8f0' }}
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg w-100 py-2 fw-bold rounded-3"
                  style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none'
                  }}
                >
                  Iniciar Sesion
                </button>
              </form>

              <div className="text-center mt-4 pt-3 border-top">
                <p className="mb-0 text-muted small">
                  ¿No tienes cuenta? 
                  <Link to="/registro" className="fw-bold text-decoration-none" style={{ color: '#667eea' }}>
                    Registrate aqui
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;