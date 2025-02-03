import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: { type: String, required: [true, 'password is required'] },

    password: { type: String, required: true },

    avatar: { type: String, default: '' },

    coverImage: { type: String, default: '' },

    watchHistory: [{ type: Schema.Types.ObjectId, ref: 'Video' }],

    refreshToken: {
      type: String,
    },
    //   role: { type: String, enum: ['admin', 'user'], default: 'user' },
  },
  { timestamps: true }
);

// Hash the password before saving only if it's newly created or modified,  
// preventing re-hashing when updating other fields.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// jwt token
userSchema.methods.generateAccessToken = async function () {
  // short lived access token
  const accessToken = jwt.sign(
    { _id: this._id, email: this.email, fullname: this.fullname },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE,
    }
  );
  return accessToken;
};

userSchema.methods.generateRefreshToken = async function () {
  const refreshToken = jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE }
  );
  return refreshToken;
};

const User = model('User', userSchema);

export default User;
