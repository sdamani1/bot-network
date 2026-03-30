'use client'

import Navbar from './Navbar'
import RegisterModal from './RegisterModal'
import { useState } from 'react'

export default function NavbarWrapper() {
  const [showRegister, setShowRegister] = useState(false)
  return (
    <>
      <Navbar onRegister={() => setShowRegister(true)} />
      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSuccess={() => setShowRegister(false)}
        />
      )}
    </>
  )
}
