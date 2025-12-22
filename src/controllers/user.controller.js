import { promiseAsyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { upLoadonCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiRespone.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Generate Access & Refresh Tokens
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) throw new ApiError(404, "User not found");

        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { refreshToken, accessToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};


// Register User
const registerUser = promiseAsyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    if ([fullName, email, username, password].some((f) => f?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
    });

    if (existedUser) {
        throw new ApiError(409, "User already exists with same email or username");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    if (!avatarLocalPath) throw new ApiError(400, "Avatar is required");

    const avatar = await upLoadonCloudinary(avatarLocalPath);

    const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar?.url || ""
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    return res.status(201).json(
        new apiResponse(200, createdUser, "User registered successfully")
    );
});


// Login User
const loginUser = promiseAsyncHandler(async (req, res) => {

    const { username, email, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "username or email is required");
    }

    const user = await User.findOne({ $or: [{ username }, { email }] });

    if (!user) throw new ApiError(404, "User not found");

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) throw new ApiError(401, "Invalid password");

    const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new apiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        );
});


// Logout User
const logoutUser = promiseAsyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: undefined } });

    const options = { httpOnly: true, secure: true };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new apiResponse(200, {}, "User logged out successfully"));
});
 
// Accessing Refresh Tokens
const refreshAccessToken = promiseAsyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401 , "Unauthorized request")
    }
    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )
    const user = await User.findById(decodedToken?._id)
  if (!user){
    throw new ApiError(401, "Invalid Token") 
  }
  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401,"Refresh Token is Expired or used")
  }
  const options = {
   httpOnly : true,
   secure : true
  }
    const {accessToken,newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
    return res
        .status(200)       
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new apiResponse(
                200,
                {accessToken,newRefreshToken:newRefreshToken},
                "Access Token Refreshed"
            )
        )
    
})

const changeCurrentPassword = promiseAsyncHandler (async(req,res)=>{
    const {oldPassword , newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError (400,"Invaid Old Password")
        
    }
    user.password = newPassword
    await user.save({validateBeforeSave :false})
    return res 
    .status(200)
    .json(new apiResponse (200,{},"Password Changed succesfully"))
})
const getCurrentUser = promiseAsyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new apiResponse(200,req.user,"Current User Fetched Successfully"))
})
 const accountDetails = promiseAsyncHandler(async(res,req)=>{
    const {fullName , email} = req.body
    if (!fullName || !email) {
        throw new ApiError(400 , " All fields are required ")
        
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            fullName,
            email
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new apiResponse (200,user, "Accounts details Updated successfully "))
     
 })

 const updateUserAvatar = promiseAsyncHandler(async(req,res)=>{
    const localPathAvatar = req.file?.path
    if(!localPathAvatar){
        throw new ApiError(400, "Avatar file is missing")
    }
    const avatar = await upLoadonCloudinary(localPathAvatar)
    if(!avatar){
        throw new ApiError(400, "Error while uploading on avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { 
            set :{
                avatar : avatar.url
            }
        },
        {new:true}
    
    )
    return res 
    .status(200)
    .json(new apiResponse (200,user, "Avatar Image Updated successfully "))
     
 })
   
    const getUserChannelProfile = promiseAsyncHandler(async(req,res)=>{
        const {username} = req.params

        if (!username?.trim) {
            throw new ApiError(400,"username is missing")
            
        }
        const channel = await User.aggregate([
            {
                $match:{
                    username: username?.toLowerCase()
                }
            },
            {
                $lookup:{
                    from: "subscriptions",
                    localField:"_id",
                    foreignField:"channel",
                    as: "subscribers"
                }
            },
            {
                $lookup:{
                    from: "subscriptions",
                    localField:"_id",
                    foreignField:"subscriber",
                    as: "subscribedTo"
                }
            },
            {
                $addFields:{
                    subscribersCount:{
                        $size:"$subscribers"
                    },
                    channelsSubscribedToCount:{
                        $size:"$subscribedTo"
                    },
                    isSubscribed:{
                        $cond: {
                            if:{$in:[req.user?._id,"subscribers"]},
                            then: true,
                            else: false 
                        }
                    }
                }
            },
         {
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                email:1

         }
         }

        ])
        if(!channel?.length){
            throw new ApiError(400, "Channel does not exists")
        }
        return res 
        .status(200)
        .json(
            new apiResponse(200,channel[0],"User channel fetched successfully")
        )
    })
     const getWatchHistory = promiseAsyncHandler(async(req , res )=>{
        const user =  await User.aggregate([
            {
                $match:{
                    _id: new mongoose.Types.ObjectId(req.user?._id)

                }
            },
            {
                $lookup:{
                    from: "videos",
                    localField:"watchHistory",
                    foreignField:"_id",
                    as:"watchHistory",
                    pipeline:[
                        {
                            $lookup:{
                                from: "users",
                                localField: "owner",
                                foreignField: '_id',
                                as: "owner",
                                pipeline:[
                                    {
                                        $project:{
                                            fullName:1,
                                            username:1,
                                            avatar: 1
                                        }
                                    }
                                ]
                
                            }
                        }
                    ]

                    
                }
            },
            {
                $addFields:{
                    owner:{
                        $first: "$owner"
                    }
                }
            }
        ])
     })
     return res 
     .status(200)
     .json(
        new apiResponse (200,user[0].watchHistory,"Watch History fetched successfully")
     )

export { 
        registerUser,
        loginUser,
        logoutUser,
        refreshAccessToken,
        changeCurrentPassword,
        getCurrentUser,
        accountDetails,
        updateUserAvatar,
        getWatchHistory
     };