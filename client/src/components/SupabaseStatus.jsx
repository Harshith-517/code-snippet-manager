import React, { useState, useEffect } from 'react';
import { checkSupabaseConfig, runSupabaseDiagnostics } from '../utils/supabaseClient';

const SupabaseStatus = ({ retry }) => {
  const [status, setStatus] = useState({
    checking: true,
    success: false,
    error: null,
    details: null
  });
  
  const [showDetails, setShowDetails] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  
  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const results = await runSupabaseDiagnostics();
      setDiagnostics(results);
      setShowDiagnostics(true);
    } catch (error) {
      console.error('Error running diagnostics:', error);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };
  
  const handleRetry = async () => {
    console.log('🔄 Retrying Supabase connection check...');
    
    // Reset state completely to force fresh check
    setStatus({
      checking: true,
      success: false,
      error: null,
      details: null
    });
    setDiagnostics(null);
    setShowDetails(false);
    setShowDiagnostics(false);
    
    // Small delay to ensure state is cleared
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      if (typeof retry === 'function') {
        retry();
      }
      
      console.log('🔍 Running fresh configuration check...');
      const config = await checkSupabaseConfig();
      console.log('✅ Configuration check result:', config);
      
      setStatus({
        checking: false,
        success: config.success,
        error: config.error || null,
        details: config.details || null
      });
      
      // If successful, also refresh diagnostics
      if (config.success) {
        console.log('✨ Success! Running diagnostics...');
        await handleRunDiagnostics();
      }
    } catch (error) {
      console.error('❌ Error retrying:', error);
      setStatus({
        checking: false,
        success: false,
        error: 'Retry failed',
        details: error
      });
    }
  };
  
  const handleCreateBucket = () => {
    // Open Supabase dashboard to storage page
    const projectRef = 'lbsfaiujcqlqizitloes'; // Extracted from URL
    window.open(
      `https://app.supabase.com/project/${projectRef}/storage/buckets`,
      '_blank'
    );
  };
  
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const config = await checkSupabaseConfig();
        setStatus({
          checking: false,
          success: config.success,
          error: config.error || null,
          details: config.details || null
        });
      } catch (error) {
        console.error('Error checking Supabase configuration:', error);
        setStatus({
          checking: false,
          success: false,
          error: 'Unexpected error checking configuration',
          details: error
        });
      }
    };
    
    checkStatus();
  }, []);
  
  if (status.checking) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mt-4 animate-pulse">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 mr-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Checking storage configuration...</p>
        </div>
      </div>
    );
  }
  
  if (status.success) {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg mt-4">
        <div className="flex items-center">
          <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
          </svg>
          <p className="text-sm text-green-800 dark:text-green-300">Storage service is properly configured</p>
          
          <button 
            className="ml-auto text-xs text-green-600 dark:text-green-400 hover:underline"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide details' : 'Show details'}
          </button>
        </div>
        
        {showDetails && status.details && (
          <div className="mt-2 text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 p-2 rounded">
            <div><strong>Available buckets:</strong> {status.details.buckets?.join(', ') || 'None'}</div>
            <div><strong>Profiles bucket:</strong> {status.details.hasProfilesBucket ? 'Available' : 'Not found'}</div>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mt-4">
      <div className="flex items-center">
        <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
        </svg>
        <p className="text-sm text-red-800 dark:text-red-300 flex-1">Storage configuration issue: {status.error}</p>
        
        <button 
          className="ml-2 text-xs text-red-600 dark:text-red-400 hover:underline"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide' : 'Show'} details
        </button>
      </div>
      
      {showDetails && status.details && (
        <div className="mt-2 text-xs text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40 p-2 rounded">
          <pre className="whitespace-pre-wrap overflow-auto max-h-48">
            {typeof status.details === 'object' 
              ? JSON.stringify(status.details, null, 2) 
              : String(status.details)}
          </pre>
          
          {status.details.troubleshootingSteps && (
            <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
              <div className="font-semibold mb-2">Troubleshooting Steps:</div>
              <ol className="list-decimal list-inside space-y-1">
                {status.details.troubleshootingSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          )}
          
          {status.details.possibleCauses && (
            <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
              <div className="font-semibold mb-2">Possible Causes:</div>
              <ul className="list-disc list-inside space-y-1">
                {status.details.possibleCauses.map((cause, index) => (
                  <li key={index}>{cause}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Special message for missing bucket */}
      {status.error?.includes('bucket does not exist') && (
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h5 className="text-sm font-bold text-yellow-800 dark:text-yellow-300 mb-1">
                📦 Storage Bucket Missing
              </h5>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-2">
                The "profiles" storage bucket doesn't exist in your Supabase project. You can either:
              </p>
              <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1 mb-2">
                <li><strong>Option 1:</strong> Click "Retry Connection" - the app will try to create it automatically</li>
                <li><strong>Option 2:</strong> Create it manually in the Supabase dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={handleRetry}
          disabled={status.checking}
          className={`px-3 py-1.5 text-xs rounded transition-colors ${
            status.checking 
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {status.checking ? 'Checking...' : 'Retry Connection'}
        </button>
        
        <button
          onClick={handleRunDiagnostics}
          disabled={isRunningDiagnostics}
          className={`px-3 py-1.5 text-xs rounded transition-colors ${
            isRunningDiagnostics 
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
        >
          {isRunningDiagnostics ? 'Running...' : 'Run Full Diagnostics'}
        </button>
        
        {status.error?.includes('bucket does not exist') && (
          <button
            onClick={handleCreateBucket}
            className="px-3 py-1.5 text-xs rounded bg-green-500 hover:bg-green-600 text-white transition-colors"
          >
            Open Supabase Storage →
          </button>
        )}
        
        {diagnostics && (
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="px-3 py-1.5 text-xs rounded bg-purple-500 hover:bg-purple-600 text-white transition-colors"
          >
            {showDiagnostics ? 'Hide' : 'Show'} Diagnostics
          </button>
        )}
      </div>
      
      {/* Diagnostics results */}
      {showDiagnostics && diagnostics && (
        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border border-red-200 dark:border-red-700">
          <div className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
            Diagnostic Results ({diagnostics.summary.overallStatus})
          </div>
          <div className="text-xs mb-3">
            Passed: {diagnostics.summary.passed} | 
            Failed: {diagnostics.summary.failed} | 
            Warnings: {diagnostics.summary.warnings}
          </div>
          
          <div className="space-y-2">
            {diagnostics.checks.map((check, index) => (
              <div key={index} className={`p-2 rounded ${
                check.status === 'passed' ? 'bg-green-50 dark:bg-green-900/20' :
                check.status === 'failed' ? 'bg-red-50 dark:bg-red-900/20' :
                'bg-yellow-50 dark:bg-yellow-900/20'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{check.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    check.status === 'passed' ? 'bg-green-200 text-green-800' :
                    check.status === 'failed' ? 'bg-red-200 text-red-800' :
                    'bg-yellow-200 text-yellow-800'
                  }`}>
                    {check.status}
                  </span>
                </div>
                <pre className="text-xs mt-1 text-gray-700 dark:text-gray-300 overflow-auto max-h-32">
                  {JSON.stringify(check.details, null, 2)}
                </pre>
              </div>
            ))}
          </div>
          
          {/* Special fix guide for signature verification errors */}
          {diagnostics.checks.some(c => 
            c.status === 'failed' && 
            (c.details?.error?.includes('signature verification') || c.details?.errorName === 'StorageApiError')
          ) && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h5 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">
                    🔧 How to Fix: API Key Mismatch
                  </h5>
                  <ol className="list-decimal list-inside text-xs text-blue-700 dark:text-blue-400 space-y-1.5">
                    <li>
                      Open{' '}
                      <a 
                        href="https://app.supabase.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline font-medium hover:text-blue-900 dark:hover:text-blue-200"
                      >
                        app.supabase.com
                      </a>
                      {' '}in a new tab
                    </li>
                    <li>Select your project: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">lbsfaiujcqlqizitloes</code></li>
                    <li>Go to <strong>Settings</strong> → <strong>API</strong></li>
                    <li>Find and copy the <strong>"anon public"</strong> key</li>
                    <li>Open <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">client/.env</code></li>
                    <li>Replace the entire <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> value</li>
                    <li>Save and restart your development server</li>
                  </ol>
                  <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded text-xs">
                    <strong>⚠️ Common Mistakes:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      <li>Copying the service_role key instead of anon key</li>
                      <li>Adding extra spaces or line breaks when pasting</li>
                      <li>Not restarting the dev server after changing .env</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupabaseStatus;