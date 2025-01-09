const express = require('express');
const router = express.Router();


const {signup,login,logout,updateProfile,checkAuth} = require('../controllers/authController');
const protectedRoute = require('../middleware/authMiddleware');


router.post('/signup', signup);

router.post('/login',login);


router.post('/logout',logout);

router.put('/update-profile',protectedRoute,updateProfile);

router.get('/check',protectedRoute,checkAuth);




module.exports = router;