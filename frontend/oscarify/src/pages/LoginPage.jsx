import { Link, useNavigate } from 'react-router-dom'
import { setUsername, setPassword } from '../globals'

function LoginPage() {
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/app')
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <Link to="/" className="logo" style={{ justifyContent: 'center', marginBottom: '24px' }}>
          <svg className="logo-icon" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#7B5EA7"/>
            <path d="M8 12h16M8 16h12M8 20h14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </Link>

        <h1 className="login-title">Let's write</h1>
        <p className="login-subtitle">Sign in to get started</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="login-input"
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            className="login-input"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="login-submit">
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
