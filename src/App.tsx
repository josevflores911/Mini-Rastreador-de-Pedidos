import { BrowserRouter, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { authRoutes } from './routes/authRoutes';
import { orderRoutes } from './routes/orderRoutes';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {authRoutes}
            {orderRoutes}
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
