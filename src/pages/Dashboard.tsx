/**
 * Dashboard — Pantalla principal post-login.
 * 
 * Muestra las listas de compra del usuario autenticado.
 * Permite crear nuevas listas y navegar hacia los detalles de cada una.
 * 
 * PRINCIPIO SOLID — SRP:
 * Solo orquesta la vista del Dashboard.
 * Las llamadas API las delega a `api.ts`.
 * El estado vivo lo delega a Zustand.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { obtenerListas, crearLista, eliminarLista, type ListaResponse } from '../lib/api';
import { Plus, Trash2, ShoppingCart, LogOut, Zap, Loader2, WifiOff } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const session = useStore((s) => s.session);
  const isOffline = useStore((s) => s.isOffline);
  const logout = useStore((s) => s.logout);
  const navigate = useNavigate();

  const [listas, setListas] = useState<ListaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [nuevaListaNombre, setNuevaListaNombre] = useState('');
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    cargarListas();
  }, []);

  const cargarListas = async () => {
    setLoading(true);
    try {
      const data = await obtenerListas();
      setListas(data);
    } catch (err) {
      console.error('Error cargando listas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearLista = async () => {
    if (!nuevaListaNombre.trim()) return;
    setCreando(true);
    try {
      const nueva = await crearLista(nuevaListaNombre.trim());
      setListas((prev) => [nueva, ...prev]);
      setNuevaListaNombre('');
      setShowModal(false);
    } catch (err) {
      console.error('Error creando lista:', err);
    } finally {
      setCreando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    try {
      await eliminarLista(id);
      setListas((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error('Error eliminando lista:', err);
    }
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('compraflash_token');
    await logout();
    navigate('/auth');
  };

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <h1 className="dash-brand">
          <Zap size={24} color="var(--primary)" />
          Compra<span style={{ color: 'var(--primary)' }}>Flash</span>
        </h1>
        <div className="header-actions">
          {isOffline && (
            <span className="offline-badge">
              <WifiOff size={12} /> Offline
            </span>
          )}
          <button className="btn-icon" onClick={handleLogout} title="Cerrar sesión">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Saludo */}
      <div className="dash-greeting">
        <p>Hola, <strong>{session?.displayName || 'Invitado'}</strong> 👋</p>
        <p className="dash-greeting-sub">
          {listas.length === 0
            ? 'Crea tu primera lista de compras'
            : `Tienes ${listas.length} lista${listas.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Botón crear lista */}
      <button className="btn-primary btn-full" onClick={() => setShowModal(true)}>
        <Plus size={20} />
        Nueva Lista
      </button>

      {/* Grid de listas */}
      {loading ? (
        <div className="dash-loading">
          <Loader2 size={32} className="spin" />
          <p>Cargando tus listas...</p>
        </div>
      ) : listas.length === 0 ? (
        <div className="dash-empty">
          <ShoppingCart size={48} />
          <p>No tienes listas aún</p>
          <p className="dash-empty-sub">
            Toca el botón de arriba para crear tu primera lista de compras.
          </p>
        </div>
      ) : (
        <div className="listas-grid">
          {listas.map((lista) => (
            <div
              key={lista.id}
              className="glass-panel lista-card"
              onClick={() => navigate(`/lista/${lista.id}`)}
            >
              <div className="lista-card-header">
                <h3>{lista.nombre}</h3>
                <button
                  className="btn-icon btn-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEliminar(lista.id);
                  }}
                  title="Eliminar lista"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="lista-card-meta">
                <span>{lista.cantidadItems || 0} ítems</span>
                <span className="lista-total">
                  ${lista.totalEstimado?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear lista */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva Lista</h2>
            <input
              type="text"
              className="input-field"
              placeholder="Nombre de la lista..."
              value={nuevaListaNombre}
              onChange={(e) => setNuevaListaNombre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCrearLista()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={handleCrearLista}
                disabled={creando || !nuevaListaNombre.trim()}
              >
                {creando ? <Loader2 size={18} className="spin" /> : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
