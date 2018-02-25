const User = require('./user');
const owasp = require('owasp-password-strength-test');
const crypto = require('crypto');
const mail = require('./mail');
const helpers = require('./helpers');
const validator = require('validator');

module.exports = {
	setSocket(socket) {
    socket.on('register', async (email, username, password) => {
    	const valid = await validateAndCallbackWithErrors(email, username, password,
        err => socket.emit('register->res', err));
    	if (valid) {
    		const verification_token = await helpers.randomString(30)
    			.catch(err => {
            console.error(err);
            socket.emit('register->res', 500);
    			});
    	}
    	const userData = {
    		email,
    		username,
    		password,
    		balance: 0,
    		takedowns: 0,
    		verified: false,
    		verification_token: token,
    		session_token: null
    	};
      User.create(userData, err => {
      	if (err) {
      		if (err.code === 11000) {
      			// Handled by validator
      			return;
      		}
          console.error(err);
          socket.emit('register->res', 500);
          return;
      	}
        socket.emit('register->res', false);
        mail.sendEmailConfirmation(email, token);
      });
    });

    socket.on('resend-confirmation', async email => {
    	if (!validator.isEmail(email)) {
        socket.emit('resend-confirmation->res', 'INVALID_EMAIL');
        return;
    	}

    	const token = await helpers.randomString(30)
    		.catch(err => {
          console.error(err);
          socket.emit('resend-confirmation->res', 500);
    		});

      User.findOne({
      	email
      }, async (err, user) => {
      	if (err && !user) {
          socket.emit('resend-confirmation->res', 500);
          return;
      	}
      	if (user.verified) {
          socket.emit('resend-confirmation->res', 'USER_ALREADY_VERIFIED');
          return;
      	}
        socket.emit('resend-confirmation->res', false);
        user.verification_token = token;
        await user.save();
        mail.sendEmailConfirmation(email, token);
      });
    });
	},

	setRoute(app) {
    app.get('/verify/:token', (req, res) => {
    	const token = req.params.token;
      User.updateOne(
        {verification_token: token},
        {$set:
          {verified: true,
          	verification_token: null}}, (err, result) => {
          		if (err || !result) {
              res.status(400);
          		} else {
console.log('validated');
          		}
          	});
      res.redirect('/');
    });
	}
};

async function validateAndCallbackWithErrors(email, username, password, callback) {
	let isValid = true;
	if (validator.isEmail(email)) {
		const isEmailRegistered = await User.findOne({email});
		if (isEmailRegistered) {
      callback('EMAIL_ALREADY_REGISTERED');
      isValid = false;
		}
	} else {
    callback('INVALID_EMAIL');
    isValid = false;
	}

	const isUsernameRegistered = await User.findOne({username});
	if (isUsernameRegistered) {
    callback('USERNAME_TAKEN');
    isValid = false;
	}

	if (!owasp.test(password).strong) {
    callback('WEAK_PASSWORD');
    isValid = false;
	}

	return isValid;
}
