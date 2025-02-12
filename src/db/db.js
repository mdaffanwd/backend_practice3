import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async (req, res) => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/${DB_NAME}`
    );

    console.log('MONGODB Connected');
  } catch (error) {
    console.log('Mdb conn error', error);
    process.exit(1);
  }
};

export {connectDB};
