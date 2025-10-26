from fastapi import FastAPI, UploadFile, File, Response, BackgroundTasks, Form
from twilio.twiml.voice_response import VoiceResponse
from utils import transcribe, parse_event
import time, io, requests,os

events = []

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello, you have successfully contact OUR API"}

@app.post("/incoming")
async def incoming():
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
    
    event.append(requests.post("http://127.0.0.1:8000/location",files=files).json())
    
@app.get('/get-transcript')
async def get_transcript():
    global event
    temp = event
    event = []
    return temp 

@app.post("/location")
async def get_event(file: UploadFile = File(...)):
    start = int(time.time())

    data = await file.read()
    audio_bytes = io.BytesIO(data)

    transcription = transcribe(audio_bytes)
    parsed_event = parse_event(transcription)
    end = int(time.time())

    if parsed_event:
        parsed_event['Response_time']= end-start
    else:
        pass
    
    parsed_event['Transcription'] = transcription
    
    return parsed_event
