import jwt from "jsonwebtoken";

function verifyJWT (req, res, next) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader.startsWith('Bearer ')) return res.sendStatus(401);
  
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.sendStatus(401);
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) return res.sendStatus(403); //invalid token
      req.user = decoded.userInfo.user;
      req.role = decoded.userInfo.role;
      next();
    });
}

function verifyRole(role) {
    return (req, res, next) => {
      if (!req.role) return res.sendStatus(401); //Unauthorized
    
      if (req.role !== role) return res.sendStatus(401); //Invalid role, not allowed
    
      next();
    };
  }

export { verifyJWT, verifyRole };