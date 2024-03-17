import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

import { User } from "../models/user.model.js";
import { Task } from "../models/task.model.js";

import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Subtask } from "../models/subtask.model.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    // while saving other properties of model will also kick-in to avoid that we pass one more parameter say `validateBeforeSave`
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(500, "Something went wrong while generating tokens.");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { phone, email, username, password, priority } = req.body;

  // assuming that phone is in valid format which required from twilio as that's a whole different feature to implement

  console.log(req.body);

  if (
    [phone, email, username, password, priority].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new apiError(400, "All fields are Required!!");
  }

  const existedUser = await User.findOne({
    $or: [
      {
        username,
      },
      {
        email,
      },
    ],
  });

  if (existedUser) {
    throw new apiError(409, "User already Exists!!");
  }

  console.log(existedUser);

  // user uploaded to database
  const user = await User.create({
    email,
    password,
    username: username.toLowerCase(),
    phone,
    priority,
  });

  // check that whether user is in database or not . ?
  const theUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // if it isn't return that the theresome server side error ..
  if (!theUser)
    throw new apiError(500, "Something went wrong while registering the user.");

  return res
    .status(201)
    .json(new apiResponse(200, theUser, "User successfully registered!!"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  console.log(req.body);

  if (!username && !email)
    throw new apiError(400, "username or email is required.");

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) throw new apiError(404, "User does not exist!");

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) throw new apiError(401, "Invalid user credentials.");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // returning to user
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // sending access and refersh token into cookies also
  // while sending cookies we have to set some options
  const options = {
    httpOnly: true,
    secure: true,
  };
  // both parameter allow cookies to be modified from the server only as by default can be modified from frontend also

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully !"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "Logged Out Successfully !!"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // need the refresh token
  // khn se aayega
  // cookies se access kar skte hain
  // taaki baar baar login na krna pde .. I guess.

  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  console.log(incomingRefreshToken);

  if (!incomingRefreshToken) throw new apiError(401, "Unauthorized request !!");

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    console.log(decodedToken);

    const user = await User.findById(decodedToken?._id);

    if (!user) throw new apiError(401, "Invalid refersh token !!");

    if (incomingRefreshToken !== user.refreshToken)
      throw new apiError(401, "Refresh token is expired !!");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );
    console.log(accessToken, refreshToken);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new apiResponse(
          200,
          {
            accessToken,
            refreshToken,
          },
          "Access Token Refreshed !!"
        )
      );
  } catch (error) {
    throw new apiError(401, error.message || "Invalid Refresh Token !!");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  console.log(user);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) throw new apiError(400, "Invalid Old Password !!");

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new apiResponse(200, req.user, "Current user fetched successfully !!")
    );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { email, priority, phone } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        email,
        priority,
        phone,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(
      new apiResponse(200, user, "Account details successfully updated !!")
    );
});

const getUserTask = asyncHandler(async (req, res) => {
  let { priority, due_date, page = 1, limit = 10 } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const filters = {};
  if (priority) filters["priority"] = parseInt(priority);
  if (due_date) filters["due_date"] = new Date(due_date);

  const tasks = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "tasks",
        localField: "taskHistory",
        foreignField: "_id",
        as: "userTasks",
      },
    },
    {
      $unwind: "$userTasks",
    },
    {
      $replaceRoot: { newRoot: "$userTasks" },
    },
    {
      $match: filters,
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    },
  ]);

  console.log(tasks);

  return res
    .status(200)
    .json(new apiResponse(200, tasks, "User Tasks fetched Successfully"));
});

const getUserSubTask = asyncHandler(async (req, res) => {
  let { status, page = 1, limit = 10 } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  const filters = {};
  if (status) filters["status"] = parseInt(status);

  const subtasks = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "tasks",
        localField: "taskHistory",
        foreignField: "_id",
        as: "userTasks",
        pipeline: [
          {
            $lookup: {
              from: "subtasks",
              localField: "subtaskHistory",
              foreignField: "_id",
              as: "userSubtasks",
            },
          },
        ],
      },
    },
    {
      $unwind: "$userTasks",
    },
    {
      $replaceRoot: { newRoot: "$userTasks" },
    },
    {
      $unwind: "$userSubtasks",
    },
    {
      $replaceRoot: { newRoot: "$userSubtasks" },
    },
    {
      $match: filters,
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    },
  ]);

  console.log(subtasks);

  return res
    .status(200)
    .json(
      new apiResponse(200, subtasks, "User Subtask fetched successfully !!")
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  getUserTask,
  getUserSubTask,
};
