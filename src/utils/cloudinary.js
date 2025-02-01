import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
    });

    // file has been uploaded successfully on cloudinary
    console.log('File uploaded on cloudinary', response.url);
    return response;
  } catch (err) {
    console.error('Cloudinary upload failed:', err);

    try {
      fs.unlinkSync(localFilePath);
    } catch (unlinkErr) {
      console.error('Failed to delete local file:', unlinkErr);
    }
    
    return null;
  }
};

export { uploadOnCloudinary };
