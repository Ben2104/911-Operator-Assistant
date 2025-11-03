# 911 Operator Assistance

A prototype 911 operator co-pilot built during Marina Hacks 5.0. The system pairs a Next.js dashboard with a FastAPI inference service that transcribes audio, classifies incidents, geocodes caller locations, and lets dispatchers confirm markers or request field units.

<a href="https://devpost.com/software/911-operator-assistant">Devpost Submission</a>
## Repository Structure

```
.
├── frontend/   # Next.js 16 dashboard (React 19 + Tailwind)
├── back_end/   # FastAPI service for transcription + incident parsing
└── README.md   # You are here
```

## Prerequisites

| Tool | Version (tested) | Notes |
|------|------------------|-------|
| Node.js | 20.x (LTS) | Ships with npm 10+ |
| npm | 10+ | Included with Node |
| Python | 3.11 | Required for `torch` + `faster-whisper` |
| ffmpeg | optional but recommended | Improves audio decoding reliability |

You will also need API credentials:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (Google Maps JavaScript API)
- `GOOGLEMAP_API_KEY` (Server-side Geocoding)
- `GOOGLEGEM_API_KEY` (Google Gemini / Vertex)
- `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` (optional: only needed when ingesting Twilio call recordings)

## 1. Clone the repository

```bash
git clone [Github Repository URL]
cd 911-Operator-Assistant
```


## 2. Frontend (Next.js Dashboard)

1. **Install packages**

   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment**

   Create `frontend/.env.local`:

   ```bash
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-google-maps-js-key>
   ```

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Visit http://localhost:3000/admin to access the operator dashboard.

4. **Build for production (optional)**

   ```bash
   npm run build
   npm run start
   ```

## 3. Backend (FastAPI inference service)

1. **Create & activate a virtual environment**

   ```bash
   cd back_end
   python3 -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   ```

2. **Install dependencies**

   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **Configure environment variables**

   Create `back_end/.env` (loaded via `python-dotenv`) with at least:

   ```bash
   GOOGLEGEM_API_KEY=<gemini-api-key>
   GOOGLEMAP_API_KEY=<google-geocoding-key>
   TWILIO_ACCOUNT_SID=<optional>
   TWILIO_AUTH_TOKEN=<optional>
   ```

   - `GOOGLEGEM_API_KEY` powers incident parsing via Gemini.
   - `GOOGLEMAP_API_KEY` geocodes the parsed address.
   - Twilio credentials are only required if you POST call recordings directly from Twilio; otherwise, you can omit them.

4. **Run the API**

   ```bash
   uvicorn server:app --reload --host 0.0.0.0 --port 8000
   ```

   Key endpoints:

   | Endpoint | Method | Description |
   |----------|--------|-------------|
   | `/location` | POST (multipart) | Accepts audio and returns `{ lat, long, Address, Incident }` |
   | `/incoming` | POST | Twilio entry point that records callers |
   | `/recording-complete` | POST | Twilio recording callback |

## 4. **Connecting both services**

1. Start the backend (`uvicorn ...`) so `/location` is reachable at `http://127.0.0.1:8000/location`.
2. Run `npm run dev` (frontend). Manual uploads and live recordings will be forwarded to the FastAPI service, and the confirmed incidents will appear on the map.


6. **Troubleshooting**

- **Blank map / console warning**: Ensure `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set and has Maps JavaScript enabled.
- **`Incident not found` when confirming manual entries**: keep both frontend and backend running so the in-memory store can accept new confirmations.
- **`torch` install failures**: make sure you’re using Python 3.11+ and upgrade `pip`; Apple Silicon users might need `pip install torch==2.2.2` with the `--index-url https://download.pytorch.org/whl/cpu`.
- **Large audio uploads fail**: install `ffmpeg` so `faster-whisper` can decode more formats reliably.


Questions or ideas? Open an issue or reach out to the Marina Hacks 911 Ops team. Stay safe out there! 🚨
