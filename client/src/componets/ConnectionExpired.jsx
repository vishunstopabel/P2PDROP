import React, { useEffect } from 'react'
import { FaExclamationTriangle } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import Logo from './logo'

function ConnectionExpired() {
    useEffect(() => {
        window.history.pushState(null, null, window.location.href)
        const handleBackButton = () => {
            window.history.pushState(null, null, window.location.href)
        }
        window.addEventListener('popstate', handleBackButton)
        return () => {
            window.removeEventListener('popstate', handleBackButton)
        }
    }, [])
    
    return (
        <div className='bg-gray-100'>
        <Logo />
        <div className="h-screen w-screen flex flex-col justify-center items-center bg-gray-100 text-gray-800 transition-all">
          
            <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-md space-y-4">
                <FaExclamationTriangle className="text-red-500 text-6xl" />
                <h1 className="text-2xl font-bold text-red-600">Connection ID Expired or Invalid</h1>
                <p className="text-gray-600 text-center">
                    The connection link you are trying to access is no longer valid.
                    This might happen if the sender closed the connection or if the link expired.
                </p>
                <Link
                    to="/"
                    className="mt-4 px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
                >
                    Go Back Home
                </Link>
            </div>
        </div>
        </div>
    )
}

export default ConnectionExpired
