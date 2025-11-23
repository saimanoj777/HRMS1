import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  // baseURL: "https://hrms-backend-w91k.onrender.com/api" // Direct connection to backend API
})