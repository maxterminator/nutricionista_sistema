import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { supabase } from '../lib/supabaseClient';
import { 
  ChevronLeft, 
  User, 
  Calendar, 
  Target, 
  Plus, 
  Activity, 
  Clock, 
  FileText, 
  Save, 
  Check, 
  AlertCircle,
  Loader2,
  X,
  History,
  TrendingUp,
  Sparkles,
  Coffee,
  Sun,
  Utensils,
  Moon,
  Trash2
} from 'lucide-react';
import { format, parseISO, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { z } from 'zod';

// Schema para validação dos dados do plano
const RefeicaoSchema = z.array(z.string().min(1)).length(5);
const MealPlanSchema = z.object({
  plano_semanal: z.array(
    z.object({
      dia: z.string().min(1),
      refeicoes: z.object({
        cafe_da_manha: RefeicaoSchema,
        lanche_manha: RefeicaoSchema,
        almoco: RefeicaoSchema,
        lanche_tarde: RefeicaoSchema,
        jantar: RefeicaoSchema,
      })
    })
  ).length(7)
});
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const PatientProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Tabs state
  const [mainTab, setMainTab] = useState<'dados' | 'consultas' | 'planos'>('dados');
  const [dataTab, setDataTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');
  
  // Data state
  const [patient, setPatient] = useState<any>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // AI Plan state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [viewingPlan, setViewingPlan] = useState<any>(null);

  // Form states
  const [editPatient, setEditPatient] = useState<any>(null);
  const [newConsultation, setNewConsultation] = useState({
    data_consulta: format(new Date(), 'yyyy-MM-dd'),
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: ''
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [patientRes, consultationsRes, plansRes] = await Promise.all([
        supabase.from('pacientes').select('*').eq('id', id).single(),
        supabase.from('consultas').select('*').eq('paciente_id', id).order('data_consulta', { ascending: false }),
        supabase.from('planos_alimentares').select('*').eq('paciente_id', id).order('created_at', { ascending: false })
      ]);

      if (patientRes.data) {
        setPatient(patientRes.data);
        setEditPatient(patientRes.data);
      }
      if (consultationsRes.data) setConsultations(consultationsRes.data);
      if (plansRes.data) setMealPlans(plansRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSave = async () => {
    setSaveLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('pacientes')
        .update(editPatient)
        .eq('id', id);

      if (error) throw error;
      
      setPatient(editPatient);
      setMessage({ type: 'success', text: 'Dados salvos com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao salvar alterações.' });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleConsultationSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const payload = {
        ...newConsultation,
        paciente_id: id,
        peso: newConsultation.peso ? parseFloat(newConsultation.peso) : null,
        cintura: newConsultation.cintura ? parseFloat(newConsultation.cintura) : null,
        quadril: newConsultation.quadril ? parseFloat(newConsultation.quadril) : null,
        percentual_gordura: newConsultation.percentual_gordura ? parseFloat(newConsultation.percentual_gordura) : null,
      };

      const { error } = await supabase.from('consultas').insert([payload]);
      if (error) throw error;

      setShowModal(false);
      setNewConsultation({
        data_consulta: format(new Date(), 'yyyy-MM-dd'),
        peso: '',
        cintura: '',
        quadril: '',
        percentual_gordura: '',
        observacoes: '',
        proximo_retorno: ''
      });
      fetchData();
    } catch (err: any) {
      alert('Erro ao salvar consulta: ' + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setMessage(null);
    setViewingPlan(null);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-plano', {
        body: { paciente: patient }
      });

      if (error) throw error;
      setGeneratedPlan(data.plano_semanal);
    } catch (err: any) {
      console.error('Error generating plan:', err);
      let errorMessage = err.message;
      
      // Se for um erro da Edge Function, tentamos ler a mensagem do corpo da resposta
      if (err.context && typeof err.context.json === 'function') {
        try {
          const body = await err.context.json();
          errorMessage = body.error || errorMessage;
        } catch (e) {
          // Ignora se não conseguir parsear o JSON
        }
      }
      
      setMessage({ type: 'error', text: 'Erro ao gerar plano alimentar: ' + errorMessage });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePlan = async () => {
    setSaveLoading(true);
    try {
      const { error } = await supabase.from('planos_alimentares').insert([
        {
          paciente_id: id,
          conteudo: { plano_semanal: generatedPlan }
        }
      ]);

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Plano alimentar salvo com sucesso!' });
      setGeneratedPlan(null);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erro ao salvar plano: ' + err.message });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEditMeal = (dayIndex: number, mealKey: string, optionIndex: number, value: string) => {
    const newPlan = [...generatedPlan];
    newPlan[dayIndex].refeicoes[mealKey][optionIndex] = value;
    setGeneratedPlan(newPlan);
  };

  const handleViewPlan = (plan: any) => {
    // Validar os dados antes de exibir
    const validation = MealPlanSchema.safeParse(plan.conteudo);
    if (validation.success) {
      setViewingPlan(validation.data.plano_semanal);
      setGeneratedPlan(null);
      // Rolar para cima para ver o plano
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      console.error('Plano histórico inválido:', validation.error);
      alert('Este plano histórico possui um formato inválido e não pode ser exibido.');
    }
  };

  const handleMultiSelect = (name: string, value: string) => {
    setEditPatient((prev: any) => {
      const current = (prev as any)[name] as string[] || [];
      if (value === 'Nenhum') return { ...prev, [name]: ['Nenhum'] };
      
      let next = current.includes(value) 
        ? current.filter(item => item !== value)
        : [...current.filter(item => item !== 'Nenhum'), value];
      
      return { ...prev, [name]: next };
    });
  };

  const chartData = useMemo(() => {
    if (!consultations.length && !patient) return [];
    
    // Combine initial weight with consultation history
    const data = [...consultations]
      .reverse()
      .map(c => ({
        data: format(parseISO(c.data_consulta), 'dd/MM'),
        peso: parseFloat(c.peso)
      }));

    if (patient?.peso_inicial) {
      data.unshift({
        data: 'Inicial',
        peso: parseFloat(patient.peso_inicial)
      });
    }
    
    return data;
  }, [consultations, patient]);

  const idade = useMemo(() => {
    if (!patient?.data_nascimento) return null;
    return differenceInYears(new Date(), parseISO(patient.data_nascimento));
  }, [patient]);

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
          
          <div className="profile-header">
            <div className="profile-avatar">
              <User size={48} />
            </div>
            <div className="profile-info">
              <h1>{patient?.nome}</h1>
              <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span>{idade} anos • {patient?.sexo}</span>
                <span>• Objetivo: {patient?.objetivos?.[0] || 'Não definido'}</span>
              </p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
               <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowModal(true)}>
                 <Plus size={18} style={{ marginRight: '0.5rem' }} />
                 Nova Consulta
               </button>
            </div>
          </div>
        </header>

        {message && (
          <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
            {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        {/* Main Navigation Tabs */}
        <div className="tabs-nav" style={{ marginBottom: '2rem' }}>
          <button className={`tab-btn ${mainTab === 'dados' ? 'active' : ''}`} onClick={() => setMainTab('dados')}>
            <FileText size={18} style={{ marginRight: '0.5rem' }} />
            Dados do Paciente
          </button>
          <button className={`tab-btn ${mainTab === 'consultas' ? 'active' : ''}`} onClick={() => setMainTab('consultas')}>
            <Activity size={18} style={{ marginRight: '0.5rem' }} />
            Consultas
          </button>
          <button className={`tab-btn ${mainTab === 'planos' ? 'active' : ''}`} onClick={() => setMainTab('planos')}>
            <TrendingUp size={18} style={{ marginRight: '0.5rem' }} />
            Planos Alimentares
          </button>
        </div>

        {/* Section 1: Dados do Paciente */}
        {mainTab === 'dados' && (
          <div className="animate-fadeIn">
            <div className="tabs-nav" style={{ fontSize: '0.875rem', marginBottom: '1.5rem', borderBottom: 'none' }}>
              <button className={`tab-btn ${dataTab === 'pessoal' ? 'active' : ''}`} onClick={() => setDataTab('pessoal')}>Pessoal</button>
              <button className={`tab-btn ${dataTab === 'clinico' ? 'active' : ''}`} onClick={() => setDataTab('clinico')}>Clínico</button>
              <button className={`tab-btn ${dataTab === 'habitos' ? 'active' : ''}`} onClick={() => setDataTab('habitos')}>Hábitos</button>
            </div>

            <div className="form-section">
              {dataTab === 'pessoal' && (
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Nome Completo</label>
                    <input type="text" className="form-control" value={editPatient.nome} onChange={(e) => setEditPatient({...editPatient, nome: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Data de Nascimento</label>
                    <input type="date" className="form-control" value={editPatient.data_nascimento} onChange={(e) => setEditPatient({...editPatient, data_nascimento: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Sexo</label>
                    <select className="form-control" value={editPatient.sexo} onChange={(e) => setEditPatient({...editPatient, sexo: e.target.value})}>
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Telefone</label>
                    <input type="text" className="form-control" value={editPatient.telefone} onChange={(e) => setEditPatient({...editPatient, telefone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>WhatsApp</label>
                    <input type="text" className="form-control" value={editPatient.whatsapp} onChange={(e) => setEditPatient({...editPatient, whatsapp: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>E-mail</label>
                    <input type="email" className="form-control" value={editPatient.email} onChange={(e) => setEditPatient({...editPatient, email: e.target.value})} />
                  </div>
                </div>
              )}

              {dataTab === 'clinico' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label>Peso Inicial (kg)</label>
                    <input type="number" step="0.1" className="form-control" value={editPatient.peso_inicial} onChange={(e) => setEditPatient({...editPatient, peso_inicial: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Altura (cm)</label>
                    <input type="number" className="form-control" value={editPatient.altura} onChange={(e) => setEditPatient({...editPatient, altura: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 3' }}>
                    <label>Objetivos</label>
                    <div className="multi-select-grid">
                      {['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'].map(obj => (
                        <label key={obj} className="checkbox-item">
                          <input type="checkbox" checked={editPatient.objetivos?.includes(obj)} onChange={() => handleMultiSelect('objetivos', obj)} />
                          {obj}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 3' }}>
                    <label>Patologias</label>
                    <div className="multi-select-grid">
                      {['Nenhum', 'Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Colesterol alto'].map(item => (
                        <label key={item} className="checkbox-item">
                          <input type="checkbox" checked={editPatient.patologias?.includes(item)} onChange={() => handleMultiSelect('patologias', item)} />
                          {item}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 3' }}>
                    <label>Medicamentos e Suplementos</label>
                    <textarea className="form-control" rows={3} value={editPatient.medicamentos} onChange={(e) => setEditPatient({...editPatient, medicamentos: e.target.value})} />
                  </div>
                </div>
              )}

              {dataTab === 'habitos' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label>Refeições por dia</label>
                    <input type="number" className="form-control" value={editPatient.refeicoes_por_dia} onChange={(e) => setEditPatient({...editPatient, refeicoes_por_dia: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Consumo de Água (L)</label>
                    <input type="number" step="0.1" className="form-control" value={editPatient.litros_agua} onChange={(e) => setEditPatient({...editPatient, litros_agua: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 3' }}>
                    <label>Atividade Física</label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                      <input type="checkbox" checked={editPatient.atividade_fisica} onChange={(e) => setEditPatient({...editPatient, atividade_fisica: e.target.checked})} />
                      <span>Pratica regularmente?</span>
                    </div>
                    <textarea className="form-control" rows={2} placeholder="Descrição e frequência..." value={editPatient.atividade_fisica_descricao} onChange={(e) => setEditPatient({...editPatient, atividade_fisica_descricao: e.target.value})} />
                  </div>
                </div>
              )}

              <div className="footer-actions">
                <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handlePatientSave} disabled={saveLoading}>
                  {saveLoading ? <Loader2 className="animate-spin" size={18} /> : (
                    <><Save size={18} style={{ marginRight: '0.5rem' }} /> Salvar alterações</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Consultas */}
        {mainTab === 'consultas' && (
          <div className="animate-fadeIn">
            <div className="chart-container">
              <h3 className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={20} color="var(--primary)" />
                Evolução de Peso (kg)
              </h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      itemStyle={{ color: 'var(--primary)', fontWeight: 700 }}
                    />
                    <Area type="monotone" dataKey="peso" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorPeso)" dot={{ r: 6, fill: 'var(--primary)', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Nenhuma consulta registrada ainda.
                </div>
              )}
            </div>

            <h3 className="form-section-title">Histórico de Consultas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {consultations.length > 0 ? consultations.map((c) => (
                <div key={c.id} className="consultation-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ padding: '0.5rem', background: 'var(--primary-light)', borderRadius: '0.5rem', color: 'var(--primary)' }}>
                        <Calendar size={18} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>
                        {format(parseISO(c.data_consulta), "dd 'de' MMMM', 'yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    {c.proximo_retorno && (
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Próximo retorno: {format(parseISO(c.proximo_retorno), 'dd/MM/yyyy')}
                      </span>
                    )}
                  </div>
                  
                  <div className="consultation-grid">
                    <div className="consultation-stat">
                      <span className="stat-label">Peso</span>
                      <span className="stat-value">{c.peso} kg</span>
                    </div>
                    <div className="consultation-stat">
                      <span className="stat-label">Cintura</span>
                      <span className="stat-value">{c.cintura || '--'} cm</span>
                    </div>
                    <div className="consultation-stat">
                      <span className="stat-label">Quadril</span>
                      <span className="stat-value">{c.quadril || '--'} cm</span>
                    </div>
                    <div className="consultation-stat">
                      <span className="stat-label">% Gordura</span>
                      <span className="stat-value">{c.percentual_gordura || '--'} %</span>
                    </div>
                  </div>

                  {c.observacoes && (
                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                      <strong>Observações:</strong> {c.observacoes}
                    </div>
                  )}
                </div>
              )) : (
                <div className="empty-message">Nenhuma consulta registrada ainda.</div>
              )}
            </div>
          </div>
        )}

        {/* Section 3: Planos Alimentares */}
        {mainTab === 'planos' && (
          <div className="animate-fadeIn">
            {!generatedPlan && !viewingPlan ? (
              <div className="form-section" style={{ marginBottom: '2rem', textAlign: 'center', padding: '3rem' }}>
                {isGenerating ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <Loader2 className="animate-spin" size={48} color="var(--primary)" />
                    <h2>Gerando Plano Alimentar...</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Isso pode levar alguns segundos enquanto a IA analisa os dados.</p>
                  </div>
                ) : (
                  <>
                    <Sparkles size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                    <h2>Planos Alimentares com IA</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Gere planos personalizados baseados nos dados, restrições e objetivos do paciente.</p>
                    <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleGeneratePlan}>
                      <Plus size={18} style={{ marginRight: '0.5rem' }} />
                      Gerar Novo Plano
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="animate-fadeIn">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button 
                      onClick={() => { setGeneratedPlan(null); setViewingPlan(null); }} 
                      className="btn" 
                      style={{ width: 'auto', padding: '0.5rem', background: 'none', color: 'var(--text-muted)' }}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <h2 style={{ margin: 0 }}>{viewingPlan ? 'Visualizando Plano Salvo' : 'Novo Plano Gerado'}</h2>
                  </div>
                  
                  {!viewingPlan && (
                    <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleSavePlan} disabled={saveLoading}>
                      {saveLoading ? <Loader2 className="animate-spin" size={18} /> : (
                        <><Save size={18} style={{ marginRight: '0.5rem' }} /> Salvar Plano</>
                      )}
                    </button>
                  )}
                </div>

                <div className="meal-plan-grid">
                  {(generatedPlan || viewingPlan).map((day: any, dayIdx: number) => (
                    <div key={day.dia} className="day-card">
                      <div className="day-header">{day.dia}</div>
                      <div className="day-content">
                        {Object.entries(day.refeicoes).map(([mealKey, options]: [string, any]) => {
                          const mealIcons: Record<string, any> = {
                            cafe_da_manha: <Coffee size={16} />,
                            lanche_manha: <Sun size={16} />,
                            almoco: <Utensils size={16} />,
                            lanche_tarde: <Sun size={16} />,
                            jantar: <Moon size={16} />
                          };
                          const mealLabels: Record<string, string> = {
                            cafe_da_manha: 'Café da Manhã',
                            lanche_manha: 'Lanche da Manhã',
                            almoco: 'Almoço',
                            lanche_tarde: 'Lanche da Tarde',
                            jantar: 'Jantar'
                          };

                          return (
                            <div key={mealKey} className="meal-section">
                              <div className="meal-title">
                                {mealIcons[mealKey]}
                                <span>{mealLabels[mealKey]}</span>
                              </div>
                              <div className="meal-options">
                                {options.map((option: string, optIdx: number) => (
                                  <div key={optIdx} className="meal-option-item">
                                    <input 
                                      type="text" 
                                      className="meal-input"
                                      value={option}
                                      disabled={!!viewingPlan}
                                      onChange={(e) => handleEditMeal(dayIdx, mealKey, optIdx, e.target.value)}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3 className="form-section-title">Histórico de Planos</h3>
            {mealPlans.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {mealPlans.map((p) => (
                  <div key={p.id} className="consultation-card" style={{ cursor: 'pointer' }} onClick={() => handleViewPlan(p)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.5rem', background: 'var(--primary-light)', borderRadius: '0.5rem', color: 'var(--primary)' }}>
                          <History size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>Plano Alimentar - {format(parseISO(p.created_at), 'dd/MM/yyyy')}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gerado às {format(parseISO(p.created_at), 'HH:mm')}</div>
                        </div>
                      </div>
                      <ChevronLeft size={18} style={{ transform: 'rotate(180deg)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-message">Nenhum plano alimentar gerado ainda.</div>
            )}
          </div>
        )}

        {/* Modal: Nova Consulta */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Nova Consulta</h2>
                <button className="close-btn" onClick={() => setShowModal(false)}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleConsultationSave}>
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Data da Consulta *</label>
                    <input 
                      type="date" 
                      required 
                      className="form-control" 
                      value={newConsultation.data_consulta} 
                      onChange={(e) => setNewConsultation({...newConsultation, data_consulta: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Peso Atual (kg) *</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      required 
                      className="form-control" 
                      value={newConsultation.peso} 
                      onChange={(e) => setNewConsultation({...newConsultation, peso: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Cintura (cm)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      className="form-control" 
                      value={newConsultation.cintura} 
                      onChange={(e) => setNewConsultation({...newConsultation, cintura: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Quadril (cm)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      className="form-control" 
                      value={newConsultation.quadril} 
                      onChange={(e) => setNewConsultation({...newConsultation, quadril: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>% de Gordura</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      className="form-control" 
                      value={newConsultation.percentual_gordura} 
                      onChange={(e) => setNewConsultation({...newConsultation, percentual_gordura: e.target.value})} 
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Observações</label>
                    <textarea 
                      className="form-control" 
                      rows={3} 
                      value={newConsultation.observacoes} 
                      onChange={(e) => setNewConsultation({...newConsultation, observacoes: e.target.value})} 
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Data do Próximo Retorno</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={newConsultation.proximo_retorno} 
                      onChange={(e) => setNewConsultation({...newConsultation, proximo_retorno: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="footer-actions">
                  <button type="button" className="btn btn-primary" style={{ background: 'none', color: 'var(--text-muted)', width: 'auto' }} onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={saveLoading}>
                    {saveLoading ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Consulta'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PatientProfile;
