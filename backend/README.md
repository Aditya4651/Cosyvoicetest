# VoiceGene MVP — Backend Setup

## Prerequisites

- Python 3.10 (recommended by CosyVoice)
- Conda (for environment management)
- CUDA-capable GPU (recommended)

## Installation

### 1. Clone CosyVoice

```bash
cd backend
git clone --recursive https://github.com/FunAudioLLM/CosyVoice.git
cd CosyVoice
conda create -n cosyvoice python=3.10 -y
conda activate cosyvoice
pip install -r requirements.txt
```

### 2. Download Model

Place the CosyVoice-300M model in:

```
backend/CosyVoice/pretrained_models/CosyVoice-300M/
```

### 3. Add Reference Voices

Place your reference voice files in `backend/voices/`:

```
backend/voices/
├── voice1.wav
├── voice2.wav
└── voice3.wav
```

Each WAV file should be a clear recording (3-10 seconds) of the voice you want to clone.

### 4. Update Voice Prompts

Edit `app.py` and update the `VOICE_MAP` with the exact transcript of each reference audio:

```python
VOICE_MAP = {
    "voice1": {
        "audio": VOICES_DIR / "voice1.wav",
        "prompt": "The exact words spoken in voice1.wav go here.",
    },
    # ...
}
```

### 5. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 6. Run

```bash
cd backend
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`.

## API

### POST /generate

Form data:
- `text` (string): Text to synthesize (max 5000 chars)
- `voice` (string): Voice ID (`voice1`, `voice2`, or `voice3`)

Response:
```json
{
  "success": true,
  "audio_url": "/generated/<uuid>.wav"
}
```

## Architecture

```
VoiceGene MVP
├── Frontend (React/Vite) — this project
│   └── POST /generate → Backend
│
└── Backend (FastAPI + CosyVoice)
    ├── /generate → CosyVoice inference_zero_shot
    └── /generated/* → Static WAV files
```
