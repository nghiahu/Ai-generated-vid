import sys
import json
import torch
import os
import re
from transformers import pipeline

# Reconfigure stdout/stderr to use UTF-8 on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

def remove_accents(input_str):
    if not input_str:
        return ""
    s = input_str.lower()
    s = re.sub(r'[àáạảãâầấậẩẫăằắặẳẵ]', 'a', s)
    s = re.sub(r'[èéẹẻẽêềếệểễ]', 'e', s)
    s = re.sub(r'[ìíịỉĩ]', 'i', s)
    s = re.sub(r'[òóọỏõôồốộổỗơờớợởỡ]', 'o', s)
    s = re.sub(r'[ùúụủũưừứựửữ]', 'u', s)
    s = re.sub(r'[ỳýỵỷỹ]', 'y', s)
    s = re.sub(r'[đ]', 'd', s)
    return s

def clean_word(w):
    """Clean word for comparison (lowercase, remove punctuation/brackets)"""
    if not w:
        return ""
    cleaned = re.sub(r"[^\w\s]", "", w.lower().strip())
    if cleaned == "hẩy":
        cleaned = "phẩy"
    return cleaned

def preprocess_chunks_for_vietnamese(orig_words, chunks):
    """
    Whisper models often transcribe the spoken word 'phẩy' as a comma ',' 
    and 'chấm' as a dot '.', attaching them to the previous word.
    If orig_words explicitly expects 'phẩy' or 'chấm', split the punctuation
    from the host chunk so it receives its own timestamp.
    """
    has_comma_word = any(clean_word(w) in ['phẩy', 'phay'] for w in orig_words)
    has_dot_word = any(clean_word(w) in ['chấm', 'cham'] for w in orig_words)

    if not (has_comma_word or has_dot_word) or not chunks:
        return chunks

    expanded = []
    for chunk in chunks:
        text = chunk.get('text', '')
        ts = chunk.get('timestamp')
        if not ts or ts[0] is None or ts[1] is None:
            expanded.append(chunk)
            continue

        start, end = float(ts[0]), float(ts[1])
        dur = end - start

        # Check for digits with comma e.g. "54,375" or "2,5"
        if has_comma_word and re.search(r'(\d+),(\d+)', text) and dur >= 0.3:
            parts = text.strip().split(',')
            part1 = parts[0].strip()
            part2 = parts[1].strip()
            mid_dur = min(0.3, max(0.18, dur * 0.3))
            left_dur = (dur - mid_dur) * 0.5
            t1 = round(start + left_dur, 3)
            t2 = round(t1 + mid_dur, 3)
            expanded.append({'text': part1, 'timestamp': [start, t1]})
            expanded.append({'text': 'phẩy', 'timestamp': [t1, t2]})
            expanded.append({'text': part2, 'timestamp': [t2, end]})
        # Check for trailing comma when orig_words has 'phẩy'
        elif has_comma_word and re.search(r'[\w]+,\s*$', text) and dur >= 0.25:
            word_part = re.sub(r',\s*$', '', text).strip()
            split_dur = min(0.35, max(0.18, dur * 0.4))
            split_point = round(end - split_dur, 3)
            expanded.append({'text': word_part, 'timestamp': [start, split_point]})
            expanded.append({'text': 'phẩy', 'timestamp': [split_point, end]})
        # Check for trailing period when orig_words has 'chấm'
        elif has_dot_word and re.search(r'[\w]+\.\s*$', text) and dur >= 0.25:
            word_part = re.sub(r'\.\s*$', '', text).strip()
            split_dur = min(0.35, max(0.18, dur * 0.4))
            split_point = round(end - split_dur, 3)
            expanded.append({'text': word_part, 'timestamp': [start, split_point]})
            expanded.append({'text': 'chấm', 'timestamp': [split_point, end]})
        else:
            expanded.append(chunk)
    return expanded

