import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import AlunoSidebar from './components/AlunoSidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PersonalDashboard from './pages/PersonalDashboard'
import AlunoDetail from './pages/AlunoDetail'
import TreinoEditor from './pages/TreinoEditor'
import ExecucaoTreino from './pages/ExecucaoTreino'
import Exercicios from './pages/Exercicios'
import AlunoLogin from './pages/AlunoLogin'
import AlunoCadastro from './pages/AlunoCadastro'
import AlunoDashboard from './pages/AlunoDashboard'
import AlunoTreinoDetail from './pages/AlunoTreinoDetail'
import AlunoHistorico from './pages/AlunoHistorico'

function Layout({ children, aluno = false }) {
  return (
    <div className="app-shell">
      {aluno ? <AlunoSidebar /> : <Sidebar />}
      <main className="main-content">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ---------- Área do personal ---------- */}
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute role="personal">
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="personal">
                <Layout><PersonalDashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/alunos/:id"
            element={
              <ProtectedRoute role="personal">
                <Layout><AlunoDetail /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/treinos/:id"
            element={
              <ProtectedRoute role="personal">
                <Layout><TreinoEditor /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/execucoes/:id"
            element={
              <ProtectedRoute role="personal">
                <Layout><ExecucaoTreino basePath="/treinos" /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/exercicios"
            element={
              <ProtectedRoute role="personal">
                <Layout><Exercicios /></Layout>
              </ProtectedRoute>
            }
          />

          {/* ---------- Portal do aluno ---------- */}
          <Route path="/aluno/login" element={<AlunoLogin />} />
          <Route path="/aluno/cadastro" element={<AlunoCadastro />} />

          <Route
            path="/aluno"
            element={
              <ProtectedRoute role="aluno">
                <Layout aluno><AlunoDashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/aluno/historico"
            element={
              <ProtectedRoute role="aluno">
                <Layout aluno><AlunoHistorico /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/aluno/treinos/:id"
            element={
              <ProtectedRoute role="aluno">
                <Layout aluno><AlunoTreinoDetail /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/aluno/execucoes/:id"
            element={
              <ProtectedRoute role="aluno">
                <Layout aluno><ExecucaoTreino basePath="/aluno/treinos" /></Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
