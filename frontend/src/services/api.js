import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const sendResearchQuery = async (query, sessionId = null) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/chat`, { query, session_id: sessionId });
        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export const getSessions = async () => {
    const response = await axios.get(`${API_BASE_URL}/sessions`);
    return response.data;
};

export const getSessionMessages = async (sessionId) => {
    const response = await axios.get(`${API_BASE_URL}/sessions/${sessionId}`);
    return response.data;
};

export const deleteSession = async (sessionId) => {
    const response = await axios.delete(`${API_BASE_URL}/sessions/${sessionId}`);
    return response.data;
};
