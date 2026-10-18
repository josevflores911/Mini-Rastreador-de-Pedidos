import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { HOME_PATH, REGISTER_PATH } from '../auth/authAdapter';
import { AuthError } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthField } from '../components/auth/AuthField';
import { Spinner } from '../components/Loading';
import { EMAIL_RE } from '../utils/password';

interface LocationState {
  from?: { pathname: string; search?: string; hash?: string };
  expired?: boolean;
}

type Errors = Partial<Record<'email' | 'password', string>>;

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const state = (useLocation().state ?? null) as LocationState | null;
  const submitting = useRef(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  // Volta para a página que o usuário tentou abrir (apenas caminhos internos).
  const from = state?.from;
  const target = from && from.pathname.startsWith('/') && !from.pathname.startsWith('//')
    ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
    : HOME_PATH;

  function validate(): Errors {
    const e: Errors = {};
    if (!email.trim()) e.email = 'Informe seu e-mail.';
    else if (!EMAIL_RE.test(email.trim())) e.email = 'Informe um e-mail válido.';
    if (!password) e.password = 'Informe sua senha.';
    return e;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (submitting.current) return; // evita envio duplicado
    const v = validate();
    setErrors(v);
    if (v.email || v.password) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      document.getElementById(v.email ? 'email' : 'password')?.focus();
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      await login({ username: email.trim(), password });
      toast.success('Login realizado com sucesso!');
      navigate(target, { replace: true });
    } catch (e) {
      toast.error(e instanceof AuthError ? e.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Bem-vindo de volta"
      subtitle="Entre na sua conta para continuar"
      footer={
        <>
          Não tem uma conta?{' '}
          <Link to={REGISTER_PATH} className="font-semibold text-brand-200 hover:underline">Criar conta</Link>
        </>
      }
    >
      {state?.expired && (
        <div role="status" className="mb-5 flex gap-2.5 rounded-xl bg-amber-400/10 p-3 text-sm text-amber-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>Sua sessão expirou. Entre novamente para continuar.</p>
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthField id="email" label="E-mail" type="email" value={email} onChange={setEmail} placeholder="voce@exemplo.com" autoComplete="email" error={errors.email} />
        <AuthField id="password" label="Senha" type="password" revealable value={password} onChange={setPassword} placeholder="Sua senha" autoComplete="current-password" error={errors.password} />
        <button type="submit" className="btn-primary mt-2 h-11 w-full" disabled={busy}>
          {busy && <Spinner className="h-4 w-4" />}
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </AuthLayout>
  );
}
