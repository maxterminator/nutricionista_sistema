import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { supabase } from '../lib/supabaseClient';
import { ChevronLeft, User, Calendar, Target } from 'lucide-react';

const PatientProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (data) setPatient(data);
      setLoading(false);
    };
    fetchPatient();
  }, [id]);

  if (loading) return <div className="dashboard-layout"><Sidebar /><main className="main-content">Carregando...</main></div>;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: '2rem' }}>
          <button onClick={() => navigate('/pacientes')} className="btn" style={{ width: 'auto', padding: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', color: 'var(--text-muted)' }}>
            <ChevronLeft size={18} />
            Voltar para listagem
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={40} />
            </div>
            <div>
              <h1>{patient?.nome}</h1>
              <p style={{ color: 'var(--text-muted)' }}>Perfil do Paciente</p>
            </div>
          </div>
        </header>

        <div className="form-grid">
          <div className="form-section">
            <h3 className="form-section-title">Informações Rápidas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} color="var(--primary)" />
                <span>Nascimento: {patient?.data_nascimento || 'Não informado'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={18} color="var(--primary)" />
                <span>Objetivo: {patient?.objetivos?.[0] || 'Não definido'}</span>
              </div>
            </div>
          </div>
          {/* Detailed sections would go here in the next prompt */}
          <div className="form-section" style={{ gridColumn: 'span 2' }}>
            <h3 className="form-section-title">Histórico de Consultas</h3>
            <p style={{ color: 'var(--text-muted)' }}>Nenhuma consulta registrada ainda.</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem', width: 'auto' }}>
              Registrar Primeira Consulta
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientProfile;
