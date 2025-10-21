import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './App.css'
import CandidateManagement from './pages/CandidateManagement.jsx'
import HomePage from './pages/HomePage.jsx'
import InterviewSetup from './pages/InterviewSetup.jsx'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InterviewSetup />} />
        <Route path="/candidate-setup" element={<CandidateManagement />} />
        <Route path="/interview" element={<HomePage />} />
      </Routes>
    </Router>
  )
}

export default App
