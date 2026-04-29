import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Sidebar } from '../components/Sidebar';
import { 
  Users, 
  Calendar, 
  UserX, 
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { startOfWeek, endOfWeek, subDays, isBefore, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

interface Patient {
  id: string;
  nome: string;
}

interface Stats {
  totalPatients: number;
  weeklyConsultations: number;
  patientsNoReturn: Patient[];
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    weeklyConsultations: 0,
    patientsNoReturn: []
  });
  const [loading, setLoading] = useState(true);
  const [nutricionista, setNutricionista] = useState<any>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setNutricionista(user);
      
      try {
        // 1. Total Pacientes
        const { count: patientCount } = await supabase
          .from('pacientes')
          .select('*', { count: 'exact', head: true })
          .eq('nutricionista_id', user.id);

        // 2. Consultas da Semana
        const now = new Date();
        const start = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        const end = endOfWeek(now, { weekStartsOn: 1 });

        const { data: weeklyCons } = await supabase
          .from('consultas')
          .select(`
            id,
            data_consulta,
            paciente!inner(nutricionista_id)
          `)
          .eq('paciente.nutricionista_id', user.id)
          .gte('data_consulta', start.toISOString())
          .lte('data_consulta', end.toISOString());

        // 3. Pacientes sem retorno
        // Get all patients and their consultations
        const { data: patientsWithCons } = await supabase
          .from('pacientes')
          .select(`
            id,
            nome,
            consultas (
              data_consulta,
              proximo_retorno
            )
          `)
          .eq('nutricionista_id', user.id);

        const thirtyDaysAgo = subDays(now, 30);
        const withoutReturn: Patient[] = [];

        if (patientsWithCons) {
          patientsWithCons.forEach((patient: any) => {
            if (patient.consultas && patient.consultas.length > 0) {
              // Sort consultations by date desc
              const sortedCons = [...patient.consultas].sort((a, b) => 
                new Date(b.data_consulta).getTime() - new Date(a.data_consulta).getTime()
              );
              
              const lastCon = sortedCons[0];
              const lastConDate = parseISO(lastCon.data_consulta);
              const hasFutureReturn = lastCon.proximo_retorno && !isBefore(parseISO(lastCon.proximo_retorno), now);

              if (isBefore(lastConDate, thirtyDaysAgo) && !hasFutureReturn) {
                withoutReturn.push({ id: patient.id, nome: patient.nome });
              }
            }
          });
        }

        setStats({
          totalPatients: patientCount || 0,
          weeklyConsultations: weeklyCons?.length || 0,
          patientsNoReturn: withoutReturn
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    // Set up real-time subscription (simplified for demo/prompt requirements)
    const subscription = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        loadDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      
      <main className="main-content">
        <header>
          <h1>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Bem-vinda, {nutricionista?.user_metadata?.nome || nutricionista?.email}
          </p>
        </header>

        <div className="stats-grid">
          {/* Card 1 — Total de pacientes ativos */}
          <div className="stat-card">
            <div className="card-header">
              <div className="card-icon">
                <Users size={24} />
              </div>
              <span className="card-title">Pacientes Ativos</span>
            </div>
            <div className="card-value">{stats.totalPatients}</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Total de cadastros realizados
            </p>
          </div>

          {/* Card 2 — Consultas da semana */}
          <div className="stat-card">
            <div className="card-header">
              <div className="card-icon">
                <Calendar size={24} />
              </div>
              <span className="card-title">Consultas da Semana</span>
            </div>
            <div className="card-value">{stats.weeklyConsultations}</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Agendamentos para esta semana
            </p>
          </div>

          {/* Card 3 — Pacientes sem retorno */}
          <div className="stat-card">
            <div className="card-header">
              <div className="card-icon" style={{ background: stats.patientsNoReturn.length > 0 ? '#fef2f2' : 'var(--primary-light)', color: stats.patientsNoReturn.length > 0 ? 'var(--error)' : 'var(--primary)' }}>
                <UserX size={24} />
              </div>
              <span className="card-title">Pacientes sem Retorno</span>
            </div>
            
            {stats.patientsNoReturn.length > 0 ? (
              <ul className="patient-list">
                {stats.patientsNoReturn.map((p) => (
                  <li key={p.id}>
                    <Link to={`/pacientes/${p.id}`} className="patient-item">
                      <span>{p.nome}</span>
                      <ArrowUpRight size={16} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-message">
                Nenhum paciente sem retorno no momento
              </div>
            )}
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
              Última consulta há +30 dias sem retorno agendado
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="auth-page">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
