import { useEffect, useState } from 'react';
import config from '../config';

const SessionScheduler = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [formData, setFormData] = useState({
        candidateId: '',
        candidateName: '',
        position: '',
        startTime: '',
        endTime: '',
        duration: 60,
        skills: '',
        experienceLevel: 'intermediate',
        focusAreas: 'technical,problem-solving',
        allowCodeEditor: true,
        customQuestions: '',
        notes: ''
    });

    // Load existing sessions
    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const response = await fetch(`${config.AI_BACKEND_URL}/api/scheduled-sessions/list`);
            const data = await response.json();
            
            if (data.success) {
                setSessions(data.sessions);
            } else {
                setError('Failed to load sessions');
            }
        } catch (err) {
            setError('Error loading sessions: ' + err.message);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Prepare the data
            const sessionData = {
                ...formData,
                skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
                focusAreas: formData.focusAreas.split(',').map(s => s.trim()).filter(Boolean),
                customQuestions: formData.customQuestions.split('\n').map(q => q.trim()).filter(Boolean)
            };

            const response = await fetch(`${config.AI_BACKEND_URL}/api/scheduled-sessions/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sessionData)
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(`Session created successfully! Session ID: ${data.session.sessionId}`);
                setFormData({
                    candidateId: '',
                    candidateName: '',
                    position: '',
                    startTime: '',
                    endTime: '',
                    duration: 60,
                    skills: '',
                    experienceLevel: 'intermediate',
                    focusAreas: 'technical,problem-solving',
                    allowCodeEditor: true,
                    customQuestions: '',
                    notes: ''
                });
                loadSessions(); // Reload the sessions list
            } else {
                setError(data.error || 'Failed to create session');
            }
        } catch (err) {
            setError('Error creating session: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateStr) => {
        return new Date(dateStr).toLocaleString();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'text-blue-600 bg-blue-100';
            case 'active': return 'text-green-600 bg-green-100';
            case 'completed': return 'text-gray-600 bg-gray-100';
            case 'expired': return 'text-red-600 bg-red-100';
            case 'cancelled': return 'text-orange-600 bg-orange-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Session Scheduler</h1>
                <p className="text-gray-600">Create and manage time-bound interview sessions for candidates</p>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Create Session Form */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Session</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Candidate ID *
                                </label>
                                <input
                                    type="text"
                                    name="candidateId"
                                    value={formData.candidateId}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    placeholder="e.g., CAND001"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Candidate Name *
                                </label>
                                <input
                                    type="text"
                                    name="candidateName"
                                    value={formData.candidateName}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    placeholder="Full Name"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Position
                            </label>
                            <input
                                type="text"
                                name="position"
                                value={formData.position}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Software Developer"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    End Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duration (minutes)
                            </label>
                            <input
                                type="number"
                                name="duration"
                                value={formData.duration}
                                onChange={handleInputChange}
                                min="15"
                                max="180"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Skills (comma-separated)
                            </label>
                            <input
                                type="text"
                                name="skills"
                                value={formData.skills}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="JavaScript, React, Node.js"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Experience Level
                            </label>
                            <select
                                name="experienceLevel"
                                value={formData.experienceLevel}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="junior">Junior</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="senior">Senior</option>
                            </select>
                        </div>

                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="allowCodeEditor"
                                    checked={formData.allowCodeEditor}
                                    onChange={handleInputChange}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm font-medium text-gray-700">
                                    Allow Code Editor
                                </span>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Custom Questions (one per line)
                            </label>
                            <textarea
                                name="customQuestions"
                                value={formData.customQuestions}
                                onChange={handleInputChange}
                                rows="4"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Tell me about your experience with React
How do you handle state management?
Describe your testing approach"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows="2"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Additional notes for this session..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50"
                        >
                            {loading ? 'Creating Session...' : 'Create Session'}
                        </button>
                    </form>
                </div>

                {/* Sessions List */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Scheduled Sessions</h2>
                        <button
                            onClick={loadSessions}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                            Refresh
                        </button>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {sessions.map((session) => (
                            <div key={session.sessionId} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-medium text-gray-900">{session.candidateName}</h3>
                                        <p className="text-sm text-gray-600">{session.position}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                                        {session.status}
                                    </span>
                                </div>
                                
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p><span className="font-medium">ID:</span> {session.candidateId}</p>
                                    <p><span className="font-medium">Start:</span> {formatDateTime(session.startTime)}</p>
                                    <p><span className="font-medium">End:</span> {formatDateTime(session.endTime)}</p>
                                    <p><span className="font-medium">Access Attempts:</span> {session.accessAttempts}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {sessions.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                            No scheduled sessions found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SessionScheduler;