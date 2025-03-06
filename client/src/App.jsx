import { useState, useCallback, useEffect, useRef } from 'react'
import Logo from './componets/logo'
import { FaFileImport } from 'react-icons/fa'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import { useSocket } from './contexts/SocketContext'
import toast from 'react-hot-toast'
import QRCode from "react-qr-code"
const peers = {};
function App() {
    const [file, setFile] = useState(null)
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isPassword, setIsPassword] = useState(true)
    const [mySocketId, setMySocketId] = useState(null)
    const [response, setResponse] = useState(null)
    const [connectedDevices, setConnectedDevices] = useState([])
    const fileRef = useRef(null)
    const socket = useSocket()
const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
    }
}, []);

useEffect(() => {
    if (file) {
        console.log("Updated file:", file);
    }
}, [file]);
useEffect(() => {
    fileRef.current = file
}, [file])




    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false })
    useEffect(() => {
        if (!socket) return

        socket.on("yourSocketId", (socketId) => setMySocketId(socketId))

        socket.on("ready-for-receiving", ({ receiverSocketId, hostName }) => {
            if (!fileRef.current) {
                toast.error("File not selected. Please choose a file before sending.")
                return
            }
            const newDevice = {
                receiverSocketId,
                hostName,
                status: "Ready"
            }
            setConnectedDevices((prev) => [...prev, newDevice])
            toast.success(`Ready to send data to ${hostName}`)
            sendFile(receiverSocketId)
        })

        socket.on("pagereload-viareciver", ({ receiverSocketId }) => {
            if (peers[receiverSocketId]) {
                peers[receiverSocketId].close()
                delete peers[receiverSocketId]
            }
            setConnectedDevices((prevDevices) =>
                prevDevices.map((device) =>
                    device.receiverSocketId === receiverSocketId
                        ? { ...device, status: 'closed' }
                        : device
                )
            )
        })

        socket.on("answer", ({ answer, receiverSocketId }) => {
            console.log("recived answer")
            const peer = peers[receiverSocketId]
            if (peer) {
                peer.setRemoteDescription(new RTCSessionDescription(answer))
            }
        })

        socket.on("ice-candidate", ({ candidate, socketId }) => {
            console.log("ice - recived through reciver")
            const peer = peers[socketId]
            if (peer) {
                peer.addIceCandidate(new RTCIceCandidate(candidate))
            }
        })
        socket.on("reloadvia-reciver", ({ receiverSocketId, senderSocketId }) => {
            if (peers[receiverSocketId]) {
                peers[receiverSocketId].close();
                delete peers[receiverSocketId];
            }
            socket.to(senderSocketId).emit("receiver-reconnected", { receiverSocketId });
        });

        return () => {
            socket.off("yourSocketId")
            socket.off("ready-for-receiving")
            socket.off("pagereload-viareciver")
            socket.off("answer")
            socket.off("ice-candidate")
            socket.off("reloadvia-reciver")
        }
    }, [socket])

    const establishConnection = async () => {
        if (!mySocketId) return toast.error("Socket not ready yet, please wait!")
        if(!file)return toast.error("slect the file to get stated")
        setIsLoading(true)
        try {
            const res = await axios.post("http://localhost:3000/connection/createConnection", { password, socketId: mySocketId }, {
                headers: { "Content-Type": "application/json" }
            })
            setResponse(res.data)
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
            await navigator.clipboard.writeText(response.url)
            toast.success("URL copied!")
        } catch {
            toast.error("Failed to copy URL")
        }
    }

    // const createPeer = (receiverSocketId) => {
    //     const peer = new RTCPeerConnection({
    //         iceServers: [
    //             { urls: "stun:stun.l.google.com:19302" }
    //         ]
    //     })

    //     peer.onicecandidate = (event) => {
    //         if (event.candidate) {
    //             socket.emit("ice-candidate", {
    //                 to: receiverSocketId,
    //                 candidate: event.candidate,
    //             })
    //         }
    //     }
    //     peers[receiverSocketId] = peer
    //     return peer
    // }

    const sendFile = (receiverSocketId) => {
        const peer = new RTCPeerConnection({ 
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }] 
        });
        peers[receiverSocketId] = peer;
    
        const dataChannel = peer.createDataChannel("file-transfer");
    
        dataChannel.onopen = () => {
            console.log(`✅ Data channel open with ${receiverSocketId}`);
            sendFileChunks(dataChannel);
        };
    
        dataChannel.onerror = (err) => {
            console.error(`❌ DataChannel error:`, err);
        };
        peer.ondatachannel = (event) => {
            const receiveChannel = event.channel;
            receiveChannel.onopen = () => console.log("✅ Data channel open on receiver");
            receiveChannel.onmessage = (event) => console.log("📩 Received data: ", event.data);
            receiveChannel.onerror = (err) => console.error("❌ DataChannel error:", err);
        };
    
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("ice - sent through sender")
                socket.emit("ice-candidate", {
                    candidate: event.candidate,
                    to: receiverSocketId,
                });
            }
        };
    
        peer.createOffer()
            .then(offer => peer.setLocalDescription(offer))
            .then(() => {
                console.log("sent offer")
                socket.emit("offer", { to: receiverSocketId, offer: peer.localDescription });
            });
    };
    

    const sendFileChunks = (dataChannel) => {
        console.log(fileRef.current)
        if (!fileRef.current) return toast.error("No file selected")
        const chunkSize = 16 * 1024 
        const reader = new FileReader()
        let offset = 0
        reader.onload = (e) => {
            dataChannel.send(e.target.result)
            console.log("sending the files")
            offset += e.target.result.byteLength
            if (offset < fileRef.current.size) {
                readSlice(offset)
            } else {
                dataChannel.send(new TextEncoder().encode("EFO")); 
                dataChannel.close()
                toast.success("File sent successfully!")
            }
        }
        const readSlice = (o) => {
            const slice = fileRef.current.slice(o, o + chunkSize)
            reader.readAsArrayBuffer(slice)
        }
        readSlice(0)
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
                                        <QRCode value={response.qrUrl} size={180} />
                                    </div>
                                    <div className="bg-gray-100 p-3 rounded border border-gray-400">
                                        <p className="text-sm font-medium mb-1">Share this link:</p>
                                        <div className="flex items-center justify-between">
                                            <span className="truncate text-xs">{response.url}</span>
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
                <div className="p-6">
                    {connectedDevices.length > 0 ? (
                        
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold mb-4 text-gray-800">Connected Devices</h2>
                            {connectedDevices.map((device) => (
                                <div
                                    key={device.receiverSocketId}
                                    className="bg-gray-900 text-white rounded-lg p-4 flex justify-between items-center shadow-md"
                                >
                                    <div>
                                        <p className="text-lg font-semibold">{device.hostName}</p>
                                        <p className={`text-sm font-medium ${device.status === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
                                            Status: {device.status}
                                        </p>
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        <p>Socket ID: <span className="font-mono">{device.receiverSocketId}</span></p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No devices connected yet.</p>
                    )}
                </div>
                :(<></>)
            
        </div>
    )
}

export default App
