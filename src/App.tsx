/**
 * App.tsx — Punto de entrada del enrutador.
 * 
 * Configura las rutas de la aplicación y escucha
 * los eventos de conectividad (online/offline) para
 * actualizar el estado global de Zustand.
 * 
 * PRINCIPIO SOLID — SRP:
 * Solo se encarga de enrutar. No contiene lógica de negocio.
 */
import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import ProtectedRoute from './components/ProtectedRoute';
import AuthScreen from './pages/AuthScreen';
import Dashboard from './pages/Dashboard';
import ListDetails from './pages/ListDetails';
import SharedList from './pages/SharedList';

function App() {
  const { setOfflineStatus, initStore } = useStore();

  useEffect(() => {
    // Restaurar sesión de IndexedDB al arrancar
    initStore();

    // Escuchar cambios de conectividad
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
    <Routes>
      {/* Rutas públicas */}
      <Route path="/auth" element={<AuthScreen />} />
      <Route path="/compartida/:token" element={<SharedList />} />

      {/* Rutas protegidas */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lista/:id"
        element={
          <ProtectedRoute>
            <ListDetails />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
