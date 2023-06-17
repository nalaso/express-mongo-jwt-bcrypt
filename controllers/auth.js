const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const userModel = require('../models/user-model');
const ErrorHandler = require('../middleware/errorHandlers');
const { catchAsyncError } = require('../middleware/catchAsyncError');

module.exports.logIn = catchAsyncError(async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return next(new ErrorHandler("username or password not passed", 400));
    }

    const user = await userModel.findOne({
        username: username,
    });

    if (!user) {
        return next(new ErrorHandler("Invalid credentials or user not found", 401));
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return next(new ErrorHandler("Invalid credentials", 401));
    }

    const token = jwt.sign({ 
        username: username
    }, process.env.SECRETKEY, { 
        expiresIn: '14h' 
    });

    res.json({
        code: 200,
        message: 'Login successful',
        token: token,
    });
});

module.exports.signUp = async (req, res, next) => {
    const { username, password, name } = req.body;

    if (!username || !password || !name ) {
        return next(new ErrorHandler("username or password not passed or not validated", 400));
    }

    const user = await userModel.findOne({
        username:username
    });

    if (user) {
        return res.status(409).json({ message: 'username already exists', code: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const date = new Date()
    const newUser = new userModel({
        username: username,
        password: hashedPassword,
        name: name,
        createdAt: {
            string:date.toLocaleString(),
            timestamp:date.getTime()
        }
    });

    const result = await newUser.save();

    if (result !== null) {
        res.json({
            code: 200,
            message: 'User created',
            data: result
        });
    } else {
        return next(new ErrorHandler("Failed to create user", 500));
    }
};

module.exports.logOut = catchAsyncError(async (req, res, next) => {
    try {

    } catch (error) {

    }
});

module.exports.whoami = catchAsyncError(async (req, res, next) => {
    const { token } = req.body;

    if (!token) {
        return next(new ErrorHandler("Token not found", 400));
    }

    const decoded = jwt.verify(token, process.env.SECRETKEY);

    if(!decoded){
        res.json({
            code: 401,
            message: 'Token expired or invalid',
        });
    }

    res.json({
        code: 200,
        message: 'user verified',
        user: decoded
    });
});

module.exports.changePassword = catchAsyncError(async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password ) {
        return next(new ErrorHandler("username or password not found", 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.findOneAndUpdate({
        username:username
    },{
        password: hashedPassword
    })

    if(!user){
        return next(new ErrorHandler("user password not updated", 400));
    }

    res.json({
        code: 200,
        status: 'success',
        user: user
    });
});