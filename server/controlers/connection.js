const { v4: uuidv4 } = require('uuid');
const { getClient } = require('../config/redisConfig');
const bcrypt = require('bcrypt');
module.exports.handleCreateConnection=async(req,res)=>{
     try {
        const {password}=req.body;
        if(!password){
            return res.status(402).json({msg:"the password is required"});
        }
        const connectionId=uuidv4();
        const client=getClient()
        const saltRounds = 10;
        let hashedpassword=''
        bcrypt.hash(password, saltRounds, function(err, hash) {
            if(err){
                throw new Error("error in hashing the password");
                
            }
            hashedpassword=hash
        });

        client.set(`p2pDrop:connections:${connectionId}`,hashedpassword);

     } catch (error) {
        
     }       
}