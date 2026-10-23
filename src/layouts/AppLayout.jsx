import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ChatWidget from '../components/ChatWidget'
import useSmoothScroll from '../hooks/useSmoothScroll'
import './AppLayout.css'

function AppLayout() {
  useSmoothScroll()

  return (
    <div className="app-layout">
      <Navbar />
      <main className="layout-main">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  )
}

export default AppLayout
