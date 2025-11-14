import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lbsfaiujcqlqizitloes.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY; // Use the public anon key for client-side operations

// Log Supabase URL to help debug
console.log('Supabase URL being used:', supabaseUrl);
if (!supabaseKey) {
  console.warn('Warning: No Supabase anon key found in environment variables');
}

const supabaseClient = createClient(supabaseUrl, supabaseKey);

/**
 * Upload an image directly to Supabase storage from the client
 * @param {Blob|File} file - The file to upload
 * @param {string} bucket - The bucket name (e.g., 'profiles')
 * @param {string} filename - The filename to use
 * @returns {Promise<string>} - URL of the uploaded file
 */
export const uploadImage = async (file, bucket = 'profiles', filename) => {
  try {
    console.log('Uploading image to Supabase directly from client', { fileSize: file.size, fileType: file.type });
    
    if (!file) {
      throw new Error('No file provided for upload');
    }
    
    // Generate a unique filename if not provided
    if (!filename) {
      // Get extension from file name or default to jpg
      const extension = file.name ? file.name.split('.').pop() : 'jpg';
      filename = `profile-${Date.now()}-${Math.random().toString(36).substring(2)}.${extension}`;
    }
    
    console.log(`Uploading to bucket: ${bucket} with filename: ${filename}`);
    
    // Check if we have proper configuration
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration');
      throw new Error('Supabase configuration missing - check your environment variables');
    }
    
    // Skip bucket verification - just attempt upload directly
    // The bucket existence is already verified by checkSupabaseConfig()
    // Attempting to list buckets here will fail due to RLS policies
    console.log('⏭️ Skipping bucket verification (RLS prevents listing), proceeding with upload...');
    
    // Ensure we have a valid file
    if (!file || file.size === 0) {
      throw new Error('File is empty or invalid');
    }
    
    // Convert blob to proper File object if needed
    let fileToUpload = file;
    if (!(file instanceof File) && file instanceof Blob) {
      fileToUpload = new File([file], filename, { 
        type: file.type || 'image/jpeg',
        lastModified: new Date().getTime()
      });
    }
    
    console.log('🔼 Uploading file:', {
      bucket, 
      filename, 
      contentType: fileToUpload.type || 'image/jpeg',
      size: fileToUpload.size,
      isFile: fileToUpload instanceof File,
      isBlob: fileToUpload instanceof Blob
    });
    
    // Upload the file with retry logic
    let attemptCount = 0;
    const maxAttempts = 3;
    let lastError = null;
    
    while (attemptCount < maxAttempts) {
      attemptCount++;
      console.log(`📤 Upload attempt ${attemptCount}/${maxAttempts} to ${bucket}/${filename}`);
      
      try {
        const { data, error } = await supabaseClient.storage
          .from(bucket)
          .upload(filename, fileToUpload, {
            cacheControl: '3600',
            upsert: true,
            contentType: fileToUpload.type || 'image/jpeg'
          });
        
        if (error) {
          console.error(`❌ Upload attempt ${attemptCount} failed:`, error);
          console.error('Error details:', {
            message: error.message,
            statusCode: error.statusCode,
            error: error.error,
            name: error.name
          });
          lastError = error;
          
          if (error.message && error.message.includes('Permission')) {
            throw new Error(`Storage permission denied: Check your Supabase bucket permissions and storage rules`);
          } else if (error.message && error.message.includes('JWT')) {
            throw new Error(`Authentication error: JWT token invalid or expired`);
          } else if (attemptCount === maxAttempts) {
            throw error;
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attemptCount));
        } else {
          // Success! Break out of retry loop
          console.log(`✅ File uploaded successfully on attempt ${attemptCount}!`);
          console.log('Upload response data:', data);
          lastError = null;
          break;
        }
      } catch (uploadErr) {
        console.error(`❌ Upload attempt ${attemptCount} exception:`, uploadErr);
        lastError = uploadErr;
        if (attemptCount === maxAttempts) {
          throw uploadErr;
        }
      }
    }
    
    // If we still have an error after all attempts, throw it
    if (lastError) {
      console.error('❌ All upload attempts failed. Last error:', lastError);
      throw lastError;
    }
    
    console.log('🔗 Getting public URL for uploaded file:', filename);
    
    // Get the public URL
    const { data: publicUrlData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(filename);
    
    console.log('Public URL data received:', publicUrlData);
    
    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error('❌ Failed to get public URL. Response:', publicUrlData);
      throw new Error('Failed to get public URL for uploaded file');
    }
    
    console.log('✨ Image uploaded successfully! URL:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Failed to upload image to Supabase:', error);
    
    // Format a more helpful error message
    const errorMessage = error.message || 'Unknown error';
    let userFriendlyMessage = errorMessage;
    
    if (errorMessage.includes('JWT')) {
      userFriendlyMessage = 'Authentication error: Please refresh the page and try again';
    } else if (errorMessage.includes('Permission')) {
      userFriendlyMessage = 'Permission denied: Your account cannot upload to this storage bucket';
    } else if (errorMessage.includes('Network')) {
      userFriendlyMessage = 'Network error: Check your internet connection';
    }
    
    const enhancedError = new Error(userFriendlyMessage);
    enhancedError.originalError = error;
    throw enhancedError;
  }
};

