/**
 * ListDetails — Vista de detalle de una lista individual.
 * 
 * Funcionalidades completas según especificaciones:
 * - Checkboxes interactivos para marcar comprado
 * - Agregar ítems manual o por escáner
 * - Editar nombre de la lista
 * - Toggle de edición colaborativa (allowEdit)
 * - Copiar link para compartir (shareToken)
 * - Total estimado en tiempo real
 * - Guardar producto no encontrado en catálogo personal
 */
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  obtenerLista, agregarItem, actualizarItem, eliminarItem,
  actualizarLista, buscarPorBarcode, crearProductoPersonal,
  type ListaDetalleResponse, type ItemResponse
} from '../lib/api';
import BarcodeScanner from '../components/BarcodeScanner';
import { 
  ArrowLeft, Plus, ScanBarcode, Trash2, Check, 
  Loader2, ShoppingBag, Share2, Users, Edit3,
  Save, X, CheckCircle
} from 'lucide-react';
import './ListDetails.css';

export default function ListDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lista, setLista] = useState<ListaDetalleResponse | null>(null);
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Editar nombre
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Modal agregar ítem
  const [showAddModal, setShowAddModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaCantidad, setNuevaCantidad] = useState('1');
  const [nuevaUnidad, setNuevaUnidad] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [nuevoBarcode, setNuevoBarcode] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [guardarProducto, setGuardarProducto] = useState(false);

  // Escáner
  const [showScanner, setShowScanner] = useState(false);

  // Feedback toast
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (id) cargarLista();
  }, [id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

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

  // ═══════════ Editar nombre de lista ═══════════
  const handleStartEdit = () => {
    setEditedName(lista?.nombre || '');
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || !id) return;
    try {
      await actualizarLista(id, { nombre: editedName.trim() });
      setLista((prev) => prev ? { ...prev, nombre: editedName.trim() } : prev);
      setEditingName(false);
      showToast('Nombre actualizado');
    } catch (err) {
      console.error('Error actualizando nombre:', err);
    }
  };

  // ═══════════ Toggle edición colaborativa ═══════════
  const handleToggleAllowEdit = async () => {
    if (!id || !lista) return;
    try {
      await actualizarLista(id, { allowEdit: !lista.allowEdit });
      setLista((prev) => prev ? { ...prev, allowEdit: !prev.allowEdit } : prev);
      showToast(lista.allowEdit ? 'Edición colaborativa desactivada' : 'Edición colaborativa activada');
    } catch (err) {
      console.error('Error cambiando permisos:', err);
    }
  };

  // ═══════════ Compartir link ═══════════
  const handleShare = async () => {
    if (!lista) return;
    const shareUrl = `${window.location.origin}/compartida/${lista.shareToken}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('¡Link copiado al portapapeles!');
    } catch {
      // Fallback para navegadores que no soporten clipboard API
      showToast(`Link: ${shareUrl}`);
    }
  };

  // ═══════════ Agregar ítem ═══════════
  const handleAgregarItem = async () => {
    if (!nuevoNombre.trim() || !id) return;
    setAgregando(true);
    try {
      const nuevo = await agregarItem(id, {
        nombre: nuevoNombre.trim(),
        cantidad: parseInt(nuevaCantidad) || 1,
        unidad: nuevaUnidad.trim() || undefined,
        precio: nuevoPrecio ? parseFloat(nuevoPrecio) : undefined,
        barcode: nuevoBarcode || undefined,
      });
      setItems((prev) => [...prev, nuevo]);

      // Si el usuario quiere guardar el producto para uso futuro
      if (guardarProducto && nuevoBarcode) {
        try {
          await crearProductoPersonal({
            nombre: nuevoNombre.trim(),
            barcode: nuevoBarcode,
            unidad: nuevaUnidad.trim() || undefined,
            precio: nuevoPrecio ? parseFloat(nuevoPrecio) : undefined,
          });
          showToast('Producto guardado en tu catálogo personal');
        } catch {
          // No es crítico si falla
        }
      }

      // Limpiar formulario
      setNuevoNombre('');
      setNuevaCantidad('1');
      setNuevaUnidad('');
      setNuevoPrecio('');
      setNuevoBarcode('');
      setGuardarProducto(false);
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
    setNuevoBarcode(code);
    try {
      const productos = await buscarPorBarcode(code);
      if (productos.length > 0) {
        const p = productos[0];
        setNuevoNombre(p.nombre);
        setNuevoPrecio(p.precioEstimado?.toString() || '');
        setNuevaUnidad(p.unidad || '');
        setGuardarProducto(false);
        showToast(`Producto encontrado: ${p.nombre}`);
      } else {
        setNuevoNombre('');
        setGuardarProducto(true); // Sugerir guardar
        showToast('Producto no encontrado. Ingresa los datos manualmente.');
      }
      setShowAddModal(true);
    } catch (err) {
      console.error('Error buscando por barcode:', err);
      setNuevoNombre('');
      setGuardarProducto(true);
      setShowAddModal(true);
    }
  }, []);

  // Cálculo del total estimado
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
      {/* Toast de feedback */}
      {toast && (
        <div className="toast">
          <CheckCircle size={16} />
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="detail-header">
        <button className="btn-icon" onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>

        {editingName ? (
          <div className="edit-name-row">
            <input
              type="text"
              className="input-field edit-name-input"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              autoFocus
            />
            <button className="btn-icon" onClick={handleSaveName}><Save size={18} /></button>
            <button className="btn-icon" onClick={() => setEditingName(false)}><X size={18} /></button>
          </div>
        ) : (
          <h1 className="detail-title" onClick={handleStartEdit} title="Click para editar nombre">
            {lista?.nombre || 'Lista'}
            <Edit3 size={14} className="edit-icon" />
          </h1>
        )}

        <div style={{ width: 40 }} />
      </header>

      {/* Barra de acciones de la lista */}
      <div className="list-actions-bar">
        <button
          className={`action-chip ${lista?.allowEdit ? 'active' : ''}`}
          onClick={handleToggleAllowEdit}
          title={lista?.allowEdit ? 'Desactivar edición colaborativa' : 'Activar edición colaborativa'}
        >
          <Users size={14} />
          {lista?.allowEdit ? 'Colaborativa ON' : 'Colaborativa OFF'}
        </button>
        <button className="action-chip" onClick={handleShare}>
          <Share2 size={14} />
          Compartir
        </button>
      </div>

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
          onClick={() => { setNuevoBarcode(''); setGuardarProducto(false); setShowAddModal(true); }}
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
            {nuevoBarcode && (
              <p className="barcode-hint">Código: <code>{nuevoBarcode}</code></p>
            )}
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

              {/* Opción de guardar producto en catálogo personal */}
              {nuevoBarcode && (
                <label className="save-product-toggle">
                  <input
                    type="checkbox"
                    checked={guardarProducto}
                    onChange={(e) => setGuardarProducto(e.target.checked)}
                  />
                  <span>Guardar este producto en mi catálogo personal</span>
                </label>
              )}
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
