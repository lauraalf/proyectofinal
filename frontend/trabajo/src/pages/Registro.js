import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Registro = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    puesto: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5001/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          password: formData.password,
          telefono: formData.telefono,
          puesto: formData.puesto || 'Empleado'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Error al registrarse');
        setLoading(false);
        return;
      }

      setSuccess('Usuario registrado exitosamente. Redirigiendo al login...');
      
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        confirmPassword: '',
        telefono: '',
        puesto: ''
      });

      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      setError('Error de conexión al servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center" 
         style={{ 
           background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
         }}>
      <div className="row justify-content-center w-100">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
            <div className="card-header bg-white border-0 text-center py-4">
              <div className="mb-2">
                <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill fs-6">
                  Nuevo Usuario
                </span>
              </div>
              <h3 className="fw-bold mb-1" style={{ color: '#2d3748' }}>
                Crear Cuenta
              </h3>
              <p className="text-muted small mb-0">Registrate para acceder al sistema</p>
            </div>
            <div className="card-body px-4 pb-4">
              {error && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                  {error}
                </div>
              )}
              {success && (
                <div className="alert alert-success d-flex align-items-center" role="alert">
                  {success}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-uppercase text-muted">Nombre</label>
                    <input
                      type="text"
                      name="nombre"
                      className="form-control form-control-lg rounded-3"
                      value={formData.nombre}
                      onChange={handleChange}
                      placeholder="Nombre"
                      required
                      style={{ backgroundColor: '#f7fafc', border: '1px solid #e2e8f0' }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-uppercase text-muted">Apellido</label>
                    <input
                      type="text"
                      name="apellido"
                      className="form-control form-control-lg rounded-3"
                      value={formData.apellido}
                      onChange={handleChange}
                      placeholder="Apellido"
                      required
                      style={{ backgroundColor: '#f7fafc', border: '1px solid #e2e8f0' }}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="form-label fw-semibold small text-uppercase text-muted">Correo Electronico</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control form-control-lg rounded-3"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="nombre@empresa.com"
                    required
                    style={{ backgroundColor: '#f7fafc', border: '1px solid #e2e8f0' }}
                  />
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-uppercase text-muted">Contraseña</label>
                    <input
                      type="password"
                      name="password"
                      className="form-control form-control-lg rounded-3"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimo 6 caracteres"
                      required
                      style={{ backgroundColor: '#f7fafc', border: '1px solid #e2e8f0' }}
                    />
                    <small className="text-muted">Minimo 6 caracteres</small>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-uppercase text-muted">Confirmar</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      className="form-control form-control-lg rounded-3"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repite tu contraseña"
                      required
                      style={{ backgroundColor: '#f7fafc', border: '1px solid #e2e8f0' }}
                    />
                  </div>
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-uppercase text-muted">Telefono</label>
                    <input
                      type="tel"
                      name="telefono"
                      className="form-control form-control-lg rounded-3"
                      value={formData.telefono}
                      onChange={handleChange}
                      placeholder="809-555-0000"
                      style={{ backgroundColor: '#f7fafc', border: '1px solid #e2e8f0' }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-uppercase text-muted">Puesto</label>
                    <input
                      type="text"
                      name="puesto"
                      className="form-control form-control-lg rounded-3"
                      value={formData.puesto}
                      onChange={handleChange}
                      placeholder="Tu cargo"
                      style={{ backgroundColor: '#f7fafc', border: '1px solid #e2e8f0' }}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg w-100 mt-4 py-2 fw-bold rounded-3"
                  disabled={loading}
                  style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none'
                  }}
                >
                  {loading ? 'Registrando...' : 'Registrarse'}
                </button>
              </form>

              <div className="text-center mt-4 pt-3 border-top">
                <p className="mb-0 text-muted small">
                  ¿Ya tienes cuenta? 
                  <Link to="/login" className="fw-bold text-decoration-none" style={{ color: '#667eea' }}>
                    Iniciar Sesion
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

export default Registro;