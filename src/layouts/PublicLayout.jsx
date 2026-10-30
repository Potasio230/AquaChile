import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ChatWidget from '../components/ChatWidget'
import useSmoothScroll from '../hooks/useSmoothScroll'
import './AppLayout.css'

function PublicLayout() {
  useSmoothScroll()

  return (
    <div className="app-layout">
      <Navbar variant="public" />
      <main className="layout-main">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  )
}

export default PublicLayout

