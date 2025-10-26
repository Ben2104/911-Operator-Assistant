from fastapi import FastAPI, UploadFile, File, HTTPException
from utils import transcribe, parse_event
from pathlib import Path
import time, io

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello, you have successfully contact OUR API"}

@app.post("/location")
async def get_event(file: UploadFile = File(...)):
    start = int(time.time())

    data = await file.read()
    audio_bytes = io.BytesIO(data)

    trasribtion = transcribe(audio_bytes)
    parsed_event = parse_event(trascribtion)
    end = int(time.time())

    if parsed_event:
        parsed_event['Response_time']= end-start
    else:
        pass
    
    parsed_event['Transcribtion'] = transcribtion
    
    return parsed_event
