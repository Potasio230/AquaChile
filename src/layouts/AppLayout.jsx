import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ChatWidget from '../components/ChatWidget'
import useSmoothScroll from '../hooks/useSmoothScroll'

function AppLayout() {
  useSmoothScroll()

  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </>
  )
}

export default AppLayout
