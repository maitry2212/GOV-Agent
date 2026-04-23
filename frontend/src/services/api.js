import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with interceptor for auth tokens
const api = axios.create({ baseURL: API_BASE_URL });

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ───── Auth API ─────

export const signUp = async (name, email, password) => {
    const response = await api.post('/auth/signup', { name, email, password });
    const { access_token, user } = response.data;
    localStorage.setItem('auth_token', access_token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    return response.data;
};

export const signIn = async (email, password) => {
    const response = await api.post('/auth/signin', { email, password });
    const { access_token, user } = response.data;
    localStorage.setItem('auth_token', access_token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    return response.data;
};

export const getMe = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
};

export const getStoredUser = () => {
    const user = localStorage.getItem('auth_user');
    return user ? JSON.parse(user) : null;
};

export const getStoredToken = () => {
    return localStorage.getItem('auth_token');
};

// ───── Chat API ─────

export const sendResearchQuery = async (query, sessionId = null) => {
    try {
        const response = await api.post('/chat', { query, session_id: sessionId });
        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export const getSessions = async () => {
    const response = await api.get('/sessions');
    return response.data;
};

export const getSessionMessages = async (sessionId) => {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
};

export const deleteSession = async (sessionId) => {
    const response = await api.delete(`/sessions/${sessionId}`);
    return response.data;
};
