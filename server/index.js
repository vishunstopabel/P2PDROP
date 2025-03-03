const {config}=require("dotenv")
config()
const express=require("express")
const app=express()
const { createServer } = require("http");
const cors=require("cors")
const { initSocket, getIO } = require("./sockets/socket")
const {initRedis }=require("./config/redisConfig")
app.use(cors({
    origin:"*"
}))
const httpServer=createServer(app)
initSocket(httpServer)
initRedis()
const io=getIO()
const connectionRoute=require("./routes/connnection")
app.use("/connection",connectionRoute)
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