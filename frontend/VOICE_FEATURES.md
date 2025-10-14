# Voice Features Documentation

## Overview
The AI Technical Interviewer features a **voice-only interface** for candidates, creating a natural conversation experience. The AI speaks questions aloud, and candidates respond using voice input only - no typing required!

## Features Implemented

### 1. **AI Voice (Text-to-Speech)**
- **Technology**: Web Speech API - SpeechSynthesis
- **Functionality**: AI interviewer speaks questions aloud
- **Features**:
  - Automatic speech when new questions appear
  - Configurable voice settings (rate, pitch, volume)
  - Preferred voice selection (Google/Microsoft voices)
  - Visual speaking indicator on AI avatar
  - Toggle button to enable/disable AI voice

#### Visual Indicators:
- **Speaking Status**: 
  - Animated sound wave bars (blue)
  - "Speaking..." text indicator
  - Enhanced avatar pulse animation
  - Green ring around avatar while speaking

### 2. **Candidate Voice (Speech Recognition) - VOICE ONLY**
- **Technology**: Web Speech API - SpeechRecognition
- **Functionality**: Real-time voice-to-text conversion - **no typing allowed**
- **Features**:
  - Continuous speech recognition
  - Real-time interim results displayed
  - Automatic text insertion into transcript display
  - Visual listening indicators
  - Easy toggle on/off with large microphone button
  - Clear button to reset answer

#### Visual Indicators:
- **Voice Input Interface**:
  - Large central microphone button (blue when ready, red pulsing when listening)
  - Live transcript display box showing spoken text
  - Real-time transcription preview in blue text
  - "Ready to Listen" / "Recording..." status text
  - "LISTENING" badge on video feed with sound wave animation
  - Clear button to delete current transcript

## How to Use

### AI Voice Control:
1. **Enable/Disable**: Click the blue speaker button in the sidebar controls
   - Blue = Voice Enabled
   - Gray = Voice Disabled
2. **Automatic Playback**: AI questions play automatically when enabled
3. **Interruption**: Clicking the button while speaking stops current speech

### Candidate Voice Input (Voice-Only Mode):
1. **Start Recording**: Click the large blue microphone button
   - Button turns red and pulses while recording
   - Status changes to "🔴 Recording..."
   - "LISTENING" badge appears on video
2. **Speak Your Answer**: Talk naturally and clearly
   - Your speech appears in the transcript box in real-time
   - Interim results shown in blue text below
3. **Review**: See your complete answer in the transcript display
4. **Stop Recording**: Click the microphone button again to stop
5. **Send Answer**: Click "Send Answer" button
6. **Clear (Optional)**: Click "Clear Text" if you want to start over

**Note**: There is NO typing option - you must use voice input only!

## Browser Compatibility

### Text-to-Speech (AI Voice):
✅ Chrome/Edge: Full support
✅ Safari: Full support
✅ Firefox: Full support
⚠️ May require HTTPS in production

### Speech Recognition (Candidate Voice):
✅ Chrome/Edge: Full support (best experience)
✅ Safari: Full support
❌ Firefox: Limited/No support
⚠️ Requires HTTPS in production

## Technical Details

### Voice Settings:
```javascript
// AI Text-to-Speech
- Rate: 0.9 (slightly slower for clarity)
- Pitch: 1.0 (natural)
- Volume: 1.0 (maximum)
- Language: Auto-detected from available voices

// Candidate Speech Recognition
- Language: en-US (English - United States)
- Continuous: true (keeps listening)
- Interim Results: true (shows real-time transcription)
```

### State Management:
- `isSpeaking`: Tracks if AI is currently speaking
- `voiceEnabled`: Toggles AI voice on/off
- `isListening`: Tracks if mic is actively listening
- `transcript`: Stores real-time interim speech results
- `inputMessage`: Final transcribed text

### Key Components:
1. **speakText()**: Handles AI text-to-speech
2. **initializeSpeechRecognition()**: Sets up speech recognition
3. **toggleRecording()**: Starts/stops voice input
4. **Recognition Event Handlers**:
   - `onstart`: Updates listening state
   - `onresult`: Processes speech to text
   - `onend`: Cleans up and stops listening
   - `onerror`: Handles errors gracefully

## UI Elements

### Chat Input Area:
- **Microphone Button**: Blue (inactive) / Red pulsing (active)
- **Text Input**: Shows "Listening... Speak now" when active
- **Transcript Overlay**: Blue box with real-time speech preview
- **Send Button**: Remains functional for manual sending

### Sidebar Controls:
- **AI Voice Toggle**: Speaker icon button
  - Blue background = enabled
  - Gray background = disabled
  - X icon overlay when disabled

### Video Display:
- **LIVE Badge**: Red indicator when camera is on
- **LISTENING Badge**: Blue badge with sound waves when mic is active
- Badges positioned at top corners for clear visibility

### AI Avatar Display:
- **Thinking**: Green bouncing dots
- **Speaking**: Blue sound wave bars + enhanced animations
- **Active**: Green pulsing dot

## Performance Considerations

1. **Speech Recognition**:
   - Continuous mode uses more resources
   - Automatically stops on error or unmount
   - Cleans up properly on component unmount

2. **Text-to-Speech**:
   - Cancels previous speech before starting new
   - Proper cleanup on component unmount
   - Delay added to prevent speech overlap with typing animation

3. **Browser Optimization**:
   - Voices loaded on component mount
   - Recognition initialized on first use (lazy loading)
   - Event listeners properly cleaned up

## Error Handling

- **Browser Incompatibility**: Alert shown if speech recognition not supported
- **Microphone Access**: Browser will request permission
- **Network Issues**: May affect voice quality in some browsers
- **Concurrent Speech**: AI voice cancels previous speech automatically

## Future Enhancements

Potential improvements:
- [ ] Voice selection dropdown for AI
- [ ] Speed/pitch controls for AI voice
- [ ] Multi-language support
- [ ] Voice command support (e.g., "submit answer")
- [ ] Audio recording for later review
- [ ] Voice emotion detection
- [ ] Background noise cancellation
- [ ] Offline voice recognition fallback

## Troubleshooting

### AI Not Speaking:
1. Check if voice is enabled (blue speaker button)
2. Check system audio volume
3. Try different browser (Chrome/Edge recommended)
4. Ensure HTTPS in production

### Voice Input Not Working:
1. Grant microphone permissions
2. Check browser compatibility (use Chrome/Edge)
3. Ensure microphone is not used by other apps
4. Try refreshing the page
5. Check browser console for errors

### Speech Recognition Accuracy:
- Speak clearly and at moderate pace
- Reduce background noise
- Use quality microphone
- Check interim results in blue overlay
- Edit text manually if needed

## Development Notes

- Component uses React hooks extensively
- Refs used for speech synthesis and recognition instances
- Proper cleanup in useEffect return functions
- State synchronization with visual indicators
- Graceful degradation for unsupported browsers
