import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import DocumentListPending from './pages/DocumentListPending';
import DocumentViewerPending from './pages/DocumentViewerPending';
import DocumentListSigned from './pages/DocumentListSigned';
import DocumentViewerSigned from './pages/DocumentViewerSigned';
import ContractorSigningDashboard from './pages/ContractorSigningDashboard';
import ContractorDetail from './pages/ContractorDetail';
import DocumentViewerAdmin from './pages/DocumentViewerAdmin';
import ErrorBoundary from './components/ErrorBoundary';
import { Users } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Users className="animate-pulse text-primary" size={48} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/documents/pending"
        element={
          <ProtectedRoute>
            <ErrorBoundary showErrorDetails={import.meta.env.DEV}>
              <DocumentListPending />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents/pending/:id"
        element={
          <ProtectedRoute>
            <ErrorBoundary showErrorDetails={import.meta.env.DEV}>
              <DocumentViewerPending />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents/signed"
        element={
          <ProtectedRoute>
            <ErrorBoundary showErrorDetails={import.meta.env.DEV}>
              <DocumentListSigned />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents/signed/:id"
        element={
          <ProtectedRoute>
            <ErrorBoundary showErrorDetails={import.meta.env.DEV}>
              <DocumentViewerSigned />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/signed-documents"
        element={
          <ProtectedRoute>
            <ErrorBoundary showErrorDetails={import.meta.env.DEV}>
              <ContractorSigningDashboard />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/signed-documents/:id"
        element={
          <ProtectedRoute>
            <ErrorBoundary showErrorDetails={import.meta.env.DEV}>
              <ContractorDetail />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents/admin/:id"
        element={
          <ProtectedRoute>
            <ErrorBoundary showErrorDetails={import.meta.env.DEV}>
              <DocumentViewerAdmin />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary showErrorDetails={import.meta.env.DEV}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
