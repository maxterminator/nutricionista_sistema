import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  ChevronRight 
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">
            <svg viewBox="0 0 100 100" className="max-nutri-svg">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
              <text x="50" y="65" textAnchor="middle" className="logo-m" fill="currentColor">M</text>
              <path d="M70 20 C 80 30, 80 50, 70 60" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M20 70 C 30 80, 50 80, 60 70" fill="none" stroke="currentColor" strokeWidth="2" />
              {/* Simplified leaf shapes */}
              <circle cx="80" cy="30" r="5" fill="currentColor" />
              <circle cx="20" cy="70" r="5" fill="currentColor" />
            </svg>
          </div>
          <span className="logo-text">Max Nutri</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
          <ChevronRight className="chevron" size={16} />
        </NavLink>
        
        <NavLink 
          to="/pacientes" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Users size={20} />
          <span>Pacientes</span>
          <ChevronRight className="chevron" size={16} />
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};
