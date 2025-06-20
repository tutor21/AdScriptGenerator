(function() {
  // This script represents the content of ads-loader.js that would be served from a CDN/server.
  // It's responsible for loading the ad display into the target page.

  // Retrieve script attributes from the current script tag itself
  // We need to iterate through all script tags to find the one that loaded THIS script
  let currentScript = null;
  const scripts = document.querySelectorAll('script[id^="adsense-sim-script-"]');
  for (let i = 0; i < scripts.length; i++) {
    // Check if this script's src matches the expected loader URL pattern
    // This is a heuristic and might need refinement in a real scenario
    const scriptSrc = scripts[i].getAttribute('src');
    if (scriptSrc && scriptSrc.includes('/ads-loader.js')) {
      currentScript = scripts[i];
      break;
    }
  }

  if (!currentScript) {
    console.error("AdSense Simulator: Loader script tag not found for dynamic loading.");
    return;
  }

  const embedLicense = currentScript.getAttribute('data-license');
  const embedSite = currentScript.getAttribute('data-site');
  const adContainerId = "ad-container-" + embedLicense; // Ensure container ID matches generated snippet

  // Ensure the ad-container div exists
  let container = document.getElementById(adContainerId);
  if (!container) {
    console.error("AdSense Simulator: Ad container div not found with ID:", adContainerId);
    // Attempt to create it if it doesn't exist, though it should be in the snippet
    container = document.createElement('div');
    container.id = adContainerId;
    container.className = "w-full flex justify-center items-center p-4 min-h-[200px]"; // Add basic styling
    document.body.appendChild(container); // Append to body if not found, or more strategically
  }

  // Function to load external scripts (Tailwind, React, ReactDOM)
  const loadScript = (url, type, onloadCallback) => {
    let script = document.querySelector(`script[src="${url}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = url;
      script.type = type;
      if (onloadCallback) {
        script.onload = () => {
          script.dataset.loaded = 'true'; // Mark as loaded
          onloadCallback();
        };
      }
      document.head.appendChild(script);
    } else if (onloadCallback) {
      // If script already exists, check if it's loaded, otherwise attach onload
      if (script.dataset.loaded === 'true') {
        onloadCallback();
      } else {
        script.onload = () => {
          script.dataset.loaded = 'true';
          onloadCallback();
        };
      }
    }
  };

  // This component simulates Google Shop product ads
  const AdDisplay = ({ config }) => {
    const [ads, setAds] = React.useState([]);

    React.useEffect(() => {
      // Simulate fetching related products
      const mockProducts = [
        { id: 1, name: "Ergonomic Office Chair", price: "$299.99", imageUrl: "https://placehold.co/100x100/007bff/ffffff?text=Chair" },
        { id: 2, name: "Smart Home Speaker", price: "$89.99", imageUrl: "https://placehold.co/100x100/28a745/ffffff?text=Speaker" },
        { id: 3, name: "Noise Cancelling Headphones", price: "$149.99", imageUrl: "https://placehold.co/100x100/ffc107/000000?text=Headphones" },
        { id: 4, name: "Wireless Mechanical Keyboard", price: "$119.99", imageUrl: "https://placehold.co/100x100/dc3545/ffffff?text=Keyboard" },
      ];
      // Randomize order for a "related search" feel
      setAds(mockProducts.sort(() => 0.5 - Math.random()).slice(0, 3)); // Show 3 random ads
    }, []);

    if (!config) {
      return <div className="text-gray-600">AdSense simulator: Configuration error.</div>;
    }

    return (
      <div className="font-sans w-full max-w-4xl mx-auto p-4 bg-white shadow-lg rounded-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm mr-2">Ad</span>
          Related Products
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {ads.map(ad => (
            <div key={ad.id} className="bg-gray-50 p-3 rounded-lg shadow-sm flex flex-col items-center text-center transition duration-300 ease-in-out transform hover:scale-105">
              <img src={ad.imageUrl} alt={ad.name} className="w-24 h-24 object-contain rounded-md mb-2 border border-gray-200 p-1" />
              <p className="text-gray-800 font-semibold text-lg">{ad.name}</p>
              <p className="text-blue-600 text-xl font-bold mt-1">{ad.price}</p>
              <button className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out shadow-md">
                Shop Now
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center mt-4">
          Disclaimer: This is a simulated ad display for demonstration purposes only and does not represent actual Google AdSense or Google Shop integration.
          Real integration requires proper API setup and adherence to Google's policies.
        </p>
      </div>
    );
  };

  // Function to initialize Firebase and render the AdDisplay
  const initializeAndRender = async () => {
    try {
      // Ensure Firebase config is available globally (from parent environment)
      const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

      if (!firebaseConfig.apiKey) {
         console.error("AdSense Simulator: Firebase config is missing. Cannot initialize Firebase.");
         container.innerHTML = '<div class="text-center text-gray-500">AdSense simulator: Missing Firebase config.</div>';
         return;
      }

      // Dynamically import Firebase modules
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js');
      const { getFirestore, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');
      const { createRoot } = await import('https://unpkg.com/react-dom/client');
      const React = await import('https://unpkg.com/react'); // Ensure React is loaded

      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);

      // Corrected document reference path: public/data/scripts
      const configDocRef = doc(db, `artifacts/${appId}/public/data/scripts/${embedLicense}`);
      const configSnap = await getDoc(configDocRef);

      if (configSnap.exists()) {
        const config = configSnap.data();
        const currentOrigin = window.location.origin.replace(/\/+$/, ''); // Remove trailing slash
        const targetOrigin = config.targetDomain.replace(/\/+$/, ''); // Remove trailing slash

        const expiry = new Date(config.expiryDate);
        const now = new Date();

        if (currentOrigin === targetOrigin && now < expiry) {
          const root = createRoot(document.getElementById(adContainerId));
          root.render(React.createElement(AdDisplay, { config }));
        } else {
          console.warn("AdSense simulator: Script conditions not met.");
          console.warn("Domain match:", currentOrigin === targetOrigin, "Current:", currentOrigin, "Target:", targetOrigin);
          console.warn("Expiry check:", now < expiry, "Now:", now.toISOString(), "Expiry:", expiry.toISOString());
          document.getElementById(adContainerId).innerHTML = '<div class="text-center text-gray-500">AdSense simulator: Script conditions not met (domain mismatch or expired).</div>';
        }
      } else {
        console.error("AdSense simulator: Configuration not found for license:", embedLicense);
        document.getElementById(adContainerId).innerHTML = '<div class="text-center text-gray-500">AdSense simulator: Configuration not found.</div>';
      }
    } catch (e) {
      console.error("AdSense simulator: Error loading configuration:", e);
      document.getElementById(adContainerId).innerHTML = '<div class="text-center text-gray-500">AdSense simulator: Error loading ads.</div>';
    }
  };

  // Load Tailwind CSS and then initialize/render
  loadScript("https://cdn.tailwindcss.com", "text/javascript", () => {
    // Mark Tailwind as loaded if it wasn't already
    const tailwindScript = document.querySelector('script[src="https://cdn.tailwindcss.com"]');
    if (tailwindScript) tailwindScript.dataset.loaded = 'true';

    initializeAndRender();
  });
})();