import { promiseAsyncHandler } from "../utils/asyncHandler.js";
import{apiError} from "../utils/apiError.js";
import {User} from "../models/user.model.js";
import {cloudinaryUpload} from "../utils/cloudinary.js";
import {apiResponse} from "../utils/apiRespone.js";

const registerUser = promiseAsyncHandler(async(req,res)=>{
// Getting User details from front end

const {fullName,email,username,password} = req.body
console.log("email:" ,email);

// Validation not empty
if([fullName,email,username,password].some((field) =>
    field?.trim() === "")

) {
throw new apiError("All fields are required",400);
}

// Check if the user exists or not 
const existedUser = User.findOne({
    $or: [{ email },{ username }]
})
if(existedUser){
    throw new apiError (409, "User already exists with the same email and username");
}

// Check for images , check for avatar
const avatarLocalPath = req.files?.avatar[0]?.path;
const coverImageLocalPath = req.files?.coverImage[0]?.path;

if(!avatarLocalPath){
    throw new apiError(400,"Avatar is required");
}


// Upload images to cloudinary 
const avatar = await cloudinaryUpload(avatarLocalPath);
const coverImage = await cloudinaryUpload(coverImageLocalPath);
if(!avatar){
        throw new apiError(400,"Avatar is required");

}
   // Create User Object - Entry in databse
  const user = await User.create({
    fullName,
    email,
    username:username.toLowerCase(),
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
   })

const Createuser = await User.findById(user._id).select("-password -refreshToken");


if (!Createuser){
    throw new apiError(500,"User registration failed, please try again later");
}

// return response
return res.status(201).json(
    new apiResponse(200,"User registered successfully",Createuser)
)


})




export{registerUser}
 
