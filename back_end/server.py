from fastapi import FastAPI, UploadFile, File, Response, BackgroundTasks, Form
from fastapi.middleware.cors import CORSMiddleware
from twilio.twiml.voice_response import VoiceResponse
from utils import transcribe, parse_event
import time, io, requests, os
from fastapi.responses import JSONResponse
from datetime import datetime, timezone

events = []

# top of file

def normalize_event(e: dict) -> dict:
  lat = str(e.get("lat")) if e.get("lat") is not None else None
  lng = str(e.get("long") if e.get("long") is not None else e.get("lng")) if (e.get("long") is not None or e.get("lng") is not None) else None

  raw_rt = e.get("Response_time") or e.get("Response_time?") or e.get("Response_time_sec")
  try:
    resp_time = int(raw_rt) if raw_rt is not None else None
  except (TypeError, ValueError):
    resp_time = None

  # 👇 new
  created_at = e.get("createdAt") or e.get("timestamp") or datetime.now(timezone.utc).isoformat()

  return {
    "Address": e.get("Address"),
    "Incident": e.get("Incident"),
    "lat": lat,
    "long": lng,
    "Response_time": resp_time,
    "Transcription": e.get("Transcription"),
    "createdAt": created_at,  # 👈 include it
  }

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Suppress favicon.ico 404 errors
@app.get("/favicon.ico")
async def favicon():
    return Response(status_code=204)  # No Content

@app.get("/")
def read_root():
    return {"message": "Hello, you have successfully contact OUR API"}

@app.post("/incoming")
async def incoming():
    print("📞 Call started")
    
    resp = VoiceResponse()
    resp.say("This is a nine one one simulator. What is your emergency.")
    
    resp.record(
        action="/recording-complete",
        method="Post",
        max_length=300,
        play_beep=True,
        trim='trim-silence'
    )
    return Response(content=str(resp),media_type='text/xml')

@app.post("/recording-complete")
async def recording_complete(
    background_tasks: BackgroundTasks,
    RecordingUrl: str = Form(...),
    RecordingSid: str = Form(None),
    CallSid: str = Form(None),
    From: str = Form(None),
    To: str = Form(None),
):
    print("🔄 Recording complete")
    
    background_tasks.add_task(update_transcript, RecordingUrl)
    return Response(status_code=204)


def update_transcript(recording_url: str):
    global event
    auth=(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'))
    mp3_url = recording_url + ".mp3"
    
    r = requests.get(mp3_url, auth=auth)
    
    files = {
        "file":("recording.mp3",r.content,'audio/mpeg')
    }
    
    events.append(requests.post("http://127.0.0.1:8000/location",files=files).json())
    print(f"✅ Transcript ready. Total transcripts: {len(events)}")

@app.get('/get-transcript')
async def get_transcript():
    global events
    temp = events
    events = []
    normalized = [normalize_event(e) for e in temp]
    return JSONResponse(content=normalized, media_type="application/json")



@app.post("/location")
async def get_event(file: UploadFile = File(...)):
    start = int(time.time())
    data = await file.read()
    audio_bytes = io.BytesIO(data)

    transcription = transcribe(audio_bytes)
    parsed_event = parse_event(transcription)
    end = int(time.time())

    if parsed_event:
        parsed_event['Response_time'] = end - start

    parsed_event['Transcription'] = transcription
    # 👇 ensure createdAt exists even before /get-transcript normalization
    from datetime import datetime, timezone
    parsed_event['createdAt'] = datetime.now(timezone.utc).isoformat()

    return parsed_event
