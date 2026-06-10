import jwt from "jsonwebtoken";

const generateRefreshToken=(userId)=>{
    return jwt.sign(
        {userId},
        process.env.REFRESH_SECRET,
        {expiresIn :"7d"}
    );
};

export default generateRefreshToken;

