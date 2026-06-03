import { useState, useEffect } from 'react'
import UserPortal from './user/UserPortal'
import AdminPortal from './admin/AdminPortal'
import Auth from './components/Auth'
import { supabase } from './utils/supabase'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('user')

  useEffect(() => {
    // Check current active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen to authentication changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const handleRoute = () => {
      // Check both hash routing (e.g. #/admin) and path routing (e.g. /admin)
      const path = window.location.pathname;
      const hash = window.location.hash;

      if (path.startsWith('/admin') || hash === '#/admin' || hash.startsWith('#/admin')) {
        setCurrentView('admin');
      } else {
        setCurrentView('user');
      }
    };

    // Run on initial mount
    handleRoute();

    // Listen to changes in navigation
    window.addEventListener('popstate', handleRoute);
    window.addEventListener('hashchange', handleRoute);

    return () => {
      window.removeEventListener('popstate', handleRoute);
      window.removeEventListener('hashchange', handleRoute);
    };
  }, []);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#f3f3f5]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#1769ff] border-t-transparent rounded-full animate-spin" />
          <span className="text-[14px] font-extrabold text-[#8f8f95] animate-pulse">TezX CRM Syncing...</span>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  return (
    <>
      {currentView === 'user' && <UserPortal session={session} />}
      {currentView === 'admin' && <AdminPortal session={session} />}
    </>
  )
}

export default App

