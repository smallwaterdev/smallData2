const userDB = require('../db_models/user_db');
const session_id = require('../config').session_id;
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const selected_field = "username email profile";


function validateUsername(username){
    // 6 - 20 char from [0-9, a-z, A-Z]
    if(typeof username === "string"){
        if(username.length >= 6 && username.length <= 20){
            for (let i = 0; i < username.length; i++) {
                if((username.charAt(i) >= '0' && username.charAt(i) <= '9') || 
                    (username.charAt(i) >= 'a' && username.charAt(i) <= 'z') || 
                    (username.charAt(i) >= 'A' && username.charAt(i) <= 'Z'))
                {
                        
                }else{
                    return "Character in username must come from 0-9, a-z or A-Z";
                }
            }
            return "OK";
        }
        return "Username's length should from 6 to 20"
    }
    return "Invalid username";
}
function validatePassword(password){
    let az = /[a-z]/;
    let AZ = /[A-Z]/;
    //let n09 = /[0-9]/;
    if(typeof password === "string"){
        if(password.length >= 8 && password.length <= 40){
            let valid = 0;
            if(az.test(password)){
                valid++;
            }
            if(AZ.test(password)){
                valid++;
            }
            /*if(n09.test(password)){
                valid++;
            }*/
            if(valid >= 2){
                return "OK";
            }
            return "Password must contain at least one lowercase and one uppercase character";
        }
        return "Password's length should from 8 to 40";
    }
    return "Invalid password";
}
function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}
function signup(req, res, callback){
    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;

    let result = validateUsername(username);
    if(result !== "OK"){
        callback({
            sucess: false,
            reasons:[result],
            value: null
        });
        return;
    }
    result = validatePassword(password);

    if(result !== "OK"){
        callback({
            sucess: false,
            reasons:[result],
            value: null
        });
        return;
    }
    
    if(!validateEmail(email)){
        callback({
            sucess: false,
            reasons:[`Invalid email ${email}`],
            value: null
        });
        return;
    }
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.log(`${username}`);
    console.log(`${email}`);
    console.log(`${password}`);
    console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
    userDB.register(new userDB({ username : username, email: email }), password, function(err, account) {
        if (err) {
            callback({
                success: false,
                reasons:[err.message],
                value:null
            });
        }else{
            passport.authenticate('local')(req, res, function () {
                // add session
                userDB.findOne({username: req.user.username}, selected_field, (err, userInfo)=>{
                    if(err){
                        callback({
                            success: false,
                            reasons:[err.message],
                            value:null
                        });
                    }else{
                        callback({
                            success: true,
                            reasons:[],
                            value:userInfo
                        });
                    }
                });
            });
        }
    });
}
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////

// user can login with username or email
function login(req, res, callback){
    if(!req.body.username){
        callback({
            success: false,
            reasons:["Missing username"],
            value:null
        });
        return;
    }
    if(validateEmail(req.body.username)){
        userDB.findOne({email: req.body.username}, (err, user)=>{
            if(err){
                callback({
                    success: false,
                    reasons:[err.message],
                    value:null
                });
                return;
            }else{
                req.body.username = user.username;
                passport.authenticate('local')(req, res, function () {
                    // add session
                    userDB.findOne({username: req.user.username}, selected_field, (err, userInfo)=>{
                        if(err){
                            callback({
                                success: false,
                                reasons:[],
                                value:null
                            });
                        }else{
                            callback({
                                success: true,
                                reasons:[],
                                value:userInfo
                            });
                        }
                    });
                });
            }
        });
    }else{
        passport.authenticate('local')(req, res, function () {
            // add session
            userDB.findOne({username: req.user.username}, selected_field, (err, userInfo)=>{
                if(err){
                    callback({
                        success: false,
                        reasons:[],
                        value:null
                    });
                }else{
                    callback({
                        success: true,
                        reasons:[],
                        value:userInfo
                    });
                }
            });
        });
    }
}

function queryUser(username, callback){
    userDB.findOne({username: username}, selected_field, (err, user)=>{
        if(err){
            callback({
                success: false,
                reasons: [err.message],
                value: null
            });
        }else if(user){
            callback({
                success: true,
                value: user,
                reasons:[]
            });
        }else{
            callback({
                success: true,
                value: null,
                reasons:[`Not found`]
            });
        }
    });
}
function logout(req, res, callback){
    if(req.session){
        req.session.destroy();
        res.clearCookie(session_id);
        callback({
            success: true,
            reasons: ["You logout"],
            value:null
        });
    }else{
        callback({
            success: false,
            reasons: ["You do not login"],
            value:null
        });
    }
}
function deleteUser(username_or_email, callback){

}
function updatePassword(username, callback){
    //user.setPassword save
    //https://stackoverflow.com/questions/17828663/passport-local-mongoose-change-password
}


module.exports.signup = signup;
module.exports.login = login;
module.exports.queryUser = queryUser;
module.exports.logout = logout;