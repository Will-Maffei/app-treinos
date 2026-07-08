import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AlunoDetail from './pages/AlunoDetail'
import TreinoEditor from './pages/TreinoEditor'
import ExecucaoTreino from './pages/ExecucaoTreino'
import Exercicios from './pages/Exercicios'

function Layout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/alunos/:id"
            element={
              <ProtectedRoute>
                <Layout><AlunoDetail /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/treinos/:id"
            element={
              <ProtectedRoute>
                <Layout><TreinoEditor /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/execucoes/:id"
            element={
              <ProtectedRoute>
                <Layout><ExecucaoTreino /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/exercicios"
            element={
              <ProtectedRoute>
                <Layout><Exercicios /></Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
