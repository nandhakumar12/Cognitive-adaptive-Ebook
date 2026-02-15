/**
 * ACCESSIBLE AUDIO PLAYER COMPONENT
 * 
 * Voice-first, screen-reader friendly audio player
 * Emits behavioral cognitive indicators automatically
 * 
 * KEY FEATURES:
 * - Full keyboard navigation
 * - ARIA labels and live regions
 * - Automatic event emission
 * - Adaptation reception and execution
 */

import React, { useRef, useState, useEffect } from 'react';
import { eventEmitter } from '../services/EventEmitter';
import { getActiveAdaptations } from '../services/apiClient';
import type { AdaptationDecision } from '../types';
import './AudioPlayer.css';

interface AudioPlayerProps {
    audioSrc: string;
    sectionId: string;
    sectionTitle: string;
    onSeekToTime?: number; // Time in seconds to seek to
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioSrc, sectionId, sectionTitle, onSeekToTime }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
    const [announcement, setAnnouncement] = useState('');
    const [activeAlert, setActiveAlert] = useState<{ message: string; strategy: string } | null>(null);
    const [isSimplified, setIsSimplified] = useState(false);
    const [pendingAdaptation, setPendingAdaptation] = useState<AdaptationDecision | null>(null);
    const idleTimerRef = useRef<number | null>(null);
    const seenAdaptationIds = useRef<Set<string>>(new Set());

    /**
     * Poll for adaptations every 2 seconds
     */
    useEffect(() => {
        const adaptationInterval = setInterval(async () => {
            const adaptations = await getActiveAdaptations(eventEmitter.getSessionId());
            applyAdaptations(adaptations);
        }, 2000);

        return () => clearInterval(adaptationInterval);
    }, []);

    /**
     * Apply adaptation decisions automatically
     */
    const applyAdaptations = (adaptations: AdaptationDecision[]) => {
        adaptations.forEach(adaptation => {
            // Only apply if we haven't seen this specific adaptation instance before
            if (seenAdaptationIds.current.has(adaptation.adaptationId)) return;
            seenAdaptationIds.current.add(adaptation.adaptationId);

            console.log('[ADAPTATION RECEIVED]', adaptation.strategy);

            switch (adaptation.strategy) {
                case 'SLOW_NARRATION':
                    const targetSpeed = adaptation.parameters.targetSpeed || 0.75;

                    // User requested confirmation for significant speed reduction (e.g. 56%)
                    if (targetSpeed < 0.75) {
                        setPendingAdaptation(adaptation);
                        return; // Wait for confirmation
                    }

                    setPlaybackSpeed(targetSpeed);
                    if (audioRef.current) {
                        audioRef.current.playbackRate = targetSpeed;
                    }
                    showAlert("Slowing narration for better comprehension", "SLOW_NARRATION");
                    break;

                case 'AUTO_REPEAT':
                    const repeatTime = adaptation.parameters.targetTime || 0;
                    if (audioRef.current) {
                        audioRef.current.currentTime = repeatTime;
                    }
                    showAlert("Automatic repeat triggered for reinforcement", "AUTO_REPEAT");
                    break;

                case 'SMART_PAUSE':
                    showAlert(adaptation.parameters.resumeMessage || 'Pausing for processing', "SMART_PAUSE");
                    if (audioRef.current && isPlaying) {
                        audioRef.current.pause();
                        setIsPlaying(false);

                        // Auto-resume after pause duration
                        setTimeout(() => {
                            if (audioRef.current) {
                                audioRef.current.play();
                                setIsPlaying(true);
                                announce('Resuming audio');
                            }
                        }, adaptation.parameters.pauseDuration || 5000);
                    }
                    break;

                case 'SUMMARY_INJECTION':
                    showAlert(adaptation.parameters.summaryText || 'Section summary available', "SUMMARY_INJECTION");
                    break;

                case 'SIMPLIFY_INTERACTION':
                    setIsSimplified(true);
                    showAlert("Enabling Simplified Mode to reduce cognitive load", "SIMPLIFY_INTERACTION");
                    setTimeout(() => setIsSimplified(false), adaptation.parameters.duration || 60000);
                    break;
            }
        });
    };

    /**
     * Handle user confirmation for adaptation
     */
    const handleConfirmAdaptation = (accepted: boolean) => {
        if (!pendingAdaptation) return;

        if (accepted) {
            const targetSpeed = pendingAdaptation.parameters.targetSpeed || 0.56;
            setPlaybackSpeed(targetSpeed);
            if (audioRef.current) {
                audioRef.current.playbackRate = targetSpeed;
            }
            showAlert("Applying requested speed reduction", "SLOW_NARRATION");
        } else {
            announce("Speed reduction declined");
        }

        setPendingAdaptation(null);
        setLastInteractionTime(Date.now());
    };

    /**
     * Announce to screen readers and show visual alert
     */
    const announce = (message: string) => {
        setAnnouncement(message);
        setTimeout(() => setAnnouncement(''), 100);
    };

    const showAlert = (message: string, strategy: string) => {
        announce(message);
        setActiveAlert({ message, strategy });
        setTimeout(() => setActiveAlert(null), 8000); // 8 second visibility
    };

    /**
     * Idle detection
     */
    useEffect(() => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
        }

        idleTimerRef.current = setTimeout(() => {
            const idleDuration = Date.now() - lastInteractionTime;
            if (idleDuration > 10000) { // 10 seconds idle
                eventEmitter.emit('USER_IDLE', {
                    idleDuration,
                    currentTime,
                    sectionId
                });
            }
        }, 10000);

        return () => {
            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
            }
        };
    }, [lastInteractionTime]);

    /**
     * Track time updates
     */
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, []);

    /**
     * Expose seek method to parent (for chapter clicks)
     */
    useEffect(() => {
        if (onSeekToTime !== undefined && audioRef.current) {
            const previousTime = audioRef.current.currentTime;

            // Detect navigation reversal if seeking to an earlier time via chapter list
            if (onSeekToTime < previousTime - 5) {
                eventEmitter.emit('NAVIGATION_REVERSAL', {
                    fromTime: previousTime,
                    toTime: onSeekToTime,
                    sectionId
                });
            }

            audioRef.current.currentTime = onSeekToTime;
        }
    }, [onSeekToTime]);

    /**
     * Play/Pause handler
     */
    const handlePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
            eventEmitter.emit('AUDIO_PAUSE', {
                currentTime: audio.currentTime,
                sectionId,
                speed: playbackSpeed
            });
            announce('Audio paused');
        } else {
            audio.play();
            setIsPlaying(true);
            eventEmitter.emit('AUDIO_PLAY', {
                currentTime: audio.currentTime,
                sectionId,
                speed: playbackSpeed
            });
            announce('Audio playing');
        }

        setLastInteractionTime(Date.now());
    };

    /**
     * Speed change handler
     */
    const handleSpeedChange = (newSpeed: number) => {
        const audio = audioRef.current;
        if (!audio) return;

        const previousSpeed = playbackSpeed;
        setPlaybackSpeed(newSpeed);
        audio.playbackRate = newSpeed;

        eventEmitter.emit('AUDIO_SPEED_CHANGE', {
            speed: newSpeed,
            previousSpeed,
            currentTime: audio.currentTime,
            sectionId
        });

        announce(`Playback speed set to ${Math.round(newSpeed * 100)}%`);
        setLastInteractionTime(Date.now());
    };

    /**
     * Seek handler (replay/skip)
     */
    const handleSeek = (seconds: number) => {
        const audio = audioRef.current;
        if (!audio) return;

        const previousTime = audio.currentTime;
        const newTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
        audio.currentTime = newTime;

        if (seconds < 0) {
            eventEmitter.emit('AUDIO_REPLAY', {
                currentTime: newTime,
                previousTime,
                replayDuration: Math.abs(seconds),
                sectionId
            });
            announce(`Replayed ${Math.abs(seconds)} seconds`);
        } else {
            eventEmitter.emit('AUDIO_SEEK', {
                currentTime: newTime,
                previousTime,
                seekDuration: seconds,
                sectionId
            });
            announce(`Skipped forward ${seconds} seconds`);
        }

        setLastInteractionTime(Date.now());
    };

    /**
     * Keyboard navigation
     */
    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case ' ':
            case 'k':
                e.preventDefault();
                handlePlayPause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                handleSeek(-10);
                break;
            case 'ArrowRight':
                e.preventDefault();
                handleSeek(10);
                break;
            case 'ArrowUp':
                e.preventDefault();
                handleSpeedChange(Math.min(2.0, playbackSpeed + 0.25));
                break;
            case 'ArrowDown':
                e.preventDefault();
                handleSpeedChange(Math.max(0.5, playbackSpeed - 0.25));
                break;
        }
    };

    /**
     * Format time for display
     */
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div
            className="audio-player"
            role="region"
            aria-label="AudioPlayer controls"
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            <audio ref={audioRef} src={audioSrc} />

            {/* Screen reader announcements */}
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                {announcement}
            </div>

            {activeAlert && (
                <div className={`adaptation-alert ${activeAlert.strategy.toLowerCase()}`}>
                    <span className="alert-icon">⚖️</span>
                    <div className="alert-content">
                        <strong>ADAPTATION ACTIVE:</strong>
                        <p>{activeAlert.message}</p>
                    </div>
                </div>
            )}

            {pendingAdaptation && (
                <div className="adaptation-confirmation-overlay">
                    <div className="confirmation-dialog">
                        <h3>Adjust Playback Speed?</h3>
                        <p>We've noticed you might be having some difficulty. Would you like to reduce the playback speed to {Math.round((pendingAdaptation.parameters.targetSpeed || 0.56) * 100)}% for better comprehension?</p>
                        <div className="confirmation-actions">
                            <button className="confirm-btn yes" onClick={() => handleConfirmAdaptation(true)}>Yes, slow down</button>
                            <button className="confirm-btn no" onClick={() => handleConfirmAdaptation(false)}>No, keep current</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="player-header">
                <h2 id="section-title">{sectionTitle}</h2>
                <p className="playback-info">
                    {formatTime(currentTime)} / {formatTime(duration)}
                    {' • '}
                    {Math.round(playbackSpeed * 100)}% speed
                </p>
            </div>

            <div className="player-controls">
                {!isSimplified && (
                    <button
                        onClick={() => handleSeek(-10)}
                        aria-label="Rewind 10 seconds"
                        className="control-btn"
                    >
                        ⏪ -10s
                    </button>
                )}

                <button
                    onClick={handlePlayPause}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    className="control-btn primary"
                >
                    {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                </button>

                {!isSimplified && (
                    <button
                        onClick={() => handleSeek(10)}
                        aria-label="Skip forward 10 seconds"
                        className="control-btn"
                    >
                        ⏩ +10s
                    </button>
                )}
            </div>

            {!isSimplified && (
                <div className="speed-controls">
                    <label htmlFor="speed-select">Playback Speed:</label>
                    <select
                        id="speed-select"
                        value={playbackSpeed}
                        onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                        aria-label="Select playback speed"
                    >
                        <option value="0.5">0.5x (Slow)</option>
                        <option value="0.75">0.75x</option>
                        <option value="1.0">1.0x (Normal)</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x (Fast)</option>
                        <option value="2.0">2.0x (Very Fast)</option>
                    </select>
                </div>
            )}

            <div className="keyboard-hints" aria-label="Keyboard shortcuts">
                <p>Keyboard shortcuts: Space/K = Play/Pause • ← = -10s • → = +10s • ↑↓ = Speed</p>
            </div>
        </div>
    );
};
