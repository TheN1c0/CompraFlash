/**
 * SharedList — Vista pública de una lista compartida.
 * 
 * Accesible por cualquiera mediante el shareToken (sin autenticación).
 * Corresponde al endpoint GET /api/compartida/{token}.
 * 
 * RF-05: Cualquiera con el link puede ver la lista (solo lectura).
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { obtenerListaCompartida, type ListaDetalleResponse } from '../lib/api';
import { Loader2, ShoppingBag, Check, Zap, Eye } from 'lucide-react';
import './SharedList.css';

export default function SharedList() {
  const { token } = useParams<{ token: string }>();
  const [lista, setLista] = useState<ListaDetalleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) cargarLista();
  }, [token]);

  const cargarLista = async () => {
    setLoading(true);
    try {
      const data = await obtenerListaCompartida(token!);
      setLista(data);
    } catch (err) {
      console.error('Error cargando lista compartida:', err);
      setError('No se encontró la lista o el enlace ya no es válido.');
    } finally {
      setLoading(false);
    }
  };

  const totalEstimado = lista?.items?.reduce((sum, item) => {
    return sum + (item.subtotal || 0);
  }, 0) || 0;

  const itemsPendientes = lista?.items?.filter((i) => !i.comprado).length || 0;
  const itemsComprados = lista?.items?.filter((i) => i.comprado).length || 0;

  if (loading) {
    return (
      <div className="container">
        <div className="dash-loading">
          <Loader2 size={32} className="spin" />
          <p>Cargando lista compartida...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="shared-error">
          <ShoppingBag size={48} />
          <h2>Lista no encontrada</h2>
          <p>{error}</p>
          <a href="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>
            Ir a CompraFlash
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="shared-header">
        <div className="shared-brand">
          <Zap size={20} color="var(--primary)" />
          Compra<span style={{ color: 'var(--primary)' }}>Flash</span>
        </div>
        <span className="shared-badge">
          <Eye size={12} /> Solo lectura
        </span>
      </header>

      <h1 className="shared-title">{lista?.nombre}</h1>

      {/* Resumen */}
      <div className="detail-summary glass-panel">
        <div className="summary-stat">
          <span className="summary-number">{itemsPendientes}</span>
          <span className="summary-label">pendientes</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-stat">
          <span className="summary-number">{itemsComprados}</span>
          <span className="summary-label">comprados</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-stat">
          <span className="summary-number summary-price">
            ${totalEstimado.toLocaleString()}
          </span>
          <span className="summary-label">estimado</span>
        </div>
      </div>

      {/* Ítems (solo lectura) */}
      {(!lista?.items || lista.items.length === 0) ? (
        <div className="dash-empty">
          <ShoppingBag size={48} />
          <p>La lista está vacía</p>
        </div>
      ) : (
        <div className="items-list">
          {lista.items.map((item) => (
            <div
              key={item.id}
              className={`item-row ${item.comprado ? 'item-done' : ''}`}
            >
              <div className={`item-check ${item.comprado ? 'checked' : ''}`}>
                {item.comprado && <Check size={14} />}
              </div>
              <div className="item-info">
                <span className="item-name">{item.nombre}</span>
                <span className="item-meta">
                  {item.cantidad} {item.unidad || 'un'}
                  {item.precio != null && (
                    <> · <span className="item-price">${item.precio.toLocaleString()}</span> c/u</>
                  )}
                  {item.subtotal != null && item.subtotal > 0 && (
                    <> = <strong>${item.subtotal.toLocaleString()}</strong></>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="shared-cta">
        <p>¿Quieres crear tu propia lista?</p>
        <a href="/auth" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
          Empezar con CompraFlash
        </a>
      </div>
    </div>
  );
}
