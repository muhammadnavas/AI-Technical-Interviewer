import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CandidateManagement = () => {
    const navigate = useNavigate()
    const [candidateId, setCandidateId] = useState('')
    const [isLoadMode, setIsLoadMode] = useState(false)
    const [savedCandidates, setSavedCandidates] = useState([])
    const [formData, setFormData] = useState({
        candidateName: '',
        position: 'Full Stack Developer',
        skills: '',
        projectDetails: '',
        customQuestions: '',
        githubProjects: '',
        experience: '',
        education: ''
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState('')

    // Fetch all saved candidates on mount
    useEffect(() => {
        fetchSavedCandidates()
    }, [])

    const fetchSavedCandidates = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/candidate/list')
            const data = await response.json()
            if (data.success) {
                setSavedCandidates(data.candidates)
            }
        } catch (err) {
            console.error('Error fetching candidates:', err)
        }
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const loadCandidateById = async () => {
        if (!candidateId.trim()) {
            setError('Please choose a candidate from the list')
            return
        }

        setIsLoading(true)
        setError('')
        setSuccessMessage('')

        try {
            const response = await fetch(`http://localhost:5000/api/candidate/load/${candidateId}`)
            const data = await response.json()

            if (data.success) {
                const profile = data.profile
                // Show a brief summary in successMessage area
                setFormData({
                    candidateName: profile.candidateName || '',
                    position: profile.position || 'Full Stack Developer',
                    skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills || ''),
                    projectDetails: profile.projectDetails || profile.githubProjects || '',
                    customQuestions: Array.isArray(profile.customQuestions) ? profile.customQuestions.join('\n') : (profile.customQuestions || ''),
                    githubProjects: profile.githubProjects || '',
                    experience: profile.experience || '',
                    education: profile.education || ''
                })
                setSuccessMessage(`✅ Loaded profile for ${profile.candidateName}`)
                setIsLoadMode(false)
            } else {
                setError(data.error || 'Candidate not found')
            }
        } catch (err) {
            console.error('Error loading candidate:', err)
            setError('Failed to load candidate profile. Make sure the backend is running.')
        } finally {
            setIsLoading(false)
        }
    }

    // Saving profiles manually removed to enforce loading JSON profiles from disk.

    const startInterviewWithProfile = async () => {
        if (!candidateId.trim()) {
            setError('Please select a candidate from the left panel')
            return
        }

        setIsLoading(true)
        setError('')

        try {
            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

            const response = await fetch('http://localhost:5000/api/interview/setup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId,
                    candidateId
                })
            })

            const data = await response.json()

            if (data.success) {
                localStorage.setItem('interviewSession', JSON.stringify({
                    sessionId,
                    candidateName: formData.candidateName,
                    candidateId,
                    position: formData.position,
                    initialMessage: data.initialMessage
                }))

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

    const selectCandidate = (candidate) => {
        setCandidateId(candidate.candidateId)
        setTimeout(loadCandidateById, 100)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Candidate Profile Manager</h1>
                    <p className="text-lg text-gray-600">Save, load, and manage candidate profiles for AI interviews</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Saved Candidates List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Saved Candidates</h2>
                            {/* Upload JSON file */}
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Candidate JSON</label>
                                <div className="flex gap-2">
                                    <input
                                        id="candidateJsonFile"
                                        type="file"
                                        accept="application/json, .json"
                                        onChange={async (e) => {
                                            const file = e.target.files && e.target.files[0]
                                            setUploadError('')
                                            setSuccessMessage('')
                                            if (!file) return
                                            setIsUploading(true)
                                            try {
                                                const text = await file.text()
                                                let json = null
                                                try { json = JSON.parse(text) } catch (err) {
                                                    setUploadError('Invalid JSON file')
                                                    setIsUploading(false)
                                                    return
                                                }

                                                // Ensure candidateId and candidateName exist
                                                let candidateIdToUse = json.candidateId || json.id || json.candidate_id
                                                if (!candidateIdToUse && json.candidateName) {
                                                    candidateIdToUse = json.candidateName.toLowerCase().replace(/\s+/g, '_')
                                                }
                                                if (!candidateIdToUse || !json.candidateName) {
                                                    setUploadError('JSON must include at least candidateId (or id) and candidateName')
                                                    setIsUploading(false)
                                                    return
                                                }

                                                // Normalize skills/customQuestions if present as strings
                                                if (json.skills && typeof json.skills === 'string') {
                                                    json.skills = json.skills.split(',').map(s => s.trim()).filter(Boolean)
                                                }
                                                if (json.customQuestions && typeof json.customQuestions === 'string') {
                                                    json.customQuestions = json.customQuestions.split('\n').map(q => q.trim()).filter(Boolean)
                                                }

                                                // Build payload for save endpoint
                                                const payload = {
                                                    candidateId: candidateIdToUse,
                                                    candidateName: json.candidateName,
                                                    position: json.position || json.role || 'Full Stack Developer',
                                                    skills: json.skills || [],
                                                    projectDetails: json.projectDetails || json.githubProjects || '',
                                                    customQuestions: json.customQuestions || [],
                                                    githubProjects: json.githubProjects || '',
                                                    experience: json.experience || '',
                                                    education: json.education || '',
                                                    metadata: json.metadata || {}
                                                }

                                                const resp = await fetch('http://localhost:5000/api/candidate/save', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify(payload)
                                                })

                                                const data = await resp.json()
                                                if (data.success) {
                                                    setSuccessMessage(`✅ Uploaded and saved profile: ${payload.candidateName} (ID: ${candidateIdToUse})`)
                                                    setCandidateId(candidateIdToUse)
                                                    // refresh list
                                                    fetchSavedCandidates()
                                                } else {
                                                    setUploadError(data.error || 'Failed to save uploaded profile')
                                                }
                                            } catch (err) {
                                                console.error('Upload error:', err)
                                                setUploadError('Failed to upload file. Check console for details.')
                                            } finally {
                                                setIsUploading(false)
                                                // clear input value so same file can be reselected
                                                const input = document.getElementById('candidateJsonFile')
                                                if (input) input.value = ''
                                            }
                                        }}
                                        className="flex-1"
                                    />
                                </div>
                                {isUploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
                                {uploadError && <p className="text-sm text-red-600 mt-2">{uploadError}</p>}
                            </div>

                            {savedCandidates.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-8">No candidates saved yet</p>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {savedCandidates.map((candidate) => (
                                        <button
                                            key={candidate.candidateId}
                                            onClick={() => {
                                                setCandidateId(candidate.candidateId)
                                                setTimeout(() => {
                                                    const btn = document.querySelector('[data-load-btn]')
                                                    if (btn) btn.click()
                                                }, 100)
                                            }}
                                            className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all"
                                        >
                                            <div className="font-semibold text-gray-900">{candidate.candidateName}</div>
                                            <div className="text-sm text-gray-500">{candidate.position}</div>
                                            <div className="text-xs text-gray-400 mt-1">ID: {candidate.candidateId}</div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={() => navigate('/')}
                                className="w-full mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                            >
                                ← Back to Setup
                            </button>
                        </div>
                    </div>

                    {/* Main Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-xl p-8">
                            {error && (
                                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-red-800 text-sm">{error}</p>
                                </div>
                            )}

                            {successMessage && (
                                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-green-800 text-sm">{successMessage}</p>
                                </div>
                            )}

                            {/* Candidate Summary Section */}
                            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Selected Candidate</label>
                                {formData.candidateName ? (
                                    <div>
                                        <div className="font-semibold text-gray-900">{formData.candidateName}</div>
                                        <div className="text-sm text-gray-600">{formData.position}</div>
                                        <div className="text-xs text-gray-500 mt-2">Skills: {formData.skills}</div>
                                        <div className="mt-2 text-sm text-gray-700 max-h-28 overflow-y-auto whitespace-pre-wrap">{formData.projectDetails}</div>
                                    </div>
                                ) : (
                                    <p className="text-gray-600">Select a candidate from the left to view profile summary</p>
                                )}
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-6">
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Enter full name"
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="e.g., Full Stack Developer"
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="JavaScript, React, Node.js, Python, SQL"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">Separate with commas</p>
                                </div>

                                {/* GitHub Projects */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        GitHub Projects
                                    </label>
                                    <textarea
                                        name="githubProjects"
                                        value={formData.githubProjects}
                                        onChange={handleChange}
                                        rows="3"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                        placeholder="List GitHub projects with descriptions..."
                                    />
                                </div>

                                {/* Project Details */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Project Experience
                                    </label>
                                    <textarea
                                        name="projectDetails"
                                        value={formData.projectDetails}
                                        onChange={handleChange}
                                        rows="4"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                        placeholder="Describe your key projects..."
                                    />
                                </div>

                                {/* Experience */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Work Experience
                                    </label>
                                    <textarea
                                        name="experience"
                                        value={formData.experience}
                                        onChange={handleChange}
                                        rows="3"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                        placeholder="Previous work experience, internships..."
                                    />
                                </div>

                                {/* Education */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Education
                                    </label>
                                    <textarea
                                        name="education"
                                        value={formData.education}
                                        onChange={handleChange}
                                        rows="2"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                        placeholder="Degree, university, graduation year..."
                                    />
                                </div>

                                {/* Custom Questions */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Custom Questions
                                    </label>
                                    <textarea
                                        name="customQuestions"
                                        value={formData.customQuestions}
                                        onChange={handleChange}
                                        rows="5"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                        placeholder="One question per line..."
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={startInterviewWithProfile}
                                        disabled={isLoading || !candidateId}
                                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl"
                                    >
                                        🎤 Start AI Interview for Selected Candidate
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CandidateManagement
