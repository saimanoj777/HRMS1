import { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Login from './components/Login'
import Register from './components/Register'
import EmployeeList from './components/EmployeeList'
import TeamList from './components/TeamList'
import CreateEmployee from './components/CreateEmployee'
import CreateTeam from './components/CreateTeam'
import AssignTeam from './components/AssignTeam'
import ActivityLog from './components/ActivityLog'
import { api } from './utils/api'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (token) {
      api.defaults.headers.Authorization = `Bearer ${token}`
      // Fetch user if needed
    }
  }, [token])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    api.post('/auth/logout')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {token ? (
        <>
          <nav className="bg-linear-to-r from-blue-600 to-blue-800 p-4 text-white shadow-lg">
            <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
              <Link to="/" className="text-2xl font-bold mb-4 md:mb-0 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                </svg>
                HRMS
              </Link>
              <div className="flex flex-wrap justify-center gap-2 md:gap-4">
                <Link to="/employees" className="px-3 py-2 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  Employees
                </Link>
                <Link to="/teams" className="px-3 py-2 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  Teams
                </Link>
                <Link to="/assign" className="px-3 py-2 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                  Assignments
                </Link>
                <Link to="/activity-log" className="px-3 py-2 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Activity Log
                </Link>
                {/* <Link to="/create-employee" className="px-3 py-2 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Employee
                </Link>
                <Link to="/create-team" className="px-3 py-2 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Team
                </Link> */}
                <button 
                  onClick={handleLogout} 
                  className="px-3 py-2 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </nav>
          <div className="container mx-auto p-4">
            <Routes>
              <Route path="/" element={<EmployeeList />} />
              <Route path="/employees" element={<EmployeeList />} />
              <Route path="/teams" element={<TeamList />} />
              <Route path="/create-employee" element={<CreateEmployee />} />
              <Route path="/create-team" element={<CreateTeam />} />
              <Route path="/assign" element={<AssignTeam />} />
              <Route path="/activity-log" element={<ActivityLog />} />
            </Routes>
          </div>
        </>
      ) : (
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Login setToken={setToken} setUser={setUser} />} />
            <Route path="/register" element={<Register setToken={setToken} setUser={setUser} />} />
            <Route path="*" element={<Login setToken={setToken} setUser={setUser} />} />
          </Routes>
        </div>
      )}
    </div>
  )
}

export default App