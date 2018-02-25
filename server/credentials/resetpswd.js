const validator = require('validator')
const User = require('./user');
var mail = require('./mail');
var helpers = require('./helpers');

module.exports = {

  setSocket : function(socket) {
    socket.on('resetpswd', function(email) {
      if (validator.isEmail(email)) {
        User.findOne({email}, async function(err, user) {
          if (err) socket.emit('resetpswd->res', 500)
          else if (!user) socket.emit('resetpswd->res', "INVALID_EMAIL")
          else {
            const token = await helpers.randomString(30).catch(function (){
              socket.emit('resetpswd->resp', 500);
            })
            User.updateOne({email}, {$set : {"password_token" : token}}, function(err, result) {
              if (err) socket.emit('resetpswd->res', 500);
              else {                
                socket.emit('resetpswd->resp', false);
                mail.sendPasswordReset(email, token);
              }
            })
          }
        })
      }
    })
  },

  setRoute : function(app) {
    app.get('/resetpassword/:token', function(req, res) {
      User.findOne({password_token : req.body.token}, function(err, result) {
        if (err) res.status(500);
        else if (!result) res.status("INVALID_TOKEN");
        else {
          res.sendFile(__dirname+'/resetpswd.js');
          // format res/file replaceing {{token}} with the token
        }
      })
    })

    app.post('/resetpassword/:token', function(req, res) {
        let token = req.body.token;
        let newpassword = req.body.password;
        User.getOne({password_token : req.body.token}, {$set, "password":newpassword}, function(err, result) {
          if (err) res.status(500);
          else if (!result) res.status("INVALID_TOKEN")
          else {
            res.redirect('/');
          }
        })
    })
    
  }
}

          
