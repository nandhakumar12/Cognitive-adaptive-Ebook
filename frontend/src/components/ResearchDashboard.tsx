/**
 * RESEARCH OBSERVABILITY DASHBOARD
 * 
 * Real-time visualization of:
 * - Behavioral event timeline
 * - Cognitive load indicators
 * - Adaptation actions
 * - Before/after metrics
 * 
 * FOR RESEARCH DEMONSTRATION ONLY - Not for end users
 */

import React, { useState, useEffect } from 'react';
import { eventEmitter } from '../services/EventEmitter';
import { getCognitiveState, getAdaptationHistory, getEventHistory } from '../services/apiClient';
import type { CognitiveState, AdaptationDecision, BehavioralEvent } from '../types';

export const ResearchDashboard: React.FC = () => {
    const [cognitiveState, setCognitiveState] = useState<CognitiveState | null>(null);
    const [adaptations, setAdaptations] = useState<AdaptationDecision[]>([]);
    const [events, setEvents] = useState<BehavioralEvent[]>([]);

    useEffect(() => {
        const interval = setInterval(async () => {
            const sessionId = eventEmitter.getSessionId();

            try {
                const [state, adaps, evts] = await Promise.all([
                    getCognitiveState(sessionId),
                    getAdaptationHistory(sessionId, 10),
                    getEventHistory(sessionId, 20)
                ]);

                if (state) setCognitiveState(state);
                setAdaptations(adaps || []);
                setEvents(evts || []);
            } catch (error) {
                console.warn('[Research Dashboard] Backend not responding:', error);
            }
        }, 3000); // Update every 3 seconds

        return () => clearInterval(interval);
    }, []);

    const getCognitiveLoadColor = (load: string | undefined) => {
        if (!load) return '#94a3b8';
        switch (load.toLowerCase()) {
            case 'low': return '#4ade80';
            case 'medium': return '#facc15';
            case 'high': return '#f87171';
            default: return '#94a3b8';
        }
    };

    return (
        <div className="research-dashboard" role="complementary" aria-label="Research observability dashboard">
            {/* Cognitive Load Indicator */}
            <div className="cognitive-load-panel">
                <h4>Cognitive Load Status</h4>
                {cognitiveState && cognitiveState.cognitiveLoad ? (
                    <div className="load-display">
                        <div
                            className="load-indicator"
                            style={{
                                backgroundColor: getCognitiveLoadColor(cognitiveState.cognitiveLoad),
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#000',
                                fontWeight: 'bold',
                                fontSize: '14px'
                            }}
                        >
                            {(cognitiveState.cognitiveLoad || 'UNKNOWN').toUpperCase()}
                        </div>
                        <div className="load-details">
                            <p><strong>Confidence:</strong> {((cognitiveState.confidence || 0) * 100).toFixed(0)}%</p>
                            <p><strong>Patterns Detected:</strong></p>
                            <ul>
                                {cognitiveState.patterns && cognitiveState.patterns.length > 0 ? (
                                    cognitiveState.patterns.map((pattern, i) => (
                                        <li key={i}>{pattern.replace(/_/g, ' ')}</li>
                                    ))
                                ) : (
                                    <li>No patterns (optimal engagement)</li>
                                )}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="load-display" style={{ padding: '20px', textAlign: 'center' }}>
                        <p style={{ margin: '10px 0' }}>⏳ Waiting for cognitive data...</p>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
                            Connecting to Backend at: <strong>{import.meta.env.VITE_API_URL || `${window.location.origin}`}</strong>
                        </p>
                    </div>
                )}
            </div>

            {/* Behavioral Metrics */}
            {cognitiveState && cognitiveState.behaviorSummary ? (
                <div className="metrics-panel">
                    <h4>Behavioral Metrics</h4>
                    <div className="metrics-grid">
                        <div className="metric">
                            <span className="metric-label">Pause Frequency</span>
                            <span className="metric-value">{(cognitiveState.behaviorSummary.pauseFrequency || 0).toFixed(1)}/min</span>
                        </div>
                        <div className="metric">
                            <span className="metric-label">Replays</span>
                            <span className="metric-value">{cognitiveState.behaviorSummary.replayCount || 0}</span>
                        </div>
                        <div className="metric">
                            <span className="metric-label">Avg Speed</span>
                            <span className="metric-value">{(cognitiveState.behaviorSummary.avgSpeed || 1.0).toFixed(2)}x</span>
                        </div>
                        <div className="metric">
                            <span className="metric-label">Nav Reversals</span>
                            <span className="metric-value">{cognitiveState.behaviorSummary.navigationReversals || 0}</span>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Adaptation Timeline */}
            <div className="adaptations-panel">
                <h4>Adaptation Actions ({adaptations.length})</h4>
                <div className="timeline">
                    {adaptations.length > 0 ? (
                        adaptations.slice().reverse().map((adaptation, i) => (
                            <div key={i} className="timeline-item">
                                <span className="timestamp">
                                    {new Date(adaptation.timestamp).toLocaleTimeString()}
                                </span>
                                <div className="adaptation-details">
                                    <strong>{(adaptation.strategy || '').replace(/_/g, ' ')}</strong>
                                    <p>{adaptation.reason || 'No reason provided'}</p>
                                    <small>Triggered by: {adaptation.triggeredBy && adaptation.triggeredBy.length > 0 ? adaptation.triggeredBy.join(', ') : 'behavioral signals'}</small>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: '#94a3b8', padding: '10px' }}>No adaptations yet - start listening to audio</p>
                    )}
                </div>
            </div>

            {/* Event Log */}
            <div className="events-panel">
                <h4>Recent Events ({events.length})</h4>
                <div className="event-log">
                    {events.length > 0 ? (
                        events.slice().reverse().slice(0, 10).map((event, i) => (
                            <div key={i} className="event-item">
                                <span className="event-type">{event.eventType || 'UNKNOWN'}</span>
                                <span className="event-time">
                                    {new Date(event.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: '#94a3b8', padding: '10px' }}>No events captured yet</p>
                    )}
                </div>
            </div>
        </div>
    );
};
