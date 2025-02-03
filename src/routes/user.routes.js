import { Router } from 'express';
import registerUser from '../controllers/user.controller.js';
import upload from '../middlewares/multer.middlewares.js';

const router = Router();

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

export default router;
