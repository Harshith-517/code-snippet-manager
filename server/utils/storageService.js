import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage provider types
const STORAGE_LOCAL = 'local';
const STORAGE_S3 = 's3';
const STORAGE_GOOGLE = 'google';
const STORAGE_AZURE = 'azure';
const STORAGE_SUPABASE = 'supabase';

// Get storage provider from env or use local by default
const storageProvider = process.env.STORAGE_PROVIDER || STORAGE_LOCAL;

// Initialize Supabase client if the provider is Supabase
let supabaseClient = null;
if (storageProvider === STORAGE_SUPABASE) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
  } else {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized for storage');
  }
}

/**
 * Save file to storage
 * @param {Object} file - File object
 * @param {string} directory - Directory to save the file
 * @param {string} filename - Filename to save
 * @returns {Promise<string>} - URL or path to the saved file
 */
export const saveFile = async (file, directory, filename) => {
  switch (storageProvider) {
    case STORAGE_S3:
      // Implement AWS S3 storage logic when needed
      throw new Error('AWS S3 storage not implemented yet');
      
    case STORAGE_GOOGLE:
      // Implement Google Cloud Storage logic when needed
      throw new Error('Google Cloud Storage not implemented yet');
      
    case STORAGE_AZURE:
      // Implement Azure Blob Storage logic when needed
      throw new Error('Azure Blob Storage not implemented yet');
    
    case STORAGE_SUPABASE:
      return saveSupabaseFile(file, directory, filename);
      
    case STORAGE_LOCAL:
    default:
      return saveLocalFile(file, directory, filename);
  }
};

/**
 * Delete file from storage
 * @param {string} fileUrl - URL or path to the file to delete
 * @returns {Promise<boolean>} - True if file was deleted successfully
 */
export const deleteFile = async (fileUrl) => {
  switch (storageProvider) {
    case STORAGE_S3:
      // Implement AWS S3 deletion logic when needed
      throw new Error('AWS S3 storage not implemented yet');
      
    case STORAGE_GOOGLE:
      // Implement Google Cloud Storage deletion logic when needed
      throw new Error('Google Cloud Storage not implemented yet');
      
    case STORAGE_AZURE:
      // Implement Azure Blob Storage deletion logic when needed
      throw new Error('Azure Blob Storage not implemented yet');
    
    case STORAGE_SUPABASE:
      return deleteSupabaseFile(fileUrl);
      
    case STORAGE_LOCAL:
    default:
      return deleteLocalFile(fileUrl);
  }
};

/**
 * Save file to local filesystem
 * @param {Object} file - Multer file object
 * @param {string} directory - Directory to save the file
 * @param {string} filename - Filename to save
 * @returns {Promise<string>} - Path to the saved file
 */
const saveLocalFile = async (file, directory, filename) => {
  try {
    console.log('Storage: saveLocalFile called with directory:', directory, 'filename:', filename);
    
    // Normalize directory path (ensure it doesn't start with a slash)
    const normalizedDir = directory.replace(/^\/+/, '');
    const uploadDir = path.join(__dirname, '..', normalizedDir);
    
    console.log('Storage: Normalized upload directory:', uploadDir);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`Storage: Created directory: ${uploadDir}`);
    }
    
    // If file is already on disk (from multer)
    if (file.path) {
      console.log('Storage: Processing file from path:', file.path);
      const filePath = path.join(uploadDir, filename);
      
      // Move file from temp to final location
      fs.copyFileSync(file.path, filePath);
      console.log(`Storage: Copied file from ${file.path} to ${filePath}`);
      
      // Verify the file was successfully copied
      if (fs.existsSync(filePath)) {
        console.log(`Storage: Verified file exists at destination: ${filePath}`);
      } else {
        console.error(`Storage: File not found at destination after copy: ${filePath}`);
        throw new Error('File not found after copy operation');
      }
      
      try {
        // Remove original after copy
        fs.unlinkSync(file.path);
        console.log('Storage: Removed temporary file:', file.path);
      } catch (err) {
        console.error('Storage: Failed to remove temp file:', err);
      }
      
      // Return the normalized path for URL generation
      const relativePath = `/${normalizedDir}/${filename}`.replace(/\/+/g, '/');
      console.log('Storage: Returning relative path:', relativePath);
      return relativePath;
    } 
    // If file is a buffer or stream
    else if (file.buffer) {
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, file.buffer);
      
      // Verify the file was written
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found after writing buffer');
      }
      
      // Return the normalized path for URL generation
      const relativePath = `/${normalizedDir}/${filename}`.replace(/\/+/g, '/');
      return relativePath;
    }
    // Handle incorrect file format
    else {
      console.error('Storage: Invalid file format provided:', file);
      throw new Error('Invalid file format provided to saveLocalFile');
    }
  } catch (error) {
    console.error('Storage: Error saving file locally:', error);
    throw error;
  }
};

