import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getBaseUrl } from '../utils/api';
import { uploadImage, checkSupabaseConfig } from '../utils/supabaseClient';
import toast from 'react-hot-toast';
import { useTheme } from '../utils/ThemeContext';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import CustomSwitch from '../components/CustomSwitch.jsx';
import SupabaseStatus from '../components/SupabaseStatus.jsx';

export default function ProfileSettings() {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    profileImage: '',
  });
  
  const [originalUser, setOriginalUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    profileImage: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Navigation states
  const [activeSection, setActiveSection] = useState('profile'); // 'profile', 'password', 'notifications', 'verification'
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showImageViewModal, setShowImageViewModal] = useState(false);
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    email: false,
    push: true,
    snippetUpdates: true,
    securityAlerts: true
  });
  
  // Image cropping states
  const [showCropModal, setShowCropModal] = useState(false);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [sourceImageFile, setSourceImageFile] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [imgRef, setImgRef] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const previewCanvasRef = useRef(null);
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordFormSubmitting, setPasswordFormSubmitting] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
    match: false
  });
  
  // Scroll to password section if URL has #password
  useEffect(() => {
    if (window.location.hash === '#password') {
      setTimeout(() => {
        const passwordSection = document.getElementById('password');
        if (passwordSection) {
          passwordSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  }, []);
  
  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        console.log('ProfileSettings: Fetching user profile data');
        const { data } = await api.get('/users/profile');
        console.log('ProfileSettings: User profile data received');
        
        setUser(data);
        setOriginalUser(data); // Store original data for comparison
        
        if (data.profileImage) {
          console.log('ProfileSettings: Processing profile image URL:', data.profileImage);
          
          // Handle both Google images and server-uploaded images correctly
          if (data.profileImage.startsWith('http')) {
            // External URL (like Google profile image)
            console.log('ProfileSettings: Setting external image URL');
            setImagePreview(data.profileImage);
            
            // Preload image
            const img = new Image();
            img.src = data.profileImage;
          } else {
            // Server-uploaded image - ensure we have the complete URL
            const baseUrl = getBaseUrl();
            const completeImageUrl = `${baseUrl}${data.profileImage}`;
            console.log('ProfileSettings: Setting server image URL:', completeImageUrl);
            setImagePreview(completeImageUrl);
            
            // Preload image
            const img = new Image();
            img.src = completeImageUrl;
            img.onload = () => console.log('ProfileSettings: Image preloaded successfully');
            img.onerror = (e) => console.error('ProfileSettings: Failed to preload image:', e);
          }
        } else {
          console.log('ProfileSettings: No profile image found');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('ProfileSettings: Failed to fetch user profile:', error);
        
        // More detailed error logging
        if (error.response) {
          console.error('ProfileSettings: Error response:', error.response.status, error.response.data);
        } else if (error.request) {
          console.error('ProfileSettings: No response received:', error.request);
        } else {
          console.error('ProfileSettings: Error setting up request:', error.message);
        }
        
        toast.error('Failed to load user profile');
        setLoading(false);
        
        // If unauthorized, redirect to login
        if (error.response && error.response.status === 401) {
          console.log('ProfileSettings: Unauthorized, redirecting to login');
          localStorage.removeItem('token');
          navigate('/signin');
        }
      }
    };
    
    // Check Supabase configuration
    const checkStorageConfig = async () => {
      try {
        const config = await checkSupabaseConfig();
        if (!config.success) {
          console.warn('Supabase storage configuration issue:', config.error);
          console.warn('Details:', config.details);
          
          // If the issue is missing configuration, log a more helpful message
          if (config.error?.includes('Missing Supabase configuration')) {
            console.warn(`
-------- SUPABASE CONFIGURATION ISSUE --------
The application is missing Supabase configuration values.
Please ensure you have the following environment variables set:

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

Current values:
URL: ${config.details.hasUrl ? '[SET]' : '[MISSING]'}
Key: ${config.details.hasKey ? '[SET]' : '[MISSING]'}

These should be set in your .env file in the client directory.
--------------------------------------------
            `);
          } else if (config.error?.includes('No write permission')) {
            console.warn(`
-------- SUPABASE PERMISSION ISSUE --------
The application doesn't have permission to write to the Supabase storage bucket.
Please check your Supabase storage bucket permissions in the Supabase dashboard:

1. Go to Storage > Buckets > profiles
2. Check the RLS (Row Level Security) policies
3. Ensure the bucket has a policy that allows uploads for authenticated users

You might need to add a policy like this:
- Operation: INSERT (create)
- FOR authenticated USERS
- WITH CHECK (true)
--------------------------------------------
            `);
          }
        } else {
          console.log('Supabase storage configuration verified:', config.details);
        }
      } catch (error) {
        console.error('Error checking Supabase configuration:', error);
      }
    };
    
    fetchUserProfile();
    checkStorageConfig();
  }, [navigate]);

  // Check for form changes
  useEffect(() => {
    const hasChanges = (
      user.firstName !== originalUser.firstName ||
      user.lastName !== originalUser.lastName ||
      selectedImage !== null
    );
    setHasFormChanges(hasChanges);
  }, [user.firstName, user.lastName, originalUser.firstName, originalUser.lastName, selectedImage]);

  // Close image options dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showImageOptions && !event.target.closest('.relative')) {
        setShowImageOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showImageOptions]);

  // Check password validation
  const isPasswordValid = () => {
    return (
      currentPassword.length > 0 &&
      newPassword.length >= 8 &&
      passwordErrors.uppercase &&
      passwordErrors.lowercase &&
      passwordErrors.number &&
      passwordErrors.specialChar &&
      passwordErrors.match
    );
  };

  // Toggle notification setting
  const toggleNotification = (setting) => {
    setNotifications(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  // Function to center and create an initial crop with aspect ratio
  const centerAspectCrop = (mediaWidth, mediaHeight, aspect) => {
    return centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect,
        mediaWidth,
        mediaHeight
      ),
      mediaWidth,
      mediaHeight
    );
  };
  
  // Handle image selection
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.match('image.*')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      console.log('Image selected:', { name: file.name, size: file.size, type: file.type });
      
      setSourceImageFile(file);
      
      // Reset crop state
      setCrop(undefined);
      setCompletedCrop(null);
      
      // Read and display the image
      const reader = new FileReader();
      reader.onload = (event) => {
        // Validate image dimensions
        const img = new Image();
        img.onload = () => {
          if (img.width < 100 || img.height < 100) {
            toast.error('Image dimensions are too small. Please select a larger image.');
            return;
          }
          
          setImgSrc(event.target.result);
          setShowCropModal(true);
        };
        img.onerror = () => {
          toast.error('Failed to load image. Please try another file.');
        };
        img.src = event.target.result;
      };
      
      reader.onerror = () => {
        toast.error('Failed to read file. Please try again.');
      };
      
      reader.readAsDataURL(file);
    }
  };

  // Remove profile image
  const handleRemoveImage = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete your profile photo?');
    
    if (!confirmed) {
      return; // User cancelled
    }
    
    try {
      console.log('Removing profile image');
      setFormSubmitting(true);
      
      await api.delete('/users/profile/image');
      
      setImagePreview(null);
      setSelectedImage(null);
      setCroppedImageUrl(null);
      setUser(prev => ({ ...prev, profileImage: '' }));
      
      // Dispatch custom event to notify navbar
      window.dispatchEvent(new CustomEvent('profileUpdated', {
        detail: { profileImage: '' }
      }));
      
      toast.success('Profile image removed successfully');
    } catch (error) {
      console.error('Failed to remove profile image:', error);
      toast.error('Failed to remove profile image');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Cropping functions
  const onImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImgRef(e.currentTarget);
    
    // Create a centered square crop that takes up 80% of the smaller dimension
    const cropSize = 80; // 80% in percentage units
    
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: cropSize,
        },
        1, // 1:1 aspect ratio for square
        naturalWidth,
        naturalHeight
      ),
      naturalWidth,
      naturalHeight
    );
    
    console.log('Initial crop set:', initialCrop);
    setCrop(initialCrop);
    setCompletedCrop(initialCrop); // Set completed crop immediately for preview
    
    return false;
  };

  // Update preview canvas when crop changes
  useEffect(() => {
    if (!completedCrop || !imgRef || !previewCanvasRef.current) {
      return;
    }

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Failed to get canvas context');
      return;
    }
    
    console.log('📸 Drawing preview with crop:', completedCrop);
    console.log('🖼️ Image dimensions:', {
      display: { width: imgRef.width, height: imgRef.height },
      natural: { width: imgRef.naturalWidth, height: imgRef.naturalHeight }
    });
    
    // completedCrop is now in pixels relative to the displayed image
    // We need to scale it to the natural image size
    const scaleX = imgRef.naturalWidth / imgRef.width;
    const scaleY = imgRef.naturalHeight / imgRef.height;
    
    const sourceX = completedCrop.x * scaleX;
    const sourceY = completedCrop.y * scaleY;
    const sourceWidth = completedCrop.width * scaleX;
    const sourceHeight = completedCrop.height * scaleY;
    
    console.log('🎯 Scaled crop for natural image:', {
      x: sourceX,
      y: sourceY,
      width: sourceWidth,
      height: sourceHeight
    });
    
    // Set canvas size to match the display size (128px as per new UI)
    const previewSize = 128;
    canvas.width = previewSize;
    canvas.height = previewSize;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create circular clip for profile photo
    ctx.save();
    ctx.beginPath();
    ctx.arc(previewSize / 2, previewSize / 2, previewSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    
    // Draw the cropped portion of the image from the natural-sized source
    try {
      ctx.drawImage(
        imgRef,
        sourceX,            // Source x (in natural image coordinates)
        sourceY,            // Source y
        sourceWidth,        // Source width
        sourceHeight,       // Source height
        0,                  // Dest x
        0,                  // Dest y
        previewSize,        // Dest width
        previewSize         // Dest height
      );
      console.log('✅ Preview drawn successfully');
    } catch (e) {
      console.error('❌ Error drawing preview:', e);
    }
    
    ctx.restore();
  }, [completedCrop, imgRef]);

  // Generate cropped image
  const getCroppedImg = async (image, pixelCrop) => {
    if (!image || !pixelCrop?.width || !pixelCrop?.height) {
      console.error('Invalid crop or image for cropping');
      return null;
    }
    
    console.log('✂️ Creating cropped image with crop parameters:', pixelCrop);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Could not get canvas context');
      return null;
    }
    
    // pixelCrop is now in pixels relative to the displayed image
    // Scale it to the natural image size (same as preview)
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    const sourceX = pixelCrop.x * scaleX;
    const sourceY = pixelCrop.y * scaleY;
    const sourceWidth = pixelCrop.width * scaleX;
    const sourceHeight = pixelCrop.height * scaleY;
    
    console.log('🎯 Scaled crop dimensions for natural image:', { 
      sourceX, 
      sourceY, 
      sourceWidth, 
      sourceHeight,
      imageNaturalWidth: image.naturalWidth,
      imageNaturalHeight: image.naturalHeight
    });
    
    // Ensure dimensions are valid
    if (sourceWidth <= 0 || sourceHeight <= 0) {
      console.error('Invalid crop dimensions: width or height is zero or negative');
      throw new Error('Invalid crop dimensions');
    }
    
    // Clamp values to image bounds
    const finalX = Math.max(0, Math.min(sourceX, image.naturalWidth));
    const finalY = Math.max(0, Math.min(sourceY, image.naturalHeight));
    const finalWidth = Math.min(sourceWidth, image.naturalWidth - finalX);
    const finalHeight = Math.min(sourceHeight, image.naturalHeight - finalY);
    
    console.log('📐 Final crop dimensions (clamped):', {
      x: finalX,
      y: finalY,
      width: finalWidth,
      height: finalHeight
    });
    
    // For profile images, use a fixed size (400px is good for profile pictures)
    const finalSize = 400;
    
    // Set canvas to final output size
    canvas.width = finalSize;
    canvas.height = finalSize;
    
    try {
      // Create circular clipping path first
      ctx.beginPath();
      ctx.arc(finalSize / 2, finalSize / 2, finalSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      
      // Draw the cropped portion directly to the circular canvas
      // This draws from the source image at natural resolution
      ctx.drawImage(
        image,
        finalX,          // Source X (from natural image)
        finalY,          // Source Y
        finalWidth,      // Source Width
        finalHeight,     // Source Height
        0,               // Dest X (fit to canvas)
        0,               // Dest Y
        finalSize,       // Dest Width (scale to final size)
        finalSize        // Dest Height
      );
      
      console.log('✅ Image drawn to canvas successfully');
      
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            console.error('Canvas is empty or toBlob not supported');
            reject(new Error('Failed to create image from canvas'));
            return;
          }
          
          // Create a new file with correct name and type
          try {
            const fileName = `profile-${Date.now()}.jpg`;
            const file = new File([blob], fileName, { 
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            const croppedImageUrl = URL.createObjectURL(blob);
            console.log('Successfully created cropped image', {
              fileName,
              fileSize: file.size,
              fileType: file.type
            });
            
            resolve({ file, url: croppedImageUrl });
          } catch (fileError) {
            console.error('Error creating File object:', fileError);
            
            // Fallback to just returning the blob and URL if File creation fails
            const croppedImageUrl = URL.createObjectURL(blob);
            resolve({ 
              file: blob, // Use blob directly as fallback
              url: croppedImageUrl 
            });
          }
        }, 'image/jpeg', 0.95);
      });
    } catch (drawError) {
      console.error('Error drawing image to canvas:', drawError);
      throw drawError;
    }
  };

  // Apply crop
  const applyCrop = async () => {
    try {
      if (!imgRef) {
        console.error('No image reference available');
        toast.error('Unable to crop image. Please try again.');
        return;
      }
      
      if (!completedCrop?.width || !completedCrop?.height) {
        console.error('Invalid crop dimensions:', completedCrop);
        toast.error('Please select an area to crop');
        return;
      }
      
      // Set loading state
      setIsCropping(true);
      
      // Show a loading toast
      const loadingToast = toast.loading('Processing image...');
      
      // Log the crop dimensions for debugging
      const pixelWidth = Math.round(completedCrop.width * imgRef.naturalWidth / 100);
      const pixelHeight = Math.round(completedCrop.height * imgRef.naturalHeight / 100);
      console.log('Applying crop with dimensions:', { 
        crop: completedCrop,
        percentages: `${completedCrop.width}% × ${completedCrop.height}%`,
        pixels: `${pixelWidth}px × ${pixelHeight}px`
      });
      
      try {
        const result = await getCroppedImg(imgRef, completedCrop);
        
        if (!result) {
          console.error('Crop operation returned no result');
          toast.error('Failed to crop image. Please try again.', { id: loadingToast });
          return;
        }
        
        const { file, url } = result;
        
        console.log('Crop applied successfully', { 
          fileSize: file.size,
          fileType: file.type,
          fileName: file.name,
          urlCreated: !!url
        });
        
        // Set the cropped image as the selected image and preview
        console.log('✂️ Setting cropped image as selected:', {
          fileSize: file.size,
          fileType: file.type,
          fileName: file.name,
          hasUrl: !!url
        });
        
        setSelectedImage(file);
        setCroppedImageUrl(url);
        setImagePreview(url);
        
        toast.dismiss(loadingToast);
        setShowCropModal(false);
      } catch (cropError) {
        console.error('Error in getCroppedImg:', cropError);
        
        // Try an alternative approach with a simpler crop if the first method failed
        try {
          console.log('Trying alternative crop method...');
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Could not get canvas context');
          }
          
          // Set canvas dimensions to a fixed size for the profile image
          canvas.width = 300;
          canvas.height = 300;
          
          // Calculate crop coordinates in pixels
          const scaleX = imgRef.naturalWidth / 100;
          const scaleY = imgRef.naturalHeight / 100;
          const sourceX = completedCrop.x * scaleX;
          const sourceY = completedCrop.y * scaleY;
          const sourceWidth = completedCrop.width * scaleX;
          const sourceHeight = completedCrop.height * scaleY;
          
          // Draw a circular crop
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
          ctx.clip();
          
          // Draw the image
          ctx.drawImage(
            imgRef,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, canvas.width, canvas.height
          );
          
          // Convert to blob
          canvas.toBlob((blob) => {
            if (!blob) {
              toast.error('Could not process image. Please try a different image.', { id: loadingToast });
              return;
            }
            
            const backupFile = new File([blob], 'profile-image.jpg', { type: 'image/jpeg' });
            const backupUrl = URL.createObjectURL(blob);
            
            console.log('Alternative crop successful', {
              fileSize: backupFile.size,
              fileType: backupFile.type
            });
            
            setSelectedImage(backupFile);
            setCroppedImageUrl(backupUrl);
            setImagePreview(backupUrl);
            
            toast.dismiss(loadingToast);
            setShowCropModal(false);
          }, 'image/jpeg', 0.95);
        } catch (backupError) {
          console.error('Both crop methods failed:', backupError);
          toast.error('Could not process image. Please try a different image.', { id: loadingToast });
        }
      }
    } catch (error) {
      console.error('Error in applyCrop:', error);
      toast.error('Failed to crop image. Please try again.');
    } finally {
      setIsCropping(false);
    }
  };

  // Handle main form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    
    try {
      // Validate form fields
      if (!user.firstName || !user.lastName) {
        toast.error('First name and last name are required');
        setFormSubmitting(false);
        return;
      }
      
      console.log('Submitting profile update');
      
      // Step 1: If there's an image, try to upload it to Supabase directly
      let profileImageUrl = user.profileImage;
      let imageUploadSuccess = true;
      
      if (selectedImage) {
        console.log('🖼️ Selected image detected for upload:', {
          hasFile: !!selectedImage,
          fileSize: selectedImage.size,
          fileType: selectedImage.type,
          fileName: selectedImage.name || 'No name',
          isBlob: selectedImage instanceof Blob,
          isFile: selectedImage instanceof File
        });
        
        // Validate the image before uploading
        if (!selectedImage.size || selectedImage.size === 0) {
          toast.error('Selected image is empty or invalid. Please try cropping again.');
          setFormSubmitting(false);
          return;
        }
        
        if (selectedImage.size > 10 * 1024 * 1024) {
          toast.error('Image is too large (max 10MB). Please select a smaller image.');
          setFormSubmitting(false);
          return;
        }
        
        // Show a toast for upload starting
        const uploadToast = toast.loading('Uploading profile image...');
        
        // First try Supabase direct upload
        try {
          console.log('📤 Starting Supabase upload...', {
            fileSize: selectedImage.size,
            fileType: selectedImage.type,
            fileName: selectedImage.name
          });
          
          // Create a fixed filename with timestamp
          const timestamp = Date.now();
          const extension = selectedImage.name?.split('.').pop() || 'jpg';
          const safeFilename = `profile-${timestamp}.${extension}`;
          
          // Upload the cropped image with a consistent name
          console.log('🚀 Calling uploadImage function with:', {
            file: selectedImage,
            bucket: 'profiles',
            filename: safeFilename
          });
          
          profileImageUrl = await uploadImage(selectedImage, 'profiles', safeFilename);
          
          console.log('✅ Image uploaded successfully to Supabase:', profileImageUrl);
          toast.dismiss(uploadToast);
        } catch (supabaseError) {
          console.error('Supabase upload failed, trying server fallback:', supabaseError);
          
          try {
            // Create form data for server upload fallback
            const formData = new FormData();
            formData.append('profileImage', selectedImage);
            
            // Use server-side upload as fallback
            const uploadResponse = await api.post('/users/upload-profile-image', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
            
            if (uploadResponse.data && uploadResponse.data.imageUrl) {
              profileImageUrl = uploadResponse.data.imageUrl;
              console.log('Image uploaded successfully via server fallback:', profileImageUrl);
              toast.dismiss(uploadToast);
            } else {
              throw new Error('Server did not return image URL');
            }
          } catch (serverError) {
            console.error('Both upload methods failed:', serverError);
            
            // Show appropriate error message
            if (supabaseError.message?.includes('JWT') || serverError.response?.status === 401) {
              toast.error('Authentication error. Please refresh the page and try again.', { id: uploadToast });
            } else if (supabaseError.message?.includes('permission')) {
              toast.error('Permission denied uploading image. Your profile info will still be updated.', { id: uploadToast });
            } else {
              toast.error('Failed to upload profile image. Your profile info will still be updated.', { id: uploadToast });
            }
            
            imageUploadSuccess = false;
          }
        }
      }
      
      // Step 2: Update user profile with the new image URL
      console.log('Updating profile with image URL:', profileImageUrl);
      
      const profileData = {
        firstName: user.firstName,
        lastName: user.lastName
      };
      
      // Only include profileImage if we have a URL and the upload was successful
      if (profileImageUrl && imageUploadSuccess) {
        profileData.profileImage = profileImageUrl;
        console.log('Adding profile image to update data:', profileImageUrl);
      }
      
      // Choose the appropriate endpoint based on image source
      let endpoint = '/users/profile';
      if (profileImageUrl && imageUploadSuccess && profileImageUrl.startsWith('http')) {
        endpoint = '/users/profile-external';
      }
      
      console.log(`Using ${endpoint} endpoint for profile update`);
      const { data } = await api.put(endpoint, profileData);
      console.log('Profile update response:', data);
      
      // Step 3: Update local state with the response
      const updatedUser = {
        ...data
      };
      
      // If we uploaded an image successfully, make sure to use that URL
      if (profileImageUrl && imageUploadSuccess) {
        updatedUser.profileImage = profileImageUrl;
      }
      
      setUser(updatedUser);
      setOriginalUser(updatedUser);
      setSelectedImage(null);
      
      // Set image preview to the profile image URL or the one we just uploaded
      setImagePreview(updatedUser.profileImage);
      
      // Dispatch custom event to notify navbar of profile image change
      window.dispatchEvent(new CustomEvent('profileUpdated', {
        detail: { 
          profileImage: updatedUser.profileImage,
          name: `${updatedUser.firstName} ${updatedUser.lastName}`
        }
      }));
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update failed:', error);
      
      // Better error handling
      if (error.response) {
        console.error('Server error response:', error.response.status, error.response.data);
        const errorMsg = error.response.data?.message || 'Failed to update profile';
        toast.error(errorMsg);
      } else if (error.request) {
        console.error('No response received from server');
        toast.error('Network error. Please check your connection and try again.');
      } else {
        console.error('Error details:', error.message);
        toast.error('Failed to update profile. Please try again.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  // Validate new password
  useEffect(() => {
    if (newPassword) {
      setPasswordErrors({
        length: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        lowercase: /[a-z]/.test(newPassword),
        number: /\d/.test(newPassword),
        specialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword),
        match: newPassword === confirmNewPassword && confirmNewPassword.length > 0
      });
    }
  }, [newPassword, confirmNewPassword]);

  // Handle password change form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordFormSubmitting(true);
    
    try {
      await api.put('/users/change-password', {
        oldPassword: currentPassword,
        newPassword: newPassword
      });
      
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      console.error('Failed to change password:', error);
      const errorMsg = error.response?.data?.message || 'Failed to change password';
      toast.error(errorMsg);
    } finally {
      setPasswordFormSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-sm min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Account settings</h2>
            <nav className="space-y-2">
              <button 
                onClick={() => setActiveSection('profile')} 
                className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                  activeSection === 'profile' 
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <svg className={`w-5 h-5 mr-3 ${activeSection === 'profile' ? 'text-blue-600' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Profile Settings
              </button>
              <button 
                onClick={() => setActiveSection('password')} 
                className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                  activeSection === 'password' 
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <svg className={`w-5 h-5 mr-3 ${activeSection === 'password' ? 'text-blue-600' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.65 10A5.002 5.002 0 0 0 3 12a5 5 0 0 0 9.65 2H17v2h2v-2h2v-4zM7 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                </svg>
                Password
              </button>
              <button 
                onClick={() => setActiveSection('notifications')} 
                className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                  activeSection === 'notifications' 
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <svg className={`w-5 h-5 mr-3 ${activeSection === 'notifications' ? 'text-blue-600' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M15.707 4.293a1 1 0 00-1.414 0l-5 5a1 1 0 001.414 1.414l5-5a1 1 0 000-1.414zM5 8a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd"/>
                  <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm2-1a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1H5z" clipRule="evenodd"/>
                </svg>
                Notifications
              </button>
              <button 
                onClick={() => setActiveSection('verification')} 
                className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                  activeSection === 'verification' 
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <svg className={`w-5 h-5 mr-3 ${activeSection === 'verification' ? 'text-blue-600' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Verification
              </button>
              <button 
                onClick={() => setActiveSection('privacy')} 
                className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                  activeSection === 'privacy' 
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <svg className={`w-5 h-5 mr-3 ${activeSection === 'privacy' ? 'text-blue-600' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                </svg>
                Privacy & Security
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-8 py-6">          
          {/* Profile Settings Form */}
          {activeSection === 'profile' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 max-w-2xl">
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); return false; }} className="space-y-6">
              {/* Profile Image Section */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div 
                    className="w-20 h-20 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700"
                    id="profileImageContainer"
                  >
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('ProfileSettings: Failed to load profile image:', e);
                          e.target.onerror = null;
                          setImagePreview(null);
                          toast.error("Couldn't load your profile image. Please try uploading a new one.");
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowImageOptions(!showImageOptions)}
                    className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                    </svg>
                  </button>
                  
                  {/* Image Options Dropdown */}
                  {showImageOptions && (
                    <div className="absolute top-full mt-2 left-0 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-2 z-10 min-w-[180px]">
                      {imagePreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowImageViewModal(true);
                            setShowImageOptions(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          <svg className="w-4 h-4 mr-3 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Profile Photo
                        </button>
                      )}
                      <label className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                        <svg className="w-4 h-4 mr-3 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {imagePreview ? 'Change Photo' : 'Upload Photo'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            handleImageChange(e);
                            setShowImageOptions(false);
                          }}
                          className="hidden"
                        />
                      </label>
                      {imagePreview && (
                        <button
                          type="button"
                          onClick={() => {
                            handleRemoveImage();
                            setShowImageOptions(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          <svg className="w-4 h-4 mr-3 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Avatar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={user.firstName || ''}
                    onChange={handleChange}
                    required
                    placeholder="First name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={user.lastName || ''}
                    onChange={handleChange}
                    required
                    placeholder="Last name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300"
                />
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={formSubmitting || !hasFormChanges}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                    hasFormChanges && !formSubmitting
                      ? 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      : 'text-gray-400 bg-gray-300 dark:bg-gray-600 dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <svg
                    className="w-4 h-4 mr-2 stroke-current"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7z" />
                    <path d="M17 3v4H7V3" />
                    <path d="M12 21v-6h4v6" />
                  </svg>
                  {formSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
            </div>
          )}

          {/* Password Change Section */}
          {activeSection === 'password' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 max-w-2xl">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Change Password</h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                
                {newPassword && (
                  <div className="mt-2 space-y-1 text-xs">
                    <div className={`flex items-center ${passwordErrors.length ? 'text-green-500' : 'text-gray-400'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {passwordErrors.length ? 
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : 
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        }
                      </svg>
                      At least 8 characters
                    </div>
                    <div className={`flex items-center ${passwordErrors.uppercase ? 'text-green-500' : 'text-gray-400'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {passwordErrors.uppercase ? 
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : 
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        }
                      </svg>
                      One uppercase letter
                    </div>
                    <div className={`flex items-center ${passwordErrors.lowercase ? 'text-green-500' : 'text-gray-400'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {passwordErrors.lowercase ? 
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : 
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        }
                      </svg>
                      One lowercase letter
                    </div>
                    <div className={`flex items-center ${passwordErrors.number ? 'text-green-500' : 'text-gray-400'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {passwordErrors.number ? 
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : 
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        }
                      </svg>
                      One number
                    </div>
                    <div className={`flex items-center ${passwordErrors.specialChar ? 'text-green-500' : 'text-gray-400'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {passwordErrors.specialChar ? 
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : 
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        }
                      </svg>
                      One special character (!@#$%)
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  className={`w-full px-3 py-2 border ${newPassword && !passwordErrors.match ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                />
                {newPassword && !passwordErrors.match && confirmNewPassword && (
                  <p className="mt-1 text-xs text-red-500">Passwords don't match</p>
                )}
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={passwordFormSubmitting || !isPasswordValid()}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                    isPasswordValid() && !passwordFormSubmitting
                      ? 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      : 'text-gray-400 bg-gray-300 dark:bg-gray-600 dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <svg
                    className={`w-4 h-4 mr-2 ${
                      isPasswordValid() && !passwordFormSubmitting ? 'text-white' : 'text-gray-400 dark:text-gray-500'
                    }`}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12.65 10A5.002 5.002 0 0 0 3 12a5 5 0 0 0 9.65 2H17v2h2v-2h2v-4zM7 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                  </svg>
                  {passwordFormSubmitting ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 max-w-2xl">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Notification Settings</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</p>
                  </div>
                  <CustomSwitch
                    id="email-notifications"
                    checked={notifications.email}
                    onChange={() => toggleNotification('email')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Push Notifications</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications in browser</p>
                  </div>
                  <CustomSwitch
                    id="push-notifications"
                    checked={notifications.push}
                    onChange={() => toggleNotification('push')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Code Snippet Updates</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when your snippets are shared or liked</p>
                  </div>
                  <CustomSwitch
                    id="snippet-notifications"
                    checked={notifications.snippetUpdates}
                    onChange={() => toggleNotification('snippetUpdates')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Security Alerts</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Important security and account notifications</p>
                  </div>
                  <CustomSwitch
                    id="security-notifications"
                    checked={notifications.securityAlerts}
                    onChange={() => toggleNotification('securityAlerts')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Verification Section */}
          {activeSection === 'verification' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 max-w-2xl">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Account Verification</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-green-800 dark:text-green-200">Email Verified</h4>
                      <p className="text-sm text-green-600 dark:text-green-300">{user.email}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                    Verified
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Two-Factor Authentication</h4>
                      <p className="text-sm text-yellow-600 dark:text-yellow-300">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <button className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700">
                    Enable 2FA
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Privacy & Security Section */}
          {activeSection === 'privacy' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 max-w-2xl">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Privacy & Security</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Profile Visibility</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="radio" name="visibility" className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" defaultChecked />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Public - Anyone can see your profile and snippets</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="visibility" className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Private - Only you can see your snippets</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Data Management</h4>
                  <div className="space-y-3">
                    <button className="flex items-center justify-between w-full p-3 text-left text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                      <span>Download Your Data</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    <button className="flex items-center justify-between w-full p-3 text-left text-sm text-red-600 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                      <span>Delete Account</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image View Modal */}
      {showImageViewModal && imagePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4" onClick={() => setShowImageViewModal(false)}>
          <div className="relative max-w-4xl max-h-screen" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setShowImageViewModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Image */}
            <img
              src={imagePreview}
              alt="Profile"
              className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
            />
            

          </div>
        </div>
      )}

      {/* Image Crop Modal - Simple YouTube Studio Style */}
      {showCropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="bg-gray-800 rounded-lg max-w-3xl w-full mx-4 shadow-2xl relative z-50">
            {/* Simple Header */}
            <div className="px-6 py-4 border-b border-gray-700 relative z-50 bg-gray-800">
              <h2 className="text-xl font-medium text-gray-200">
                Customize picture
              </h2>
            </div>
            
            {/* Simple Centered Crop Area */}
            <div className="p-6 flex items-center justify-center bg-gray-900 min-h-[500px] relative">
              <div className="max-w-full max-h-[500px]">
                {imgSrc && (
                  <ReactCrop
                    crop={crop}
                    onChange={(pixelCrop, percentCrop) => {
                      setCrop(percentCrop);
                    }}
                    onComplete={(pixelCrop, percentCrop) => {
                      setCompletedCrop(pixelCrop);
                    }}
                    aspect={1}
                    circularCrop
                  >
                    <img
                      src={imgSrc}
                      onLoad={onImageLoad}
                      alt="Crop preview"
                      className="max-w-full h-auto"
                      style={{ maxHeight: '450px', display: 'block' }}
                      onError={(e) => {
                        console.error('Failed to load image for cropping:', e);
                        toast.error('Failed to load image for cropping');
                        setShowCropModal(false);
                      }}
                    />
                  </ReactCrop>
                )}
              </div>
            </div>
            
            {/* Simple Footer */}
            <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3 relative z-50 bg-gray-800">
              <button
                type="button"
                onClick={() => setShowCropModal(false)}
                className="px-6 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyCrop}
                disabled={!completedCrop?.width || !completedCrop?.height || isCropping}
                className={`px-8 py-2 text-sm font-medium rounded transition-colors ${
                  !completedCrop?.width || !completedCrop?.height || isCropping
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isCropping ? 'Processing...' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}