const User = require('../models/user');
const { validationResult } = require("express-validator/check");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signupUser = (req, res, next) => {
    
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log(errors.errors)
        const error = new Error('Validation failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error
    }

    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    bcrypt.hash(password, 12)
    .then(hashedPassword => {
        const user = new User({
            name : name,
            password : hashedPassword,
            email : email
        });
        return user.save();
    })
    .then(user => {
        res.status(201).json({message : 'user created', userId : user._id})
    })
    .catch(error => {
        if (!error.statusCode) {
            error.statusCode = 500;
          }
        return next(error);
    })
}

exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    User.findOne({email : email})
    .then(user => {
        if(!user) {
            const error = new Error('Email or password is not valid');
            error.statusCode = 401;
            throw error
        }
        loadedUser = user;
        return bcrypt.compare(password, user.password)
    })
    .then(isEqual => {
        if (!isEqual) {
            const error = new Error('Email or password is not valid');
            error.statusCode = 401;
            throw error
        }
        const token = jwt.sign({
            email : loadedUser.email,
            userId : loadedUser._id.toString()
        }, 'secret', { expiresIn : '1h' });
        res.status(200).json( {token : token, userId : loadedUser._id.toString()});

    })
    .catch(error => {
        if (!error.statusCode) {
            error.statusCode = 500;
          }
        return next(error);
    });
}