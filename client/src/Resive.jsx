import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import Logo from './componets/logo'
import { useSocket } from './contexts/SocketContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import { FaFileArrowDown } from "react-icons/fa6"

function Resive() {
    const [method, setMethod] = useState(null)
    const { connectionId } = useParams()
    const [mySocketId, setMySocketId] = useState(null)
    const [password, setPassword] = useState('')
    const [token, setToken] = useState('')
    const socket = useSocket()

    const verifyConnection = async (selectedMethod) => {
        try {
            const payload = {
                [selectedMethod === "viaPassword" ? "password" : "token"]: selectedMethod === "viaPassword" ? password : token,
                receiverSocketId: mySocketId,
            }
            console.log(payload, "log from payload")

            const response = await axios.post(
                "http://localhost:3000/connection/conformConnection",
                { connectionId, method: selectedMethod, data: payload },
                { headers: { "Content-Type": "application/json" } }
            )

            toast.success("Connection successful!")
            toast.success("File transfer will start shortly.")
        } catch (error) {
            const errorMsg = error.response?.data?.msg || "Connection failed"
            toast.error(errorMsg)

            if (errorMsg === "Invalid token" && error.response?.data?.data?.method === "viaPassword") {
                setMethod("viaPassword")
                toast.success("Switching to password authentication.")
            }
            console.error(error)
        }
    }


    useEffect(() => {
        if (!socket) return

        socket.on("yourSocketId", (socketId) => {
            setMySocketId(socketId)
        })

        const queryParams = new URLSearchParams(window.location.search)
        const tokenFromURL = queryParams.get("token")

        if (tokenFromURL) {
            setToken(tokenFromURL)
            setMethod("viaToken")
        } else {
            setMethod("viaPassword")
        }

        return () => socket.off("yourSocketId")
    }, [socket])

    
    useEffect(() => {
        if (mySocketId && method === "viaToken" && token) {
            verifyConnection("viaToken")
        }
    }, [mySocketId, method, token])

  
    const handlePasswordSubmit = (e) => {
        e.preventDefault()
        verifyConnection("viaPassword")
    }

    return (
        <div className="h-screen w-screen text-white flex flex-col">
            <Logo />
            <div className="h-[30%] flex flex-col justify-center items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-5xl font-bold text-gray-600">
                        Receive<span className="text-gray-900">File</span>
                    </h1>
                    <FaFileArrowDown className="text-6xl text-black" />
                </div>
            </div>

            
            <div className="flex-grow flex justify-center items-start">
                {mySocketId ? (
                    <>
                        {method === "viaPassword" && (
                            <form
                                onSubmit={handlePasswordSubmit}
                                className="bg-white text-black p-6 rounded-lg shadow-md w-full max-w-md flex flex-col gap-4"
                            >
                                <label className="text-sm font-semibold">Enter Secret Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-600"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="bg-black text-white py-2 rounded hover:bg-gray-800 transition"
                                >
                                    Connect & Receive File
                                </button>
                            </form>
                        )}

                        {method === "viaToken" && (
                            <div className="text-center">
                                <p className="text-lg text-gray-700">🔗 Verifying secure token connection...</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-lg text-gray-700">🔄 Connecting to server...</div>
                )}
            </div>
        </div>
    )
}

export default Resive
