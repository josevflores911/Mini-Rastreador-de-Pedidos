import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { LOGIN_PATH } from '../auth/authAdapter';
import { AuthError } from '../services/authService';
import { useToast } from '../context/ToastContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthField } from '../components/auth/AuthField';
import { PasswordStrength } from '../components/auth/PasswordStrength';
import { Spinner } from '../components/Loading';
import { EMAIL_RE, MIN_PASSWORD_LENGTH } from '../utils/password';

type Field = 'nome' | 'sobrenome' | 'email' | 'senha' | 'termos';
type Errors = Partial<Record<Field, string>>;
const ORDER: Field[] = ['nome', 'sobrenome', 'email', 'senha', 'termos'];

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const submitting = useRef(false);

  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [termos, setTermos] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  function validate(): Errors {
    const e: Errors = {};
    if (!nome.trim()) e.nome = 'Informe seu nome.';
    if (!sobrenome.trim()) e.sobrenome = 'Informe seu sobrenome.';
    if (!email.trim()) e.email = 'Informe seu e-mail.';
    else if (!EMAIL_RE.test(email.trim())) e.email = 'Informe um e-mail válido.';
    if (!senha) e.senha = 'Crie uma senha.';
    else if (senha.length < MIN_PASSWORD_LENGTH) e.senha = `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`;
    if (!termos) e.termos = 'Aceite os termos para criar a conta.';
    return e;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (submitting.current) return;
    const v = validate();
    setErrors(v);
    const firstInvalid = ORDER.find((f) => v[f]);
    if (firstInvalid) {
      toast.error('Corrija os campos destacados para continuar.');
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      await register({ email: email.trim(), password: senha });
      toast.success('Conta criada com sucesso! Entre para continuar.');
      navigate(LOGIN_PATH, { replace: true });
    } catch (e) {
      toast.error(e instanceof AuthError ? e.message : 'Não foi possível criar a conta. Tente novamente.');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Peça e acompanhe suas entregas em um só lugar"
      footer={
        <>
          Já tem uma conta?{' '}
          <Link to={LOGIN_PATH} className="font-semibold text-brand-200 hover:underline">Entrar</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <AuthField id="nome" label="Nome" value={nome} onChange={setNome} placeholder="João" autoComplete="given-name" error={errors.nome} />
          <AuthField id="sobrenome" label="Sobrenome" value={sobrenome} onChange={setSobrenome} placeholder="Silva" autoComplete="family-name" error={errors.sobrenome} />
        </div>
        <AuthField id="email" label="E-mail" type="email" value={email} onChange={setEmail} placeholder="voce@exemplo.com" autoComplete="email" error={errors.email} />
        <AuthField id="senha" label="Senha" type="password" revealable value={senha} onChange={setSenha} placeholder="Mínimo 8 caracteres" autoComplete="new-password" error={errors.senha}>
          <PasswordStrength password={senha} />
        </AuthField>

        <div>
          <div className="flex items-start gap-2.5">
            <input
              id="termos"
              type="checkbox"
              checked={termos}
              onChange={(e) => setTermos(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand-600"
              aria-invalid={Boolean(errors.termos)}
              aria-describedby={errors.termos ? 'termos-error' : undefined}
            />
            <label htmlFor="termos" className="cursor-pointer text-xs text-ink-300">
              Concordo com os <strong className="font-semibold text-paper-100">Termos de uso</strong> e a{' '}
              <strong className="font-semibold text-paper-100">Política de privacidade</strong>
            </label>
          </div>
          {errors.termos && <p id="termos-error" role="alert" className="mt-1.5 text-xs font-medium text-brand-200">{errors.termos}</p>}
        </div>

        <button type="submit" className="btn-primary h-11 w-full" disabled={busy}>
          {busy && <Spinner className="h-4 w-4" />}
          {busy ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>
    </AuthLayout>
  );
}
