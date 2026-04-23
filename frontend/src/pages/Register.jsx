import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import Spinner from '../components/Spinner'

export default function Register() {
  const { register } = useAuth()
  const navigate      = useNavigate()

  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await register({ name: form.name, email: form.email, password: form.password })
      toast.success('Account created! Please log in.')
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const strength = (() => {
    const p = form.password
    if (!p) return 0
    let s = 0
    if (p.length >= 6)  s++
    if (p.length >= 10) s++
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) s++
    if (/[^a-zA-Z0-9]/.test(p)) s++
    return s
  })()
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-500'][strength]

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] bg-brand-600/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">🛒</span>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-brand-400 to-brand-300 bg-clip-text text-transparent">
              NexCart
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Join thousands of happy shoppers</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-600/15 border border-red-600/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="label">Full Name</label>
              <input id="name" name="name" type="text" autoComplete="name" required
                value={form.name} onChange={handleChange} className="input" placeholder="Jane Doe" />
            </div>

            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input id="email" name="email" type="email" autoComplete="email" required
                value={form.email} onChange={handleChange} className="input" placeholder="you@example.com" />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input id="password" name="password" type="password" autoComplete="new-password" required
                value={form.password} onChange={handleChange} className="input" placeholder="Min. 6 characters" />
              {form.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map((i) => (
                      <div key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          i <= strength ? strengthColor : 'bg-surface-600'
                        }`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">{strengthLabel}</p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirm" className="label">Confirm Password</label>
              <input id="confirm" name="confirm" type="password" autoComplete="new-password" required
                value={form.confirm} onChange={handleChange} className="input" placeholder="Repeat password"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? <Spinner size="sm" /> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
