import React, { useEffect, useRef, useState } from "react";

export default function FaceDetector() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [faceCount, setFaceCount] = useState(0);
  const [alert, setAlert] = useState("Initializing...");
  const [isLoading, setIsLoading] = useState(true);
  const faceDetectionRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    let isActive = true;
    let animationId = null;

    const initializeFaceDetection = async () => {
      try {
        console.log("Starting face detection initialization...");
        
        // First, start the webcam
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });

        if (!isActive) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log("Webcam stream connected");
        }

        // Wait for video to be ready
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play();
              resolve();
            };
          }
        });

        console.log("Video ready, loading MediaPipe...");

        // Now initialize MediaPipe face detection
        const { FaceDetection } = await import("@mediapipe/face_detection");

        if (!isActive) return;

        const faceDetection = new FaceDetection({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/${file}`;
          }
        });

        faceDetectionRef.current = faceDetection;

        await faceDetection.setOptions({
          model: "short",
          minDetectionConfidence: 0.5,
        });

        faceDetection.onResults(onResults);

        console.log("Face detection initialized, starting detection loop...");
        setIsLoading(false);

        // Start detection loop
        const detectFaces = async () => {
          if (isActive && videoRef.current && videoRef.current.readyState === 4) {
            await faceDetection.send({ image: videoRef.current });
          }
          if (isActive) {
            animationId = requestAnimationFrame(detectFaces);
          }
        };

        detectFaces();

      } catch (error) {
        console.error("Error initializing face detection:", error);
        if (error.name === "NotAllowedError") {
          setAlert("❌ Camera access denied");
        } else if (error.name === "NotFoundError") {
          setAlert("❌ No camera found");
        } else {
          setAlert("❌ Failed to initialize: " + error.message);
        }
        setIsLoading(false);
      }
    };

    const onResults = (results) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      if (!canvas || !video) return;

      const ctx = canvas.getContext("2d");
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Clear previous drawings
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const faces = results.detections ? results.detections.length : 0;
      setFaceCount(faces);

      // Set alerts based on face count
      if (faces === 0) {
        setAlert("⚠️ No face detected!");
      } else if (faces > 1) {
        setAlert("🚨 Multiple faces detected!");
      } else {
        setAlert("✅ Face detected - All clear");
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
    };

    initializeFaceDetection();

    // Cleanup
    return () => {
      console.log("Cleaning up face detection...");
      isActive = false;
      
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      
      if (faceDetectionRef.current) {
        faceDetectionRef.current.close();
      }
    };
  }, []);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {isLoading && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "20px",
          borderRadius: "10px",
          zIndex: 10
        }}>
          Loading Face Detection...
        </div>
      )}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline
        muted
        className="video-screen"
        style={{ display: "block", maxWidth: "100%" }}
      />
      <canvas 
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none"
        }}
      />
      <div style={{
        position: "absolute",
        top: 10,
        right: 10,
        background: "rgba(0,0,0,0.7)",
        color: "white",
        padding: "10px",
        borderRadius: "5px",
        fontSize: "14px"
      }}>
        <div><strong>Faces Detected:</strong> {faceCount}</div>
        <div style={{ marginTop: "5px" }}>{alert}</div>
      </div>
    </div>
  );
}
