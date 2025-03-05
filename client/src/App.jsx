import { useState, useCallback, useEffect } from 'react'
import Logo from './componets/logo'
import { FaFileImport } from 'react-icons/fa'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import { useSocket } from './contexts/SocketContext'
import toast from 'react-hot-toast'
import QRCode from "react-qr-code"

function App() {
    const [file, setFile] = useState(null)
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isPassword, setIsPassword] = useState(true)
    const [mySocketId, setMySocketId] = useState(null)
    const [respone, setRespone] = useState(null)

    const onDrop = useCallback((acceptedFiles) => {
        setFile(acceptedFiles[0])
    }, [])
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false })

    const socket = useSocket()

    useEffect(() => {
        if (!socket) return
        socket.on("yourSocketId", (socketId) => setMySocketId(socketId))
        return () => socket.off("yourSocketId")
    }, [socket])
    useEffect(()=>{
        if (!socket) return
        socket.on("ready-for-receiving",(socketId)=>{
            console.log("you are ready to send data to this MF")
            toast.success("you are ready to send data to this MF")
        })
    },[socket])
    const establishConnection = async () => {
        if (!mySocketId) return toast.error("Socket not ready yet, please wait!")
        setIsLoading(true)
        try {
            const res = await axios.post("http://localhost:3000/connection/createConnection", { password, socketId: mySocketId },{
                headers:{
                    "Content-Type":"application/json"
                }
            })
            setRespone(res.data)
            setIsPassword(false)
            toast.success(res.data.msg)
        } catch (err) {
            toast.error(err.response?.data?.msg || "Failed to create connection")
        } finally {
            setIsLoading(false)
        }
    }

    const handleClickCopy = async () => {
        try {
            await navigator.clipboard.writeText(respone.url)
            toast.success("URL copied!")
        } catch {
            toast.error("Failed to copy URL")
        }
    }

    return (
        <div className="h-screen w-screen text-white flex flex-col">
            <Logo />
            <div className="h-[30%] flex flex-col justify-center items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-5xl font-bold text-gray-600">
                        Send<span className="text-gray-900">File</span>
                    </h1>
                    <FaFileImport className="text-6xl" color='black' />
                </div>
            </div>
            <div className="h-[70%] w-full flex justify-center items-start">
                <div className="w-full max-w-md flex flex-col items-center gap-6">
                    {file && (
                        <div className="w-full bg-white text-black border border-gray-800 p-3 rounded-md shadow-md text-center">
                            {file.name}
                        </div>
                    )}

                    {!file ? (
                        <div
                            {...getRootProps()}
                            className={`w-full h-56 border-2 border-dashed border-gray-500 rounded-lg p-6 cursor-pointer bg-white text-black flex flex-col items-center justify-center gap-3 transition ${
                                isDragActive ? "bg-gray-600" : ""
                            }`}
                        >
                            <input {...getInputProps()} />
                            <p className="font-medium">
                                {isDragActive ? "Drop your file here" : "Drag & drop file, or click to select"}
                            </p>
                        </div>
                    ) : (
                        <>
                            {isLoading ? (
                                <p className="animate-pulse">⏳ Setting up secure connection...</p>
                            ) : isPassword ? (
                                <div className="w-full bg-white text-black p-5 rounded-lg shadow-md">
                                    <label className="block text-sm font-medium mb-2">Secret Password</label>
                                    <input
                                        type="password"
                                        placeholder="Enter password for receiver"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full p-2 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-gray-900"
                                    />
                                    <div className="mt-4 flex justify-between">
                                        <button
                                            onClick={establishConnection}
                                            className="bg-black text-white px-5 py-2 rounded hover:bg-gray-800 transition"
                                        >
                                            Start Transfer
                                        </button>
                                        <button
                                            onClick={() => { setFile(null); setPassword('') }}
                                            className="border border-black text-black px-5 py-2 rounded hover:bg-gray-200 transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full bg-white text-black p-5 rounded-lg shadow-md flex flex-col gap-4">
                                    <div className="flex justify-center">
                                        <QRCode value={respone.qrUrl} size={180} />
                                    </div>
                                    <div className="bg-gray-100 p-3 rounded border border-gray-400">
                                        <p className="text-sm font-medium mb-1">Share this link:</p>
                                        <div className="flex items-center justify-between">
                                            <span className="truncate text-xs">{respone.url}</span>
                                            <button
                                                onClick={handleClickCopy}
                                                className="bg-black text-white px-3 py-1 rounded text-xs"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                    <ul className="text-xs text-gray-600 space-y-1">
                                        <li>✅ Share the link or scan QR to connect.</li>
                                        <li>✅ Keep this tab open until transfer completes.</li>
                                        <li>⚠️ Do not refresh or close the page.</li>
                                        <li>🔒 Password protected for security.</li>
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default App
