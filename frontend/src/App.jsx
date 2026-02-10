import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import DocumentList from './pages/DocumentList'
import DocumentViewer from './pages/DocumentViewer'

function App() {
    return (
        <Router>
            <div className="App font-sans text-gray-900">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/documents" element={<DocumentList />} />
                    <Route path="/documents/:id" element={<DocumentViewer />} />
                    <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>
            </div>
        </Router>
    )
}

export default App
