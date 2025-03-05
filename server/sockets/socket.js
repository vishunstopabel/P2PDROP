const {Server}=require('socket.io')
let  io=null
function initSocket(httpServer){
io=new Server(httpServer,{
    cors:{
        origin:"*"
    }
})
}
function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized!')
    }
    return io
}

module.exports={initSocket,getIO}