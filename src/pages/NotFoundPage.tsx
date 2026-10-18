import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export default function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="Página não encontrada"
      description="O endereço que você acessou não existe."
      action={<Link to="/pedidos" className="btn-primary">Ir para meus pedidos</Link>}
    />
  );
}
