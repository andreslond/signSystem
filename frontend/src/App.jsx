import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DocumentListPending from './pages/DocumentListPending';
import DocumentViewerPending from './pages/DocumentViewerPending';
import DocumentListSigned from './pages/DocumentListSigned';
import DocumentViewerSigned from './pages/DocumentViewerSigned';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/documents/pending" element={<DocumentListPending />} />
        <Route path="/documents/pending/:id" element={<DocumentViewerPending />} />
        <Route path="/documents/signed" element={<DocumentListSigned />} />
        <Route path="/documents/signed/:id" element={<DocumentViewerSigned />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
