import { lazy, Suspense } from 'react';
import type { JSX } from 'react';
import { Route } from 'react-router-dom';
import { LOGIN_PATH, REGISTER_PATH } from '../auth/authAdapter';
import { PageLoading } from '../components/Loading';
import { PublicOnlyRoute } from './PublicOnlyRoute';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));

const page = (el: JSX.Element) => <Suspense fallback={<PageLoading />}>{el}</Suspense>;

/** Rotas públicas de autenticação (login e cadastro). */
export const authRoutes = (
  <Route element={<PublicOnlyRoute />}>
    <Route path={LOGIN_PATH} element={page(<LoginPage />)} />
    <Route path={REGISTER_PATH} element={page(<RegisterPage />)} />
  </Route>
);
