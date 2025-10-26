import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './App.css'
import HomePage from './pages/HomePage.jsx'
import InterviewSetup from './pages/InterviewSetup.jsx'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InterviewSetup />} />
  {/* Candidate management removed */}
        <Route path="/interview" element={<HomePage />} />
      </Routes>
    </Router>
  )
}

export default App
