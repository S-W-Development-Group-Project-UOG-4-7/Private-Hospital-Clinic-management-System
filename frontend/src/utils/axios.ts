import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default axios.create({
  baseURL: `${API_BASE_URL}/api`,
});
