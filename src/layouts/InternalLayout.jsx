import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function InternalLayout() {
  return (
    <>
      <Navbar variant="internal" />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

export default InternalLayout

