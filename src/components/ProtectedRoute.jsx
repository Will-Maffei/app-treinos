import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// role: 'personal' | 'aluno' — define quem pode acessar essa rota
export default function ProtectedRoute({ role, children }) {
  const { session, role: currentRole, loading } = useAuth()

  if (loading) {
    return <div className="loading-line">Carregando...</div>
  }

  if (!session) {
    return <Navigate to={role === 'aluno' ? '/aluno/login' : '/login'} replace />
  }

  if (currentRole !== role) {
    // Logado, mas no papel errado (ex: aluno tentando acessar área do personal)
    return <Navigate to={currentRole === 'aluno' ? '/aluno' : '/login'} replace />
  }

  return children
}
