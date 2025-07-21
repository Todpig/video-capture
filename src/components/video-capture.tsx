"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";

interface VideoCaptureProps {
  session: any;
}

export function VideoCapture({ session }: VideoCaptureProps) {
  const [permission, setPermission] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<
    "inactive" | "recording"
  >("inactive");
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioSource, setAudioSource] = useState<string>("");
  const [videoSource, setVideoSource] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    const getDevices = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((device) => device.kind === "videoinput");
      const mics = devices.filter((device) => device.kind === "audioinput");
      setCameraDevices(cameras);
      setMicDevices(mics);
      if (cameras.length > 0) setVideoSource(cameras[0].deviceId);
      if (mics.length > 0) setAudioSource(mics[0].deviceId);
    };
    getDevices();
  }, []);

  const startCamera = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: audioSource ? { deviceId: { exact: audioSource } } : true,
        video: videoSource ? { deviceId: { exact: videoSource } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setPermission(true);
      setStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error(err);
      alert("Failed to access media devices.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setPermission(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const startRecording = async () => {
    if (!stream) return;
    setRecordingStatus("recording");
    setRecordedVideo(null);
    let localChunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        localChunks.push(event.data);
      }
    };
    mediaRecorder.onstop = () => {
      const videoBlob = new Blob(localChunks, { type: "video/webm" });
      const videoUrl = URL.createObjectURL(videoBlob);
      setRecordedVideo(videoUrl);
    };
    mediaRecorder.start(1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === "recording") {
      setRecordingStatus("inactive");
      mediaRecorderRef.current.stop();
    }
  };

  const handleDeviceChange = async () => {
    if (stream) {
      stopCamera();
      await startCamera();
    }
  };

  const downloadVideo = () => {
    if (!recordedVideo) return;
    const a = document.createElement("a");
    a.href = recordedVideo;
    a.download = "recording.webm";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Media Recorder
          </h1>
          <div className="flex items-center">
            <span>{session.user.name}</span>
            <Image
              className="ml-2 rounded-full"
              src={session.user.picture}
              alt={session.user.name}
              width={24}
              height={24}
            />
            <a
              href="/auth/logout"
              className="ml-4 px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer"
            >
              Sair
            </a>
          </div>
        </div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Device Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Camera
              </label>
              <select
                value={videoSource}
                onChange={(e) => {
                  setVideoSource(e.target.value);
                  handleDeviceChange();
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {cameraDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label ||
                      `Camera ${cameraDevices.indexOf(device) + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Microphone
              </label>
              <select
                value={audioSource}
                onChange={(e) => {
                  setAudioSource(e.target.value);
                  handleDeviceChange();
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {micDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label ||
                      `Microphone ${micDevices.indexOf(device) + 1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Preview</h2>
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto max-h-96"
            />
            {!permission && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 text-white">
                Camera preview will appear here
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          {!permission ? (
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Start Camera
            </button>
          ) : (
            <>
              <button
                onClick={stopCamera}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              >
                Stop Camera
              </button>

              {recordingStatus === "inactive" ? (
                <button
                  onClick={startRecording}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                >
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                >
                  Stop Recording
                </button>
              )}
            </>
          )}
        </div>

        {recordedVideo && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Recorded Video</h2>
            <div className="bg-black rounded-lg overflow-hidden">
              <video
                ref={playbackRef}
                src={recordedVideo}
                controls
                className="w-full h-auto max-h-96"
              />
            </div>
            <div className="mt-4">
              <button
                onClick={downloadVideo}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
              >
                Download Video
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <p>Camera Status: {permission ? "Active" : "Inactive"}</p>
          <p>
            Recording Status:{" "}
            {recordingStatus === "recording" ? "Recording..." : "Ready"}
          </p>
        </div>
      </div>
    </div>
  );
}
