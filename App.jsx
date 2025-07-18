import React, { useState, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [detections, setDetections] = useState([]);
  const [imageHistory, setImageHistory] = useState([]);
  const [audioFile, setAudioFile] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [askResponse, setAskResponse] = useState("");

  const audioBlobRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    setPredictions({});
    setDetections([]);
  };

  const handlePrediction = async () => {
    if (selectedFiles.length === 0) return;

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("images", file));

    try {
      const response = await fetch("/predict", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setPredictions(data.predictions);

      const fileURLs = selectedFiles.map((file) => URL.createObjectURL(file));
      setImageHistory([...imageHistory, ...fileURLs]);
    } catch (error) {
      console.error("Prediction error:", error);
    }
  };

  const handleDetection = async () => {
    if (selectedFiles.length === 0) return;

    const formData = new FormData();
    formData.append("image", selectedFiles[0]);

    try {
      const response = await fetch("/detect", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setDetections(data.detections);
    } catch (error) {
      console.error("Detection error:", error);
    }
  };

  const getBarChartData = (top3) => {
    return top3.map((item) => ({
      label: item.label,
      confidence: parseFloat((item.confidence * 100).toFixed(2)),
    }));
  };

  const handleAudioUpload = (e) => {
    setAudioFile(e.target.files[0]);
  };

  const handleTranscribeUpload = async () => {
    if (!audioFile) {
      alert("Please upload an audio file first.");
      return;
    }

    const formData = new FormData();
    formData.append("audio", audioFile);
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/speech/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setTranscription(data.transcription);
    } catch (error) {
      console.error("❌ Transcription failed:", error);
      alert("Speech transcription failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm' };
      const recorder = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioBlobRef.current = blob;

        const file = new File([blob], "speech.webm", { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", file);
        setIsLoading(true);

        try {
          const res = await fetch("/speech", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          setTranscription(data.transcription);
        } catch (err) {
          alert("Speech transcription failed.");
          console.error("Live speech upload failed:", err);
        } finally {
          setIsLoading(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access required.");
      console.error("Mic access denied:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleAskQuestion = async () => {
    const question = "What is this?";
    if (detections.length === 0) {
      alert("No detected objects found.");
      return;
    }

    const detectedClasses = detections.map((det) => det.class);
    const payload = { question, detected: detectedClasses };

    try {
      const res = await fetch("http://127.0.0.1:8000/ask/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to fetch answer.");
      const data = await res.json();
      setAskResponse(data.answer || "No info found.");
    } catch (err) {
      console.error("Ask error:", err);
      setAskResponse("❌ Could not fetch answer. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-center">
      <h1 className="text-3xl font-bold mb-6">
        🧠 Image Classifier + Object Detector + Speech
      </h1>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="block mx-auto mb-4"
      />

      <div className="flex gap-4 justify-center">
        <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handlePrediction}>
          Run Prediction
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleDetection}>
          Run Object Detection (1st image only)
        </button>
      </div>

      <div className="mt-10 max-w-2xl mx-auto text-left">
        <h2 className="text-xl font-semibold mb-2">Predictions</h2>
        {Object.keys(predictions).length === 0 ? (
          <p className="italic text-gray-500">No predictions yet</p>
        ) : (
          Object.entries(predictions).map(([filename, result], idx) => (
            <div key={idx} className="bg-white p-4 shadow rounded mb-6">
              <p className="font-bold mb-2">{filename}</p>
              <ul className="list-disc ml-6 mb-4">
                {result.top_3.map((item, i) => (
                  <li key={i}>{item.label} - {(item.confidence * 100).toFixed(2)}%</li>
                ))}
              </ul>
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getBarChartData(result.top_3)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="confidence" fill="#60A5FA" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))
        )}

        <h2 className="text-xl font-semibold mt-6 mb-2">Detections</h2>
        <ul className="list-disc ml-6">
          {detections.length > 0 ? (
            detections.map((det, i) => (
              <li key={i}>{det.class} - {(det.confidence * 100).toFixed(2)}%</li>
            ))
          ) : (
            <li>No detections found</li>
          )}
        </ul>

        <button
          onClick={handleAskQuestion}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded"
          disabled={detections.length === 0}
        >
          Ask "What is this?"
        </button>

        {askResponse && (
          <p className="mt-4 italic text-gray-700">
            <strong>Answer:</strong> {askResponse}
          </p>
        )}

        <h2 className="text-xl font-semibold mt-6 mb-2">🎙️ Speech-to-Text</h2>
        <div className="flex gap-4 items-center mb-4">
          <input type="file" accept="audio/*" onChange={handleAudioUpload} />
          <button className="bg-purple-600 text-white px-4 py-2 rounded" onClick={handleTranscribeUpload} disabled={isLoading}>
            {isLoading ? "Transcribing..." : "Transcribe Uploaded Audio"}
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          {!isRecording ? (
            <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={startRecording} disabled={isLoading}>
              Start Recording
            </button>
          ) : (
            <button className="bg-gray-600 text-white px-4 py-2 rounded" onClick={stopRecording}>
              Stop & Transcribe
            </button>
          )}
        </div>

        <p className="italic text-gray-700">
          <strong>Speech Transcription:</strong> {transcription || "No speech input yet"}
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">🖼️ Image History</h2>
        <div className="flex flex-wrap gap-2">
          {imageHistory.map((imgUrl, index) => (
            <img key={index} src={imgUrl} alt="History" className="w-24 h-24 object-cover rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;



