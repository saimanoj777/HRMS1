import axios from 'axios'

export const api = axios.create({
  baseURL: "https://hrms-backend-w91k.onrender.com/api" // Direct connection to backend API
})