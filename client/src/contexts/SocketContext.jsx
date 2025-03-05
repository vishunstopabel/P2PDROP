import {createContext, useContext, useEffect, useState} from 'react'
import {io} from "socket.io-client"
const SocketContext =createContext();

export const useSocket=()=>useContext(SocketContext);


export const SocketProvider=({children})=>{ 
        const [socket,setSocket]=useState(null);
        useEffect(()=>{
            const newSocket=io(`http://localhost:3000`)
            setSocket(newSocket)
            return()=>{if (newSocket) {
                newSocket.disconnect();
            }
        };
        },[])
        return(
            
            <SocketContext.Provider value={socket} >
                {children}
            </SocketContext.Provider>
        )
}
