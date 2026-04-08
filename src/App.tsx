import { useEffect } from 'react'
import { useStore } from './store/useStore'
import { ScanBarcode } from 'lucide-react'
import './App.css'

function App() {
  const { isOffline, setOfflineStatus, initStore, session } = useStore()

  useEffect(() => {
    initStore();

    const handleOnline = () => setOfflineStatus(false);
    const handleOffline = () => setOfflineStatus(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [initStore, setOfflineStatus]);

  return (
    <div className="container">
      <header className="header">
        <h1>
          ⚡ Compra<span style={{color: 'var(--primary)'}}>Flash</span>
        </h1>
        {isOffline && <span className="offline-badge">Offline Mode</span>}
      </header>

      <main className="glass-panel">
        <h2>Bienvenido a tu PWA</h2>
        <p style={{margin: '1rem 0'}}>Esta es la estructura base con Zustand, IndexedDB y Vanilla CSS funcionando.</p>

        {!session ? (
            <button className="btn-primary" style={{marginRight: '1rem', marginBottom: '1rem'}}>
              Iniciar Sesión con Google
            </button>
        ) : (
            <div style={{marginBottom: '1rem'}}>
              Hola, {session.displayName}!
            </div>
        )}

        <button className="btn-primary" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <ScanBarcode size={20} />
          Probar Escáner de Código
        </button>
      </main>
    </div>
  )
}

export default App
