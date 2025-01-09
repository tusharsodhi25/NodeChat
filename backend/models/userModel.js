const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    email:{
        type:String,
        required:true,
        unique:true
    },

    fullName:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true,
        minLength:6
    },

    profilePic:{
        type:String,
        default:"https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg"
    },

    



},
   {timestamps:true}
);

const User = mongoose.model("User",userSchema);
module.exports = User;