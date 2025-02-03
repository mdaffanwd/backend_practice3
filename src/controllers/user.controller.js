import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/user.models.js';
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from '../utils/cloudinary.js';
import ApiResponse from '../utils/ApiResponse.js';

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

export default registerUser;