def needleman_wunsch_align(orig_words, whisper_chunks):
    """
    Perform sequence alignment to match Whisper transcribed chunks to target words.
    Returns aligned timestamps for target words.
    """
    whisper_chunks = preprocess_chunks_for_vietnamese(orig_words, whisper_chunks)
    N = len(orig_words)
    M = len(whisper_chunks)
    
    dp = [[0.0] * (M + 1) for _ in range(N + 1)]
    tb = [[0] * (M + 1) for _ in range(N + 1)]
    gap_penalty = -1.0
    
    for i in range(1, N + 1):
        dp[i][0] = i * gap_penalty
        tb[i][0] = 2
    for j in range(1, M + 1):
        dp[0][j] = j * gap_penalty
        tb[0][j] = 3
        
    for i in range(1, N + 1):
        for j in range(1, M + 1):
            w1 = orig_words[i-1]
            w2 = whisper_chunks[j-1]["text"]
            
            w1_c = clean_word(w1)
            w2_c = clean_word(w2)
            w1_raw = remove_accents(w1_c)
            w2_raw = remove_accents(w2_c)
            
            if w1_c == w2_c:
                match_score = 2.0
            elif w1_raw == w2_raw:
                match_score = 1.8
            elif w1_c in w2_c or w2_c in w1_c or w1_raw in w2_raw or w2_raw in w1_raw:
                match_score = 1.2
            elif len(w1_raw) >= 2 and len(w2_raw) >= 2 and (w1_raw[:3] == w2_raw[:3] or w1_raw[-3:] == w2_raw[-3:]):
                match_score = 0.8
            else:
                match_score = -0.5
                
            score_match = dp[i-1][j-1] + match_score
            score_gap_whisper = dp[i-1][j] + gap_penalty
            score_gap_orig = dp[i][j-1] + gap_penalty
            
            best_score = max(score_match, score_gap_whisper, score_gap_orig)
            dp[i][j] = best_score
            
            if best_score == score_match:
                tb[i][j] = 1 # Match
            elif best_score == score_gap_whisper:
                tb[i][j] = 2 # Gap in Whisper
            else:
                tb[i][j] = 3 # Gap in original
                
    i, j = N, M
    aligned = [None] * N
    
    while i > 0 or j > 0:
        if i > 0 and j > 0 and tb[i][j] == 1:
            chunk = whisper_chunks[j-1]
            timestamp = chunk.get("timestamp")
            if timestamp:
                aligned[i-1] = {
                    "word": orig_words[i-1],
                    "start": float(timestamp[0]),
                    "end": float(timestamp[1])
                }
            else:
                aligned[i-1] = {
                    "word": orig_words[i-1],
                    "start": None,
                    "end": None
                }
            i -= 1
            j -= 1
        elif i > 0 and (j == 0 or tb[i][j] == 2):
            aligned[i-1] = {
                "word": orig_words[i-1],
                "start": None,
                "end": None
            }
            i -= 1
        else:
            j -= 1
            
    # Interpolate missing timestamps
    for idx in range(N):
        if aligned[idx]["start"] is None:
            prev_val = None
            for p in range(idx - 1, -1, -1):
                if aligned[p]["end"] is not None:
                    prev_val = aligned[p]["end"]
                    break
            if prev_val is None:
                prev_val = 0.0
                
            next_val = None
            for n in range(idx + 1, N):
                if aligned[n]["start"] is not None:
                    next_val = aligned[n]["start"]
                    break
            if next_val is None:
                next_val = prev_val + 0.35
                
            unmatched_count = 0
            for k in range(idx, N):
                if aligned[k]["start"] is None:
                    unmatched_count += 1
                else:
                    break
            
            step = (next_val - prev_val) / (unmatched_count + 1)
            for k in range(unmatched_count):
                aligned[idx + k]["start"] = round(prev_val + (k + 1) * step - step * 0.5, 3)
                aligned[idx + k]["end"] = round(prev_val + (k + 1) * step, 3)
                
    return aligned

