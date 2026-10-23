import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ChatWidget from '../components/ChatWidget'
import useSmoothScroll from '../hooks/useSmoothScroll'

function PublicLayout() {
  useSmoothScroll()

  return (
    <>
      <Navbar variant="public" />
      <main>
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </>
  )
}

export default PublicLayout

