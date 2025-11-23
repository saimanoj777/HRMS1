import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:3001/api' || "https://hrms-backend-w91k.onrender.com" // Direct connection to backend API
})