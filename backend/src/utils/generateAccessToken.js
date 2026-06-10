import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const generateAccessToken=(userId,role)=>{
    const jti=uuidv4();
    const token=jwt.sign(
        {
            userId,
            role,
            jti
        },
        process.env.ACCESS_SECRET,
        {expiresIn:"15m"}
    );
    return{
        token,
        jti
    };
};

 export default generateAccessToken;