def map_spoken_to_original(orig_words, aligned_spoken):
    """
    Map timestamps from aligned_spoken back to original display words.
    Handles 1-to-1, 1-to-N, and N-to-1 transliterated word relationships.
    """
    N = len(orig_words)
    M = len(aligned_spoken)
    if N == 0:
        return []
    if M == 0:
        return [{"word": w, "start": None, "end": None} for w in orig_words]

    spoken_words = [item["word"] for item in aligned_spoken]

    dp = [[0.0] * (M + 1) for _ in range(N + 1)]
    tb = [[0] * (M + 1) for _ in range(N + 1)]
    gap_penalty = -0.3

    for i in range(1, N + 1):
        dp[i][0] = i * gap_penalty
        tb[i][0] = 2
    for j in range(1, M + 1):
        dp[0][j] = j * gap_penalty
        tb[0][j] = 3

    for i in range(1, N + 1):
        for j in range(1, M + 1):
            w1_c = clean_word(orig_words[i-1])
            w2_c = clean_word(spoken_words[j-1])
            w1_raw = remove_accents(w1_c)
            w2_raw = remove_accents(w2_c)

            if w1_c == w2_c:
                score = 2.0
            elif w1_raw == w2_raw:
                score = 1.8
            elif w1_raw in w2_raw or w2_raw in w1_raw:
                score = 1.2
            elif len(w1_raw) >= 2 and len(w2_raw) >= 2 and (w1_raw[:2] == w2_raw[:2] or w1_raw[-2:] == w2_raw[-2:]):
                score = 1.0
            else:
                score = 0.4 # Positive score so multi-syllable spoken words stay connected

            s_match = dp[i-1][j-1] + score
            s_gap_spk = dp[i-1][j] + gap_penalty
            s_gap_orig = dp[i][j-1] + gap_penalty

            best = max(s_match, s_gap_spk, s_gap_orig)
            dp[i][j] = best
            if best == s_match:
                tb[i][j] = 1
            elif best == s_gap_spk:
                tb[i][j] = 2
            else:
                tb[i][j] = 3

    i, j = N, M
    matches = [[] for _ in range(N)]

    while i > 0 or j > 0:
        if i > 0 and j > 0 and tb[i][j] == 1:
            matches[i-1].append(j-1)
            i -= 1
            j -= 1
        elif i > 0 and (j == 0 or tb[i][j] == 2):
            i -= 1
        else:
            if i > 0:
                matches[i-1].append(j-1)
            j -= 1

    aligned_orig = []
    for idx in range(N):
        spk_indices = matches[idx]
        valid_starts = [aligned_spoken[k]["start"] for k in spk_indices if aligned_spoken[k]["start"] is not None]
        valid_ends = [aligned_spoken[k]["end"] for k in spk_indices if aligned_spoken[k]["end"] is not None]

        start_time = min(valid_starts) if valid_starts else None
        end_time = max(valid_ends) if valid_ends else None

        aligned_orig.append({
            "word": orig_words[idx],
            "start": start_time,
            "end": end_time
        })

    # Interpolate any remaining missing timestamps
    for idx in range(N):
        if aligned_orig[idx]["start"] is None:
            prev_val = None
            for p in range(idx - 1, -1, -1):
                if aligned_orig[p]["end"] is not None:
                    prev_val = aligned_orig[p]["end"]
                    break
            if prev_val is None:
                prev_val = 0.0

            next_val = None
            for n in range(idx + 1, N):
                if aligned_orig[n]["start"] is not None:
                    next_val = aligned_orig[n]["start"]
                    break
            if next_val is None:
                next_val = prev_val + 0.35

            unmatched_count = 0
            for k in range(idx, N):
                if aligned_orig[k]["start"] is None:
                    unmatched_count += 1
                else:
                    break

            step = (next_val - prev_val) / (unmatched_count + 1)
            for k in range(unmatched_count):
                aligned_orig[idx + k]["start"] = round(prev_val + (k + 1) * step - step * 0.5, 3)
                aligned_orig[idx + k]["end"] = round(prev_val + (k + 1) * step, 3)

    return aligned_orig

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments. Usage: python align.py <audio_path> <original_text> [spoken_text]"}))
        sys.exit(1)
        
    audio_path = sys.argv[1]
    original_text = sys.argv[2]
    spoken_text = sys.argv[3] if len(sys.argv) > 3 else None
    
    if not os.path.exists(audio_path):
        print(json.dumps({"error": f"Audio file not found: {audio_path}"}))
        sys.exit(1)
        
    orig_words = original_text.split()
    if len(orig_words) == 0:
        print(json.dumps([]))
        sys.exit(0)
        
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    try:
        pipe = pipeline(
            "automatic-speech-recognition",
            model="openai/whisper-tiny",
            device=device,
            return_timestamps="word"
        )
        
        try:
            result = pipe(audio_path, generate_kwargs={"language": "vi", "task": "transcribe"})
        except Exception:
            result = pipe(audio_path)
        chunks = result.get("chunks", [])
        
        if spoken_text and spoken_text.strip() and spoken_text.strip() != original_text.strip():
            # Clean spoken text of any [PHONEME: ...] tags and expand hyphens to spaces
            cleaned_spoken_text = re.sub(r"\[PHONEME:[^\]]*\]", "", spoken_text).strip()
            cleaned_spoken_text = cleaned_spoken_text.replace("-", " ")
            spoken_words = [w.strip() for w in cleaned_spoken_text.split() if w.strip()]
            if len(spoken_words) > 0:
                aligned_spoken = needleman_wunsch_align(spoken_words, chunks)
                aligned_result = map_spoken_to_original(orig_words, aligned_spoken)
            else:
                aligned_result = needleman_wunsch_align(orig_words, chunks)
        else:
            aligned_result = needleman_wunsch_align(orig_words, chunks)
        
        print(json.dumps(aligned_result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
