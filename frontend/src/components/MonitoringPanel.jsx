import React, { useEffect, useRef, useState } from 'react';
import VideoMonitor from './VideoMonitor';
import ObjectDetector from './ObjectDetector';
import FaceDetector from './FaceDetector';

// MonitoringPanel coordinates the three detectors. It can either use a shared MediaStream
// (recommended) or render the detectors independently. We expose a simple toggle UI.
export default function MonitoringPanel({ useSharedStream = true, externalStream = null }) {
  const [stream, setStream] = useState(externalStream);
  const [sharedEnabled, setSharedEnabled] = useState(useSharedStream && !externalStream);
  const localStreamRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const startSharedStream = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!mounted) {
          s.getTracks().forEach(t => t.stop());
          return;
        }
        localStreamRef.current = s;
        setStream(s);
      } catch (err) {
        console.error('Failed to get user media for MonitoringPanel:', err);
      }
    };

    if (externalStream) {
      // If an external stream is provided, use it and don't create a new one
      setStream(externalStream);
    } else if (sharedEnabled) {
      startSharedStream();
    } else {
      // if we're disabling shared stream, stop any existing stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      setStream(null);
    }

    return () => {
      mounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [sharedEnabled]);

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-3">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={sharedEnabled} onChange={(e) => setSharedEnabled(e.target.checked)} />
          <span>Use shared camera/audio stream</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* VideoMonitor takes a stream prop and shows overlays + audio monitoring */}
        <div className="col-span-1 bg-gray-900 rounded-lg overflow-hidden">
          <h3 className="p-2 text-white font-semibold">Video Monitor (face + objects + audio)</h3>
          <div style={{ width: '100%', height: 400 }}>
            <VideoMonitor stream={stream} />
          </div>
        </div>

        {/* Standalone detectors (useful for debugging or separate windows) */}
        <div className="col-span-1 space-y-4">
          <div className="bg-gray-900 rounded-lg p-2">
            <h4 className="text-white font-semibold mb-2">Standalone Object Detector</h4>
            <ObjectDetector />
          </div>

          <div className="bg-gray-900 rounded-lg p-2">
            <h4 className="text-white font-semibold mb-2">Standalone Face Detector</h4>
            <FaceDetector />
          </div>
        </div>
      </div>
    </div>
  );
}
