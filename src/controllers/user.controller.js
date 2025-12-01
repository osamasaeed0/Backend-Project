import { promiseAsyncHandler } from "../utils/asyncHandler.js";


const registerUser = promiseAsyncHandler(async(req,res)=>{
    res.status(200).json({
        message: "Successfull"
    })
})

export{registerUser}
 
