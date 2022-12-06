const jwt = require('jsonwebtoken');

exports.signToken = ( email ) => {
    return jwt.sign({ email }, process.env.JWT_SECRET_KEY);
}

exports.verifyToken = (token ) =>{
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        return decoded;
    }catch(err){
    // err
        console.error(err);
        return null;
    }
}