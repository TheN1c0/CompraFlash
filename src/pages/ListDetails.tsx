/**
 * ListDetails — Vista de detalle de una lista individual.
 * 
 * Muestra todos los ítems de la lista con checkboxes interactivos,
 * permite agregar nuevos ítems (manual o por escáner de barras),
 * y calcula el total estimado en tiempo real.
 * 
 * PRINCIPIO SOLID — SRP: 
 * La vista gestiona la UI. Las llamadas al backend van por api.ts.
 * El componente BarcodeScanner se aísla en su propio módulo.
 */
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  obtenerLista, agregarItem, actualizarItem, eliminarItem,
  buscarPorBarcode,
  type ListaDetalleResponse, type ItemResponse
} from '../lib/api';
import BarcodeScanner from '../components/BarcodeScanner';
import { 
  ArrowLeft, Plus, ScanBarcode, Trash2, Check, 
  Loader2, ShoppingBag
} from 'lucide-react';
import './ListDetails.css';

export default function ListDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lista, setLista] = useState<ListaDetalleResponse | null>(null);
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado del modal de agregar ítem
  const [showAddModal, setShowAddModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaCantidad, setNuevaCantidad] = useState('1');
  const [nuevaUnidad, setNuevaUnidad] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [agregando, setAgregando] = useState(false);

  // Estado del escáner
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (id) cargarLista();
  }, [id]);

  const cargarLista = async () => {
    setLoading(true);
    try {
      const data = await obtenerLista(id!);
      setLista(data);
      setItems(data.items || []);
    } catch (err) {
      console.error('Error cargando lista:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarItem = async () => {
    if (!nuevoNombre.trim() || !id) return;
    setAgregando(true);
    try {
      const nuevo = await agregarItem(id, {
        nombre: nuevoNombre.trim(),
        cantidad: parseInt(nuevaCantidad) || 1,
        unidad: nuevaUnidad.trim() || undefined,
        precio: nuevoPrecio ? parseFloat(nuevoPrecio) : undefined,
      });
      setItems((prev) => [...prev, nuevo]);
      // Limpiar formulario
      setNuevoNombre('');
      setNuevaCantidad('1');
      setNuevaUnidad('');
      setNuevoPrecio('');
      setShowAddModal(false);
    } catch (err) {
      console.error('Error agregando ítem:', err);
    } finally {
      setAgregando(false);
    }
  };

  const handleToggleComprado = async (item: ItemResponse) => {
    try {
      const updated = await actualizarItem(item.id, {
        comprado: !item.comprado,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? updated : i))
      );
    } catch (err) {
      console.error('Error actualizando ítem:', err);
    }
  };

  const handleEliminarItem = async (itemId: string) => {
    try {
      await eliminarItem(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error('Error eliminando ítem:', err);
    }
  };

  const handleBarcodeDetected = useCallback(async (code: string) => {
    setShowScanner(false);
    try {
      const productos = await buscarPorBarcode(code);
      if (productos.length > 0) {
        const p = productos[0];
        setNuevoNombre(p.nombre);
        setNuevoPrecio(p.precioEstimado?.toString() || '');
        setNuevaUnidad(p.unidad || '');
        setShowAddModal(true);
      } else {
        setNuevoNombre(`Producto (${code})`);
        setShowAddModal(true);
      }
    } catch (err) {
      console.error('Error buscando por barcode:', err);
      setNuevoNombre(`Producto (${code})`);
      setShowAddModal(true);
    }
  }, []);

  // Cálculo del total estimado en tiempo real
  const totalEstimado = items.reduce((sum, item) => {
    return sum + (item.subtotal || 0);
  }, 0);

  const itemsPendientes = items.filter((i) => !i.comprado).length;
  const itemsComprados = items.filter((i) => i.comprado).length;

  if (loading) {
    return (
      <div className="container">
        <div className="dash-loading">
          <Loader2 size={32} className="spin" />
          <p>Cargando lista...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <header className="detail-header">
        <button className="btn-icon" onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="detail-title">{lista?.nombre || 'Lista'}</h1>
        <div style={{ width: 40 }} />
      </header>

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

      {/* Botones de acción */}
      <div className="detail-actions">
        <button
          className="btn-primary"
          style={{ flex: 1 }}
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={20} /> Agregar Ítem
        </button>
        <button
          className="btn-scanner"
          onClick={() => setShowScanner(true)}
          title="Escanear código de barras"
        >
          <ScanBarcode size={22} />
        </button>
      </div>

      {/* Lista de ítems */}
      {items.length === 0 ? (
        <div className="dash-empty">
          <ShoppingBag size={48} />
          <p>Lista vacía</p>
          <p className="dash-empty-sub">
            Agrega ítems manualmente o escaneando un código de barras.
          </p>
        </div>
      ) : (
        <div className="items-list">
          {items.map((item) => (
            <div
              key={item.id}
              className={`item-row ${item.comprado ? 'item-done' : ''}`}
            >
              <button
                className={`item-check ${item.comprado ? 'checked' : ''}`}
                onClick={() => handleToggleComprado(item)}
              >
                {item.comprado && <Check size={14} />}
              </button>

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

              <button
                className="btn-icon btn-danger"
                onClick={() => handleEliminarItem(item.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal agregar ítem */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Agregar Ítem</h2>
            <div className="add-form">
              <input
                type="text"
                className="input-field"
                placeholder="Nombre del producto..."
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                autoFocus
              />
              <div className="add-form-row">
                <div className="input-group">
                  <label className="input-label">Cantidad</label>
                  <input
                    type="number"
                    className="input-field input-sm"
                    placeholder="1"
                    value={nuevaCantidad}
                    onChange={(e) => setNuevaCantidad(e.target.value)}
                    min="1"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Unidad</label>
                  <select
                    className="input-field input-sm"
                    value={nuevaUnidad}
                    onChange={(e) => setNuevaUnidad(e.target.value)}
                  >
                    <option value="">un</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lt">lt</option>
                    <option value="ml">ml</option>
                    <option value="paq">paq</option>
                    <option value="caja">caja</option>
                    <option value="botella">botella</option>
                    <option value="docena">docena</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Precio $</label>
                  <input
                    type="number"
                    className="input-field input-sm"
                    placeholder="0"
                    value={nuevoPrecio}
                    onChange={(e) => setNuevoPrecio(e.target.value)}
                    min="0"
                  />
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowAddModal(false)}>
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={handleAgregarItem}
                disabled={agregando || !nuevoNombre.trim()}
              >
                {agregando ? <Loader2 size={18} className="spin" /> : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escáner */}
      {showScanner && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
