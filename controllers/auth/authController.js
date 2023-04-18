import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  createUser,
  createDefaultMaster,
  findUser,
  findUserByPhone,
  updateRefreshToken,
  deleteRefreshToken,
  getUserByRefreshToken,
} from "./authDbFunctions.js";

//console.log(await bcrypt.hash('admin', 10));

import dotenv from "dotenv";
import ROLE from "./../../config/roles.js";
dotenv.config();

const register = async (req, res) => {
  const { accountType, firstName, lastName, phone, password } = req.body;

  if (!accountType || !firstName || !lastName || !phone || !password)
    return res.status(400).json({
      message: "accountType, firstName, lastName, phone, password are required",
    });

  //check for duplicate user by phone
  //const duplicate = await select ...
  //if (duplicate) return res.status(409); //Conflict

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    let userId = null;
    if (accountType == "master") {
      userId = await createDefaultMaster(firstName, lastName, phone, hashedPassword);
    } else {
      userId = await createUser(firstName, lastName, phone, hashedPassword);
    }

    const { newRefreshToken, accessToken } = await generateAccessToken(userId);

    if (!accessToken || !newRefreshToken) {
      throw new Error("Access or refresh token not available");
    } else {
      console.log("accessToken: ", accessToken);
      console.log("newRefreshToken: ", newRefreshToken);

      //Create Secure Cookie with refresh token
      res.cookie("jwt", newRefreshToken, {
        httpOnly: true,
        sameSite: false, //in production mode maybe true ?
        //sameSite: 'none', //in production -> strict
        //secure: true, //in production only service on https
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.status(200).json({ accessToken });
    }
  } catch ({ message }) {
    res.status(500).json({ message: message });
  }
};

const generateAccessToken = async (userId) => {
  let user1 = await findUser(userId);
  const role = user1.role;

  const accessToken = jwt.sign(
    {
      userInfo: {
        user: {
          id: user1.id,
          firstName: user1.firstName,
          lastName: user1.lastName,
          avatar: user1.avatar,
          phone: user1.phone,
          email: user1.email,
          isEmailVerified: user1.isEmailVerified,
          masterInfo:
            role === ROLE.MASTER
              ? {
                  categories: user1.categories,
                  tagLine: user1.masterData.tagLine,
                  description: user1.masterData.description,
                  location:
                    user1.masterData.lat && user1.masterData.lng
                      ? {
                          lat: user1.masterData.lat,
                          lng: user1.masterData.lng,
                        }
                      : null,
                  nationality: user1.masterData.id
                    ? {
                        id: user1.masterData.id,
                        country: user1.masterData.country,
                        flag: user1.masterData.flag,
                      }
                    : null,
                }
              : null,
        },
        role: role,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" } //in production 15 min = 900s
  );

  const newRefreshToken = jwt.sign(
    {
      userInfo: {
        user: {
          id: user1.id,
          firstName: user1.firstName,
          lastName: user1.lastName,
          avatar: user1.avatar,
          phone: user1.phone,
          email: user1.email,
          isEmailVerified: user1.isEmailVerified,
          masterInfo:
            role === ROLE.MASTER
              ? {
                  categories: user1.categories,
                  tagLine: user1.masterData.tagLine,
                  description: user1.masterData.description,
                  location:
                    user1.masterData.lat && user1.masterData.lng
                      ? {
                          lat: user1.masterData.lat,
                          lng: user1.masterData.lng,
                        }
                      : null,
                  nationality: user1.masterData.id
                    ? {
                        id: user1.masterData.id,
                        country: user1.masterData.country,
                        flag: user1.masterData.flag,
                      }
                    : null,
                }
              : null,
        },
        role: role,
      },
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "1d" }
  );

  updateRefreshToken(user1.id, newRefreshToken);

  return { newRefreshToken, accessToken };
};

const login = async (req, res) => {
  const cookies = req.cookies;
  const { phone, password } = req.body;
  if (!phone || !password)
    return res.status(400).json({ message: "phone, password are required" });

  let user1 = await findUserByPhone(phone);
  if (!user1) return res.sendStatus(401); //Unauthorized
  //console.log('user1', user1);

  try {
    if (await bcrypt.compare(password, user1.password)) {
      const role = user1.role;

      //const accessToken = jwt.sign(user1, process.env.ACCESS_TOKEN_SECRET);
      const accessToken = jwt.sign(
        {
          userInfo: {
            user: {
              id: user1.id,
              firstName: user1.firstName,
              lastName: user1.lastName,
              avatar: user1.avatar,
              phone: user1.phone,
              email: user1.email,
              isEmailVerified: user1.isEmailVerified,
              masterInfo:
                role === ROLE.MASTER
                  ? {
                      categories: user1.categories,
                      tagLine: user1.masterData.tagLine,
                      description: user1.masterData.description,
                      location:
                        user1.masterData.lat && user1.masterData.lng
                          ? {
                              lat: user1.masterData.lat,
                              lng: user1.masterData.lng,
                            }
                          : null,
                      nationality: user1.masterData.id
                        ? {
                            id: user1.masterData.id,
                            country: user1.masterData.country,
                            flag: user1.masterData.flag,
                          }
                        : null,
                    }
                  : null,
            },
            role: role,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" } //in production 15 min = 900s
      );

      const newRefreshToken = jwt.sign(
        {
          userInfo: {
            user: {
              id: user1.id,
              firstName: user1.firstName,
              lastName: user1.lastName,
              avatar: user1.avatar,
              phone: user1.phone,
              email: user1.email,
              isEmailVerified: user1.isEmailVerified,
              masterInfo:
                role === ROLE.MASTER
                  ? {
                      categories: user1.categories,
                      tagLine: user1.masterData.tagLine,
                      description: user1.masterData.description,
                      location:
                        user1.masterData.lat && user1.masterData.lng
                          ? {
                              lat: user1.masterData.lat,
                              lng: user1.masterData.lng,
                            }
                          : null,
                      nationality: user1.masterData.id
                        ? {
                            id: user1.masterData.id,
                            country: user1.masterData.country,
                            flag: user1.masterData.flag,
                          }
                        : null,
                    }
                  : null,
            },
            role: role,
          },
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "1d" }
      );

      if (cookies != undefined) {
        if (cookies["jwt"]) {
          //const refreshToken = cookies['jwt'];

          //const foundToken = await checkRefreshToken(refreshToken);//problem with sault?, when compared

          //Detected refresh token reuse!
          // if (!foundToken) {
          //   console.log('attempted refresh token reuse at login');//?
          // }

          res.clearCookie("jwt", {
            httpOnly: true,
            sameSite: false, //in production mode maybe true ?
            //sameSite: 'none', //in production -> strict
            //secure: true, //in production only service on https
          });
        }
      }

      updateRefreshToken(user1.id, newRefreshToken);

      //Create Secure Cookie with refresh token
      res.cookie("jwt", newRefreshToken, {
        httpOnly: true,
        sameSite: false, //in production mode maybe true ?
        //sameSite: 'none', //in production -> strict
        //secure: true, //in production only service on https
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.status(200).json({ accessToken });
    } else {
      res.sendStatus(401); //Unauthorized
    }
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
};

const refresh = async (req, res) => {
  const refreshToken = req.cookies["jwt"];
  if (!refreshToken) return res.sendStatus(401);

  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: false, //in production mode maybe true ?
    //sameSite: 'none',//in production -> strict
    //secure: true, //in production only service on https
  });

  //const foundUser = await getUserByRefreshToken(refreshToken);//problem with sault
  const foundUser = await jwt
    .verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) return res.sendStatus(403); // Forbidden

        // deleteRefreshToken(refreshToken);//same problem
        return decoded.userInfo.user.id;
      }
    )
    .then(async (id) => await findUser(id));

  //Detected refresh token reuse!
  if (!foundUser) {
    // deleteRefreshToken(refreshToken);//same problem
    return res.sendStatus(403); //Forbidden
  }

  //console.log('foundUser:::', foundUser);

  //evaluate jwt
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      deleteRefreshToken(refreshToken);
    }

    //console.log('decoded:::', decoded);

    if (
      err ||
      foundUser.id !== decoded.userInfo.user.id ||
      foundUser.firstName !== decoded.userInfo.user.firstName ||
      foundUser.lastName !== decoded.userInfo.user.lastName
    )
      return res.sendStatus(403);

    //Refresh token was still valid
    const role = foundUser.role;
    const accessToken = jwt.sign(
      {
        userInfo: {
          user: {
            id: decoded.userInfo.user.id,
            firstName: decoded.userInfo.user.firstName,
            lastName: decoded.userInfo.user.lastName,
            avatar: decoded.userInfo.user.avatar,
            phone: decoded.userInfo.user.phone,
            email: decoded.userInfo.user.email,
            isEmailVerified: decoded.userInfo.user.isEmailVerified,
            masterInfo:
              role === ROLE.MASTER
                ? {
                    categories: foundUser.categories,
                    tagLine: foundUser.masterData.tagLine,
                    description: foundUser.masterData.description,
                    location:
                      foundUser.masterData.lat && foundUser.masterData.lng
                        ? {
                            lat: foundUser.masterData.lat,
                            lng: foundUser.masterData.lng,
                          }
                        : null,
                    nationality: foundUser.masterData.id
                      ? {
                          id: foundUser.masterData.id,
                          country: foundUser.masterData.country,
                          flag: foundUser.masterData.flag,
                        }
                      : null,
                  }
                : null,
          },
          role: role,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" } //in production 15 min = 900s
    );

    const newRefreshToken = jwt.sign(
      {
        userInfo: {
          user: {
            id: foundUser.id,
            firstName: foundUser.firstName,
            lastName: foundUser.lastName,
            avatar: foundUser.avatar,
            phone: foundUser.phone,
            email: foundUser.email,
            isEmailVerified: foundUser.isEmailVerified,
            masterInfo:
              role === ROLE.MASTER
                ? {
                    categories: foundUser.categories,
                    tagLine: foundUser.masterData.tagLine,
                    description: foundUser.masterData.description,
                    location:
                      foundUser.masterData.lat && foundUser.masterData.lng
                        ? {
                            lat: foundUser.masterData.lat,
                            lng: foundUser.masterData.lng,
                          }
                        : null,
                    nationality: foundUser.masterData.id
                      ? {
                          id: foundUser.masterData.id,
                          country: foundUser.masterData.country,
                          flag: foundUser.masterData.flag,
                        }
                      : null,
                  }
                : null,
          },
          role: role,
        },
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    //Saving refresh token with current user
    updateRefreshToken(foundUser.id, newRefreshToken);

    //Create Secure Cookie with refresh token
    res.cookie("jwt", newRefreshToken, {
      httpOnly: true,
      sameSite: false, //in production mode maybe true ?
      //sameSite: 'none', //in production -> strict
      //secure: true, //in production only service on https
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  });
};

const logout = async (req, res) => {
  const refreshToken = req.cookies["jwt"];
  if (!refreshToken) return res.sendStatus(204); //No content

  //Is refresh token in db?
  const foundUser = await getUserByRefreshToken(refreshToken);
  if (!foundUser) {
    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: false, //in production mode maybe true ?
      //sameSite: 'none',//in production -> strict
      //secure: true, //in production only service on https
    });
    return res.sendStatus(204);
  }

  //On client, also delete the token
  deleteRefreshToken(refreshToken);
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: false, //in production mode maybe true ?
    //sameSite: 'none', //in production -> strict
    //secure: true, //in production only service on https
  });
  res.sendStatus(204);
};

export default {
  register,
  login,
  refresh,
  logout,
};
