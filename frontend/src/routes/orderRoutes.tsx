import { lazy, Suspense } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { PageLoading } from '../components/Loading';
import { ProtectedRoute } from './ProtectedRoute';

const OrdersPage = lazy(() => import('../pages/OrdersPage'));
const OrderDetailsPage = lazy(() => import('../pages/OrderDetailsPage'));
const CreateOrderPage = lazy(() => import('../pages/CreateOrderPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const page = (el: JSX.Element) => <Suspense fallback={<PageLoading />}>{el}</Suspense>;

/**
 * Rotas do sistema de pedidos. Para integrar ao seu app existente, importe e
 * renderize `orderRoutes` dentro do seu <Routes> (ao lado das rotas de login).
 */
export const orderRoutes = (
  <Route element={<ProtectedRoute />}>
    <Route element={<Layout />}>
      <Route index element={<Navigate to="/pedidos" replace />} />
      <Route path="/pedidos" element={page(<OrdersPage />)} />
      <Route path="/restaurantes/:restaurantId/novo-pedido" element={page(<CreateOrderPage />)} />
      <Route path="/pedidos/:id" element={page(<OrderDetailsPage />)} />
      <Route path="*" element={page(<NotFoundPage />)} />
    </Route>
  </Route>
);
