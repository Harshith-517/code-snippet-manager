// Theme switcher utility for favicons and logos
export const updateThemeAssets = (isDarkMode) => {
  const theme = isDarkMode ? 'dark' : 'light';
  
  // Update favicons
  document.querySelectorAll('link[rel="icon"]').forEach(link => {
    const href = link.getAttribute('href');
    if (href) {
      link.href = href.replace(/(light|dark)/, theme);
    }
  });

  // Update manifest theme color
  const themeColor = isDarkMode ? '#000000' : '#ffffff';
  document.querySelector('meta[name="theme-color"]').content = themeColor;
  
  // Update manifest
  const manifest = document.querySelector('link[rel="manifest"]');
  if (manifest) {
    const manifestData = {
      ...manifest,
      background_color: themeColor,
      theme_color: themeColor,
      icons: [
        {
          src: `/favicon/${theme}/favicon_io/android-chrome-192x192.png`,
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: `/favicon/${theme}/favicon_io/android-chrome-512x512.png`,
          sizes: "512x512",
          type: "image/png"
        },
        {
          src: `/logo/${theme}/logo.svg`,
          sizes: "any",
          type: "image/svg+xml",
          purpose: "any"
        }
      ]
    };
    
    // Update manifest file (Note: This will only work during development)
    if (process.env.NODE_ENV === 'development') {
      try {
        const manifestString = JSON.stringify(manifestData, null, 2);
        localStorage.setItem('app-manifest', manifestString);
      } catch (error) {
        console.warn('Could not update manifest in development mode:', error);
      }
    }
  }
};