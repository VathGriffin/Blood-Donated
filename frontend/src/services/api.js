import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const fetchDonors = () => axios.get(`${API_BASE}/donors`);
export const requestBlood = (data) => axios.post(`${API_BASE}/request`, data);
