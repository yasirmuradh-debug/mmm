#!/usr/bin/env python3
"""
Jarvis — offline speech-to-text sidecar.

A tiny local web server that turns audio into text using faster-whisper, which
runs fully on your machine (no internet, no per-word cost). Jarvis's main app
starts this automatically when you tick "Offline speech" in Settings, sends it
short audio clips, and gets the transcription back.

You never run this by hand — but you must install its two packages once:

    pip install -r python/requirements.txt

The first transcription downloads the chosen model (a few hundred MB for
"base.en"); after that it's cached and instant to load.
"""
import os
import tempfile

try:
    from flask import Flask, request, jsonify
    from faster_whisper import WhisperModel
except ImportError:
    raise SystemExit(
        "Missing packages. Run:  pip install -r python/requirements.txt"
    )

MODEL_SIZE = os.environ.get("JARVIS_WHISPER_MODEL", "base.en")
PORT = int(os.environ.get("JARVIS_WHISPER_PORT", "8756"))

app = Flask(__name__)

print(f"Loading Whisper model '{MODEL_SIZE}' (first run downloads it)…", flush=True)
model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
print("Whisper ready.", flush=True)


@app.route("/health")
def health():
    return jsonify({"ok": True})


@app.route("/transcribe", methods=["POST"])
def transcribe():
    audio = request.get_data()
    if not audio:
        return jsonify({"text": ""})
    # faster-whisper decodes most formats (webm/opus, wav…) via its bundled
    # ffmpeg, so we just hand it the raw bytes on disk.
    tmp = tempfile.NamedTemporaryFile(suffix=".webm", delete=False)
    try:
        tmp.write(audio)
        tmp.close()
        segments, _ = model.transcribe(tmp.name, beam_size=1)
        text = "".join(seg.text for seg in segments).strip()
        return jsonify({"text": text})
    except Exception as exc:  # noqa: BLE001 — report any decode/transcribe error
        return jsonify({"text": "", "error": str(exc)}), 500
    finally:
        try:
            os.remove(tmp.name)
        except OSError:
            pass


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=PORT)
