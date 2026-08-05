import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevaSolicitud, setNuevaSolicitud] = useState({
    tipo: 'vacaciones',
    fecha_inicio: '',
    fecha_fin: '',
    descripcion: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [mensajeTipo, setMensajeTipo] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const isAdmin = usuario.rol === 'admin';

  const cargarSolicitudes = useCallback(async () => {
    try {
      const response = await fetch('https://proyectofinal-jj1a.onrender.com/solicitudes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          navigate('/login');
          return;
        }
        throw new Error('Error al cargar solicitudes');
      }

      const data = await response.json();
      setSolicitudes(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    cargarSolicitudes();
  }, [token, navigate, cargarSolicitudes]);

  const crearSolicitud = async (e) => {
    e.preventDefault();
    setMensaje('');
    
    const hoy = new Date().toISOString().split('T')[0];
    if (nuevaSolicitud.fecha_inicio < hoy) {
      setMensaje('La fecha de inicio no puede ser en el pasado');
      setMensajeTipo('error');
      return;
    }

    const solicitudData = {
      tipo: nuevaSolicitud.tipo,
      fecha_inicio: nuevaSolicitud.fecha_inicio,
      fecha_fin: nuevaSolicitud.fecha_fin,
      descripcion: nuevaSolicitud.descripcion
    };

    try {
      const response = await fetch('https://proyectofinal-jj1a.onrender.com/solicitudes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(solicitudData)
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje(data.message || 'Solicitud creada exitosamente');
        setMensajeTipo('success');
        setNuevaSolicitud({
          tipo: 'vacaciones',
          fecha_inicio: '',
          fecha_fin: '',
          descripcion: ''
        });
        setShowForm(false);
        cargarSolicitudes();
      } else {
        setMensaje(data.message || 'Error al crear solicitud');
        setMensajeTipo('error');
      }
    } catch (error) {
      setMensaje('Error de conexion al servidor');
      setMensajeTipo('error');
      console.error('Error:', error);
    }
  };

  const actualizarEstado = async (id, estado) => {
    try {
      const response = await fetch(`https://proyectofinal-jj1a.onrender.com/solicitudes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado })
      });

      const data = await response.json();

      if (!response.ok) {
        setMensaje(data.message || 'Error al actualizar solicitud');
        setMensajeTipo('error');
        return;
      }

      setMensaje('Solicitud actualizada exitosamente');
      setMensajeTipo('success');
      cargarSolicitudes();
    } catch (error) {
      setMensaje('Error de conexion al servidor');
      setMensajeTipo('error');
      console.error('Error:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  const getEstadoBadge = (estado) => {
    const clases = {
      'pendiente': 'bg-warning text-dark',
      'aprobada': 'bg-success',
      'rechazada': 'bg-danger'
    };
    return `badge ${clases[estado] || 'bg-secondary'}`;
  };

  const getPrioridadLabel = (prioridad) => {
    if (prioridad === 1) return '1 prioridad';
    if (prioridad === 2) return '2 prioridad';
    if (prioridad >= 3) return `${prioridad} prioridad`;
    return 'Sin prioridad';
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2 text-muted">Cargando solicitudes...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <nav className="navbar navbar-expand-lg navbar-dark" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="container-fluid px-4">
          <span className="navbar-brand fw-bold">
            Sistema RRHH
          </span>
          <div className="d-flex align-items-center">
            <span className="text-white me-3">
              <span className="fw-bold">{usuario.nombre} {usuario.apellido}</span>
              <span className="badge bg-light text-dark ms-2">{usuario.rol}</span>
            </span>
            <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
              Cerrar Sesion
            </button>
          </div>
        </div>
      </nav>

      <div className="container-fluid px-4 py-4">
        {mensaje && (
          <div className={`alert alert-${mensajeTipo === 'success' ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
            {mensaje}
            <button type="button" className="btn-close" onClick={() => setMensaje('')}></button>
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-0" style={{ color: '#2d3748' }}>
              {isAdmin ? 'Panel de Administracion' : 'Mis Solicitudes'}
            </h2>
            <p className="text-muted small">
              {isAdmin ? 'Gestiona todas las solicitudes de los empleados' : 'Crea y da seguimiento a tus solicitudes'}
            </p>
          </div>
          {!isAdmin && (
            <button 
              className="btn btn-primary btn-lg rounded-3"
              onClick={() => setShowForm(!showForm)}
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              {showForm ? 'Cancelar' : 'Nueva Solicitud'}
            </button>
          )}
        </div>

        {!isAdmin && showForm && (
          <div className="card shadow-sm border-0 rounded-4 mb-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">Nueva Solicitud</h5>
              <form onSubmit={crearSolicitud}>
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label fw-semibold small">Tipo</label>
                    <select
                      className="form-select"
                      value={nuevaSolicitud.tipo}
                      onChange={(e) => setNuevaSolicitud({...nuevaSolicitud, tipo: e.target.value})}
                      required
                    >
                      <option value="vacaciones">Vacaciones</option>
                      <option value="ausencia">Ausencia</option>
                      <option value="permiso">Permiso</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold small">Fecha Inicio</label>
                    <input
                      type="date"
                      className="form-control"
                      value={nuevaSolicitud.fecha_inicio}
                      onChange={(e) => setNuevaSolicitud({...nuevaSolicitud, fecha_inicio: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold small">Fecha Fin</label>
                    <input
                      type="date"
                      className="form-control"
                      value={nuevaSolicitud.fecha_fin}
                      onChange={(e) => setNuevaSolicitud({...nuevaSolicitud, fecha_fin: e.target.value})}
                      min={nuevaSolicitud.fecha_inicio || new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold small">Descripcion</label>
                    <textarea
                      className="form-control"
                      value={nuevaSolicitud.descripcion}
                      onChange={(e) => setNuevaSolicitud({...nuevaSolicitud, descripcion: e.target.value})}
                      rows="1"
                      placeholder="Motivo de la solicitud..."
                    />
                  </div>
                </div>
                <div className="mt-3 d-flex gap-2">
                  <button type="submit" className="btn btn-primary px-4">
                    Enviar Solicitud
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>
                    Cancelar
                  </button>
                </div>
                <small className="text-muted mt-2 d-block">
                  Cupos por tipo: Vacaciones (2 personas), Ausencia (sin limite), Permiso (3 personas).
                </small>
              </form>
            </div>
          </div>
        )}

        <div className="card shadow-sm border-0 rounded-4">
          <div className="card-header bg-white border-0 pt-4 px-4">
            <h5 className="fw-bold mb-0">Lista de Solicitudes</h5>
          </div>
          <div className="card-body p-4">
            {solicitudes.length === 0 ? (
              <div className="text-center py-5">
                <div style={{ fontSize: '48px' }}></div>
                <p className="text-muted mt-2">No hay solicitudes registradas</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead style={{ backgroundColor: '#f7fafc' }}>
                    <tr>
                      {isAdmin && <th>Empleado</th>}
                      <th>Tipo</th>
                      <th>Fechas</th>
                      <th>Descripcion</th>
                      <th>Solicitado</th>
                      <th>Prioridad</th>
                      <th>Estado</th>
                      {isAdmin && <th>Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {solicitudes.map((solicitud) => (
                      <tr key={solicitud.id}>
                        {isAdmin && (
                          <td>
                            <div className="fw-semibold">
                              {solicitud.empleados?.nombre} {solicitud.empleados?.apellido}
                            </div>
                          </td>
                        )}
                        <td>
                          <span className="badge bg-light text-dark">
                            {solicitud.tipo}
                          </span>
                        </td>
                        <td>
                          <div className="small">
                            {formatFecha(solicitud.fecha_inicio)}
                            <br />
                            <span className="text-muted">→ {formatFecha(solicitud.fecha_fin)}</span>
                          </div>
                        </td>
                        <td>{solicitud.descripcion || '-'}</td>
                        <td>
                          <div className="small">
                            {formatFecha(solicitud.fecha_solicitud || solicitud.created_at)}
                            <br />
                            <span className="text-muted">
                              {formatHora(solicitud.fecha_solicitud || solicitud.created_at)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-info text-dark">
                            {getPrioridadLabel(solicitud.prioridad || 0)}
                          </span>
                        </td>
                        <td>
                          <span className={getEstadoBadge(solicitud.estado)}>
                            {solicitud.estado === 'pendiente' ? 'Pendiente' :
                             solicitud.estado === 'aprobada' ? 'Aprobada' : 'Rechazada'}
                          </span>
                          {solicitud.estado === 'rechazada' && solicitud.prioridad >= 3 && (
                            <div className="small text-danger">
                              Sin cupo disponible
                            </div>
                          )}
                        </td>
                        {isAdmin && (
                          <td>
                            {solicitud.estado === 'pendiente' && (
                              <div className="d-flex gap-1">
                                <button 
                                  className="btn btn-success btn-sm"
                                  onClick={() => actualizarEstado(solicitud.id, 'aprobada')}
                                >
                                  Aprobar
                                </button>
                                <button 
                                  className="btn btn-danger btn-sm"
                                  onClick={() => actualizarEstado(solicitud.id, 'rechazada')}
                                >
                                  Rechazar
                                </button>
                              </div>
                            )}
                            {solicitud.estado !== 'pendiente' && (
                              <span className="text-muted small">Procesada</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-muted small">
            © 2026 – Sistema de Recursos Humanos – Proyecto UNIBE
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;