import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// we can use _ also for those values which are not in use..
export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // console.log(token);

    if (!token) throw new apiError(401, "Unauthorized reqeust !");

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // console.log(decodedToken);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) throw new apiError(401, "Invalid access token !!");
    // discuss about frontend

    // console.log(user);

    req.user = user;
    req.query.userId = user._id;

    next();
  } catch (error) {
    throw new apiError(401, error?.message || "Invalid access token !");
  }
});
