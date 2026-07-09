import { useState } from 'react';
import { useApp } from '../context/AppContext';
import './Login.css';

export default function Login() {
  const { login } = useApp();
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(rut, password);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-bg-effects">
        <div className="login-orb login-orb-1"></div>
        <div className="login-orb login-orb-2"></div>
        <div className="login-orb login-orb-3"></div>
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <div className="login-logo-icon">⚙️</div>
              <h1 className="login-title">Sermac Diesel</h1>
              <p className="login-subtitle">Bosch Diesel Center</p>
            </div>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="rut">RUT (sin puntos ni guión)</label>
              <div className="login-input-wrapper">
                <span className="login-input-icon">👤</span>
                <input
                  id="rut"
                  type="text"
                  className="input input-lg"
                  placeholder="Ej: 123456789"
                  value={rut}
                  onChange={(e) => setRut(e.target.value.replace(/[^0-9kK]/g, ''))}
                  autoComplete="username"
                  style={{ paddingLeft: '48px' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="password">Contraseña</label>
              <div className="login-input-wrapper">
                <span className="login-input-icon">🔒</span>
                <input
                  id="password"
                  type="password"
                  className="input input-lg"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingLeft: '48px' }}
                />
              </div>
            </div>

            {error && (
              <div className="login-error">
                <span>⚠️</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={loading || !rut || !password}
            >
              {loading ? (
                <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>Sistema de Gestión de Taller v1.0</p>
          </div>
        </div>

        <div className="login-demo-info">
          <p><strong>Demo:</strong> Admin RUT: 123456789 / Pass: admin123</p>
          <p>Mecánico RUT: 111222333 / Pass: mec123</p>
        </div>
      </div>
    </div>
  );
}