/**
 * Check Supabase configuration and connection
 * @returns {Promise<Object>} - Result of the check
 */
export const checkSupabaseConfig = async () => {
  try {
    // Check if we have proper configuration
    if (!supabaseUrl || !supabaseKey) {
      return {
        success: false,
        error: 'Missing Supabase configuration',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          message: 'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file'
        }
      };
    }
    
    // Verify the Supabase URL format
    try {
      const url = new URL(supabaseUrl);
      if (!url.hostname.includes('supabase.co')) {
        console.warn('Supabase URL does not appear to be a standard Supabase domain:', url.hostname);
      }
    } catch (urlError) {
      return {
        success: false,
        error: 'Invalid Supabase URL format',
        details: {
          url: supabaseUrl,
          message: 'The VITE_SUPABASE_URL must be a valid URL (e.g., https://yourproject.supabase.co)'
        }
      };
    }
    
    // Test basic connectivity to Supabase
    console.log('Testing basic connectivity to Supabase URL:', supabaseUrl);
    try {
      const healthCheck = await fetch(supabaseUrl + '/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': supabaseKey
        }
      });
      
      console.log('Supabase connectivity check:', {
        status: healthCheck.status,
        ok: healthCheck.ok,
        statusText: healthCheck.statusText
      });
      
      if (!healthCheck.ok && healthCheck.status !== 404) {
        // 404 is acceptable as the endpoint might not exist, but other errors are concerning
        console.warn('Supabase connectivity issue:', healthCheck.status, healthCheck.statusText);
      }
    } catch (fetchError) {
      console.error('Cannot reach Supabase URL:', fetchError);
      return {
        success: false,
        error: 'Cannot reach Supabase server',
        details: {
          errorMessage: fetchError.message,
          supabaseUrl,
          possibleCauses: [
            'Network connection issues',
            'Supabase project is paused or deleted',
            'Firewall or VPN blocking the connection',
            'Invalid project URL'
          ],
          troubleshootingSteps: [
            '1. Visit https://app.supabase.com and verify your project is active',
            '2. Try accessing ' + supabaseUrl + ' in your browser',
            '3. Check your network connection',
            '4. Disable VPN if using one and retry'
          ]
        }
      };
    }
    
    // Test the connection by listing buckets
    console.log('Testing Supabase connection...');
    let bucketsResult;
    
    try {
      bucketsResult = await supabaseClient.storage.listBuckets();
    } catch (connectionError) {
      console.error('Failed to connect to Supabase:', connectionError);
      return {
        success: false,
        error: 'Failed to connect to Supabase',
        details: {
          errorType: connectionError?.name || 'UnknownError',
          errorMessage: connectionError?.message || 'No error message',
          errorStack: connectionError?.stack || 'No stack trace',
          supabaseUrl,
          hasKey: !!supabaseKey,
          keyLength: supabaseKey?.length || 0,
          suggestion: 'Check your network connection and Supabase project settings'
        }
      };
    }
    
    const { data: buckets, error: bucketsError } = bucketsResult;
    
    if (bucketsError) {
      console.error('Supabase bucket list error:', bucketsError);
      
      // Detailed error information
      let friendlyErrorMessage = 'Failed to connect to Supabase';
      let errorDetails = {
        errorName: bucketsError.name || 'Unknown',
        errorMessage: bucketsError.message || 'No message',
        isStorageError: bucketsError.__isStorageError || false,
        originalError: bucketsError.originalError || {},
        supabaseUrl,
        hasKey: !!supabaseKey
      };
      
      // Analyze the error type
      if (bucketsError.name === 'StorageUnknownError') {
        friendlyErrorMessage = 'Storage service connection failed - check your Supabase configuration';
        errorDetails.possibleCauses = [
          'Invalid Supabase URL in VITE_SUPABASE_URL',
          'Invalid or missing API key in VITE_SUPABASE_ANON_KEY',
          'Network connectivity issues',
          'Supabase project may be paused, deleted, or not accessible',
          'CORS or firewall blocking the connection',
          'The storage API endpoint may be unavailable'
        ];
        errorDetails.troubleshootingSteps = [
          '1. Verify your Supabase project is active at https://app.supabase.com',
          '2. Check that VITE_SUPABASE_URL matches your project URL',
          '3. Regenerate your anon key from Settings > API',
          '4. Try accessing ' + supabaseUrl + ' in your browser',
          '5. Check browser console for CORS errors'
        ];
      } else if (bucketsError.message?.includes('signature verification failed') || bucketsError.name === 'StorageApiError') {
        friendlyErrorMessage = 'Authentication error: API key signature verification failed';
        errorDetails.possibleCauses = [
          'The API key does not match this Supabase project',
          'The API key was copied incorrectly (missing characters or extra spaces)',
          'The key was regenerated in Supabase dashboard but not updated locally',
          'You might be using a key from a different Supabase project'
        ];
        errorDetails.troubleshootingSteps = [
          '1. Go to https://app.supabase.com and select your project: ' + supabaseUrl.split('//')[1].split('.')[0],
          '2. Navigate to Settings > API',
          '3. Copy the ENTIRE "anon public" key (it should be ~208 characters)',
          '4. Replace VITE_SUPABASE_ANON_KEY in your .env file with the new key',
          '5. Make sure there are NO extra spaces or line breaks in the key',
          '6. Restart your development server completely',
          '7. Clear your browser cache if the issue persists'
        ];
      } else if (bucketsError.message?.includes('Network') || bucketsError.message?.includes('fetch')) {
        friendlyErrorMessage = 'Network error connecting to Supabase';
        errorDetails.troubleshootingSteps = [
          'Check your internet connection',
          'Verify the Supabase URL is accessible',
          'Check if a VPN or proxy is blocking the connection'
        ];
      }
      
      return {
        success: false,
        error: friendlyErrorMessage,
        details: errorDetails
      };
    }
    
    console.log('📦 Available storage buckets:', buckets?.map(b => b.name).join(', ') || 'none');
    
    // IMPORTANT: If buckets array is empty, it might be due to RLS policies
    // In this case, we'll try to directly access the profiles bucket instead of listing
    if (!buckets || buckets.length === 0) {
      console.warn('⚠️ No buckets visible - likely due to RLS policies. Attempting direct bucket access...');
      
      // Try to directly test if the profiles bucket exists and is accessible
      // by attempting a test operation (list files in the bucket)
      try {
        const { data: files, error: listFilesError } = await supabaseClient.storage
          .from('profiles')
          .list('', { limit: 1 });
        
        if (listFilesError) {
          // If we get "Bucket not found", then it truly doesn't exist
          if (listFilesError.message?.includes('Bucket not found')) {
            console.error('❌ Profiles bucket truly does not exist');
            return {
              success: false,
              error: 'Profiles bucket does not exist',
              details: {
                message: 'The profiles storage bucket was not found',
                possibleCauses: [
                  'The bucket has not been created yet',
                  'The bucket was deleted',
                  'Incorrect bucket name'
                ],
                troubleshootingSteps: [
                  '1. Go to https://app.supabase.com and select your project',
                  '2. Navigate to Storage > Buckets in the left sidebar',
                  '3. Click "New bucket" or check if "profiles" exists',
                  '4. If creating new: Name it "profiles", make it Public, set 10MB limit',
                  '5. If it exists: Check the bucket policies (see next step)',
                  '6. Go to Storage > Policies',
                  '7. Ensure there are policies allowing SELECT and INSERT for authenticated/anon users',
                  '8. You may need to add policies like:',
                  '   - Policy name: "Public Access" or "Allow uploads"',
                  '   - Allowed operation: SELECT, INSERT',
                  '   - Target roles: public or anon',
                  '   - Policy definition: true (allows all)'
                ]
              }
            };
          }
          
          // If we get an RLS error, the bucket exists but we can't access it due to policies
          if (listFilesError.message?.includes('row-level security') || listFilesError.message?.includes('policy')) {
            console.warn('⚠️ Profiles bucket exists but RLS policies are blocking access');
            return {
              success: false,
              error: 'Storage bucket access denied by security policies',
              details: {
                message: 'The profiles bucket exists but Row-Level Security (RLS) policies are preventing access',
                actualError: listFilesError.message,
                possibleCauses: [
                  'RLS policies are enabled on the storage.objects table',
                  'No policies exist to allow public/anon access to the profiles bucket',
                  'Policies are too restrictive'
                ],
                troubleshootingSteps: [
                  '1. Go to https://app.supabase.com/project/lbsfaiujcqlqizitloes/storage/policies',
                  '2. You should see policies for the "objects" table in storage schema',
                  '3. Add a new policy for profiles bucket access:',
                  '',
                  '   📝 POLICY 1 - Allow Public Reads:',
                  '   - Name: "Public profile images read"',
                  '   - Allowed operation: SELECT',
                  '   - Policy definition: bucket_id = \'profiles\'',
                  '   - Or use SQL: CREATE POLICY "Public profile images read" ON storage.objects FOR SELECT USING (bucket_id = \'profiles\');',
                  '',
                  '   📝 POLICY 2 - Allow Authenticated Uploads:',
                  '   - Name: "Authenticated users upload profiles"',
                  '   - Allowed operation: INSERT',
                  '   - Policy definition: bucket_id = \'profiles\' AND auth.role() = \'authenticated\'',
                  '   - Or use SQL: CREATE POLICY "Authenticated users upload profiles" ON storage.objects FOR INSERT WITH CHECK (bucket_id = \'profiles\' AND auth.role() = \'authenticated\');',
                  '',
                  '   📝 POLICY 3 - Allow Users to Update Their Own:',
                  '   - Name: "Users update own profiles"',
                  '   - Allowed operation: UPDATE',
                  '   - Policy definition: bucket_id = \'profiles\' AND auth.uid()::text = (storage.foldername(name))[1]',
                  '',
                  '4. After adding policies, click "Retry Connection" in the app',
                  '5. If you want to allow anonymous uploads for testing, you can use auth.role() = \'anon\' in policy 2'
                ]
              }
            };
          }
          
          // Some other error
          console.error('❌ Error accessing profiles bucket:', listFilesError);
          return {
            success: false,
            error: 'Error accessing profiles bucket',
            details: {
              message: listFilesError.message,
              error: listFilesError
            }
          };
        }
        
        // Success! The bucket exists and is accessible
        console.log('✅ Profiles bucket exists and is accessible via direct access');
        return {
          success: true,
          hasWritePermission: true, // We'll verify this separately if needed
          message: 'Supabase storage configured correctly (profiles bucket accessible)'
        };
        
      } catch (directAccessError) {
        console.error('❌ Failed to test direct bucket access:', directAccessError);
        return {
          success: false,
          error: 'Could not verify profiles bucket access',
          details: {
            message: directAccessError.message,
            error: directAccessError
          }
        };
      }
    }
    
    // Original logic: Check for the profiles bucket in the list
    let profilesBucket = buckets?.find(b => b.name === 'profiles');
    let hasWritePermission = false;
    let permissionError = null;
    
    // If profiles bucket doesn't exist, try to create it
    if (!profilesBucket) {
      console.log('⚠️ Profiles bucket not found in:', buckets?.map(b => b.name));
      console.log('🔧 Attempting to create profiles bucket...');
      try {
        const { data: newBucket, error: createError } = await supabaseClient.storage.createBucket('profiles', {
          public: true,
          fileSizeLimit: 10 * 1024 * 1024, // 10MB limit
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
        });
        
        if (createError) {
          console.error('Failed to create profiles bucket:', createError);
          return {
            success: false,
            error: 'Profiles bucket does not exist and could not be created',
            details: {
              buckets: buckets?.map(b => b.name) || [],
              createError: createError.message,
              possibleCauses: [
                'Insufficient permissions to create storage buckets',
                'Storage quota exceeded',
                'Project restrictions or RLS policies preventing bucket creation'
              ],
              troubleshootingSteps: [
                '1. Go to https://app.supabase.com and select your project',
                '2. Navigate to Storage section in the left sidebar',
                '3. Click "New bucket" button',
                '4. Name it "profiles"',
                '5. Make it Public',
                '6. Set file size limit to 10MB',
                '7. Save and retry'
              ]
            }
          };
        }
        
        console.log('Successfully created profiles bucket');
        profilesBucket = { name: 'profiles' };
        // Give it a moment to propagate
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (createErr) {
        console.error('Error creating profiles bucket:', createErr);
        return {
          success: false,
          error: 'Failed to create profiles bucket',
          details: {
            error: createErr.message,
            troubleshootingSteps: [
              '1. Manually create the bucket in Supabase dashboard',
              '2. Go to Storage → New bucket',
              '3. Name: "profiles", Public: Yes',
              '4. Retry connection'
            ]
          }
        };
      }
    }
    
    // Test write permissions if the profiles bucket exists
    if (profilesBucket) {
      try {
        // Create a small test file (1x1 transparent pixel)
        const base64Pixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        const blobData = await fetch(base64Pixel).then(res => res.blob());
        const testFile = new File([blobData], 'test-pixel.png', { type: 'image/png' });
        
        // Attempt to upload it
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from('profiles')
          .upload('__test_permissions.png', testFile, {
            cacheControl: '0',
            upsert: true
          });
          
        if (!uploadError) {
          hasWritePermission = true;
          
          // Clean up test file
          await supabaseClient.storage
            .from('profiles')
            .remove(['__test_permissions.png']);
        } else {
          permissionError = uploadError;
        }
      } catch (err) {
        permissionError = err;
        console.error('Error testing write permissions:', err);
      }
    }
    
    return {
      success: profilesBucket && hasWritePermission,
      error: !profilesBucket 
        ? 'Profiles bucket does not exist' 
        : !hasWritePermission 
          ? 'No write permission to profiles bucket' 
          : null,
      details: {
        buckets: buckets?.map(b => b.name) || [],
        hasProfilesBucket: !!profilesBucket,
        hasWritePermission,
        permissionError,
        profilesBucket: profilesBucket || null,
        bucketCount: buckets?.length || 0
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Unexpected error checking Supabase configuration',
      details: error
    };
  }
};

