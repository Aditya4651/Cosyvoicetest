import os
import sys
import uuid
from pathlib import Path

import torch
import torchaudio
from fastapi import FastAPI, Form, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# ============================================================
# COSYVOICE PATH
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

# Change this if your CosyVoice folder is somewhere else.
COSYVOICE_DIR = BASE_DIR / "CosyVoice"

sys.path.insert(0, str(COSYVOICE_DIR / "third_party" / "Matcha-TTS"))

from cosyvoice.cli.cosyvoice import CosyVoice
from cosyvoice.utils.file_utils import load_wav


# ============================================================
# CONFIG
# ============================================================

MODEL_DIR = COSYVOICE_DIR / "pretrained_models" / "CosyVoice-300M"

VOICES_DIR = BASE_DIR / "voices"
GENERATED_DIR = BASE_DIR / "generated"

VOICES_DIR.mkdir(exist_ok=True)
GENERATED_DIR.mkdir(exist_ok=True)


# ============================================================
# APP
# ============================================================

app = FastAPI(title="VoiceGene MVP")

# Allow CORS for local development with React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount(
    "/generated",
    StaticFiles(directory=GENERATED_DIR),
    name="generated",
)


# ============================================================
# LOAD COSYVOICE ONCE
# ============================================================

print("Loading CosyVoice...")

cosyvoice = CosyVoice(str(MODEL_DIR))

print("CosyVoice loaded.")


# ============================================================
# VOICES
# ============================================================

VOICE_MAP = {
    "voice1": {
        "audio": VOICES_DIR / "voice1.wav",
        "prompt": "The exact transcript spoken in voice1.wav",
    },
    "voice2": {
        "audio": VOICES_DIR / "voice2.wav",
        "prompt": "The exact transcript spoken in voice2.wav",
    },
    "voice3": {
        "audio": VOICES_DIR / "voice3.wav",
        "prompt": "The exact transcript spoken in voice3.wav",
    },
}


# ============================================================
# GENERATE
# ============================================================

@app.post("/generate")
async def generate(
    text: str = Form(...),
    voice: str = Form(...)
):
    text = text.strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty."
        )

    if len(text) > 5000:
        raise HTTPException(
            status_code=400,
            detail="Text is too long. Maximum 5000 characters."
        )

    if voice not in VOICE_MAP:
        raise HTTPException(
            status_code=400,
            detail="Invalid voice."
        )

    voice_data = VOICE_MAP[voice]
    reference_audio = voice_data["audio"]

    if not reference_audio.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Reference audio not found: {reference_audio.name}"
        )

    try:
        # Load reference voice at 16 kHz.
        prompt_speech_16k = load_wav(
            str(reference_audio),
            16000
        )

        # Generate speech using CosyVoice zero-shot.
        results = cosyvoice.inference_zero_shot(
            text,
            voice_data["prompt"],
            prompt_speech_16k,
            stream=False
        )

        output_file = GENERATED_DIR / f"{uuid.uuid4().hex}.wav"

        # CosyVoice returns generated audio as an iterator.
        for result in results:
            audio = result["tts_speech"]
            torchaudio.save(
                str(output_file),
                audio,
                22050  # CosyVoice sample rate
            )
            break

        if not output_file.exists():
            raise RuntimeError("CosyVoice did not return audio.")

        return {
            "success": True,
            "audio_url": f"/generated/{output_file.name}"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
