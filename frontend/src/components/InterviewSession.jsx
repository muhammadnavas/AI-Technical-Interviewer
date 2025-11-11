import axios from 'axios';
import { useEffect, useState } from 'react';
import config from '../config';

const InterviewSession = () => {
  const [sessionData, setSessionData] = useState(null);
  const [interviewData, setInterviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingInterview, setLoadingInterview] = useState(false);
  const [interviewInitialized, setInterviewInitialized] = useState(false);
  const [accessForm, setAccessForm] = useState({
    sessionId: '',
    accessToken: ''
  });
  const [candidateId, setCandidateId] = useState('');
  const [accessMode, setAccessMode] = useState('session'); // 'session' or 'candidate'

  // Check for session data from URL parameters or localStorage
  useEffect(() => {
    // First, check localStorage for session data (from InterviewSetup)
    const storedSession = localStorage.getItem('interviewSession');
    if (storedSession) {
      try {
        const sessionInfo = JSON.parse(storedSession);
        console.log('Found stored session:', sessionInfo);
        
        if (sessionInfo.sessionId && sessionInfo.accessToken) {
          setAccessForm({ 
            sessionId: sessionInfo.sessionId, 
            accessToken: sessionInfo.accessToken 
          });
          
          // Set pre-loaded data if available
          if (sessionInfo.interviewData) {
            setSessionData({
              sessionId: sessionInfo.sessionId,
              candidateName: sessionInfo.candidateName,
              role: sessionInfo.position,
              companyName: sessionInfo.companyName,
              status: 'active'
            });
            setInterviewData(sessionInfo.interviewData);
            setInterviewInitialized(true);
            
            // Clear localStorage after successful load
            localStorage.removeItem('interviewSession');
            console.log('Interview session loaded from storage and ready to start');
          } else {
            // Auto-access session to get interview data
            handleAccessSession(sessionInfo.sessionId, sessionInfo.accessToken);
          }
          return;
        }
      } catch (err) {
        console.error('Error parsing stored session:', err);
        localStorage.removeItem('interviewSession'); // Clean up invalid data
      }
    }

    // Fallback to URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sessionId');
    const token = urlParams.get('token');
    
    if (sessionId && token) {
      setAccessForm({ sessionId, accessToken: token });
      // Auto-access if URL contains session details
      handleAccessSession(sessionId, token);
    }
  }, []);

  const handleAccessSession = async (sessionId = accessForm.sessionId, accessToken = accessForm.accessToken) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${config.AI_BACKEND_URL}/api/sessions/access`, {
        sessionId,
        accessToken
      });

      if (response.data.success) {
        setSessionData(response.data.session);
        setInterviewData(response.data.interviewData);
        console.log('Session accessed successfully:', response.data);
        console.log('Interview data loaded:', response.data.interviewData);
      } else {
        setError(response.data.error || 'Failed to access session');
      }
    } catch (err) {
      console.error('Access error:', err);
      setError(err.response?.data?.error || 'Failed to access session');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessByCandidateId = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${config.AI_BACKEND_URL}/api/sessions/access-by-candidate`, {
        candidateId
      });

      if (response.data.success) {
        setSessionData(response.data.session);
        setInterviewData(response.data.interviewData);
        
        // Update access form with the retrieved session details for future use
        setAccessForm({
          sessionId: response.data.session.sessionId,
          accessToken: response.data.session.accessToken
        });
        
        console.log('Session accessed by candidate ID:', response.data);
        console.log('Interview data loaded:', response.data.interviewData);
        
        // Show success message with session details
        if (response.data.accessUrl) {
          console.log('Direct access URL:', response.data.accessUrl);
        }
      } else {
        setError(response.data.error || 'Failed to access session');
        
        // Show helpful information if session not yet accessible
        if (response.data.sessionInfo) {
          const info = response.data.sessionInfo;
          setError(`${response.data.message || response.data.error}\n\nSession Details:\n- Candidate: ${info.candidateName}\n- Role: ${info.role}\n- Company: ${info.companyName}\n- Scheduled: ${new Date(info.scheduledStartTime).toLocaleString()}\n- Access from: ${new Date(info.accessibleFrom).toLocaleString()}\n- Time until access: ${info.timeUntilAccess} minutes`);
        }
      }
    } catch (err) {
      console.error('Access by candidate ID error:', err);
      
      if (err.response?.data?.sessionInfo) {
        const info = err.response.data.sessionInfo;
        setError(`${err.response.data.message || err.response.data.error}\n\nSession Details:\n- Candidate: ${info.candidateName}\n- Role: ${info.role}\n- Company: ${info.companyName}\n- Scheduled: ${new Date(info.scheduledStartTime).toLocaleString()}\n- Access from: ${new Date(info.accessibleFrom).toLocaleString()}\n- Time until access: ${info.timeUntilAccess} minutes`);
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Failed to access session');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeInterview = async () => {
    if (!sessionData || !accessForm.accessToken) return;

    setLoadingInterview(true);
    try {
      const response = await axios.post(`${config.AI_BACKEND_URL}/api/sessions/initialize-interview/${sessionData.sessionId}`, {
        accessToken: accessForm.accessToken
      });

      if (response.data.success) {
        setInterviewData(response.data.interviewData);
        setInterviewInitialized(true);
        console.log('Interview initialized:', response.data);
        alert('Interview session has been initialized! You can now start the interview.');
      } else {
        alert('Failed to initialize interview: ' + response.data.error);
      }
    } catch (err) {
      alert('Error initializing interview: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingInterview(false);
    }
  };

  const handleEndSession = async () => {
    if (!sessionData || !accessForm.accessToken) return;

    try {
      const response = await axios.post(`${config.AI_BACKEND_URL}/api/sessions/end/${sessionData.sessionId}`, {
        accessToken: accessForm.accessToken
      });

      if (response.data.success) {
        alert('Session ended successfully');
        setSessionData(null);
        setInterviewData(null);
        setInterviewInitialized(false);
      } else {
        alert('Failed to end session: ' + response.data.error);
      }
    } catch (err) {
      alert('Error ending session: ' + (err.response?.data?.error || err.message));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'text-blue-600',
      active: 'text-green-600',
      completed: 'text-gray-600',
      expired: 'text-red-600',
      cancelled: 'text-red-500'
    };
    return colors[status] || 'text-gray-500';
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (sessionData) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            AI Technical Interview
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Session ID: {sessionData.sessionId}</span>
            <span className={`font-semibold ${getStatusColor(sessionData.status)}`}>
              Status: {sessionData.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Candidate Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Candidate Information</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Name:</span> {sessionData.candidateName}</p>
              <p><span className="font-medium">Role:</span> {sessionData.role}</p>
              <p><span className="font-medium">Company:</span> {sessionData.companyName}</p>
            </div>
          </div>

          {/* Session Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Session Details</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Start Time:</span> {formatTime(sessionData.scheduledStartTime)}</p>
              <p><span className="font-medium">End Time:</span> {formatTime(sessionData.scheduledEndTime)}</p>
              <p><span className="font-medium">Duration:</span> {sessionData.duration} minutes</p>
              <p><span className="font-medium">Time Remaining:</span> 
                <span className={`ml-1 ${sessionData.timeRemaining <= 10 ? 'text-red-600 font-semibold' : 'text-green-600'}`}>
                  {sessionData.timeRemaining} minutes
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Session Status */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-medium text-blue-800">Interview Session Active</h4>
              <p className="text-blue-700">
                {sessionData.isActive 
                  ? `You joined at ${formatTime(sessionData.joinedAt)}` 
                  : 'Session is ready to begin'}
              </p>
              {sessionData.totalTimeSpent && (
                <p className="text-blue-700">Total time spent: {sessionData.totalTimeSpent} minutes</p>
              )}
            </div>
            <div className="flex gap-2">
              {!interviewInitialized && (
                <button
                  onClick={handleInitializeInterview}
                  disabled={loadingInterview}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {loadingInterview ? 'Loading...' : 'Start Interview'}
                </button>
              )}
              <button
                onClick={handleEndSession}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                End Session
              </button>
            </div>
          </div>
        </div>

        {/* Interview Data Display */}
        {interviewData && (
          <div className="space-y-6 mb-8">
            {/* Candidate Profile */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">📋 Interview Profile Loaded</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><span className="font-medium">Position:</span> {interviewData.candidateProfile?.position || sessionData.role}</p>
                  <p><span className="font-medium">Experience:</span> {interviewData.candidateProfile?.experience || 'Not specified'}</p>
                  <p><span className="font-medium">Data Source:</span> 
                    <span className={`ml-2 px-2 py-1 text-xs rounded ${
                      interviewData.metadata?.dataSource === 'database' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {interviewData.metadata?.dataSource || 'Unknown'}
                    </span>
                  </p>
                </div>
                <div>
                  <p><span className="font-medium">Skills:</span> {
                    Array.isArray(interviewData.candidateProfile?.skills) 
                      ? interviewData.candidateProfile.skills.join(', ')
                      : (interviewData.candidateProfile?.skills || sessionData.role)
                  }</p>
                  <p><span className="font-medium">Questions Prepared:</span> {interviewData.interviewQuestions?.length || 0}</p>
                  <p><span className="font-medium">Coding Tasks:</span> {interviewData.codingTasks?.length || 0}</p>
                </div>
              </div>
            </div>

            {/* Interview Questions Preview */}
            <div className="bg-gray-50 p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">❓ Interview Questions</h3>
              <div className="max-h-40 overflow-y-auto">
                {interviewData.interviewQuestions?.length > 0 ? (
                  <ol className="space-y-2">
                    {interviewData.interviewQuestions.slice(0, 5).map((question, index) => (
                      <li key={index} className="text-sm text-gray-700">
                        <span className="font-medium">{index + 1}.</span> {question}
                      </li>
                    ))}
                    {interviewData.interviewQuestions.length > 5 && (
                      <li className="text-sm text-gray-500 italic">
                        ... and {interviewData.interviewQuestions.length - 5} more questions
                      </li>
                    )}
                  </ol>
                ) : (
                  <p className="text-gray-500">No questions available</p>
                )}
              </div>
            </div>

            {/* Coding Tasks Preview */}
            <div className="bg-gray-50 p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">💻 Coding Tasks</h3>
              <div className="space-y-3">
                {interviewData.codingTasks?.length > 0 ? (
                  interviewData.codingTasks.map((task, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <h4 className="font-medium text-gray-800">{task.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{task.description?.slice(0, 150)}...</p>
                      <div className="flex gap-2 mt-2">
                        {task.languageHints?.map((lang, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No coding tasks available</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Interview Interface Placeholder */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <h3 className="text-xl font-medium text-gray-700 mb-4">
            Interview Interface
          </h3>
          <p className="text-gray-600 mb-4">
            This is where the actual interview interface would be loaded.
          </p>
          <div className="space-y-3 text-left max-w-md mx-auto">
            <p className="text-sm text-gray-600">• Voice/video chat interface</p>
            <p className="text-sm text-gray-600">• Code editor integration</p>
            <p className="text-sm text-gray-600">• Question display</p>
            <p className="text-sm text-gray-600">• Real-time collaboration tools</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Access Interview Session</h2>
      
      {/* Access Mode Tabs */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setAccessMode('candidate')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            accessMode === 'candidate' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          👤 Candidate ID
        </button>
        <button
          onClick={() => setAccessMode('session')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            accessMode === 'session' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🔐 Session Details
        </button>
      </div>

      {/* Candidate ID Access */}
      {accessMode === 'candidate' && (
        <form onSubmit={(e) => { e.preventDefault(); handleAccessByCandidateId(); }} className="space-y-4">
          <div>
            <label htmlFor="candidateId" className="block text-sm font-medium text-gray-700 mb-1">
              Candidate ID
            </label>
            <input
              type="text"
              id="candidateId"
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your candidate ID"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Use the candidate ID provided in your interview invitation email
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <pre className="text-red-600 text-sm whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !candidateId}
            className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Accessing...' : 'Access My Interview'}
          </button>
        </form>
      )}

      {/* Session Details Access */}
      {accessMode === 'session' && (
        <form onSubmit={(e) => { e.preventDefault(); handleAccessSession(); }} className="space-y-4">
          <div>
            <label htmlFor="sessionId" className="block text-sm font-medium text-gray-700 mb-1">
              Session ID
            </label>
            <input
              type="text"
              id="sessionId"
              value={accessForm.sessionId}
              onChange={(e) => setAccessForm({ ...accessForm, sessionId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter session ID"
              required
            />
          </div>

          <div>
            <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700 mb-1">
              Access Token
            </label>
            <input
              type="text"
              id="accessToken"
              value={accessForm.accessToken}
              onChange={(e) => setAccessForm({ ...accessForm, accessToken: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter access token"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <pre className="text-red-600 text-sm whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Accessing...' : 'Access Session'}
          </button>
        </form>
      )}

      <div className="mt-6 space-y-2">
        <div className="text-xs text-gray-500">
          <p><strong>👤 Candidate ID:</strong> Easy access using just your candidate ID</p>
          <p><strong>🔐 Session Details:</strong> Access using session ID and token from URL</p>
        </div>
        <div className="text-xs text-gray-400 border-t pt-2">
          <p>Need help? Contact your recruiter for assistance.</p>
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;