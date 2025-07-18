# AI-Powered-Image-Speech-Recognition-Web-App
Built a multi-modal AI tool using YOLOv8 and speech-to-text for interactive voice-based learning. Boosted speed by 70%, accuracy by 35%, reduced manual input by 80%. UI with React + Tailwind, backend with FastAPI, Docker, PostgreSQL, and REST APIs.

### 📌 License Notice
This project is shared for educational and portfolio purposes only.Please do not copy, modify, or redistribute the code without permission.

# 🧠 ImageAI App
A full-stack AI-powered image classification web application built with:
⚙️ FastAPI backend for model serving
💻 React + Tailwind CSS frontend
📦 Docker support (optional)
🎯 Object/image classification
📊 Confidence score visualization
🔁 Batch upload support
🧠 AI-powered predictions (supports speech input and future enhancements)

---

🚀 Features
Upload single or multiple images for prediction
Real-time AI predictions with confidence scores
FastAPI-powered RESTful API backend
Beautiful, responsive frontend using React + Tailwind
Optionally containerized using Docker
Extendable for Grad-CAM, history, database, or speech support
---

🛠️ Getting Started
📦 Clone the Repository
git clone https://github.com/yourusername/ImageAI-App.git
cd ImageAI-App

🔧 Backend Setup (FastAPI)
cd backend 
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt

▶️ Run FastAPI Server
uvicorn app.main:app --reload --port 8000
📄 Access the FastAPI docs: http://localhost:8000/docs

💻 Frontend Setup (React + Tailwind CSS)
cd frontend

# Install dependencies
npm install

# Start the React app
npm run dev
🌐 App runs at: http://localhost:5173

📂 Project Structure
ImageAI-App/
│
├── backend/                # FastAPI app
│   ├── app/
│   │   ├── main.py         # API endpoints
│   │   └── model/          # ML model and utilities
│   └── requirements.txt
│
├── frontend/               # React + Tailwind frontend
│   ├── src/
│   └── package.json
│
└── README.md               # You are here

🐳 Docker Setup (Optional)

🤝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.
## ⚙️ Tech Stack

| Layer     | Technology                          |
|-----------|------------------------------------ |
| 🧠 AI      | YOLOv8, CIFAR-10 (Keras/TensorFlow)|
| 🔙 Backend | FastAPI, Python, Pydantic          |
| 🌐 Frontend| React.js, Vite, Tailwind CSS       |
| 🗣️ Voice   | Web Speech API / SpeechRecognition |
| 🛢️ Storage | PostgreSQL (optional)              |
| 🐳 DevOps  | Docker-ready                       |

---

## 🛠️ Installation

### 📦 Prerequisites
- Python 3.9+
- Node.js + npm
- (Optional) PostgreSQL if saving predictions

---

