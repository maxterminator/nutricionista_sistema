import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { supabase } from '../lib/supabaseClient';
import { 
  Plus, 
  Search, 
  User, 
  ChevronRight,
  Filter,
  Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Patient {
  id: string;
  nome: string;
  objetivos: string[];
  objetivo_texto: string;
  ultima_consulta?: string;
}

const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select(`
          id,
          nome,
          objetivos,
          objetivo_texto,
          consultas (
            data_consulta
          )
        `)
        .eq('nutricionista_id', user.id)
        .order('nome');

      if (error) throw error;

      const formattedPatients = data.map((p: any) => {
        const lastCon = p.consultas && p.consultas.length > 0
          ? [...p.consultas].sort((a, b) => 
              new Date(b.data_consulta).getTime() - new Date(a.data_consulta).getTime()
            )[0].data_consulta
          : undefined;

        return {
          ...p,
          ultima_consulta: lastCon
        };
      });

      setPatients(formattedPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="patient-list-header">
          <div>
            <h1>Pacientes</h1>
            <p style={{ color: 'var(--text-muted)' }}>Gerencie sua base de pacientes</p>
          </div>
          <Link to="/pacientes/novo" className="btn btn-primary" style={{ width: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Plus size={20} />
            Novo Paciente
          </Link>
        </header>

        <div className="search-container" style={{ marginBottom: '2rem' }}>
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader2 className="animate-spin" size={40} color="var(--primary)" />
          </div>
        ) : filteredPatients.length > 0 ? (
          <div className="patient-table-container">
            <table className="patient-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Objetivo</th>
                  <th>Última Consulta</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr 
                    key={patient.id} 
                    className="patient-row"
                    onClick={() => navigate(`/pacientes/${patient.id}`)}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={16} />
                        </div>
                        <span className="patient-name">{patient.nome}</span>
                      </div>
                    </td>
                    <td>
                      {patient.objetivos && patient.objetivos.length > 0 ? (
                        <span className="objective-badge">{patient.objetivos[0]}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Não definido</span>
                      )}
                    </td>
                    <td>
                      {patient.ultima_consulta ? (
                        format(parseISO(patient.ultima_consulta), "dd 'de' MMMM, yyyy", { locale: ptBR })
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Sem consultas</span>
                      )}
                    </td>
                    <td>
                      <ChevronRight size={18} color="var(--text-muted)" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-message" style={{ background: 'white', borderRadius: '1rem', border: '1px solid var(--border)' }}>
            <div style={{ marginBottom: '1rem', opacity: 0.5 }}>
              <User size={48} style={{ margin: '0 auto' }} />
            </div>
            <p>{searchTerm ? 'Nenhum paciente encontrado para esta busca.' : 'Nenhum paciente cadastrado ainda.'}</p>
            {!searchTerm && (
              <Link to="/pacientes/novo" style={{ color: 'var(--primary)', fontWeight: '600', marginTop: '1rem', display: 'inline-block' }}>
                Cadastrar o primeiro paciente
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Patients;
