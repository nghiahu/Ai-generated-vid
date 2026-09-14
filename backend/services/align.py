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

def clean_word(w):
    """Clean word for comparison (lowercase, remove punctuation/accents/brackets)"""
    if not w:
        return ""
    # Lowercase and keep only alphanumeric characters
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
    Perform sequence alignment to match Whisper transcribed chunks to original words.
    Returns aligned timestamps for original words.
    """
    whisper_chunks = preprocess_chunks_for_vietnamese(orig_words, whisper_chunks)
    N = len(orig_words)
    M = len(whisper_chunks)
    
    # DP table initialized with gap penalties
    dp = [[0.0] * (M + 1) for _ in range(N + 1)]
    tb = [[0] * (M + 1) for _ in range(N + 1)] # 1: match, 2: gap_whisper, 3: gap_orig
    
    # Gap penalty
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
            
            # Calculate match score based on clean word similarity
            w1_c = clean_word(w1)
            w2_c = clean_word(w2)
            
            if w1_c == w2_c:
                match_score = 2.0
            elif w1_c in w2_c or w2_c in w1_c:
                match_score = 1.0
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
                tb[i][j] = 2 # Gap in Whisper (delete original word)
            else:
                tb[i][j] = 3 # Gap in original (insert Whisper word)
                
    # Backtracking
    i, j = N, M
    aligned = [None] * N
    
    while i > 0 or j > 0:
        if i > 0 and j > 0 and tb[i][j] == 1:
            # Match
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
            # Original word unmatched (gap in Whisper)
            aligned[i-1] = {
                "word": orig_words[i-1],
                "start": None,
                "end": None
            }
            i -= 1
        else:
            # Whisper chunk unmatched (gap in original)
            j -= 1
            
    # Interpolate missing timestamps
    for idx in range(N):
        if aligned[idx]["start"] is None:
            # Find previous valid timestamp
            prev_val = None
            for p in range(idx - 1, -1, -1):
                if aligned[p]["end"] is not None:
                    prev_val = aligned[p]["end"]
                    break
            if prev_val is None:
                prev_val = 0.0
                
            # Find next valid timestamp
            next_val = None
            for n in range(idx + 1, N):
                if aligned[n]["start"] is not None:
                    next_val = aligned[n]["start"]
                    break
            if next_val is None:
                # If no next matched word, we can estimate based on previous + average word duration (e.g. 0.3s)
                next_val = prev_val + 0.35
                
            # Distribute time evenly among unmatched consecutive words
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

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments. Usage: python align.py <audio_path> <original_text>"}))
        sys.exit(1)
        
    audio_path = sys.argv[1]
    original_text = sys.argv[2]
    
    if not os.path.exists(audio_path):
        print(json.dumps({"error": f"Audio file not found: {audio_path}"}))
        sys.exit(1)
        
    orig_words = original_text.split()
    if len(orig_words) == 0:
        print(json.dumps([]))
        sys.exit(0)
        
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    try:
        # Load ASR pipeline (Whisper Tiny is fast and reliable for alignment)
        pipe = pipeline(
            "automatic-speech-recognition",
            model="openai/whisper-tiny",
            device=device,
            return_timestamps="word"
        )
        
        # Run ASR transcription with Vietnamese language hint
        try:
            result = pipe(audio_path, generate_kwargs={"language": "vi", "task": "transcribe"})
        except Exception:
            result = pipe(audio_path)
        chunks = result.get("chunks", [])
        
        # Align chunks to original words
        aligned_result = needleman_wunsch_align(orig_words, chunks)
        
        print(json.dumps(aligned_result, ensure_ascii=False))
    except Exception as e:
        # Fallback to simple uniform distribution if Whisper fails
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
