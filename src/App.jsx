import { useState, useEffect } from 'react'
import UserPortal from './user/UserPortal'
import AdminPortal from './admin/AdminPortal'
import Auth from './components/Auth'
import AdminAuth from './components/AdminAuth'
import { supabase } from './utils/supabase'
import Chatbot from './components/Chatbot'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('user')

  useEffect(() => {
    // Check current active session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session)
      })
      .catch((err) => {
        console.error("Error getting session:", err)
      })
      .finally(() => {
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
      // Check path and hash routing for admin and auth views
      const path = window.location.pathname;
      const hash = window.location.hash;

      if (path.startsWith('/admin') || hash === '#/admin' || hash.startsWith('#/admin')) {
        setCurrentView('admin');
      } else if (
        path.startsWith('/authencation') ||
        path.startsWith('/authentication') ||
        hash === '#/authencation' ||
        hash === '#/authentication' ||
        hash.startsWith('#/authencation') ||
        hash.startsWith('#/authentication')
      ) {
        setCurrentView('auth');
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
      <div className="w-screen h-screen flex items-center justify-center bg-[#e0f2fe]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#1769ff] border-t-transparent rounded-full animate-spin" />
          <span className="text-[14px] font-extrabold text-[#8f8f95] animate-pulse">TezX CRM Syncing...</span>
        </div>
      </div>
    )
  }

  const isAdmin = session && (
    session.user.email?.toLowerCase().includes('admin') ||
    session.user.email?.toLowerCase() === 'admin@tezx.com' ||
    session.user.email?.toLowerCase() === 'r@gmail.com'
  );

  // If currentView is admin, verify administrator authentication
  if (currentView === 'admin') {
    if (!isAdmin) {
      return <AdminAuth session={session} />
    }
    return <AdminPortal session={session} />
  }

  // Render Auth component if explicit auth path is selected, or if user has no session
  if (currentView === 'auth' || !session) {
    return <Auth />
  }

  return (
    <>
      {currentView === 'user' && <UserPortal session={session} />}
      {session && !isAdmin && <Chatbot session={session} />}
    </>
  )
}

export default App

