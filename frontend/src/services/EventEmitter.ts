/**
 * EVENT EMISSION SERVICE
 * 
 * Centralized service for emitting behavioral cognitive indicators
 * All frontend interactions flow through this service
 */

import axios from 'axios';
import type { BehavioralEvent, BehavioralEventType } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

class EventEmitter {
    private sessionId: string;
    private eventQueue: Partial<BehavioralEvent>[] = [];
    private batchInterval: number = 2000; // Send batch every 2 seconds
    private batchTimer: NodeJS.Timeout | null = null;

    constructor() {
        this.sessionId = this.generateSessionId();
        this.startBatchProcessing();
    }

    /**
     * Generate unique session ID
     */
    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    /**
     * Emit a behavioral event
     * 
     * @param eventType - Type of behavioral event
     * @param metadata - Additional context about the event
     */
    public emit(eventType: BehavioralEventType, metadata: Record<string, any> = {}) {
        const event = {
            eventType,
            metadata: {
                ...metadata,
                timestamp: Date.now()
            }
        };

        // Add to queue for batch processing
        this.eventQueue.push(event);

        console.log(`[EVENT] ${eventType}`, metadata);

        // For critical events, send immediately
        if (this.isCriticalEvent(eventType)) {
            this.sendImmediate(event);
        }
    }

    private isCriticalEvent(eventType: BehavioralEventType): boolean {
        return [
            'SESSION_START',
            'SESSION_END',
            'AUDIO_PAUSE',
            'AUDIO_REPLAY' // IMMEDIATE SEND for Rapid Rewind detection
        ].includes(eventType);
    }

    /**
     * Send event immediately (for critical events)
     */
    private async sendImmediate(event: Partial<BehavioralEvent>) {
        try {
            await axios.post(`${API_BASE_URL}/api/events/ingest`, {
                sessionId: this.sessionId,
                ...event
            });
        } catch (error) {
            console.error('Failed to send event:', error);
            // Store in queue as fallback
            this.eventQueue.push(event);
        }
    }

    /**
     * Start batch processing of events
     */
    private startBatchProcessing() {
        this.batchTimer = setInterval(() => {
            this.processBatch();
        }, this.batchInterval);
    }

    /**
     * Process queued events in batch
     */
    private async processBatch() {
        if (this.eventQueue.length === 0) return;

        const eventsToSend = [...this.eventQueue];
        this.eventQueue = [];

        try {
            await axios.post(`${API_BASE_URL}/api/events/batch`, {
                sessionId: this.sessionId,
                events: eventsToSend
            });

            console.log(`[EVENT BATCH] Sent ${eventsToSend.length} events`);
        } catch (error) {
            console.error('Failed to send batch:', error);
            // Re-queue events
            this.eventQueue.unshift(...eventsToSend);
        }
    }

    /**
     * Get current session ID
     */
    public getSessionId(): string {
        return this.sessionId;
    }

    /**
     * Start new session
     */
    public startSession() {
        this.emit('SESSION_START');
    }

    /**
     * Start a fresh session (used when switching books)
     */
    public refreshSession() {
        this.endSession();
        this.sessionId = this.generateSessionId();
        this.startSession();
        console.log(`[SESSION] Refreshed. New ID: ${this.sessionId}`);
    }

    /**
     * End session
     */
    public endSession() {
        this.emit('SESSION_END');
        this.processBatch(); // Send any remaining events
        if (this.batchTimer) {
            clearInterval(this.batchTimer);
        }
    }
}

// Singleton instance
export const eventEmitter = new EventEmitter();
