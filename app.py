import os
import io
import json
import uuid
import numpy as np
import tensorflow as tf
from PIL import Image
import uvicorn
import cv2
import psycopg2
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from pydub import AudioSegment
import speech_recognition as sr
from pydantic import BaseModel
from duckduckgo_search import DDGS


app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load classification model
model = tf.keras.models.load_model("cifar10_model.h5")
class_labels = ["airplane", "automobile", "bird", "cat", "deer", "dog", "frog", "horse", "ship", "truck"]
model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])

# Load YOLO
yolo_model = YOLO("yolov8n.pt")

# Database config
DB_HOST = "127.0.0.1"
DB_PORT = 5432
DB_NAME = "image_classifier_db"
DB_USER = "postgres"
DB_PASS = "newpassword"

def connect_db():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
    )

def preprocess_image(image: Image.Image):
    img = image.resize((32, 32))
    img_array = np.array(img) / 255.0
    return np.expand_dims(img_array, axis=0)

@app.post("/predict/")
async def predict(images: list[UploadFile] = File(...)):
    predictions = {}
    try:
        db_conn = connect_db()
        cursor = db_conn.cursor()

        for image_file in images:
            image_bytes = await image_file.read()
            image = Image.open(io.BytesIO(image_bytes))
            image_array = preprocess_image(image)

            pred = model.predict(image_array)
            top_3_indices = np.argsort(pred[0])[-3:][::-1]
            top_3_predictions = [{"label": class_labels[i], "confidence": float(pred[0][i])} for i in top_3_indices]

            predictions[image_file.filename] = {"top_3": top_3_predictions}

            cursor.execute(
                "INSERT INTO predictions (image_name, prediction) VALUES (%s, %s)",
                (image_file.filename, json.dumps(top_3_predictions)),
            )
            db_conn.commit()

        return {"predictions": predictions}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
    finally:
        cursor.close()
        db_conn.close()

@app.post("/detect/")
async def detect_objects(image: UploadFile = File(...)):
    try:
        image_np = np.frombuffer(await image.read(), np.uint8)
        img = cv2.imdecode(image_np, cv2.IMREAD_COLOR)

        results = yolo_model(img)[0]
        detections = []

        for box in results.boxes:
            class_id = int(box.cls)
            label = yolo_model.names[class_id]
            confidence = float(box.conf)
            detections.append({"class": label, "confidence": confidence})

        return {"detections": detections}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection error: {str(e)}")

@app.post("/speech/")
async def classify_speech(audio: UploadFile = File(...)):
    recognizer = sr.Recognizer()
    uid = str(uuid.uuid4())[:8]
    webm_path = f"temp_{uid}.webm"
    wav_path = f"temp_{uid}.wav"

    try:
        with open(webm_path, "wb") as f:
            f.write(await audio.read())

        sound = AudioSegment.from_file(webm_path)
        sound.export(wav_path, format="wav")

        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)

        return {"transcription": text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        for file in [webm_path, wav_path]:
            if os.path.exists(file):
                os.remove(file)

# Object Q&A using DuckDuckGo
class ObjectQuestionRequest(BaseModel):
    question: str
    detected: list

@app.post("/ask/")
async def ask_about_object(payload: ObjectQuestionRequest):
    question = payload.question.lower()
    detected = payload.detected

    if not detected or "what" not in question:
        return {"answer": "No valid question or object detected."}

    search_term = detected[0]
   
    try:
        with DDGS() as ddgs:
            results = ddgs.text(search_term, max_results=1)
            for r in results:
                text = r.get("body", "")
                if "airplane" in text.lower() or "flight" in text.lower():
                    return {"answer": text}
            return {"answer": f"It looks like: {search_term}. No good explanation found."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DuckDuckGo query failed: {str(e)}")

# Run server
if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)




