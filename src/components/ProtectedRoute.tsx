/**
 * ProtectedRoute — Componente de protección de rutas.
 * 
 * PRINCIPIO SOLID — SRP:
 * Solo se encarga de verificar si hay sesión activa en Zustand.
 * Si no la hay, redirige al login. No conoce cómo funciona la auth.
 */
import { Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const session = useStore((s) => s.session);

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
