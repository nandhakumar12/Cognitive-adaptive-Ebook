/**
 * ADAPTATION API CLIENT
 * 
 * Service for polling and receiving adaptation decisions from backend
 */

import axios from 'axios';
import type { AdaptationDecision } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3001`;

/**
 * Poll for active adaptations
 */
export async function getActiveAdaptations(sessionId: string): Promise<AdaptationDecision[]> {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/adaptations/${sessionId}/active`);
        return response.data.activeAdaptations || [];
    } catch (error) {
        console.error('Failed to get active adaptations:', error);
        return [];
    }
}

/**
 * Get cognitive state for session
 */
export async function getCognitiveState(sessionId: string) {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/cognitive/${sessionId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to get cognitive state:', error);
        return null;
    }
}

/**
 * Get adaptation history
 */
export async function getAdaptationHistory(sessionId: string, limit: number = 20) {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/adaptations/${sessionId}`, {
            params: { limit }
        });
        return response.data.adaptations || [];
    } catch (error) {
        console.error('Failed to get adaptation history:', error);
        return [];
    }
}

/**
 * Get event history (for research dashboard)
 */
export async function getEventHistory(sessionId: string, limit: number = 50) {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/events/${sessionId}`, {
            params: { limit }
        });
        return response.data.events || [];
    } catch (error) {
        console.error('Failed to get event history:', error);
        return [];
    }
}
