import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSocket } from './contexts/SocketContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import Logo from './componets/logo'
import { FaFileArrowDown } from "react-icons/fa6"
function Resive() {
    const [method, setMethod] = useState(null)
    const { connectionId } = useParams()
    const [mySocketId, setMySocketId] = useState(null)
    const [senderSocketId, setSenderSocketId] = useState(null)
    const [password, setPassword] = useState('')
    const [token, setToken] = useState('')
    const [chunks, setChunks] = useState([])
    const chunksRef = useRef([]);

    const socket = useSocket()
    const navigate = useNavigate()

    const peerRef = useRef(null)

    const createPeerConnection = () => {
        peerRef.current = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        })

        peerRef.current.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", {
                    candidate:event.candidate,
                    to:senderSocketId
                   
                });
                console.log("ice - sent through reciver")
            }
        }

        peerRef.current.ondatachannel = (event) => {
            const dataChannel = event.channel;
            dataChannel.binaryType = "arraybuffer";
            dataChannel.onmessage = (e) => {
                console.log("Received chunk:", e.data);
                const message = new TextDecoder().decode(e.data);
                if (message === "EFO") { 
                    console.log("File transfer complete. Preparing for download.");
        
                    // Ensure chunksRef is properly accumulated
                    if (chunksRef.current.length === 0) {
                        console.error("No chunks received!");
                        return;
                    }
        
                    const receivedBlob = new Blob(chunksRef.current);
                    const url = URL.createObjectURL(receivedBlob);
        
                    // Create download link and trigger click
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "received_file"; // Ensure filename is set
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
        
                    // Free up memory
                    URL.revokeObjectURL(url);
                    chunksRef.current = [];  
                } else {
                    chunksRef.current.push(e.data);
                }
            };
        
            dataChannel.onclose = () => {
                console.log("Data channel closed.");
            };
        };
        
    }

    const verifyConnection = async (selectedMethod) => {
        try {
            const payload = {
                [selectedMethod === "viaPassword" ? "password" : "token"]: selectedMethod === "viaPassword" ? password : token,
                receiverSocketId: mySocketId,
            }

            const response = await axios.post(
                "http://localhost:3000/connection/conformConnection",
                { connectionId, method: selectedMethod, data: payload },
                { headers: { "Content-Type": "application/json" } }
            )
            setSenderSocketId(response.data.senderSocketId)
            toast.success("Connection successful! File transfer will start shortly.")
        } catch (error) {
            const errorMsg = error.response?.data?.msg || "Connection failed"
            toast.error(errorMsg)

            if (errorMsg === "Invalid token" && error.response?.data?.data?.method === "viaPassword") {
                setMethod("viaPassword")
                toast.success("Switching to password authentication.")
            }
            if (errorMsg === "Connection ID may be expired or invalid") {
                navigate("/connectionexpired")
            }
        }
    }

    const handleOffer = useCallback(async ({ offer }) => {
        console.log("recived offer")
        if (!peerRef.current) createPeerConnection();

        await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer))

        const answer = await peerRef.current.createAnswer()
        await peerRef.current.setLocalDescription(answer)
        console.log(senderSocketId)
        socket.emit("answer", { mySocketId, to: senderSocketId, answer })
        console.log("sent answe")
    }, [socket, connectionId, senderSocketId, mySocketId])

    useEffect(() => {
        if (!socket) return;

        socket.on("yourSocketId", (socketId) => setMySocketId(socketId))

        const queryParams = new URLSearchParams(window.location.search)
        const tokenFromURL = queryParams.get("token")
        if (tokenFromURL) {
            setToken(tokenFromURL)
            setMethod("viaToken")
        } else {
            setMethod("viaPassword")
        }

        socket.on("offer", handleOffer)
        socket.on("ice-candidate", ({ candidate }) => {
            peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate))
            console.log("ice - revied through reciver")
        })

        return () => {
            socket.off("yourSocketId")
            socket.off("offer", handleOffer)
            socket.off("ice-candidate")
        }
    }, [socket, handleOffer])

    useEffect(() => {
        if (mySocketId && method === "viaToken" && token) {
            verifyConnection("viaToken")
        }
    }, [mySocketId, method, token])

    useEffect(() => {
        const handleTabClose = () => {
            if (socket && mySocketId && senderSocketId) {
                socket.emit("reloadvia-reciver", {
                    receiverSocketId: mySocketId,
                    senderSocketId
                })
            }
        }

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === 'hidden') {
                handleTabClose()
            }
        })

        return () => {
            document.removeEventListener("visibilitychange", handleTabClose)
        }
    }, [socket, mySocketId, senderSocketId])

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
