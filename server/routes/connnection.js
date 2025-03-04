const express=require("express")
const { handleCreateConnection,conformConnection } = require("../controlers/connection")
const router=express.Router()
router.post("/createConnection",handleCreateConnection)
router.post("/conformConnection",conformConnection)
module.exports=router