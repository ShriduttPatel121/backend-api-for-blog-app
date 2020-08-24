const express = require('express');
const { body } = require('express-validator/check');
const authController = require('../controllers/auth');
const User = require('../models/user');
const router = express.Router();

router.put('/signup',[
    body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .custom((value, { req }) => {
       return User.findOne({email : value})
        .then(user => {
            
            if(user) {
                console.log('user');
                return Promise.reject('Email already in use.');
            }
        })
    }),
    body('password')
    .trim()
    .isLength({min : 5}),

    body('name')
    .trim()
    .not()
    .isEmpty()
],authController.signupUser)

router.post('/login', authController.login);
module.exports = router;