import React, { useEffect, useState } from 'react';

const ADS_LOADER_JS_CONTENT = `
  (function() {
    var script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456';
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
    console.log('AdSense script loaded via ADS_LOADER_JS_CONTENT.');
    // Example: Push an ad unit if adsbygoogle is defined
    script.onload = () => {
      if (window.adsbygoogle && window.adsbygoogle.push) {
        window.adsbygoogle.push({});
      }
    };
  })();
`;

// App component
const App = () => {
  const [loadingScript, setLoadingScript] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [message, setMessage] = useState('');

  // Function to load the ad script dynamically
  const loadAdScript = () => {
    if (!loadingScript && !scriptLoaded) {
      setLoadingScript(true);
      setMessage('Loading ad script...');

      try {
        // Create a script element
        const script = document.createElement('script');
        script.type = 'text/javascript';

        // Set the script's content using the ADS_LOADER_JS_CONTENT string
        script.innerHTML = ADS_LOADER_JS_CONTENT;

        // Append the script to the document body or head
        document.body.appendChild(script);

        script.onload = () => {
          setLoadingScript(false);
          setScriptLoaded(true);
          setMessage('Ad script loaded successfully!');
          console.log('Script tag successfully appended and executed.');
        };

        script.onerror = (e) => {
          setLoadingScript(false);
          setMessage('Failed to load ad script. Check console for details.');
          console.error('Error loading ad script:', e);
        };
      } catch (error) {
        setLoadingScript(false);
        setMessage(`An error occurred: ${error.message}`);
        console.error('Error during script creation/append:', error);
      }
    } else if (scriptLoaded) {
      setMessage('Ad script is already loaded.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Ad Loader Example</h1>
        <p className="text-gray-700 mb-6">
          This application demonstrates how to dynamically load an ad script by embedding its content directly.
        </p>
        <button
          onClick={loadAdScript}
          disabled={loadingScript || scriptLoaded}
          className={`px-6 py-3 rounded-full text-lg font-semibold transition-all duration-300
            ${loadingScript || scriptLoaded
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
            }`}
        >
          {loadingScript ? 'Loading...' : scriptLoaded ? 'Script Loaded' : 'Load Ad Script'}
        </button>
        {message && (
          <p className={`mt-4 text-sm ${scriptLoaded ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
          <p>
            <strong>Note:</strong> This is a conceptual example. In a real application, you'd replace the placeholder
            `ADS_LOADER_JS_CONTENT` with your actual ad network's JavaScript code. The script attempts to load a dummy
            AdSense script for demonstration.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;