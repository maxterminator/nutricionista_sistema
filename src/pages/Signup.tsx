import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, AlertCircle, Leaf, CheckCircle2 } from 'lucide-react';

const Signup: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validations
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome: nome,
          },
        },
      });

      if (signUpError) throw signUpError;

      setSuccess(true);
      // Wait a bit and redirect to login or dashboard
      // Note: By default Supabase might require email confirmation
      // If auto-confirm is on, it might already be logged in.
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao criar a conta.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
      <div className="logo">
        <Leaf size={32} />
        <span>MAX Nutri System</span>
      </div>
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="success-message" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem' }}>
            <CheckCircle2 size={48} color="var(--primary)" />
            <h3 style={{ color: 'var(--text-main)' }}>Conta criada com sucesso!</h3>
            <p style={{ color: 'var(--text-muted)' }}>Você será redirecionado para a tela de login em instantes.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="logo">
        <Leaf size={32} />
        <span>MAX Nutri System</span>
      </div>
      
      <div className="auth-card">
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Criar sua conta</h2>
        
        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label htmlFor="nome">Nome Completo</label>
            <input
              id="nome"
              type="text"
              className="form-control"
              placeholder="Ex: Maria Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Senha</label>
            <input
              id="confirmPassword"
              type="password"
              className="form-control"
              placeholder="Repita a senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {loading ? 'Criando conta...' : (
              <>
                <UserPlus size={20} />
                <span>Criar conta</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Já tem conta? <Link to="/login">Faça login</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
