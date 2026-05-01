import axios from 'axios';

// Configure axios to always include credentials for session-based auth
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:5000';

export default axios;
