import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AlunoSidebar() {
  const { aluno, signOut } = useAuth()

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" />
        <span className="brand-title">TREINO</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/aluno" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Meus treinos
        </NavLink>
        <NavLink to="/aluno/historico" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Histórico
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        {aluno?.nome || 'Aluno'}
        <button onClick={signOut}>Sair</button>
      </div>
    </aside>
  )
}
