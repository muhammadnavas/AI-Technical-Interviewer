import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const HomePage = () => {
    const navigate = useNavigate()
    const [sessionData, setSessionData] = useState(null)
    const [messages, setMessages] = useState([])
    const [inputMessage, setInputMessage] = useState('')
    const [isRecording, setIsRecording] = useState(false)
    const [interviewStatus, setInterviewStatus] = useState('active') // active, paused, ended
    const [isVideoEnabled, setIsVideoEnabled] = useState(false)
    const [isAudioEnabled, setIsAudioEnabled] = useState(true)
    const [isTyping, setIsTyping] = useState(false)
    const [questionsAnswered, setQuestionsAnswered] = useState(3)
    const [interviewDuration, setInterviewDuration] = useState(0)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [voiceEnabled, setVoiceEnabled] = useState(true)
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [autoSubmitCountdown, setAutoSubmitCountdown] = useState(0)
    const videoRef = useRef(null)
    const streamRef = useRef(null)
    const messagesEndRef = useRef(null)
    const chatContainerRef = useRef(null)
    const speechSynthesisRef = useRef(null)
    const recognitionRef = useRef(null)
    const autoSubmitTimerRef = useRef(null)
    const pendingMessageRef = useRef('')
    const countdownIntervalRef = useRef(null)

    // Text-to-Speech function
    const speakText = (text) => {
        if (!voiceEnabled || !('speechSynthesis' in window)) return

        // Cancel any ongoing speech
        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)
        
        // Configure voice settings
        utterance.rate = 0.9 // Slightly slower for clarity
        utterance.pitch = 1.0
        utterance.volume = 1.0
        
        // Get available voices and prefer a professional sounding one
        const voices = window.speechSynthesis.getVoices()
        const preferredVoice = voices.find(voice => 
            voice.name.includes('Google') || 
            voice.name.includes('Microsoft') ||
            voice.lang.startsWith('en')
        )
        if (preferredVoice) {
            utterance.voice = preferredVoice
        }

        utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = () => setIsSpeaking(false)

        speechSynthesisRef.current = utterance
        window.speechSynthesis.speak(utterance)
    }

    // Initialize Speech Recognition
    const initializeSpeechRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        
        if (!SpeechRecognition) {
            console.error('Speech recognition not supported')
            return null
        }

        const recognition = new SpeechRecognition()
        recognition.continuous = false // Changed to false for auto-stop
        recognition.interimResults = true
        recognition.lang = 'en-IN'
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
            setIsListening(true)
            setIsRecording(true)
        }

        recognition.onresult = (event) => {
            let interimTranscript = ''
            let finalTranscript = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' '
                } else {
                    interimTranscript += transcript
                }
            }

            if (finalTranscript) {
                setInputMessage(prev => {
                    const newMessage = prev + finalTranscript
                    pendingMessageRef.current = newMessage // Store for auto-submit
                    return newMessage
                })
                setTranscript('')
            } else {
                setTranscript(interimTranscript)
            }
        }

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error)
            setIsListening(false)
            setIsRecording(false)
            if (autoSubmitTimerRef.current) {
                clearTimeout(autoSubmitTimerRef.current)
            }
        }

        recognition.onend = () => {
            setIsListening(false)
            setIsRecording(false)
            setTranscript('')
            
            // Auto-submit after speech ends (with a countdown) only if there's content
            if (pendingMessageRef.current.trim().length > 0) {
                let countdown = 3 // 3 seconds countdown
                setAutoSubmitCountdown(countdown)
                
                // Countdown interval
                countdownIntervalRef.current = setInterval(() => {
                    countdown -= 1
                    setAutoSubmitCountdown(countdown)
                    
                    if (countdown <= 0) {
                        clearInterval(countdownIntervalRef.current)
                    }
                }, 1000)
                
                // Auto-submit timer
                autoSubmitTimerRef.current = setTimeout(() => {
                    if (pendingMessageRef.current.trim().length > 0) {
                        handleSendMessage()
                        pendingMessageRef.current = ''
                    }
                    setAutoSubmitCountdown(0)
                }, 3000) // 3 second delay
            }
        }

        return recognition
    }

    // Start voice recording
    const startRecording = () => {
        if (!recognitionRef.current) {
            recognitionRef.current = initializeSpeechRecognition()
        }

        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.')
            return
        }

        try {
            recognitionRef.current.start()
        } catch (error) {
            console.error('Error starting recognition:', error)
        }
    }

    // Stop voice recording manually
    const stopRecording = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop()
        }
    }

    // Cancel auto-submit
    const cancelAutoSubmit = () => {
        if (autoSubmitTimerRef.current) {
            clearTimeout(autoSubmitTimerRef.current)
            autoSubmitTimerRef.current = null
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
            countdownIntervalRef.current = null
        }
        setAutoSubmitCountdown(0)
    }

    // Toggle voice recording
    const toggleRecording = () => {
        if (isListening) {
            stopRecording()
        } else {
            startRecording()
        }
    }

    const handleSendMessage = async () => {
        if (inputMessage.trim() && sessionData) {
            // Clear auto-submit timer if exists
            if (autoSubmitTimerRef.current) {
                clearTimeout(autoSubmitTimerRef.current)
                autoSubmitTimerRef.current = null
            }
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current)
                countdownIntervalRef.current = null
            }
            setAutoSubmitCountdown(0)
            
            const newMessage = {
                role: 'candidate',
                content: inputMessage,
                timestamp: new Date().toLocaleTimeString()
            }
            setMessages([...messages, newMessage])
            setInputMessage('')
            pendingMessageRef.current = '' // Clear pending message
            setIsTyping(true)
            
            try {
                // Get AI response from backend
                const response = await fetch('http://localhost:5000/api/interview/message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sessionId: sessionData.sessionId,
                        message: inputMessage
                    })
                })

                const data = await response.json()

                if (data.success) {
                    const aiResponse = {
                        role: 'interviewer',
                        content: data.response,
                        timestamp: new Date().toLocaleTimeString()
                    }
                    setMessages(prev => [...prev, aiResponse])
                    setQuestionsAnswered(prev => prev + 1)
                } else {
                    console.error('Error getting AI response:', data.error)
                    // Fallback to generic response
                    const aiResponse = {
                        role: 'interviewer',
                        content: 'I apologize, I had trouble processing your answer. Could you please try again?',
                        timestamp: new Date().toLocaleTimeString()
                    }
                    setMessages(prev => [...prev, aiResponse])
                }
            } catch (error) {
                console.error('Error communicating with backend:', error)
                const aiResponse = {
                    role: 'interviewer',
                    content: 'Sorry, I\'m having connection issues. Please make sure the backend server is running.',
                    timestamp: new Date().toLocaleTimeString()
                }
                setMessages(prev => [...prev, aiResponse])
            } finally {
                setIsTyping(false)
            }
        }
    }

    const endInterview = async () => {
        setInterviewStatus('ended')
        stopVideo()
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop()
        }

        // End session on backend
        if (sessionData) {
            try {
                await fetch('http://localhost:5000/api/interview/end', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sessionId: sessionData.sessionId
                    })
                })
            } catch (error) {
                console.error('Error ending interview:', error)
            }
        }

        // Clear session data
        localStorage.removeItem('interviewSession')
    }

    const startVideo = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
            streamRef.current = stream
            setIsVideoEnabled(true)
        } catch (err) {
            console.error("Error accessing camera:", err)
            alert("Unable to access camera. Please grant camera permissions.")
        }
    }

    const stopVideo = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            if (videoRef.current) {
                videoRef.current.srcObject = null
            }
            streamRef.current = null
            setIsVideoEnabled(false)
        }
    }

    const toggleVideo = () => {
        if (isVideoEnabled) {
            stopVideo()
        } else {
            startVideo()
        }
    }

    const toggleAudio = () => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled
                setIsAudioEnabled(audioTrack.enabled)
            }
        }
    }

    useEffect(() => {
        // Load session data
        const session = localStorage.getItem('interviewSession')
        if (!session) {
            // Redirect to setup page if no session
            navigate('/')
            return
        }

        const parsedSession = JSON.parse(session)
        setSessionData(parsedSession)

        // Set initial message
        setMessages([{
            role: 'interviewer',
            content: parsedSession.initialMessage,
            timestamp: new Date().toLocaleTimeString()
        }])

        // Auto-start video when component mounts
        startVideo()

        // Interview duration timer
        const timer = setInterval(() => {
            setInterviewDuration(prev => prev + 1)
        }, 1000)

        // Load voices for speech synthesis
        if ('speechSynthesis' in window) {
            // Some browsers need this to load voices
            window.speechSynthesis.getVoices()
        }

        // Cleanup on unmount
        return () => {
            stopVideo()
            clearInterval(timer)
            window.speechSynthesis.cancel()
            if (recognitionRef.current && isListening) {
                recognitionRef.current.stop()
            }
            if (autoSubmitTimerRef.current) {
                clearTimeout(autoSubmitTimerRef.current)
            }
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current)
            }
        }
    }, [])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Text-to-Speech for AI messages
    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1]
            if (lastMessage.role === 'interviewer' && !isTyping) {
                // Slight delay to let the message render
                setTimeout(() => {
                    speakText(lastMessage.content)
                }, 500)
            }
        }
    }, [messages, isTyping, voiceEnabled])

    // Format duration (seconds to MM:SS)
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <div className="bg-white shadow-md border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">AI Technical Interviewer</h1>
                                <p className="text-sm text-gray-500">
                                    {sessionData ? `${sessionData.candidateName} - ${sessionData.position}` : 'Interview Session'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${interviewStatus === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                <span className="text-sm font-medium text-gray-700 capitalize">{interviewStatus}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                                <span className="font-semibold">Duration:</span> {formatDuration(interviewDuration)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Chat Area */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[calc(100vh-220px)]">
                            {/* Messages */}
                            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                                {messages.map((message, index) => (
                                    <div key={index} className={`flex ${message.role === 'candidate' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                        <div className={`flex items-start space-x-3 max-w-3xl ${message.role === 'candidate' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                            {message.role === 'interviewer' ? (
                                                // AI Interviewer Avatar with image
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 ring-2 ring-indigo-200 transform hover:scale-110 transition-transform">
                                                    <img 
                                                        src="https://api.dicebear.com/7.x/bottts/svg?seed=AI-Interviewer&backgroundColor=4f46e5" 
                                                        alt="AI Interviewer"
                                                        className="w-full h-full rounded-full"
                                                    />
                                                </div>
                                            ) : (
                                                // Candidate Avatar
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-green-500 to-emerald-600 ring-2 ring-green-200 transform hover:scale-110 transition-transform">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                            )}
                                            <div className={`rounded-2xl px-4 py-3 shadow-md hover:shadow-lg transition-shadow ${
                                                message.role === 'interviewer' 
                                                    ? 'bg-gray-100 text-gray-800' 
                                                    : 'bg-indigo-600 text-white'
                                            }`}>
                                                <p className="text-sm leading-relaxed">{message.content}</p>
                                                <p className={`text-xs mt-1 ${
                                                    message.role === 'interviewer' ? 'text-gray-500' : 'text-indigo-200'
                                                }`}>{message.timestamp}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Typing Indicator */}
                                {isTyping && (
                                    <div className="flex justify-start animate-fade-in">
                                        <div className="flex items-start space-x-3 max-w-3xl">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 ring-2 ring-indigo-200">
                                                <img 
                                                    src="https://api.dicebear.com/7.x/bottts/svg?seed=AI-Interviewer&backgroundColor=4f46e5" 
                                                    alt="AI Interviewer"
                                                    className="w-full h-full rounded-full"
                                                />
                                            </div>
                                            <div className="bg-gray-100 rounded-2xl px-4 py-3 shadow-md">
                                                <div className="flex space-x-2">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Voice Input Area */}
                            <div className="border-t border-gray-200 p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                                <div className="flex flex-col items-center space-y-4">
                                    {/* Voice Transcript Display */}
                                    <div className="w-full bg-white rounded-lg border-2 border-gray-300 p-4 min-h-[100px] max-h-[150px] overflow-y-auto">
                                        {inputMessage ? (
                                            <p className="text-gray-800 whitespace-pre-wrap">{inputMessage}</p>
                                        ) : (
                                            <p className="text-gray-400 italic text-center">
                                                {isListening ? "🎤 Listening... Speak your answer" : "Click the microphone to start speaking"}
                                            </p>
                                        )}
                                        
                                        {/* Real-time transcript preview */}
                                        {isListening && transcript && (
                                            <p className="text-blue-600 mt-2 animate-pulse">
                                                <span className="font-semibold">Transcribing: </span>{transcript}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center space-x-4">
                                        {/* Large Voice Input Button */}
                                        <button 
                                            onClick={toggleRecording}
                                            className={`p-6 rounded-full transition-all transform hover:scale-110 active:scale-95 shadow-xl ${
                                                isListening 
                                                    ? 'bg-red-600 hover:bg-red-700 animate-pulse shadow-red-500/50' 
                                                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/50'
                                            }`}
                                            title={isListening ? 'Stop Voice Input' : 'Start Voice Input'}
                                        >
                                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                {isListening ? (
                                                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z M19 11h2c0 .91-.13 1.8-.37 2.65l-1.73-1.73c.07-.3.1-.61.1-.92z M4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
                                                ) : (
                                                    <>
                                                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                                                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                                                    </>
                                                )}
                                            </svg>
                                        </button>
                                        
                                        {/* Status Text */}
                                        <div className="text-center">
                                            <p className={`font-semibold text-lg ${isListening ? 'text-red-600' : autoSubmitCountdown > 0 ? 'text-green-600' : 'text-blue-600'}`}>
                                                {isListening ? '🔴 Recording...' : autoSubmitCountdown > 0 ? `✅ Auto-sending in ${autoSubmitCountdown}s` : '🎤 Ready to Listen'}
                                            </p>
                                            <p className="text-gray-500 text-sm mt-1">
                                                {isListening 
                                                    ? 'Click microphone to stop or wait for auto-stop' 
                                                    : autoSubmitCountdown > 0 
                                                        ? 'Answer will be sent automatically'
                                                        : 'Your answer will be sent when you stop speaking'
                                                }
                                            </p>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        {autoSubmitCountdown > 0 ? (
                                            <button 
                                                onClick={cancelAutoSubmit}
                                                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full transition-all font-semibold transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl flex items-center space-x-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                <span>Cancel Send</span>
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={handleSendMessage}
                                                disabled={!inputMessage.trim() || isTyping}
                                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-4 rounded-full transition-all font-semibold transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl disabled:shadow-none flex items-center space-x-2"
                                            >
                                                <span>Send Now</span>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* Clear Button */}
                                    {inputMessage && !isListening && autoSubmitCountdown === 0 && (
                                        <button 
                                            onClick={() => {
                                                setInputMessage('')
                                                pendingMessageRef.current = ''
                                            }}
                                            className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center space-x-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            <span>Clear Text</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* AI Interviewer Display */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3">
                                <h3 className="text-lg font-semibold text-white flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    AI Interviewer
                                </h3>
                            </div>
                            <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 aspect-video overflow-hidden">
                                {/* Animated background */}
                                <div className="absolute inset-0">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 animate-pulse-slow"></div>
                                    {/* Floating particles */}
                                    <div className="absolute top-10 left-10 w-2 h-2 bg-purple-400 rounded-full animate-ping"></div>
                                    <div className="absolute top-20 right-16 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                                    <div className="absolute bottom-16 left-20 w-2.5 h-2.5 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                                </div>
                                
                                {/* AI Avatar */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center z-10">
                                        {/* Main AI Avatar */}
                                        <div className="relative inline-block">
                                            <div className={`w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 p-1 ${isSpeaking ? 'animate-pulse' : 'animate-pulse-slow'}`}>
                                                <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center overflow-hidden">
                                                    <img 
                                                        src="https://api.dicebear.com/7.x/bottts/svg?seed=AI-Interviewer&backgroundColor=312e81&scale=80" 
                                                        alt="AI Interviewer"
                                                        className={`w-full h-full ${isTyping ? 'animate-bounce' : isSpeaking ? 'scale-110 transition-transform' : ''}`}
                                                    />
                                                </div>
                                            </div>
                                            {/* Rings around avatar - more intense when speaking */}
                                            <div className={`absolute inset-0 rounded-full border-2 border-purple-400 ${isSpeaking ? 'opacity-80' : 'opacity-50'} animate-ping`}></div>
                                            <div className={`absolute inset-0 rounded-full border-2 border-indigo-400 ${isSpeaking ? 'opacity-60' : 'opacity-30'} animate-ping`} style={{animationDelay: '0.5s'}}></div>
                                            {isSpeaking && (
                                                <div className="absolute inset-0 rounded-full border-2 border-green-400 opacity-70 animate-ping"></div>
                                            )}
                                        </div>
                                        
                                        {/* AI Status */}
                                        <div className="mt-4">
                                            <p className="text-white font-semibold text-lg">AI Interview Assistant</p>
                                            <div className="flex items-center justify-center mt-2 space-x-2">
                                                {isTyping ? (
                                                    <>
                                                        <div className="flex space-x-1">
                                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                                                        </div>
                                                        <span className="text-green-400 text-sm font-medium">Thinking...</span>
                                                    </>
                                                ) : isSpeaking ? (
                                                    <>
                                                        <div className="flex space-x-1">
                                                            <div className="w-1 h-3 bg-blue-400 rounded animate-pulse" style={{animationDelay: '0ms'}}></div>
                                                            <div className="w-1 h-4 bg-blue-400 rounded animate-pulse" style={{animationDelay: '100ms'}}></div>
                                                            <div className="w-1 h-5 bg-blue-400 rounded animate-pulse" style={{animationDelay: '200ms'}}></div>
                                                            <div className="w-1 h-4 bg-blue-400 rounded animate-pulse" style={{animationDelay: '300ms'}}></div>
                                                            <div className="w-1 h-3 bg-blue-400 rounded animate-pulse" style={{animationDelay: '400ms'}}></div>
                                                        </div>
                                                        <span className="text-blue-400 text-sm font-medium">Speaking...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                                        <span className="text-green-400 text-sm font-medium">Active</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Sound wave visualization when speaking */}
                                        {isTyping && (
                                            <div className="flex items-center justify-center space-x-1 mt-4">
                                                {[...Array(5)].map((_, i) => (
                                                    <div 
                                                        key={i}
                                                        className="w-1 bg-purple-400 rounded-full"
                                                        style={{
                                                            height: '20px',
                                                            animation: `pulse 0.8s ease-in-out infinite`,
                                                            animationDelay: `${i * 0.1}s`
                                                        }}
                                                    ></div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* AI Active Indicator */}
                                <div className="absolute top-3 right-3 flex items-center space-x-2 bg-black bg-opacity-60 px-3 py-1.5 rounded-full">
                                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-white text-xs font-medium">ONLINE</span>
                                </div>
                            </div>
                        </div>

                        {/* Candidate Video Stream */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3">
                                <h3 className="text-lg font-semibold text-white flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Your Live Video
                                </h3>
                            </div>
                            <div className="relative bg-gray-900 aspect-video">
                                {/* Live Video Stream */}
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    muted 
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                {!isVideoEnabled && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                        <div className="text-center">
                                            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <p className="text-gray-400 text-sm">Camera Off</p>
                                        </div>
                                    </div>
                                )}
                                {/* Recording Indicator */}
                                {isVideoEnabled && (
                                    <div className="absolute top-3 left-3 flex items-center space-x-2 bg-black bg-opacity-60 px-3 py-1.5 rounded-full">
                                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                                        <span className="text-white text-xs font-medium">LIVE</span>
                                    </div>
                                )}
                                
                                {/* Listening Indicator */}
                                {isListening && (
                                    <div className="absolute top-3 right-3 flex items-center space-x-2 bg-blue-600 bg-opacity-90 px-3 py-1.5 rounded-full animate-pulse">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                                        </svg>
                                        <span className="text-white text-xs font-medium">LISTENING</span>
                                        <div className="flex space-x-0.5">
                                            <div className="w-1 h-2 bg-white rounded animate-pulse" style={{animationDelay: '0ms'}}></div>
                                            <div className="w-1 h-3 bg-white rounded animate-pulse" style={{animationDelay: '100ms'}}></div>
                                            <div className="w-1 h-4 bg-white rounded animate-pulse" style={{animationDelay: '200ms'}}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-gray-50 flex justify-center space-x-3">
                                <button 
                                    onClick={toggleVideo}
                                    className={`p-3 rounded-lg transition-colors ${
                                        isVideoEnabled 
                                            ? 'bg-green-600 hover:bg-green-700' 
                                            : 'bg-gray-600 hover:bg-gray-700'
                                    }`}
                                    title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                                >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {isVideoEnabled ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        )}
                                    </svg>
                                </button>
                                <button 
                                    onClick={toggleAudio}
                                    className={`p-3 rounded-lg transition-colors ${
                                        isAudioEnabled 
                                            ? 'bg-green-600 hover:bg-green-700' 
                                            : 'bg-red-600 hover:bg-red-700'
                                    }`}
                                    title={isAudioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                                >
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        {isAudioEnabled ? (
                                            <>
                                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                                                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                                            </>
                                        ) : (
                                            <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
                                        )}
                                    </svg>
                                </button>
                                
                                {/* AI Voice Toggle */}
                                <button 
                                    onClick={() => {
                                        setVoiceEnabled(!voiceEnabled)
                                        if (isSpeaking) {
                                            window.speechSynthesis.cancel()
                                        }
                                    }}
                                    className={`p-3 rounded-lg transition-colors ${
                                        voiceEnabled 
                                            ? 'bg-blue-600 hover:bg-blue-700' 
                                            : 'bg-gray-600 hover:bg-gray-700'
                                    }`}
                                    title={voiceEnabled ? 'Disable AI Voice' : 'Enable AI Voice'}
                                >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {voiceEnabled ? (
                                            <>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            </>
                                        ) : (
                                            <>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                <line strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} x1="17" y1="9" x2="23" y2="15" />
                                                <line strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} x1="23" y1="9" x2="17" y2="15" />
                                            </>
                                        )}
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HomePage