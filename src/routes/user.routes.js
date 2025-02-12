import { Router } from 'express';
import registerUser, {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser, logoutUser,
  refreshAccessToken,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage
} from '../controllers/user.controller.js';
import upload from '../middlewares/multer.middlewares.js';
import verifyJWT from '../middlewares/auth.middlewares.js'
logoutUser

const router = Router();

// unsecured routes. 
router.route('/register').post(
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1,
    },
    {
      name: 'coverImage',
      maxCount: 1,
    },
  ]), // for handling avatar, cover, and other files. especially images.
  registerUser
);

router.route("/login").post(loginUser)
router.route("/refresh-token").post(refreshAccessToken)

// secured routes

router.route("/logout",).post(verifyJWT, logoutUser)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/avatar").patch(verifyJWT, upload.single, updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single, updateUserCoverImage)
router.route("/history").get(verifyJWT, getWatchHistory)


export{ router};
