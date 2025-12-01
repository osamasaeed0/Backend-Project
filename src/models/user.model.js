import mongoose,{Schema} from "mongoose";
import { JsonWebTokenError } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { use } from "react";

const userSchema = new Schema({

    username : {
       type : String,
       required: true,
       lowercase: true,
       trim: true,
       index: true,
       unique: true
    },
    email:{
       type : String,
       required: true,
       lowercase: true,
       trim: true,
       unique: true
    },
    fullName:{
        type : String,
       required: true,
       index: true,
       trim: true,
       
    },

     avatar:{
        type : String, // AWS or any Cloud platform
        required: true
     },
     coverimage:{
    type: String , // Cloud platform
           
     }, 
     watchHistory:[{
        type: Schema.Types.ObjectId,
        ref: "Videos",
     }],
     password:{
      type: String,
      required: [true, "Passowrd is required"],

     },
     refreshToken:{
        type:String,
     }



},{
    timestamps:true
})

userSchema.pre("save", async function (next){
 if (this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);  
    this.password = await bcrypt.hash(this.password, salt);
    next();
})
userSchema.methods.isPasswordCorrect = async function (password){
  return await  bcrypt.compare(password, this.password)
}
userSchema.methods.generateAccessToken = function (){
jwt.sign({
    _id : this._id,
    username: this.username,
    email: this.email,
    fullName: this.fullName,
}, process.env.ACCES_TOKEN_SECRET,{
    expiresIn: process.env.ACCES_TOKEN_EXPIRY
})
}
userSchema.methods.generateRefreshToken = function (){
     return  jwt.sign({
        _id : this._id, }),
        process.env.REFRESH_TOKEN_SECRET,{
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
     }
}

export const User = mongoose.model("User",userSchema)