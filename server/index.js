const { config } = require('dotenv');
config();

const express = require('express');
const { createServer } = require('http');
const cors = require('cors');

const { initSocket, getIO } = require('./sockets/socket');
const { initRedis } = require('./config/redisConfig');
const connectionRoute = require('./routes/connnection');

const app = express();

// app.use(cors({
//     origin: process.env.FRONTEND_URI || "*"
// }));
app.use(cors({
    origin:"*"
}))

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const httpServer = createServer(app);

async function startServer() {
    await initRedis();
    initSocket(httpServer);

    const io = getIO();

    io.on("connection", (socket) => {
        console.log("New socket connected:", socket.id);
        socket.emit("yourSocketId", socket.id);
        socket.on("reloadvia-reciver",({receiverSocketId,senderSocketId})=>{
            socket.to(senderSocketId).emit("pagereload-viareciver",({receiverSocketId}))
        })
        socket.on("ice-candidate", ({ candidate, to }) => {
            socket.to(to).emit("ice-candidate", { candidate, socketId: socket.id });
        });
        
        socket.on("offer",({to,offer})=>{
                socket.to(to).emit("offer",{offer})
        })
        socket.on("answer",({mySocketId,to,answer})=>{
            socket.to(to).emit("answer",{answer,receiverSocketId:mySocketId})
        })
        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
        });
    });

    app.use("/connection", connectionRoute);

    const port = process.env.PORT || 3000;
    httpServer.listen(port, () => {
        console.log(`App is listening at http://localhost:${port}`);
    });
}

startServer().catch(err => {
    console.error("Failed to start server:", err);
});
