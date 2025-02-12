import { app } from './app.js';
import dotenv from 'dotenv';
import connectDB from './db/db.js';

dotenv.config();

const PORT = process.env.PORT || 8001;
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log('running on:', PORT));
  })
  .catch((err) => console.log('mongodb connection error'));
