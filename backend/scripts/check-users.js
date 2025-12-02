const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config/config');
const connectDB = require('../config/database');

async function checkUsers() {
    await connectDB();
    const count = await User.countDocuments();
    console.log(`Total users: ${count}`);
    process.exit(0);
}

checkUsers();
