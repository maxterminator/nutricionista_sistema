import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '../components/Sidebar';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Activity, 
  Clock, 
  Check, 
  AlertCircle,
  Loader2,
  ChevronLeft
} from 'lucide-react';
import { differenceInYears, parseISO } from 'date-fns';

const AddPatient: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    data_nascimento: '',
    sexo: '',
    telefone: '',
    whatsapp: '',
    email: '',
    peso_inicial: '',
    altura: '',
    objetivos: [] as string[],
    objetivo_texto: '',
    nivel_atividade: '',
    patologias: [] as string[],
    restricoes_alimentares: [] as string[],
    alergias: [] as string[],
    medicamentos: '',
    suplementos: '',
    refeicoes_por_dia: '',
    horario_acorda: '',
    horario_dorme: '',
    litros_agua: '',
    atividade_fisica: false,
    atividade_fisica_descricao: '',
    observacoes: ''
  });

  // Auto-calculated fields
  const idade = useMemo(() => {
    if (!formData.data_nascimento) return null;
    return differenceInYears(new Date(), parseISO(formData.data_nascimento));
  }, [formData.data_nascimento]);

  const imc = useMemo(() => {
    const p = parseFloat(formData.peso_inicial);
    const a = parseFloat(formData.altura) / 100;
    if (p && a) return (p / (a * a)).toFixed(2);
    return null;
  }, [formData.peso_inicial, formData.altura]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleMultiSelect = (name: string, value: string) => {
    setFormData(prev => {
      const current = (prev as any)[name] as string[];
      if (value === 'Nenhum') return { ...prev, [name]: ['Nenhum'] };
      
      let next = current.includes(value) 
        ? current.filter(item => item !== value)
        : [...current.filter(item => item !== 'Nenhum'), value];
      
      return { ...prev, [name]: next };
    });
  };

  const formatTimeInput = (name: string, value: string) => {
    let digits = value.replace(/\D/g, '');
    if (digits.length > 4) digits = digits.slice(0, 4);
    
    let formatted = '';
    if (digits.length <= 2) {
      formatted = digits.padStart(2, '0') + ':00';
    } else {
      const h = digits.slice(0, digits.length - 2).padStart(2, '0');
      const m = digits.slice(digits.length - 2).padStart(2, '0');
      formatted = `${h}:${m}`;
    }
    setFormData(prev => ({ ...prev, [name]: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) {
      setError('O nome completo é obrigatório.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Sessão expirada. Faça login novamente.');
      return;
    }

    try {
      const payload = {
        ...formData,
        nutricionista_id: user.id,
        peso_inicial: formData.peso_inicial ? parseFloat(formData.peso_inicial) : null,
        altura: formData.altura ? parseFloat(formData.altura) : null,
        refeicoes_por_dia: formData.refeicoes_por_dia ? parseInt(formData.refeicoes_por_dia) : null,
        litros_agua: formData.litros_agua ? parseFloat(formData.litros_agua) : null,
      };

      const { data, error: insertError } = await supabase
        .from('pacientes')
        .insert([payload])
        .select()
        .single();

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        navigate(`/pacientes/${data.id}`);
      }, 1500);
    } catch (err: any) {
      console.error('Error saving patient:', err);
      setError(err.message || 'Ocorreu um erro ao salvar o paciente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: '2rem' }}>
          <button onClick={() => navigate('/pacientes')} className="btn" style={{ width: 'auto', padding: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', color: 'var(--text-muted)' }}>
            <ChevronLeft size={18} />
            Voltar para listagem
          </button>
          <h1>Novo Paciente</h1>
          <p style={{ color: 'var(--text-muted)' }}>Preencha os dados para iniciar o acompanhamento</p>
        </header>

        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            <Check size={18} />
            Paciente cadastrado com sucesso! Redirecionando...
          </div>
        )}

        <div className="tabs-container">
          <div className="tabs-nav">
            <button 
              className={`tab-btn ${activeTab === 'pessoal' ? 'active' : ''}`}
              onClick={() => setActiveTab('pessoal')}
            >
              <User size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Pessoal
            </button>
            <button 
              className={`tab-btn ${activeTab === 'clinico' ? 'active' : ''}`}
              onClick={() => setActiveTab('clinico')}
            >
              <Activity size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Clínico
            </button>
            <button 
              className={`tab-btn ${activeTab === 'habitos' ? 'active' : ''}`}
              onClick={() => setActiveTab('habitos')}
            >
              <Clock size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Hábitos
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* --- Aba 1: Pessoal --- */}
            {activeTab === 'pessoal' && (
              <div className="form-section animate-fadeIn">
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Nome Completo *</label>
                    <input 
                      type="text" 
                      name="nome"
                      className="form-control" 
                      required 
                      value={formData.nome}
                      onChange={handleInputChange}
                      placeholder="Ex: Maria Silva"
                    />
                  </div>
                  <div className="form-group">
                    <label>Data de Nascimento</label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <input 
                        type="date" 
                        name="data_nascimento"
                        className="form-control" 
                        value={formData.data_nascimento}
                        onChange={handleInputChange}
                      />
                      {idade !== null && (
                        <div className="imc-display" style={{ minWidth: '80px', padding: '0.5rem' }}>
                          {idade} anos
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Sexo</label>
                    <select 
                      className="form-control" 
                      name="sexo"
                      value={formData.sexo}
                      onChange={handleInputChange}
                    >
                      <option value="">Selecione...</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Telefone</label>
                    <input 
                      type="text" 
                      name="telefone"
                      className="form-control" 
                      placeholder="(00) 0000-0000"
                      value={formData.telefone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>WhatsApp</label>
                    <input 
                      type="text" 
                      name="whatsapp"
                      className="form-control" 
                      placeholder="(00) 00000-0000"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>E-mail</label>
                    <input 
                      type="email" 
                      name="email"
                      className="form-control" 
                      placeholder="email@exemplo.com"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="footer-actions">
                  <button type="button" className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setActiveTab('clinico')}>
                    Próximo: Clínico
                  </button>
                </div>
              </div>
            )}

            {/* --- Aba 2: Clínico --- */}
            {activeTab === 'clinico' && (
              <div className="form-section animate-fadeIn">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Peso Atual</label>
                    <div className="input-with-suffix">
                      <input 
                        type="number" 
                        name="peso_inicial"
                        step="0.1"
                        className="form-control" 
                        value={formData.peso_inicial}
                        onChange={handleInputChange}
                      />
                      <span className="input-suffix">kg</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Altura</label>
                    <div className="input-with-suffix">
                      <input 
                        type="number" 
                        name="altura"
                        className="form-control" 
                        value={formData.altura}
                        onChange={handleInputChange}
                      />
                      <span className="input-suffix">cm</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>IMC</label>
                    <div className={`imc-display ${imc ? '' : 'disabled'}`} style={{ opacity: imc ? 1 : 0.5 }}>
                      {imc || '--.--'}
                    </div>
                  </div>
                  
                  <div className="form-group" style={{ gridColumn: 'span 3' }}>
                    <label>Objetivo</label>
                    <div className="multi-select-grid">
                      {['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'].map(obj => (
                        <label key={obj} className="checkbox-item">
                          <input 
                            type="checkbox" 
                            checked={formData.objetivos.includes(obj)}
                            onChange={() => handleMultiSelect('objetivos', obj)}
                          />
                          {obj}
                        </label>
                      ))}
                    </div>
                    <textarea 
                      name="objetivo_texto"
                      className="form-control" 
                      style={{ marginTop: '1rem' }} 
                      placeholder="Outros objetivos ou detalhes..."
                      value={formData.objetivo_texto}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 3' }}>
                    <label>Nível de Atividade Física</label>
                    <select 
                      name="nivel_atividade"
                      className="form-control"
                      value={formData.nivel_atividade}
                      onChange={handleInputChange}
                    >
                      <option value="">Selecione...</option>
                      <option value="Sedentário">Sedentário</option>
                      <option value="Levemente ativo">Levemente ativo</option>
                      <option value="Moderadamente ativo">Moderadamente ativo</option>
                      <option value="Muito ativo">Muito ativo</option>
                      <option value="Extremamente ativo">Extremamente ativo</option>
                    </select>
                  </div>

                  {/* Patologias */}
                  <div className="form-group" style={{ gridColumn: 'span 3' }}>
                    <label>Patologias ou Condições de Saúde</label>
                    <div className="multi-select-grid">
                      {['Nenhum', 'Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'].map(item => (
                        <label key={item} className="checkbox-item">
                          <input 
                            type="checkbox" 
                            checked={formData.patologias.includes(item)}
                            onChange={() => handleMultiSelect('patologias', item)}
                          />
                          {item}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Restrições */}
                  <div className="form-group" style={{ gridColumn: 'span 3' }}>
                    <label>Restrições Alimentares</label>
                    <div className="multi-select-grid">
                      {['Nenhum', 'Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar'].map(item => (
                        <label key={item} className="checkbox-item">
                          <input 
                            type="checkbox" 
                            checked={formData.restricoes_alimentares.includes(item)}
                            onChange={() => handleMultiSelect('restricoes_alimentares', item)}
                          />
                          {item}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 3' }}>
                    <label>Alergias Alimentares</label>
                    <div className="multi-select-grid">
                      {['Nenhum', 'Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar'].map(item => (
                        <label key={item} className="checkbox-item">
                          <input 
                            type="checkbox" 
                            checked={formData.alergias.includes(item)}
                            onChange={() => handleMultiSelect('alergias', item)}
                          />
                          {item}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 3' }}>
                    <label>Medicamentos Contínuos</label>
                    <textarea 
                      name="medicamentos"
                      className="form-control" 
                      value={formData.medicamentos}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 3' }}>
                    <label>Suplementos em Uso</label>
                    <textarea 
                      name="suplementos"
                      className="form-control" 
                      value={formData.suplementos}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="footer-actions">
                  <button type="button" className="btn btn-primary" style={{ width: 'auto', background: 'var(--bg-gray)', color: 'var(--text-main)' }} onClick={() => setActiveTab('pessoal')}>
                    Anterior
                  </button>
                  <button type="button" className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setActiveTab('habitos')}>
                    Próximo: Hábitos
                  </button>
                </div>
              </div>
            )}

            {/* --- Aba 3: Hábitos --- */}
            {activeTab === 'habitos' && (
              <div className="form-section animate-fadeIn">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Refeições por dia</label>
                    <input 
                      type="number" 
                      name="refeicoes_por_dia"
                      className="form-control" 
                      value={formData.refeicoes_por_dia}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Horário que acorda</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ex: 630 para 06:30"
                      onBlur={(e) => formatTimeInput('horario_acorda', e.target.value)}
                      defaultValue={formData.horario_acorda}
                    />
                    <small style={{ color: 'var(--text-muted)' }}>Atual: {formData.horario_acorda || '--:--'}</small>
                  </div>
                  <div className="form-group">
                    <label>Horário que dorme</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ex: 2230 para 22:30"
                      onBlur={(e) => formatTimeInput('horario_dorme', e.target.value)}
                      defaultValue={formData.horario_dorme}
                    />
                    <small style={{ color: 'var(--text-muted)' }}>Atual: {formData.horario_dorme || '--:--'}</small>
                  </div>
                  <div className="form-group">
                    <label>Consumo de água</label>
                    <div className="input-with-suffix">
                      <input 
                        type="number" 
                        name="litros_agua"
                        step="0.1"
                        className="form-control" 
                        value={formData.litros_agua}
                        onChange={handleInputChange}
                      />
                      <span className="input-suffix">litros</span>
                    </div>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                    <label style={{ margin: 0 }}>Pratica atividade física?</label>
                    <input 
                      type="checkbox" 
                      name="atividade_fisica"
                      style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary)' }}
                      checked={formData.atividade_fisica}
                      onChange={handleInputChange}
                    />
                  </div>
                  {formData.atividade_fisica && (
                    <div className="form-group" style={{ gridColumn: 'span 3' }}>
                      <label>Qual atividade e frequência semanal?</label>
                      <input 
                        type="text" 
                        name="atividade_fisica_descricao"
                        className="form-control" 
                        placeholder="Ex: Musculação 4x na semana"
                        value={formData.atividade_fisica_descricao}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}
                  <div className="form-group" style={{ gridColumn: 'span 3' }}>
                    <label>Observações Gerais</label>
                    <textarea 
                      name="observacoes"
                      className="form-control" 
                      rows={4}
                      value={formData.observacoes}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="footer-actions">
                  <button type="button" className="btn btn-primary" style={{ width: 'auto', background: 'var(--bg-gray)', color: 'var(--text-main)' }} onClick={() => setActiveTab('clinico')}>
                    Anterior
                  </button>
                  <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: 'auto' }}>
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Salvar Paciente'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddPatient;
