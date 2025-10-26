from utils import transcribe, parse_event
import json

event = transcribe(
    r"C:\Hackathons\Marina-Hacks2\back_end\audio\7-11_bolsa_emergency.mp3"
)

event_parsed = parse_event(event)

with open("output.json", "w") as file:
    json.dump(event_parsed, file)
