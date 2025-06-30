import axios from 'axios';

const bffUrl = import.meta.env.VITE_BFF_URL || 'http://localhost:39500';

async function getTotals() {
  try {
    const response = await axios.get(`/${bffUrl}/expenses/totals`);
    return response.data;
  } catch (error) {
    console.error('Error fetching totals:', error);
    throw error;
  }
}

async function getExpenses() {
  try {
    const response = await axios.get(`/${bffUrl}/expenses`);
    return response.data;
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
}

async function getProfile() {
  try {
    const response = await axios.get(`/${bffUrl}/profile`);
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
}

function login() {
  window.location.href = `/${bffUrl}/login`;
}

function logout() {
  window.location.href = `/${bffUrl}/logout`;
}

export { getTotals, getExpenses, getProfile, login };