import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/user.models.js';
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from '../utils/cloudinary.js';
import ApiResponse from '../utils/ApiResponse.js';

import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const registerUser = asyncHandler(async (req, res) => {
  // code to register a user
  const { fullname, username, email, password } = req.body;

  // for particular missing fields
  const missingFields = ['fullname', 'username', 'email', 'password'].filter(
    (field, index) => ![fullname, username, email, password][index]?.trim()
  );

  // validation
  if (
    [fullname, username, email, password].some((field) => field?.trim() === '')
  ) {
    throw new ApiError(
      404,
      `these fields:- ${missingFields.join(', ')}  should be filled properly!😊`
    );
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, 'User already exists with this email or username!');
  }

  console.warn(req.files);

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar file is missing!🥲');
  }

  let avatar, coverImage;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log('Upload avatar', avatar);
  } catch (error) {
    console.log('error uploading avatar', error);
  }
  try {
    coverImage = coverLocalPath
      ? await uploadOnCloudinary(coverLocalPath)
      : null;
    console.log('Upload coverImage', coverImage);
  } catch (error) {
    console.log('error uploading coverImage', error);
  }
  try {
    const user = await User.create({
      fullname,
      avatar: avatar?.url || '',
      coverImage: coverImage?.url || '',
      email,
      password,
      username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select(
      '-password -refreshToken'
    );

    if (!createdUser) {
      throw new ApiError(
        400,
        'something went wrong while reigstering a user🥲'
      );
    }

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, 'User registered succesfully'));
  } catch (error) {
    console.log('User creation failed');

    if (avatar?.publicId) {
      await deleteFromCloudinary(avatar.publicId);
    }

    if (coverImage?.publicId) {
      await deleteFromCloudinary(coverImage.publicId);
    }
    if (!createdUser) {
      throw new ApiError(
        400,
        'something went wrong while reigstering a user🥲 and images were deleted'
      );
    }
  }
});

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    // small check for user existence
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      'Something went wrong while generating access and refresh tokens'
    );
  }
};

const loginUser = asyncHandler(async (req, res, next) => {
  // get data from body
  const { email, username, password } = req.body;

  // validation
  ['email', 'username', 'password'].forEach((field) => {
    if (!req.body[field]) throw new Error(`${field} is required`);
  });

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // validate password
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid Email or Password');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  };

  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        // for mobile. bcz, we cannot set cookies in mobile.
        { user: loggedInUser, accessToken, refreshToken },
        'User logged in successfully!'
      )
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  // req.body.refreshToken is for mobiles

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Refresh token is required');
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          'Access token refreshed successfully'
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      'Something went wrong while refreshing access token'
    );
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    // TODO: need to come back here after middleware/
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options);
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body

  const user = await User.findById(req.user?._id)

  const isPasswordValid = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordValid) throw new ApiError(401, "Old password is incorrect")

  user.password = newPassword;

  await user.save({ validateBeforeSave: false })

  return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "Current user details"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body

  if (!fullname || !email) throw new ApiError(400, "Fullname and email are required")

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname, email: email.toLowerCase()
      },
    },
    { new: true }
  ).select("-password")

  return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.files?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, "File is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url) {
    throw new ApiError(500, "Something went wrong while uploading avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    { new: true }
  ).select("-password -refreshToken")

  res.status(200).json(new ApiError(200, user, "Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => { })

export {
  generateAccessAndRefreshToken,
  loginUser,
  refreshAccessToken,
  logoutUser,
};
export default registerUser;
