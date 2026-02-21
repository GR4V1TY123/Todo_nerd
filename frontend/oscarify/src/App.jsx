import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import EditorPage from './pages/EditorPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<DashboardPage />} />
      <Route path="/editor" element={<EditorPage />} />
      <Route path="/editor/:projectId" element={<EditorPage />} />
    </Routes>
  )
}

export default App
