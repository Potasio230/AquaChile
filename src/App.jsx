import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import HomePage from './pages/HomePage'
import PostulacionPage from './pages/PostulacionPage'
import LoginPage from './pages/LoginPage'
import GestionPage from './pages/GestionPage'
import EvaluacionPage from './pages/EvaluacionPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/postulacion" element={<PostulacionPage />} />
          <Route path="/acceso-interno" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/gestion" element={<GestionPage />} />
            <Route path="/gestion/evaluacion/:id" element={<EvaluacionPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
