import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { promiseAsyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";



 export const jwtVerify = promiseAsyncHandler(async(req , res ,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
        if(!token){
            throw new ApiError(401,"Unauthorized , Access token is missing")
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken._id).select("-password -refreshToken")
        if(!user){
            throw new ApiError (401,"Unauthorized , invalid token user not found")
        }
         
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401,error?.message ||"Invalid access token")
        
    }
        
   
 })
