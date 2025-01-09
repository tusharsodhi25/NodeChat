
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const generateToken = require('../config/util');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

// Signup
const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: 'Email already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.log('Error in signup controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found with email:", email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      console.log("Incorrect password for user:", email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log('Error in login controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};



// Logout
const logout = async (req, res) => {
  try {
    res.cookie('jwt', '', { maxAge: 0 });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.log('Error in logout controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update Profile
// const updateProfile = async (req, res) => {
//   try {
//     // Check if files exist in the request
//     if (!req.files || !req.files.profilePic) {
//       return res.status(400).json({ message: 'Profile pic is required' });
//     }

//     const { profilePic } = req.files; // `req.files` contains uploaded files
//     const userId = req.user._id;

//     console.log('Profile pic received:', profilePic.name);

//     // Create the uploads directory if it doesn't exist
//     const uploadDir = path.join(__dirname, '../uploads');
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir);
//     }

//     // Create a path for the temporary file
//     const tempPath = path.join(uploadDir, profilePic.name);
//     console.log('Temporary file path:', tempPath);

//     // Move the file to the temporary path
//     profilePic.mv(tempPath, async (err) => {
//       if (err) {
//         return res.status(500).json({ message: 'File upload failed' });
//       }

//       // Upload the image to Cloudinary
//       const uploadResponse = await cloudinary.uploader.upload(tempPath, {
//         folder: 'user_profiles',  // Cloudinary folder for images
//       });

//       // Remove the file from local storage after upload
//       fs.unlink(tempPath, (err) => {
//         if (err) console.log('Error removing file:', err);
//       });

//       if (!uploadResponse || !uploadResponse.secure_url) {
//         return res.status(500).json({ message: 'Failed to upload image' });
//       }

//       // Update user's profile with the uploaded image URL
//       const updatedUser = await User.findByIdAndUpdate(
//         userId,
//         { profilePic: uploadResponse.secure_url },
//         { new: true }
//       );

//       res.status(200).json(updatedUser);
//     });
//   } catch (error) {
//     console.error('Error in update profile:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

const updateProfile = async (req, res) => {
  try {
    if (!req.files || !req.files.profilePic) {
      return res.status(400).json({ message: 'Profile pic is required' });
    }

    const { profilePic } = req.files;
    const userId = req.user._id;

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(profilePic.mimetype)) {
      return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, and GIF allowed.' });
    }

    // File size validation (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (profilePic.size > maxSize) {
      return res.status(400).json({ message: 'File size exceeds the maximum limit of 5MB.' });
    }

    console.log('Profile pic received:', profilePic.name);

    // Create upload directory if not exists
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    const tempPath = path.join(uploadDir, profilePic.name);
    console.log('Temporary file path:', tempPath);

    // Move the file to the temporary path
    profilePic.mv(tempPath, async (err) => {
      if (err) {
        return res.status(500).json({ message: 'File upload failed' });
      }

      // Upload to Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(tempPath, {
        folder: 'user_profiles',
      });

      console.log('Cloudinary Upload Response:', uploadResponse);

      fs.unlink(tempPath, (err) => {
        if (err) console.log('Error removing file:', err);
      });

      if (!uploadResponse || !uploadResponse.secure_url) {
        return res.status(500).json({ message: 'Failed to upload image' });
      }

      // Update the user profile with the Cloudinary image URL
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: uploadResponse.secure_url },
        { new: true }
      );

      res.status(200).json(updatedUser);
    });
  } catch (error) {
    console.error('Error in update profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Check Auth
const checkAuth = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log('Error in checkAuth controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { signup, login, logout, updateProfile, checkAuth };



