import sys
import os
import speech_recognition as sr

r = sr.Recognizer()
wav_path = r"c:\Users\nghia\OneDrive\Máy tính\AI-grenerated vid-hyperframe\mp3\elevenlab\do_trinh\voice_preview_đô trịnh - giọng hay.wav"
out_txt_path = r"c:\Users\nghia\OneDrive\Máy tính\AI-grenerated vid-hyperframe\scratch\dotrinh_transcript.txt"

if not os.path.exists(wav_path):
    print(f"File not found: {wav_path}")
    sys.exit(1)

with sr.AudioFile(wav_path) as source:
    audio_data = r.record(source)
    print("Transcribing...")
    try:
        text = r.recognize_google(audio_data, language="vi-VN")
        with open(out_txt_path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Success! Transcript written to: {out_txt_path}")
    except Exception as e:
        print(f"Transcription failed: {e}")
