import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import HomePage from './pages/HomePage'
import PostulacionPage from './pages/PostulacionPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/postulacion" element={<PostulacionPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
