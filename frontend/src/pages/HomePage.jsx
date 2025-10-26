import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AIAvatar3D from '../components/AIAvatar3D'

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
    const [showCodeEditor, setShowCodeEditor] = useState(false)
    const [codeEditorUrl, setCodeEditorUrl] = useState('')
    const [isAwaitingCodeEvaluation, setIsAwaitingCodeEvaluation] = useState(false)
    const [editorAcknowledged, setEditorAcknowledged] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [autoSubmitCountdown, setAutoSubmitCountdown] = useState(0)
    const videoRef = useRef(null)
                                
    const streamRef = useRef(null)
    const messagesEndRef = useRef(null)
    const chatContainerRef = useRef(null)
    const iframeRef = useRef(null)
    const speechSynthesisRef = useRef(null)
    const recognitionRef = useRef(null)
    const prevListeningRef = useRef(false)
    const suppressRecognitionRef = useRef(false)
    const autoSubmitTimerRef = useRef(null)
    const pendingMessageRef = useRef('')
    const countdownIntervalRef = useRef(null)
    const typingAutoSendTimerRef = useRef(null)
    const typingAutoSendIntervalRef = useRef(null)
    const [typingAutoSendCountdown, setTypingAutoSendCountdown] = useState(0)

    // Text-to-Speech function
    const speakText = (text) => {
        if (!voiceEnabled || !('speechSynthesis' in window)) return

        // Cancel any ongoing speech
        window.speechSynthesis.cancel()

        // If recognition is active, remember that and stop it to avoid capturing AI speech
        try {
            // Remember if recognition existed (state may lag) and suppress incoming results
            prevListeningRef.current = Boolean(recognitionRef.current) || isListening
            suppressRecognitionRef.current = true
            if (recognitionRef.current) {
                try {
                    // Abort to immediately cancel and avoid further events
                    recognitionRef.current.abort()
                } catch (e) {
                    try { recognitionRef.current.stop() } catch (e2) {}
                }
                recognitionRef.current = null
            }
            setIsListening(false)
        } catch (e) {
            console.warn('Error while pausing recognition for TTS:', e)
        }

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
        utterance.onend = () => {
            setIsSpeaking(false)
            // Stop suppressing recognition results and restart if needed
            suppressRecognitionRef.current = false
            if (prevListeningRef.current) {
                prevListeningRef.current = false
                try {
                    startRecording()
                } catch (err) {
                    console.warn('Failed to restart recognition after TTS:', err)
                }
            }
        }
        utterance.onerror = () => {
            setIsSpeaking(false)
            suppressRecognitionRef.current = false
            // Attempt to resume recognition if needed
            if (prevListeningRef.current) {
                prevListeningRef.current = false
                try { startRecording() } catch (err) {/* ignore */}
            }
        }

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
            // Automatically enable speaker (text-to-speech) when the user starts speaking
            setVoiceEnabled(true)
            // While speaking, disable typing by preventing key input (handled in a global listener)
        }

        recognition.onresult = (event) => {
            // If we're suppressing recognition (AI is speaking), ignore results
            if (suppressRecognitionRef.current) return
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
            // Suppress noisy errors when we've intentionally aborted/suppressed recognition
            const errCode = event && event.error ? event.error : null
            if (suppressRecognitionRef.current && (errCode === 'aborted' || errCode === 'no-speech')) {
                // silently ignore
                return
            }
            // For other errors, log them
            console.error('Speech recognition error:', errCode || event)
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

            // Immediately submit after speech ends if there's content (no countdown)
            if (pendingMessageRef.current && pendingMessageRef.current.trim().length > 0) {
                try {
                    handleSendMessage()
                } catch (err) {
                    console.error('Error auto-sending after speech end:', err)
                }
                pendingMessageRef.current = ''
                setAutoSubmitCountdown(0)

                // Clear any leftover timers
                if (autoSubmitTimerRef.current) {
                    clearTimeout(autoSubmitTimerRef.current)
                    autoSubmitTimerRef.current = null
                }
                if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current)
                    countdownIntervalRef.current = null
                }
            }
        }

        // return the recognition instance so callers can start/stop it
        return recognition
    }

    // Stop voice recording manually
    const stopRecording = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop()
        }
    }

    // Toggle voice recording
    const toggleRecording = () => {
        if (isListening) {
            stopRecording()
        } else {
            startRecording()
        }
    }

    // Programmatic start for speech recognition (used for auto-start)
    const startRecording = () => {
        if (isListening) return
        const recognition = initializeSpeechRecognition()
        if (!recognition) return
        recognitionRef.current = recognition
        // Ensure suppression is off when starting recognition
        suppressRecognitionRef.current = false
        try {
            recognition.start()
        } catch (err) {
            console.warn('Speech recognition start failed:', err)
            // start failed; nothing else to do here
        }
    }

    const handleSendMessage = async () => {
        // Ensure we have an active interview session before sending
        if (!sessionData || !sessionData.sessionId) {
            console.error('No active interview session—cannot send message')
            const aiResponse = {
                role: 'interviewer',
                content: 'No active interview session. Please (re)start the interview.',
                timestamp: new Date().toLocaleTimeString()
            }
            setMessages(prev => [...prev, aiResponse])
            setInputMessage('')
            pendingMessageRef.current = ''
            return
        }

        if (inputMessage.trim()) {
            // Clear auto-submit timer if exists
            if (autoSubmitTimerRef.current) {
                clearTimeout(autoSubmitTimerRef.current)
                autoSubmitTimerRef.current = null
            }
            // Clear typing auto-send timers
            if (typingAutoSendTimerRef.current) {
                clearTimeout(typingAutoSendTimerRef.current)
                typingAutoSendTimerRef.current = null
            }
            if (typingAutoSendIntervalRef.current) {
                clearInterval(typingAutoSendIntervalRef.current)
                typingAutoSendIntervalRef.current = null
            }
            setTypingAutoSendCountdown(0)
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

                if (!response.ok) {
                    // Backend returned an HTTP error (404/500/etc). Try to read body for details.
                    const text = await response.text().catch(() => null)
                    console.error('Backend error', response.status, text)
                    const aiResponse = {
                        role: 'interviewer',
                        content: `Sorry, the interview service returned an error (${response.status}).`,
                        timestamp: new Date().toLocaleTimeString()
                    }
                    setMessages(prev => [...prev, aiResponse])
                } else {
                    const data = await response.json()
                    if (data && data.success) {
                        const aiResponse = {
                            role: 'interviewer',
                            content: data.response,
                            timestamp: new Date().toLocaleTimeString()
                        }
                        setMessages(prev => [...prev, aiResponse])
                        setQuestionsAnswered(prev => prev + 1)
                    } else {
                        console.error('Error getting AI response:', data && data.error)
                        const aiResponse = {
                            role: 'interviewer',
                            content: (data && data.error) ? data.error : 'I apologize, I had trouble processing your answer. Could you please try again?',
                            timestamp: new Date().toLocaleTimeString()
                        }
                        setMessages(prev => [...prev, aiResponse])
                    }
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

    // Cancel typing auto-send (manual cancel button)
    // (Auto-send cancel buttons removed - auto-send will proceed without manual cancel)

    const endInterview = async () => {
        setInterviewStatus('ended')
        stopVideo()
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop()
        }

        // End session on backend and save results
        if (sessionData) {
            try {
                const response = await fetch('http://localhost:5000/api/interview/end', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sessionId: sessionData.sessionId
                    })
                })

                const data = await response.json()
                
                if (data.success && data.fileName) {
                    // Show success message with file details
                    alert(
                        `✅ Interview Completed!\n\n` +
                        `Candidate: ${data.summary.candidateName}\n` +
                        `Duration: ${data.summary.duration}\n` +
                        `Questions Asked: ${data.summary.questionsAsked}\n\n` +
                        `Results saved to:\n${data.fileName}\n\n` +
                        `Thank you for participating!`
                    )
                    console.log('Interview saved:', data.fileName)
                }
            } catch (error) {
                console.error('Error ending interview:', error)
                alert('Interview ended. Results may not have been saved.')
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

    // Auto-start speech recognition when a session is available
    useEffect(() => {
        if (!sessionData) return
        try {
            startRecording()
        } catch (err) {
            console.warn('Auto-start recognition failed:', err)
        }

        // Note: cleanup (stop) on unmount is handled in the main session effect above
    }, [sessionData])

    // Keyboard shortcut: press 'm' to toggle microphone (user gesture to satisfy some browsers)
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'm' || e.key === 'M') {
                e.preventDefault()
                toggleRecording()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [isListening])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

        // Auto-send typed messages after a short debounce (800ms)
        useEffect(() => {
            const clearTypingTimers = () => {
                if (typingAutoSendTimerRef.current) {
                    clearTimeout(typingAutoSendTimerRef.current)
                    typingAutoSendTimerRef.current = null
                }
                if (typingAutoSendIntervalRef.current) {
                    clearInterval(typingAutoSendIntervalRef.current)
                    typingAutoSendIntervalRef.current = null
                }
                setTypingAutoSendCountdown(0)
            }

            // Do not auto-send while using voice recording
            if (isListening) {
                clearTypingTimers()
                return
            }

            // If no input, nothing to send
            if (!inputMessage || !inputMessage.trim()) {
                clearTypingTimers()
                return
            }

            // Start debounce timer (800ms) and a simple 1s countdown for UI feedback
            const delayMs = 800
            const delaySec = Math.ceil(delayMs / 1000)

            // Reset any previous timers
            clearTypingTimers()
            setTypingAutoSendCountdown(delaySec)

            typingAutoSendIntervalRef.current = setInterval(() => {
                setTypingAutoSendCountdown(prev => {
                    if (!prev || prev <= 1) {
                        // final tick - clear interval
                        if (typingAutoSendIntervalRef.current) {
                            clearInterval(typingAutoSendIntervalRef.current)
                            typingAutoSendIntervalRef.current = null
                        }
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)

            typingAutoSendTimerRef.current = setTimeout(async () => {
                // clear the interval
                if (typingAutoSendIntervalRef.current) {
                    clearInterval(typingAutoSendIntervalRef.current)
                    typingAutoSendIntervalRef.current = null
                }
                typingAutoSendTimerRef.current = null
                setTypingAutoSendCountdown(0)

                try {
                    await handleSendMessage()
                } catch (err) {
                    console.error('Error auto-sending typed message:', err)
                }
            }, delayMs)

            // Cleanup on dependency change/unmount
            return () => {
                clearTypingTimers()
            }
        }, [inputMessage, isListening])

        // Send immediately when user presses Enter (without Shift)
        useEffect(() => {
            const onKeyDown = (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    // Prevent newline insertion where a separate input is used
                    e.preventDefault()
                    if (isListening) return
                    if (inputMessage && inputMessage.trim()) {
                        // Clear any pending debounce timers before sending
                        if (typingAutoSendTimerRef.current) {
                            clearTimeout(typingAutoSendTimerRef.current)
                            typingAutoSendTimerRef.current = null
                        }
                        if (typingAutoSendIntervalRef.current) {
                            clearInterval(typingAutoSendIntervalRef.current)
                            typingAutoSendIntervalRef.current = null
                        }
                        setTypingAutoSendCountdown(0)
                        try {
                            handleSendMessage()
                        } catch (err) {
                            console.error('Error sending message on Enter:', err)
                        }
                    }
                }
            }

            window.addEventListener('keydown', onKeyDown)
            return () => window.removeEventListener('keydown', onKeyDown)
        }, [inputMessage, isListening])

        // When listening, prevent typing by blocking character keydowns globally
        useEffect(() => {
            const blockTyping = (e) => {
                if (!isListening) return
                // Allow control keys like Escape to stop recording, and allow function keys
                const allowed = ['Escape', 'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12','Tab','Shift','Control','Alt','Meta','ArrowLeft','ArrowRight','ArrowUp','ArrowDown']
                if (allowed.includes(e.key)) return
                // If key is a single printable character, prevent it
                if (e.key.length === 1) {
                    e.preventDefault()
                    e.stopPropagation()
                }
            }

            document.addEventListener('keydown', blockTyping, true)
            return () => document.removeEventListener('keydown', blockTyping, true)
        }, [isListening])

    // Text-to-Speech for AI messages
    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1]
            if (lastMessage.role === 'interviewer' && !isTyping) {
                // Slight delay to let the message render
                setTimeout(() => {
                    speakText(lastMessage.content)
                }, 500)
                // Detect if AI is asking for a coding test / coding exercise
                try {
                    const text = (lastMessage.content || '').toLowerCase()
                    const codingTriggers = [
                        'coding test',
                        'code challenge',
                        'coding exercise',
                        'please write code',
                        'implement',
                        'solve the problem',
                        'write a function',
                        'pair programming',
                        'open the code editor',
                        'coding task',
                        'build a solution',
                        'please implement',
                        'write code to'
                    ]

                    const triggered = codingTriggers.some(trigger => text.includes(trigger))
                    if (triggered && sessionData) {
                        // Build code editor URL with some context if available
                        const base = 'https://ai-code-editor-psi-two.vercel.app/'
                        const params = new URLSearchParams()
                        if (sessionData.sessionId) params.set('sessionId', sessionData.sessionId)
                        if (sessionData.candidateId) params.set('candidateId', sessionData.candidateId)
                        if (sessionData.candidateName) params.set('candidateName', sessionData.candidateName)
                        // If the session has a codeQuestionsUrl (generated by backend), pass it to the editor
                        if (sessionData.codeQuestionsUrl) params.set('codeQuestionsUrl', sessionData.codeQuestionsUrl)
                        const url = params.toString() ? `${base}?${params.toString()}` : base
                        setCodeEditorUrl(url)
                        // Slight delay to avoid abrupt UI change
                        setTimeout(() => setShowCodeEditor(true), 350)
                    }
                } catch (err) {
                    console.error('Error detecting coding trigger:', err)
                }
            }
        }
    }, [messages, isTyping, voiceEnabled])

    // When code editor panel opens, create a test session and notify backend + editor
    useEffect(() => {
        const notifyCodeStart = async () => {
            if (!showCodeEditor || !sessionData) return

            try {
                // 1) Create a dedicated test session for the code editor so it has its own sessionId and questions
                console.log('[notifyCodeStart] Creating test session for candidate', sessionData.candidateId)
                let testResp = null
                try {
                    const r = await fetch('http://localhost:5000/api/test/start-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ candidateId: sessionData.candidateId })
                    })
                    testResp = r.ok ? await r.json().catch(() => null) : null
                    console.log('[notifyCodeStart] /api/test/start-session response', r && r.status, testResp)
                } catch (err) {
                    console.warn('[notifyCodeStart] Failed to call /api/test/start-session', err)
                }

                // 2) Tell the interviewer that coding started (so it pauses)
                try {
                    const r2 = await fetch('http://localhost:5000/api/interview/code-start', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId: sessionData.sessionId, testName: 'Coding Test', candidateId: sessionData.candidateId })
                    })
                    console.log('[notifyCodeStart] /api/interview/code-start status', r2 && r2.status)
                } catch (err) {
                    console.warn('[notifyCodeStart] Failed to notify interview/code-start', err)
                }

                // 3) Build start message for iframe — include both interview sessionId and testSessionId + candidateId + tasks
                const startMsg = {
                    type: 'startCodingTest',
                    interviewSessionId: sessionData.sessionId,
                    candidateId: sessionData.candidateId,
                    testSessionId: testResp && testResp.sessionId ? testResp.sessionId : null,
                    tasks: []
                }

                // If the test start response provided the first question (or tasks), add it
                if (testResp) {
                    if (testResp.tasks) startMsg.tasks = testResp.tasks
                    else if (testResp.question) startMsg.tasks = [testResp.question]
                    else if (testResp.questions) startMsg.tasks = testResp.questions
                }

                // 4) Ensure iframe URL contains candidate/test context so the editor can read from window.location if needed
                try {
                    const base = 'https://ai-code-editor-psi-two.vercel.app/'
                    const params = new URLSearchParams()
                    if (sessionData.sessionId) params.set('interviewSessionId', sessionData.sessionId)
                    if (sessionData.candidateId) params.set('candidateId', sessionData.candidateId)
                    if (testResp && testResp.sessionId) params.set('testSessionId', testResp.sessionId)
                    const newUrl = params.toString() ? `${base}?${params.toString()}` : base
                    setCodeEditorUrl(newUrl)
                } catch (e) {
                    console.warn('Failed to build code editor URL with params', e)
                }

                // 5) Post start message to iframe (retry a few times until iframe acknowledges)
                const maxAttempts = 6
                let attempt = 0
                const editorUrl = codeEditorUrl || ''
                const origin = (() => { try { return editorUrl ? new URL(editorUrl).origin : '*' } catch (e) { return '*' } })()

                while (attempt < maxAttempts) {
                    attempt += 1
                    try {
                        if (iframeRef && iframeRef.current && iframeRef.current.contentWindow) {
                            console.log(`[notifyCodeStart] posting start message attempt ${attempt}`, startMsg)
                            iframeRef.current.contentWindow.postMessage(startMsg, origin || '*')
                        } else {
                            console.log('[notifyCodeStart] iframe not ready yet, will retry')
                        }
                    } catch (e) {
                        console.warn('postMessage to iframe failed on attempt', attempt, e)
                    }

                    // Wait for a short interval to allow iframe to load and potentially ack
                    await new Promise(r => setTimeout(r, 400))

                    // Stop early if editor acknowledged
                    if (editorAcknowledged) {
                        console.log('[notifyCodeStart] editor acknowledged start')
                        break
                    }
                }

            } catch (err) {
                console.warn('Error in notifyCodeStart flow:', err)
            }
        }

        notifyCodeStart()
    }, [showCodeEditor, sessionData])

    // Listen for postMessage events from embedded code editor and forward results to backend
    useEffect(() => {
        const allowedOrigins = [
            'https://ai-code-editor-psi-two.vercel.app',
            'https://ai-code-editor-psi-two.vercel.app/'
        ]

        const handleEditorMessage = async (event) => {
            console.log('[editor->parent] message received', { origin: event.origin, data: event.data })
            if (!event || !event.data) return

            // Basic origin check: allow explicit origins or localhost-dev
            const origin = event.origin || ''
            const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1')
            if (!isLocalhost && !allowedOrigins.includes(origin)) {
                // Not from allowed origin — ignore for security
                console.warn('Ignored message from untrusted origin:', origin)
                return
            }

            let data = event.data
            // If message is a JSON string, try to parse
            if (typeof data === 'string') {
                try { data = JSON.parse(data) } catch (e) { /* leave as-is */ }
            }

            // Support different shapes: { type: 'codeSubmission', payload: {...} } or raw payload containing code
            const payload = (data && (data.type === 'codeSubmission' || data.type === 'code-result' || data.action === 'submit'))
                ? (data.payload || data)
                : data

            if (!payload || (!payload.code && !payload.result)) {
                // Allow editor to send acknowledgment messages like { type: 'editorAck' }
                if (payload && payload.type && (payload.type === 'editorAck' || payload.type === 'editorReady')) {
                    console.log('[editor->parent] editor acknowledged start', payload)
                    setEditorAcknowledged(true)
                }
                return
            }

            // Ensure sessionId is present
            if (!payload.sessionId && sessionData && sessionData.sessionId) {
                payload.sessionId = sessionData.sessionId
            }

            setIsAwaitingCodeEvaluation(true)
            try {
                const resp = await fetch('http://localhost:5000/api/interview/code-result', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })

                const data = await resp.json()
                console.log('[parent->backend] forwarded code-result response', data)
                if (data && data.success) {
                    const aiResponse = {
                        role: 'interviewer',
                        content: data.aiResponse || data.response || 'Received coding test results.',
                        timestamp: new Date().toLocaleTimeString()
                    }
                    setMessages(prev => [...prev, aiResponse])
                } else {
                    console.error('Error from /api/interview/code-result:', data)
                }
            } catch (err) {
                console.error('Failed to forward code result to backend:', err)
            } finally {
                setIsAwaitingCodeEvaluation(false)
            }
        }

        window.addEventListener('message', handleEditorMessage)
        return () => window.removeEventListener('message', handleEditorMessage)
    }, [sessionData])

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
                {/* Slide-in Code Editor Panel */}
                <div className={`fixed top-0 right-0 h-full z-50 transition-transform duration-400 ${showCodeEditor ? 'translate-x-0' : 'translate-x-full'}`} style={{width: 'min(980px, 100%)'}}>
                    <div className="h-full bg-white shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-indigo-600 text-white rounded flex items-center justify-center font-bold">C</div>
                                <div>
                                    <div className="text-sm font-semibold">Coding Test</div>
                                    <div className="text-xs text-gray-500">Interactive code editor</div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                {isAwaitingCodeEvaluation && (
                                    <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Awaiting AI evaluation…</div>
                                )}
                                <button
                                    onClick={() => {
                                        // Simulate a code submission (useful when editor doesn't postMessage)
                                        const payload = {
                                            type: 'codeSubmission',
                                            payload: {
                                                code: 'function add(a, b) { return a + b }',
                                                language: 'javascript',
                                                passed: true,
                                                result: 'All tests passed',
                                                details: '3/3 unit tests passed'
                                            }
                                        }
                                        window.postMessage(payload, window.location.origin)
                                    }}
                                    className="text-sm text-indigo-600 hover:underline"
                                >Simulate Submit</button>
                                <a href={codeEditorUrl || 'https://ai-code-editor-psi-two.vercel.app/'} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">Open in new tab</a>
                                <button onClick={() => setShowCodeEditor(false)} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">Close</button>
                            </div>
                        </div>
                        <div className="flex-1 bg-gray-50">
                            {codeEditorUrl ? (
                                <iframe
                                    ref={iframeRef}
                                    title="AI Code Editor"
                                    src={codeEditorUrl}
                                    className="w-full h-full border-0"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">Preparing code editor...</div>
                            )}
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
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 ring-2 ring-indigo-200 transform hover:scale-110 transition-transform`}>
                                                    <AIAvatar3D className="w-full h-full rounded-full" isThinking={message.role === 'interviewer' && isTyping} />
                                                </div>
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
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 ring-2 ring-indigo-200">
                                                <AIAvatar3D className="w-full h-full rounded-full" isThinking={isTyping} />
                                            </div>
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
                                        {/* Microphone indicator (recognition auto-starts). Button removed to run recognition automatically. */}
                                        <div className="flex flex-col items-center space-y-2">
                                            <div
                                                className={`p-6 rounded-full transition-all transform shadow-xl ${
                                                    isListening 
                                                        ? 'bg-red-600 animate-pulse shadow-red-500/50' 
                                                        : 'bg-blue-600 shadow-blue-500/50'
                                                }`}
                                                aria-hidden="true"
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
                                            </div>

                                            {/* fallback button removed per request */}
                                        </div>
                                        
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
                                        <div className="flex items-center space-x-3">
                                            {(typingAutoSendCountdown > 0 || inputMessage.trim()) && (
                                                <div className={`px-4 py-3 rounded-lg ${inputMessage.trim() ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                    {typingAutoSendCountdown > 0 ? `Auto-sending in ${typingAutoSendCountdown}s` : 'Auto-send enabled'}
                                                </div>
                                            )}
                                        </div>
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
                                        <rect x="3" y="4" width="18" height="12" rx="2" ry="2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"></rect>
                                        <path d="M8 20h8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"></path>
                                        <path d="M12 16v4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"></path>
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
                                                    <AIAvatar3D className={`w-full h-full ${isTyping ? 'animate-bounce' : isSpeaking ? 'scale-110 transition-transform' : ''}`} isThinking={isTyping} />
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