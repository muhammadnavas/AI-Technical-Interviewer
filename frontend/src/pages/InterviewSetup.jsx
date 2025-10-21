import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const InterviewSetup = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        candidateName: '',
        skills: '',
        projectDetails: '',
        customQuestions: '',
        position: 'Full Stack Developer'
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const loadMockData = () => {
        // Mock student candidate data
        setFormData({
            candidateName: 'Priya Sharma',
            position: 'Junior Frontend Developer',
            skills: 'HTML, CSS, JavaScript, React, Node.js, Express, MongoDB, Git, Bootstrap, Tailwind CSS, REST APIs, Firebase',
            projectDetails: `Project 1: E-Commerce Website - Built a fully responsive online shopping website using React and Tailwind CSS. Implemented shopping cart functionality, product filtering, and checkout process. Used local storage for cart persistence. Added dark mode toggle feature.

Project 2: Task Management App - Created a full-stack CRUD application with React frontend and Node.js/Express backend. Integrated MongoDB for data storage. Features include user authentication with JWT, task creation, editing, deletion, and status tracking.

Project 3: Weather Dashboard - Developed a weather application that fetches real-time data from OpenWeather API. Displays current weather, 5-day forecast, and weather alerts. Used React hooks for state management and Axios for API calls. Implemented geolocation to auto-detect user's city.

Project 4: Portfolio Website - Designed and developed personal portfolio using HTML, CSS, and vanilla JavaScript. Showcased all projects with live demos and GitHub links. Implemented smooth scrolling, animations, and contact form with EmailJS integration.

Project 5: Chat Application - Built a real-time chat app using React and Firebase Realtime Database. Features include user authentication, multiple chat rooms, message timestamps, and online/offline status indicators. Deployed on Firebase Hosting.`,
            customQuestions: `What is the difference between let, const, and var in JavaScript?
Explain how React hooks like useState and useEffect work
What is the difference between SQL and NoSQL databases?
How does Git version control help in software development?
What are the key differences between REST APIs and GraphQL?`
        })
        
        // Show success message
        setError('')
        setTimeout(() => {
            alert('✅ Sample student data loaded! Review and click "Start AI Interview" when ready.')
        }, 100)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            // Generate unique session ID
            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            // Parse skills and questions
            const skills = formData.skills.split(',').map(s => s.trim()).filter(s => s)
            const customQuestions = formData.customQuestions 
                ? formData.customQuestions.split('\n').filter(q => q.trim())
                : []

            // Setup interview with backend
            const response = await fetch('http://localhost:5000/api/interview/setup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId,
                    candidateName: formData.candidateName,
                    skills,
                    projectDetails: formData.projectDetails,
                    customQuestions,
                    position: formData.position
                })
            })

            const data = await response.json()

            if (data.success) {
                // Store session data in localStorage
                localStorage.setItem('interviewSession', JSON.stringify({
                    sessionId,
                    candidateName: formData.candidateName,
                    position: formData.position,
                    initialMessage: data.initialMessage
                }))

                // Navigate to interview page
                navigate('/interview')
            } else {
                setError(data.error || 'Failed to start interview')
            }
        } catch (err) {
            console.error('Error starting interview:', err)
            setError('Failed to connect to server. Please make sure the backend is running.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Technical Interviewer</h1>
                    <p className="text-lg text-gray-600">Setup your personalized interview session</p>
                    
                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-3 justify-center">
                        <button
                            type="button"
                            onClick={() => navigate('/candidate-setup')}
                            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Manage Candidate Profiles
                        </button>
                        <button
                            type="button"
                            onClick={loadMockData}
                            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Load Sample Student Data
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <p className="text-red-800 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Candidate Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Candidate Name *
                            </label>
                            <input
                                type="text"
                                name="candidateName"
                                value={formData.candidateName}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="Enter your full name"
                            />
                        </div>

                        {/* Position */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Position *
                            </label>
                            <input
                                type="text"
                                name="position"
                                value={formData.position}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="e.g., Full Stack Developer, Backend Engineer"
                            />
                        </div>

                        {/* Skills */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Technical Skills *
                            </label>
                            <input
                                type="text"
                                name="skills"
                                value={formData.skills}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="e.g., JavaScript, React, Node.js, Python, SQL"
                            />
                            <p className="mt-1 text-sm text-gray-500">Separate multiple skills with commas</p>
                        </div>

                        {/* Project Details */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Project Experience (Optional)
                            </label>
                            <textarea
                                name="projectDetails"
                                value={formData.projectDetails}
                                onChange={handleChange}
                                rows="4"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                                placeholder="Describe your key projects, technologies used, and your role..."
                            />
                        </div>

                        {/* Custom Questions */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Custom Questions (Optional)
                            </label>
                            <textarea
                                name="customQuestions"
                                value={formData.customQuestions}
                                onChange={handleChange}
                                rows="5"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                                placeholder="Enter specific questions you want to be asked (one per line)&#10;Example:&#10;Explain the event loop in JavaScript&#10;How do you handle state management in React?"
                            />
                            <p className="mt-1 text-sm text-gray-500">One question per line. AI will prioritize these questions.</p>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95 disabled:transform-none shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Starting Interview...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Start AI Interview</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div className="text-sm text-blue-800">
                                <p className="font-semibold mb-1">How it works:</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-700">
                                    <li>AI will personalize questions based on your skills and experience</li>
                                    <li>Use voice input to answer questions naturally</li>
                                    <li>Answers are automatically sent when you stop speaking</li>
                                    <li>Make sure your backend server is running on port 5000</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default InterviewSetup
