const userDB = require('../db_models/user_db');
const session_id = require('../config').session_id;

const selected_field = "username email";


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
function signup(req, username, email, password, callback){
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

    userDB.findOne({username: username}, (err, value)=>{
        if(err){
            callback({
                success: false,
                reasons:[err.message],
                value:null
            });
            return;
        }else if(value){
            callback({
                success: false,
                reasons:[`Username ${value.username} already existed`],
                value:null
            });
            return;
        }else{
            userDB.findOne({email: email}, (err2, value2)=>{
                if(err2){
                    callback({
                        success: false,
                        reasons:[err2.message],
                        value:null
                    });
                    return;
                }else if(value2){
                    callback({
                        success: false,
                        reasons:[`Email ${value2.email} already registered`],
                        value:null
                    });
                    return;
                }else{
                    // OK
                    userDB.create({username: username, email: email, password: password}, (err3,result)=>{
                        if(err3){
                            callback({
                                success: false,
                                reasons:[err3.message],
                                value:null
                            });
                            return;
                        }else{
                            req.session.username = result.username;
                            userDB.findOne({username: username}, selected_field, (err4, fresult)=>{
                                callback({
                                    success: true,
                                    value: fresult,
                                    reasons:[],
                                });
                            });
                        }
                    });
                }
            });
        }
    });
}

// user can login with username or email
function login(req, username_or_email, password, callback){
    let isEmail = validateEmail(username_or_email);
    // already login?
    if(req.session.username){
        callback({
           success: true,
           value: "You already login",
           reasons:[] 
        });
        return;
    }

    if(isEmail){
        userDB.findOne({email: username_or_email, password: password}, selected_field, (err, result)=>{
            if(err){
                callback({
                    success: false,
                    reasons:[err.message],
                    value: null
                });
            }else if(result){
                req.session.username = result.username;
                callback({
                    success: true,
                    reasons:[],
                    value: result
                });
            }else{
                callback({
                    success: false,
                    reasons:["The combination of your account and password does not existed"],
                    value: null
                });
            }
        });
    }else{
        userDB.findOne({username: username_or_email, password: password}, selected_field,(err, result)=>{
            if(err){
                callback({
                    success: false,
                    reasons:[err.message],
                    value: null
                });
            }else if(result){
                req.session.username = result.username;
                callback({
                    success: true,
                    reasons:[],
                    value: result
                });
            }else{
                callback({
                    success: false,
                    reasons:["The combination of your account and password does not existed"],
                    value: null
                });
            }
        });
    }
}

function queryUser(username, callback){
    userDB.findOne({username: username}, selected_field, (err, result)=>{
        if(err){
            callback({
                success: false,
                reasons: [err.message],
                value: null
            });
        }else if(result){
            callback({
                success: true,
                value: result,
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
    if(req.session && req.session.username){
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


module.exports.signup = signup;
module.exports.login = login;
module.exports.queryUser = queryUser;
module.exports.logout = logout;