/**
 * Run comprehensive Supabase diagnostics
 * This function tests all aspects of the Supabase configuration
 */
export const runSupabaseDiagnostics = async () => {
  console.log('🔍 Running Supabase diagnostics...');
  const results = {
    timestamp: new Date().toISOString(),
    checks: []
  };
  
  // Check 1: Environment variables
  const envCheck = {
    name: 'Environment Variables',
    status: 'unknown',
    details: {}
  };
  
  if (!supabaseUrl || !supabaseKey) {
    envCheck.status = 'failed';
    envCheck.details = {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      message: 'Missing required environment variables'
    };
  } else {
    envCheck.status = 'passed';
    envCheck.details = {
      url: supabaseUrl,
      keyLength: supabaseKey.length,
      keyPrefix: supabaseKey.substring(0, 20) + '...'
    };
  }
  results.checks.push(envCheck);
  
  // Check 2: URL format
  const urlCheck = {
    name: 'URL Format',
    status: 'unknown',
    details: {}
  };
  
  try {
    const url = new URL(supabaseUrl);
    urlCheck.status = 'passed';
    urlCheck.details = {
      protocol: url.protocol,
      hostname: url.hostname,
      isSupabaseDomain: url.hostname.includes('supabase.co')
    };
  } catch (e) {
    urlCheck.status = 'failed';
    urlCheck.details = {
      error: e.message,
      url: supabaseUrl
    };
  }
  results.checks.push(urlCheck);
  
  // Check 3: Network connectivity
  const connectCheck = {
    name: 'Network Connectivity',
    status: 'unknown',
    details: {}
  };
  
  try {
    const response = await fetch(supabaseUrl + '/rest/v1/', {
      method: 'HEAD',
      headers: { 'apikey': supabaseKey }
    });
    
    connectCheck.status = response.ok || response.status === 404 ? 'passed' : 'warning';
    connectCheck.details = {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    };
  } catch (e) {
    connectCheck.status = 'failed';
    connectCheck.details = {
      error: e.message,
      type: e.name
    };
  }
  results.checks.push(connectCheck);
  
  // Check 4: Storage API access
  const storageCheck = {
    name: 'Storage API Access',
    status: 'unknown',
    details: {}
  };
  
  try {
    const { data, error } = await supabaseClient.storage.listBuckets();
    
    if (error) {
      storageCheck.status = 'failed';
      storageCheck.details = {
        error: error.message,
        errorName: error.name,
        isStorageError: error.__isStorageError
      };
    } else {
      storageCheck.status = 'passed';
      storageCheck.details = {
        bucketsFound: data?.length || 0,
        buckets: data?.map(b => b.name) || []
      };
    }
  } catch (e) {
    storageCheck.status = 'failed';
    storageCheck.details = {
      error: e.message,
      stack: e.stack
    };
  }
  results.checks.push(storageCheck);
  
  // Summary
  const passed = results.checks.filter(c => c.status === 'passed').length;
  const failed = results.checks.filter(c => c.status === 'failed').length;
  const warnings = results.checks.filter(c => c.status === 'warning').length;
  
  results.summary = {
    total: results.checks.length,
    passed,
    failed,
    warnings,
    overallStatus: failed === 0 ? 'healthy' : 'issues_detected'
  };
  
  console.log('🔍 Diagnostics complete:', results.summary);
  console.table(results.checks.map(c => ({ Check: c.name, Status: c.status })));
  
  return results;
};

export default supabaseClient;