/**
 * Delete file from local filesystem
 * @param {string} fileUrl - Path to the file to delete
 * @returns {Promise<boolean>} - True if file was deleted successfully
 */
const deleteLocalFile = async (fileUrl) => {
  try {
    console.log('Storage: Deleting file:', fileUrl);
    
    // Handle null or undefined fileUrl
    if (!fileUrl) {
      console.log('Storage: No file URL provided for deletion');
      return false;
    }
    
    // Normalize the file path (handle different path formats)
    const normalizedPath = fileUrl.replace(/^\/+/, ''); // Remove leading slashes
    const filePath = path.join(__dirname, '..', normalizedPath);
    console.log('Storage: Normalized file path for deletion:', filePath);
    
    if (fs.existsSync(filePath)) {
      console.log('Storage: File exists, deleting:', filePath);
      fs.unlinkSync(filePath);
      console.log('Storage: File successfully deleted');
      return true;
    } else {
      console.log('Storage: File does not exist, nothing to delete:', filePath);
      return false;
    }
  } catch (error) {
    console.error('Storage: Error deleting file:', error);
    return false;
  }
};

/**
 * Save file to Supabase storage
 * @param {Object} file - Multer file object
 * @param {string} directory - Directory (bucket) to save the file
 * @param {string} filename - Filename to save
 * @returns {Promise<string>} - URL to the saved file
 */
const saveSupabaseFile = async (file, directory, filename) => {
  try {
    if (!supabaseClient) {
      throw new Error('Supabase client not initialized');
    }
    
    // Extract bucket name from directory
    const bucketName = directory.split('/').pop();
    
    // Check if bucket exists, create if not
    const { data: buckets } = await supabaseClient.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      const { error } = await supabaseClient.storage.createBucket(bucketName, {
        public: true
      });
      
      if (error) {
        throw error;
      }
    }
    
    let fileData;
    
    // Get file data from multer file object
    if (file.path) {
      fileData = fs.readFileSync(file.path);
    } else if (file.buffer) {
      fileData = file.buffer;
    } else {
      throw new Error('Invalid file format provided');
    }
    
    // Upload file to Supabase
    const { data, error } = await supabaseClient.storage
      .from(bucketName)
      .upload(filename, fileData, {
        contentType: file.mimetype,
        upsert: true
      });
    
    if (error) {
      throw error;
    }
    
    // Get public URL of the file
    const { data: publicURL } = supabaseClient.storage
      .from(bucketName)
      .getPublicUrl(filename);
    
    // Clean up local file if it exists
    if (file.path) {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Storage: Failed to remove temp file:', err);
      }
    }
    
    return publicURL.publicUrl;
  } catch (error) {
    console.error('Storage: Error saving file to Supabase:', error);
    throw error;
  }
};

/**
 * Delete file from Supabase storage
 * @param {string} fileUrl - URL of the file to delete
 * @returns {Promise<boolean>} - True if file was deleted successfully
 */
const deleteSupabaseFile = async (fileUrl) => {
  try {
    if (!supabaseClient) {
      throw new Error('Supabase client not initialized');
    }
    
    if (!fileUrl) {
      return false;
    }
    
    // Extract bucket and filename from URL
    const urlParts = fileUrl.split('/');
    const filename = urlParts.pop();
    const bucketName = urlParts[urlParts.length - 2];
    
    const { error } = await supabaseClient.storage
      .from(bucketName)
      .remove([filename]);
    
    if (error) {
      console.error('Storage: Supabase delete error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Storage: Error deleting file from Supabase:', error);
    return false;
  }
};

export default {
  saveFile,
  deleteFile,
  getStorageProvider: () => storageProvider
};