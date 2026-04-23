import { useState, useEffect } from 'react'
import { notificationsApi } from '../api'
import Spinner from '../components/Spinner'

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function Notifications() {
  const [notifs,  setNotifs]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = () => {
    setLoading(true)
    notificationsApi.list()
      .then(({ data }) => setNotifs(data.data.notifications))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const handleMarkRead = async (id) => {
    try {
      await notificationsApi.markRead(id)
      setNotifs(notifs.map((n) => n.id === id ? { ...n, is_read: true } : n))
    } catch {}
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead()
      setNotifs(notifs.map((n) => ({ ...n, is_read: true })))
    } catch {}
  }

  const unreadCount = notifs.filter(n => !n.is_read).length

  if (loading) return <Spinner size="lg" className="py-32" />

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="section-title text-3xl">Notifications</h1>
          <p className="section-subtitle">Stay updated on your orders</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn-ghost text-sm text-brand-400 hover:text-brand-300">
            Mark all as read
          </button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="card py-20 text-center text-gray-500">
          <span className="text-3xl mb-3 block">📭</span>
          You have no notifications.
        </div>
      ) : (
        <div className="space-y-3">
          {notifs.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
              className={`card p-5 flex gap-4 transition-all duration-300 ${
                n.is_read ? 'opacity-70 bg-surface-800' : 'bg-surface-700/60 border-brand-500/30 cursor-pointer hover:border-brand-500/60'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-brand-600/20 text-brand-400 flex items-center justify-center flex-shrink-0 text-xl">
                {n.type === 'order.placed' ? '🛍️' : '🔔'}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-semibold ${n.is_read ? 'text-gray-300' : 'text-white'}`}>
                    {n.title}
                  </h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                    {timeAgo(n.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {n.body}
                </p>
              </div>
              {!n.is_read && (
                <div className="w-2 h-2 rounded-full bg-brand-500 self-center shadow-[0_0_8px_rgba(59,91,252,0.6)]" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
