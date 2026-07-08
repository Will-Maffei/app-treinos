import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
  const { personal, signOut } = useAuth()

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" />
        <span className="brand-title">TREINO</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Alunos
        </NavLink>
        <NavLink to="/exercicios" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Banco de exercícios
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        {personal?.nome || 'Personal'}
        <button onClick={signOut}>Sair</button>
      </div>
    </aside>
  )
}
