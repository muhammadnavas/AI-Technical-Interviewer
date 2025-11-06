import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import config from '../config'

const InterviewSetup = () => {
    const navigate = useNavigate()
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [selectedCandidateId, setSelectedCandidateId] = useState('')
    const [profileSummary, setProfileSummary] = useState(null)

    const handleFileUpload = async (file) => {
        setUploadError('')
        setSuccessMessage('')
        if (!file) return
        setIsUploading(true)
        // Quick health check to ensure backend is reachable before attempting upload
        try {
            const healthResp = await fetch(`${config.AI_BACKEND_URL}/api/health`);
            if (!healthResp.ok) throw new Error('Backend health check failed')
        } catch (err) {
            setUploadError(`Cannot reach backend at ${config.AI_BACKEND_URL} — please start the server and try again`)
            setIsUploading(false)
            return
        }
        try {
            const text = await file.text()
            let json = null
            try { json = JSON.parse(text) } catch (err) {
                setUploadError('Invalid JSON file')
                setIsUploading(false)
                return
            }

            let candidateIdToUse = json.candidateId || json.id || json.candidate_id
            if (!candidateIdToUse && json.candidateName) {
                candidateIdToUse = json.candidateName.toLowerCase().replace(/\s+/g, '_')
            }
            if (!candidateIdToUse || !json.candidateName) {
                setUploadError('JSON must include at least candidateId (or id) and candidateName')
                setIsUploading(false)
                return
            }

            if (json.skills && typeof json.skills === 'string') {
                json.skills = json.skills.split(',').map(s => s.trim()).filter(Boolean)
            }
            if (json.customQuestions && typeof json.customQuestions === 'string') {
                json.customQuestions = json.customQuestions.split('\n').map(q => q.trim()).filter(Boolean)
            }

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
                metadata: json.metadata || {},
                // include the full original JSON so backend can persist any extra fields
                rawProfile: json
            }

            const resp = await fetch(`${config.AI_BACKEND_URL}/api/candidate/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!resp.ok) {
                const text = await resp.text().catch(() => null)
                setUploadError(text || `Server error: ${resp.status}`)
                setIsUploading(false)
                return
            }

            const data = await resp.json().catch(() => null)
            if (data && data.success) {
                // After saving profile, request generation of coding questions for the code editor
                try {
                    const genResp = await fetch(`${config.AI_BACKEND_URL}/api/candidate/generate-code-questions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ candidateId: candidateIdToUse })
                    })
                    if (genResp && genResp.ok) {
                        const genData = await genResp.json().catch(() => null)
                        if (genData && genData.success) {
                            payload.codeQuestionsUrl = `${config.AI_BACKEND_URL}${genData.path}`
                            payload.codeQuestionsFile = genData.fileName
                        }
                    } else {
                        console.warn('Code questions generation failed or backend unreachable')
                    }
                } catch (err) {
                    console.warn('Could not generate code questions:', err)
                }

                setSuccessMessage(`✅ Uploaded and saved profile: ${payload.candidateName} (ID: ${candidateIdToUse})`)
                setSelectedCandidateId(candidateIdToUse)
                setProfileSummary(payload)
            } else {
                setUploadError(data.error || 'Failed to save uploaded profile')
            }
        } catch (err) {
            console.error('Upload error:', err)
            setUploadError('Failed to upload file. Check console for details.')
        } finally {
            setIsUploading(false)
            const input = document.getElementById('interviewUpload')
            if (input) input.value = ''
        }
    }

    const startInterviewWithUploaded = async () => {
        if (!selectedCandidateId) {
            setUploadError('No candidate selected. Upload a profile first.')
            return
        }

        try {
            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            const response = await fetch(`${config.AI_BACKEND_URL}/api/interview/setup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, candidateId: selectedCandidateId })
            })
            const data = await response.json()
            if (data.success) {
                localStorage.setItem('interviewSession', JSON.stringify({
                    sessionId,
                    candidateName: profileSummary?.candidateName || '',
                    candidateId: selectedCandidateId,
                    position: profileSummary?.position || '',
                    codeQuestionsUrl: profileSummary?.codeQuestionsUrl || null,
                    initialMessage: data.initialMessage
                }))
                navigate('/interview')
            } else {
                setUploadError(data.error || 'Failed to start interview')
            }
        } catch (err) {
            console.error('Error starting interview:', err)
            setUploadError('Failed to connect to server. Please make sure the backend is running.')
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
                    <p className="text-lg text-gray-600">Upload a candidate JSON to start an interview</p>

                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">Upload a candidate JSON below to start an interview session. Candidate management has been removed from the UI.</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {uploadError && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800 text-sm">{uploadError}</p>
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-green-800 text-sm">{successMessage}</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Candidate JSON</label>
                            <input id="interviewUpload" type="file" accept="application/json, .json" onChange={(e) => handleFileUpload(e.target.files && e.target.files[0])} />
                            {isUploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
                        </div>

                        {profileSummary && (
                            <div className="p-4 bg-gray-50 rounded">
                                <div className="font-semibold">{profileSummary.candidateName} <span className="text-sm text-gray-500">({selectedCandidateId})</span></div>
                                <div className="text-sm text-gray-600">Position: {profileSummary.position}</div>
                                <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{profileSummary.projectDetails}</div>
                            </div>
                        )}

                        <div className="pt-4">
                            <button onClick={startInterviewWithUploaded} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg">Start AI Interview</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default InterviewSetup
