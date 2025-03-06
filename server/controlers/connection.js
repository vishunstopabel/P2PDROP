const { v4: uuidv4 } = require('uuid');
const { getClient } = require('../config/redisConfig');
const bcrypt = require('bcrypt');
const { getIO } = require('../sockets/socket');
const crypto = require('crypto');
const client = getClient();
module.exports.handleCreateConnection = async (req, res) => {
    try {
        const { password, socketId } = req.body;
        if (!password || !socketId) {
            return res.status(400).json({ msg: "All fields are required" });
        }
        const connectionId = uuidv4();
        const token = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);
        const connectionData = {
            hashedPassword,
            token,
            socketId
        };
        await client.set(`p2pDrop:connections:${connectionId}`, JSON.stringify(connectionData), {
            EX: 7200 
        });
        const connectionUri = `${process.env.FRONTEND_URI}/recive/${connectionId}`;
        const qrUrl = `${connectionUri}?token=${token}`;
        res.status(200).json({
            msg: "Connection link generated successfully",
            url: connectionUri,
            qrUrl
        });
    } catch (error) {
        console.error("Error in handleCreateConnection:", error);
        res.status(500).json({ msg: "Internal server error" });
    }
};

module.exports.conformConnection = async (req, res) => {
    try {
        const { connectionId, method, data } = req.body;
        const io = getIO();
        if (!method || !connectionId || !data) {
            return res.status(400).json({ msg: "All fields are required" });
        }

        const connectionRawData = await client.get(`p2pDrop:connections:${connectionId}`);
        if (!connectionRawData) {
            return res.status(400).json({ msg: "Connection ID may be expired or invalid" });
        }


        const connectionData = JSON.parse(connectionRawData);
        
        if (!io.sockets.sockets.has(connectionData.socketId)) {
            return res.status(400).json({ msg: "Connection ID may be expired or invalid" });
        }
        
        if (method === "viaPassword") {
            const isValid = await bcrypt.compare(data.password, connectionData.hashedPassword);
            if (!isValid) {
                return res.status(400).json({ msg: "Invalid password" });
            }
        } else {
            console.log(data.token)
            if (data.token != connectionData.token) {
                return res.status(400).json({
                    msg: "Invalid token",
                    data: {
                        method: "viaPassword",
                        msg: "Switching to password auth"
                    }
                });
            }
        }

 

        io.to(connectionData.socketId).emit("ready-for-receiving",{receiverSocketId:data.receiverSocketId,hostName:req.headers.host});

        res.status(200).json({
            msg: "Connection successful",
            senderSocketId:connectionData.socketId
        });

    } catch (error) {
        console.error("Error in conformConnection:", error);
        res.status(500).json({ msg: "Internal server error" });
    }
};
