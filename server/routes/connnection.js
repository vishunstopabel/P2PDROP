const express=require("express")
const { handleCreateConnection } = require("../controlers/connection")
const router=express.Router()
router.post("/createConnection",handleCreateConnection)
module.exports=router