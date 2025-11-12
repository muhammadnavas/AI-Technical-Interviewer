import { useEffect, useRef, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

const VideoMonitor = ({ stream }) => {
  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const faceDetectionRef = useRef(null);
  const objectModelRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationRef = useRef(null);
  const [isLoud, setIsLoud] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [objectCount, setObjectCount] = useState(0);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [alert, setAlert] = useState('Initializing...');
  const [hasViolation, setHasViolation] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');
  const [isModelLoading, setIsModelLoading] = useState(true);

  // Debug: Log when stream changes
  useEffect(() => {
    console.log('VideoMonitor received stream:', stream);
    if (stream) {
      console.log('Stream tracks:', stream.getTracks());
    }
  }, [stream]);

  // Initialize MediaPipe Face Detection and TensorFlow Object Detection
  useEffect(() => {
    const initDetectionModels = async () => {
      try {
        console.log('Loading detection models...');
        // Dynamically import MediaPipe to avoid bundler/runtime issues and to
        // ensure the locateFile path is correct for the CDN files
        const { FaceDetection } = await import('@mediapipe/face_detection');
        const { Camera } = await import('@mediapipe/camera_utils');

        // Create face detector and set options
        const faceDetection = new FaceDetection({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/${file}`
        });

        faceDetection.setOptions({
          model: 'short',
          minDetectionConfidence: 0.5
        });

        // Load Object Detection Model
        const objectModel = await cocoSsd.load();
        objectModelRef.current = objectModel;
        console.log('Object detection model loaded');

        faceDetection.onResults((results) => {
          if (!overlayCanvasRef.current || !videoRef.current) return;

          const canvas = overlayCanvasRef.current;
          const video = videoRef.current;
          const ctx = canvas.getContext('2d');
          
          // Set canvas size to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Clear previous drawings
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          const faces = results.detections ? results.detections.length : 0;
          setFaceCount(faces);

          // Set alerts based on face count
          if (faces === 0) {
            setAlert('⚠️ No face detected!');
            setHasViolation(true);
            setViolationMessage('⚠️ No face detected!');
          } else if (faces > 1) {
            setAlert('🚨 Multiple faces detected!');
            setHasViolation(true);
            setViolationMessage(`🚨 Multiple people detected! (${faces} faces)`);
          } else {
            setAlert('✅ Face detected - All clear');
            setHasViolation(false);
            setViolationMessage('');
          }

          // Draw detections only if multiple faces
          if (results.detections && results.detections.length > 1) {
            results.detections.forEach((detection, index) => {
              const box = detection.boundingBox;
              const x = box.xCenter * canvas.width - (box.width * canvas.width) / 2;
              const y = box.yCenter * canvas.height - (box.height * canvas.height) / 2;
              const width = box.width * canvas.width;
              const height = box.height * canvas.height;

              // Draw red bounding box
              ctx.strokeStyle = "#FF0000";
              ctx.lineWidth = 3;
              ctx.strokeRect(x, y, width, height);

              // Draw red label
              ctx.fillStyle = "#FF0000";
              ctx.font = "16px Arial";
              const confidence = detection.score && Array.isArray(detection.score) 
                ? (detection.score[0] * 100).toFixed(1)
                : detection.score 
                ? (detection.score * 100).toFixed(1)
                : "N/A";
              ctx.fillText(
                `Face ${index + 1} (${confidence}%)`,
                x,
                y > 20 ? y - 5 : y + height + 20
              );

              // Draw keypoints (eyes, nose, mouth, ears)
              if (detection.landmarks) {
                ctx.fillStyle = "#FFFF00";
                detection.landmarks.forEach((landmark) => {
                  const lx = landmark.x * canvas.width;
                  const ly = landmark.y * canvas.height;
                  ctx.beginPath();
                  ctx.arc(lx, ly, 4, 0, 2 * Math.PI);
                  ctx.fill();
                });
              }
            });
          }
        });

  // If we have a video element available we'll create a Camera helper which
  // will drive faceDetection.send({image: video}) on each frame. The Camera
  // helper gracefully handles timing and works well with MediaPipe.
  faceDetectionRef.current = faceDetection;

  // Save Camera constructor and instance placeholders so we can create/stop it
  faceDetectionRef.current._Camera = Camera;
  faceDetectionRef.current._camera = null;

  setIsModelLoading(false);
  console.log('Face detection ready (MediaPipe loaded)');

  // Camera will be created later once video element has metadata loaded.
      } catch (error) {
        console.error('Failed to initialize detection models:', error);
        setIsModelLoading(false);
      }
    };

    initDetectionModels();

    return () => {
      if (faceDetectionRef.current) {
        try {
          if (faceDetectionRef.current._camera) {
            faceDetectionRef.current._camera.stop && faceDetectionRef.current._camera.stop();
            faceDetectionRef.current._camera = null;
          }
        } catch (e) {
          console.warn('Error stopping MediaPipe camera on cleanup:', e);
        }

        try {
          faceDetectionRef.current.close && faceDetectionRef.current.close();
        } catch (e) {
          // ignore
        }
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Connect stream to video and start detection
  useEffect(() => {
    if (!stream || !videoRef.current) {
      console.log('Stream or video ref not ready');
      return;
    }

    const video = videoRef.current;
    console.log('Connecting stream to video element...');
    video.srcObject = stream;

    const handleLoadedMetadata = async () => {
      try {
        console.log('Video metadata loaded, starting playback...');
        
        // Play video
        try {
          await video.play();
          console.log('Video playing successfully');
        } catch (playError) {
          console.error('Error playing video:', playError);
        }
        
        // Set canvas size to match video
        if (overlayCanvasRef.current) {
          overlayCanvasRef.current.width = video.videoWidth;
          overlayCanvasRef.current.height = video.videoHeight;
          console.log('Canvas size set:', video.videoWidth, 'x', video.videoHeight);
        }

        // Start detection loop
        if (faceDetectionRef.current || objectModelRef.current) {
          let currentObjects = [];
          
          const detectLoop = async () => {
            if (video.readyState === 4) {
              // Detect objects first
              if (objectModelRef.current) {
                try {
                  const predictions = await objectModelRef.current.detect(video);
                  const nonPersonObjects = predictions.filter(p => p.class !== 'person');
                  currentObjects = nonPersonObjects;
                  setDetectedObjects(nonPersonObjects);
                  setObjectCount(nonPersonObjects.length);
                } catch (objError) {
                  console.error('Object detection error:', objError);
                }
              }
              
              // Send frame to face detection only when MediaPipe Camera helper is not
              // being used. If Camera is active it already calls faceDetection.send.
              if (faceDetectionRef.current && video.videoWidth > 0 && video.videoHeight > 0 && !faceDetectionRef.current._camera) {
                try {
                  if (!video.paused && !video.ended) {
                    await faceDetectionRef.current.send({ image: video });
                  }
                  
                  // After face detection, draw objects on top
                  if (overlayCanvasRef.current && currentObjects.length > 0) {
                    const canvas = overlayCanvasRef.current;
                    const ctx = canvas.getContext('2d');
                    
                    currentObjects.forEach((prediction) => {
                      const [x, y, width, height] = prediction.bbox;
                      const score = (prediction.score * 100).toFixed(1);

                      // Draw bounding box in cyan color
                      ctx.strokeStyle = '#00FFFF';
                      ctx.lineWidth = 2;
                      ctx.strokeRect(x, y, width, height);

                      // Draw label background
                      ctx.fillStyle = '#00FFFF';
                      const text = `${prediction.class} ${score}%`;
                      const textWidth = ctx.measureText(text).width;
                      ctx.fillRect(x, y - 20, textWidth + 10, 20);

                      // Draw label text
                      ctx.fillStyle = '#000000';
                      ctx.font = '14px Arial';
                      ctx.fillText(text, x + 5, y - 5);
                    });
                  }
                } catch (faceError) {
                  console.error('Face detection error:', faceError);
                }
              }
            }
            
            animationRef.current = requestAnimationFrame(detectLoop);
          };

          console.log('Starting detection loop...');
          // If faceDetection has a Camera constructor and no camera started yet,
          // create a Camera helper to drive MediaPipe detection frames.
          if (faceDetectionRef.current && faceDetectionRef.current._Camera && video) {
            try {
              if (!faceDetectionRef.current._camera) {
                faceDetectionRef.current._camera = new faceDetectionRef.current._Camera(video, {
                  onFrame: async () => {
                    try {
                      await faceDetectionRef.current.send({ image: video });
                    } catch (e) {
                      // ignore send errors (will be logged inside onResults error path)
                    }
                  },
                  width: video.videoWidth,
                  height: video.videoHeight,
                });
                faceDetectionRef.current._camera.start();
              }
            } catch (camErr) {
              console.warn('Failed to start MediaPipe Camera helper:', camErr);
            }
          }

          detectLoop();
        }
      } catch (error) {
        console.error('Failed to start detection:', error);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (faceDetectionRef.current && faceDetectionRef.current._camera) {
        try {
          faceDetectionRef.current._camera.stop && faceDetectionRef.current._camera.stop();
        } catch (e) {
          console.warn('Error stopping MediaPipe camera during video cleanup:', e);
        }
        faceDetectionRef.current._camera = null;
      }
    };
  }, [stream]);

  // Audio monitoring for loud sound detection
  useEffect(() => {
    if (!stream) return;

    let animationFrameId;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let soundCounter = 0;
      const THRESHOLD = 30;
      const CONSECUTIVE_FRAMES = 3;
      
      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        
        if (average > THRESHOLD) {
          soundCounter++;
          if (soundCounter >= CONSECUTIVE_FRAMES && !isLoud) {
            setIsLoud(true);
          }
        } else {
          soundCounter = 0;
          if (isLoud) {
            setIsLoud(false);
          }
        }
        
        animationFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();

      return () => {
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    } catch (error) {
      console.error('Failed to initialize audio monitoring:', error);
    }
  }, [stream, isLoud]);

  return (
    <div className="relative w-full h-full">
      {/* Violation Alert */}
      {hasViolation && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">{violationMessage}</span>
        </div>
      )}

      {/* Loading Indicator */}
      {isModelLoading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-black bg-opacity-80 text-white px-6 py-4 rounded-lg">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span>Loading Detection Models...</span>
          </div>
        </div>
      )}

      {/* Face Count Indicator */}
      <div className="absolute top-4 right-4 z-20 bg-black bg-opacity-70 text-white px-3 py-1.5 rounded-lg">
        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold border-b border-gray-600 pb-2">
            Faces Detected: <span className={faceCount > 1 ? 'text-red-500' : faceCount === 1 ? 'text-green-500' : 'text-yellow-500'}>{faceCount}</span>
          </div>
          <div className="text-xs">
            {alert}
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-gray-600 pt-2 mt-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
          <span className="text-sm font-medium">
            {objectCount === 0 ? 'No Objects' : `${objectCount} Object${objectCount > 1 ? 's' : ''}`}
          </span>
        </div>
        {detectedObjects.length > 0 && (
          <div className="mt-2 text-xs border-t border-gray-600 pt-2 max-h-32 overflow-y-auto">
            {detectedObjects.map((obj, i) => (
              <div key={i} className="text-cyan-400">• {obj.class}</div>
            ))}
          </div>
        )}
      </div>

      {/* Detection Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-xs">
        <div className="font-semibold mb-1">Detection Status:</div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>1 Person = Normal</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 border-2 border-red-500"></div>
          <span>2+ People = Violation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-cyan-400"></div>
          <span>Objects Detected</span>
        </div>
      </div>

      {/* Audio Level Alert */}
      {isLoud && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-orange-500 text-white px-3 py-2 rounded-lg shadow-lg animate-pulse flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <span>High Volume Detected!</span>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Overlay Canvas for Face Detection */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />
    </div>
  );
};

export default VideoMonitor;
