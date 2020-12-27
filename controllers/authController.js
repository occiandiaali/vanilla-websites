const User = require('../models/User');
const jwt = require('jsonwebtoken');


// error handler function
const handleError = err => {
    console.log(err.message, err.code);
    let errors = { email: '', password: ''};

    // incorrect email check
    if (err.message === 'incorrect email') {
        errors.email = 'This email doesn\'t look correct';
    }

    // incorrect password check
    if (err.message === 'incorrect password') {
        errors.password = 'this password is not correct';
    }

    // duplicate error code
    if (err.code === 11000) {
        errors.email = 'This email is already registered';
        return errors;
    }

    // validation errors
    if (err.message.includes('user validation failed')) {
        Object.values(err.errors).forEach(({properties}) => {
            errors[properties.path] = properties.message;
        });
    }

    return errors;
};

// constant value for use in time validity issues like jwt/cookies
const maxAge = 3 * 24 * 60 * 60; // 3 days

// json web token creation function
const createToken = id => {
    return jwt.sign({ id }, 'super simple nanya secrett', {
        expiresIn: maxAge
    });
};

module.exports.signup_get = (req, res) => {
    res.render('signup');
}

module.exports.login_get = (req, res) => {
    res.render('login');
}


module.exports.signup_post = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await User.create({ email, password });
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(201).json({ user: user._id });
    } catch (err) {
        const errorsValues = handleError(err);
        res.status(400).json(errorsValues);
    }
}

module.exports.login_post = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await User.login(email, password);
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(200).json({ user: user._id });
    } catch (err) {
        const errors = handleError(err);
        res.status(400).json({ errors });
    }
}


module.exports.logout_get = (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.redirect('/');
};
