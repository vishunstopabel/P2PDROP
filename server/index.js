const {config}=require("dotenv")
config()
const express=require("express")
const app=express()
const {Server}=require("socket.io")
const { createServer } = require("http");
const cors=require("cors")
app.use(cors({
    origin:"*"
}))
const httpServer=createServer(app)
const io=new Server(httpServer,{
    cors:{
        origin:"*"
    }
})
io.on("connection",(socket)=>{
    console.log("new socket connected",socket.id)
    socket.on("disconnect",()=>{
        console.log("socket disconnected with the id ",socket.id)
    })
})
const port=process.env.PORT
httpServer.listen(port,()=>{
    console.log(`app is listening at the http://localhost:${port}`)
})