
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoute = require('./routes/authRoute');
const messageRoute = require('./routes/messageRoute');
const dbconnect = require('./config/database');
require('dotenv').config();
const path = require('path');

const {app,server} = require('./config/socket');



const PORT = process.env.PORT || 3001;

// Increase the request body size limit
app.use(express.json({ limit: '50mb' })); // You can adjust this value
app.use(cookieParser());


app.use(express.static(path.join(__dirname, 'build')));


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});




const fileUpload = require('express-fileupload');
app.use(fileUpload());



// CORS configuration
app.use(cors({
  origin: "http://localhost:3000", // Your frontend URL
  credentials: true
}));

// Routes
app.use('/api/auth', authRoute);
app.use('/api/messages', messageRoute);







// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Connect to the database
dbconnect();
