# Sample Audio for Testing

This directory should contain sample audiobook files for testing.

## How to Add Audio

### Option 1: Use Free Text-to-Speech (Recommended)

Generate sample audio narration using free online TTS services:

1. Visit **Natural Readers** (https://www.naturalreaders.com/online/) or **TTSMaker** (https://ttsmaker.com/)
2. Paste a sample text (e.g., first chapter of a public domain book)
3. Generate MP3 audio
4. Download and save as:
   - `great-gatsby.mp3`

   - etc.

### Option 2: Use Public Domain Audiobooks

Download from **LibriVox** (https://librivox.org/):
1. Search for public domain books
2. Download MP3 files  
3. Rename to match the audiobook IDs in `audiobooks.json`

### Option 3: Use Sample Test Audio

For quick testing, use this royalty-free audio URL:
```
https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3
```

## File Naming

Match the `audioUrl` field in `frontend/src/data/audiobooks.json`:
- `great-gatsby.mp3`
- `pride-prejudice.mp3`

- `moby-dick.mp3`
- `jane-eyre.mp3`
- `frankenstein.mp3`

## Current Status

⚠️ **No audio files currently included**

The audiobooks.json uses placeholder Unsplash images for covers and points to audio files in this directory. Add MP3 files here to enable playback.

## Note on Microphone Access

**Microphone is NOT needed** - this platform is for PLAYBACK only, not recording. The browser may ask for permissions depending on your configuration, but you can deny microphone access safely.
