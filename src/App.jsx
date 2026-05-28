import { useState, useEffect } from 'react'
import UserPortal from './user/UserPortal'
import AdminPortal from './admin/AdminPortal'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('user')

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

  return (
    <>
      {currentView === 'user' && <UserPortal />}
      {currentView === 'admin' && <AdminPortal />}
    </>
  )
}

export default App
