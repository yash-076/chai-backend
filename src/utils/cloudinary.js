import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'
import { ApiError } from './ApiError.js';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

function getPublicIdFromUrl(url) {
  const parts = url.split("/upload/");
  const pathWithVersion = parts[1];
  const path = pathWithVersion.replace(/^v\d+\//, "");
  const publicId = path.replace(/\.[^/.]+$/, "");
  return publicId;
}

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath){
            return null
        }

        // upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        
        // File has been uploaded successfully
        // console.log("file uploaded on cloudinary")
        // console.log("Response Given by Cloudinary: ", response)

        // safely delete local temp file after successful upload
        try {
            if (fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath)
            }
        } catch (e) {
            console.warn("Failed to unlink temp file after upload:", localFilePath, e?.message || e)
        }
        return response
    } catch (error) {
        // attempt to remove local temp file even if upload failed
        try {
            if (localFilePath && fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath)
            }
        } catch (e) {
            console.warn("Failed to unlink temp file after upload error:", localFilePath, e?.message || e)
        }
        return null;
    }
}

const removeFromCloudinary = async (lastImageUrl)=>{
    try {
        if(!lastImageUrl) return null;
        
        const publicId = getPublicIdFromUrl(lastImageUrl)

        const result = await cloudinary.uploader.destroy(publicId)
        return result

    } catch (error) {
        throw new ApiError(500, error.message || "Error While deleting the Image");
    }
}


export {uploadOnCloudinary, removeFromCloudinary}