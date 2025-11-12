import React, { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

export default function ObjectDetector() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [objects, setObjects] = useState([]);
  const [model, setModel] = useState(null);
  const animationRef = useRef(null);

  useEffect(() => {
    // Load the model
    const loadModel = async () => {
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
      console.log("Object detection model loaded");
    };

    // Start webcam
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    loadModel();
    startWebcam();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (model && videoRef.current) {
      detectObjects();
    }
  }, [model]);

  const detectObjects = async () => {
    if (
      videoRef.current &&
      videoRef.current.readyState === 4 &&
      model
    ) {
      const predictions = await model.detect(videoRef.current);
      setObjects(predictions);
      drawDetections(predictions);
    }
    animationRef.current = requestAnimationFrame(detectObjects);
  };

  const drawDetections = (predictions) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    predictions.forEach((prediction) => {
      const [x, y, width, height] = prediction.bbox;
      const score = (prediction.score * 100).toFixed(1);

      // Draw bounding box
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // Draw label background
      ctx.fillStyle = "#00FF00";
      const text = `${prediction.class} ${score}%`;
      const textWidth = ctx.measureText(text).width;
      ctx.fillRect(x, y - 25, textWidth + 10, 25);

      // Draw label text
      ctx.fillStyle = "#000000";
      ctx.font = "16px Arial";
      ctx.fillText(text, x + 5, y - 7);
    });
  };

  return (
    <div style={{ position: "relative", display: "inline-block", marginTop: "20px" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          border: "4px solid white",
          borderRadius: "10px",
          boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
          display: "block"
        }}
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
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "10px",
          borderRadius: "5px",
          fontSize: "14px",
          maxWidth: "200px"
        }}
      >
        <div><strong>Objects Detected:</strong> {objects.length}</div>
        {objects.length > 0 && (
          <div style={{ marginTop: "5px", fontSize: "12px" }}>
            {objects.map((obj, i) => (
              <div key={i}>• {obj.class}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
