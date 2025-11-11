import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './App.css'
import InterviewSession from './components/InterviewSession.jsx'
import HomePage from './pages/HomePage.jsx'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/interview" element={<HomePage />} />
        <Route path="/interview-session" element={<InterviewSession />} />
      </Routes>
    </Router>
  )
}

export default App
