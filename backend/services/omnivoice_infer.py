"""
OmniVoice Inference Engine with Smart Sentence Chunking.
Drop-in replacement for omnivoice.cli.infer.
Prevents OmniVoice flow-matching from skipping/truncating clauses at sentence boundaries (? ! .).
"""

import argparse
import logging
import os
import re
import sys
import numpy as np
import soundfile as sf
import torch

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from omnivoice.models.omnivoice import OmniVoice
from omnivoice.utils.common import str2bool


def get_best_device():
    if torch.cuda.is_available():
        return "cuda"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def get_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="OmniVoice robust chunked inference",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--model", type=str, default="k2-fsa/OmniVoice")
    parser.add_argument("--text", type=str, required=True, help="Text to synthesize.")
    parser.add_argument("--output", type=str, required=True, help="Output WAV file path.")
    parser.add_argument("--ref_audio", type=str, default=None, help="Reference audio file path.")
    parser.add_argument("--ref_text", type=str, default=None, help="Reference text.")
    parser.add_argument("--instruct", type=str, default=None, help="Style instruction.")
    parser.add_argument("--language", type=str, default="Vietnamese", help="Language name.")
    parser.add_argument("--num_step", type=int, default=32)
    parser.add_argument("--guidance_scale", type=float, default=2.0)
    parser.add_argument("--speed", type=float, default=1.0)
    parser.add_argument("--duration", type=float, default=None)
    parser.add_argument("--t_shift", type=float, default=0.1)
    parser.add_argument("--denoise", type=str2bool, default=True)
    parser.add_argument("--postprocess_output", type=str2bool, default=True)
    parser.add_argument("--layer_penalty_factor", type=float, default=5.0)
    parser.add_argument("--position_temperature", type=float, default=5.0)
    parser.add_argument("--class_temperature", type=float, default=0.0)
    parser.add_argument("--device", type=str, default=None)
    return parser


def split_into_sentences(text: str, max_chars: int = 75):
    """
    Split text at sentence boundaries (? ! . …) AND clause boundaries (, ;)
    to prevent OmniVoice duration predictor & attention drift from dropping clauses in long sentences.
    """
    raw_text = text.strip()
    if not raw_text:
        return []

    # First split on primary sentence boundaries (. ? ! …)
    primary_parts = re.split(r'(?<=[.?!…])\s+', raw_text)
    
    final_chunks = []
    for part in primary_parts:
        part = part.strip()
        if not part:
            continue
        
        # If sentence is long (> max_chars) or contains clause separators, split on commas/semicolons
        if len(part) > max_chars or ',' in part or ';' in part:
            sub_parts = re.split(r'(?<=[,;])\s+', part)
            current = ""
            for sub in sub_parts:
                sub = sub.strip()
                if not sub:
                    continue
                if not current:
                    current = sub
                elif len(current) + len(sub) + 1 <= max_chars:
                    current += " " + sub
                else:
                    final_chunks.append(current)
                    current = sub
            if current:
                final_chunks.append(current)
        else:
            final_chunks.append(part)

    if not final_chunks:
        return [raw_text]
    return final_chunks


def main():
    formatter = "%(asctime)s %(levelname)s [%(filename)s:%(lineno)d] %(message)s"
    logging.basicConfig(format=formatter, level=logging.INFO, force=True)

    args = get_parser().parse_args()
    device = args.device or get_best_device()
    logging.info(f"Loading OmniVoice model from {args.model} on {device}...")
    model = OmniVoice.from_pretrained(args.model, device_map=device, dtype=torch.float16)

    sentences = split_into_sentences(args.text)
    logging.info(f"Input text has {len(sentences)} sentence chunk(s): {sentences}")

    sr = model.sampling_rate
    audio_segments = []
    # 180ms natural pause between full sentences, 100ms for clause pauses
    sentence_pause = np.zeros(int(sr * 0.18), dtype=np.float32)
    clause_pause = np.zeros(int(sr * 0.10), dtype=np.float32)

    for idx, sentence in enumerate(sentences):
        logging.info(f"Generating chunk [{idx+1}/{len(sentences)}]: {sentence}")
        chunk_audios = model.generate(
            text=sentence,
            language=args.language,
            ref_audio=args.ref_audio,
            ref_text=args.ref_text,
            instruct=args.instruct,
            duration=args.duration,
            num_step=args.num_step,
            guidance_scale=args.guidance_scale,
            speed=args.speed,
            t_shift=args.t_shift,
            denoise=args.denoise,
            postprocess_output=args.postprocess_output,
            layer_penalty_factor=args.layer_penalty_factor,
            position_temperature=args.position_temperature,
            class_temperature=args.class_temperature,
        )
        audio_data = chunk_audios[0]
        audio_segments.append(audio_data)

        if idx < len(sentences) - 1:
            if sentence.rstrip().endswith((',', ';')):
                audio_segments.append(clause_pause)
            else:
                audio_segments.append(sentence_pause)

    if len(audio_segments) == 1:
        final_audio = audio_segments[0]
    else:
        final_audio = np.concatenate(audio_segments)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    sf.write(args.output, final_audio, sr)
    total_dur = len(final_audio) / sr
    logging.info(f"Successfully generated {total_dur:.2f}s audio saved to {args.output}")


if __name__ == "__main__":
    main()
