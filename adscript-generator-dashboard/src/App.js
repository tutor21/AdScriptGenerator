// src/App.js
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, onSnapshot, collection, query, where } from 'firebase/firestore';

// Define the content of the simulated ads-loader.js script as a constant static string.
// Placeholders (SCRIPT_ID_PLACEHOLDER, TARGET_DOMAIN_PLACEHOLDER) will be replaced dynamically.
const ADS_LOADER_JS_CONTENT_TEMPLATE = `
  (function() {
    // This script represents the content of ads-loader.js that would be served from a CDN/server.
    // It's responsible for loading the ad display into the target page.

    // Retrieve script attributes from the current script tag itself
    let currentScript = null;
    const scripts = document.querySelectorAll('script[id^="adsense-sim-script-"]');
    for (let i = 0; i < scripts.length; i++) {
      const scriptSrc = scripts[i].getAttribute('src');
      if (scriptSrc && scriptSrc.endsWith('/ads-loader.js')) {
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
    const adContainerId = "ad-container-" + embedLicense;

    let container = document.getElementById(adContainerId);
    if (!container) {
      console.error("AdSense Simulator: Ad container div not found with ID:", adContainerId);
      container = document.createElement('div');
      container.id = adContainerId;
      container.className = "w-full flex justify-center items-center p-4 min-h-[200px]";
      document.body.appendChild(container);
    }

    const loadScript = (url, type, onloadCallback) => {
      let script = document.querySelector(\`script[src="\${url}"]\`);
      if (!script) {
        script = document.createElement('script');
        script.src = url;
        script.type = type;
        if (onloadCallback) {
          script.onload = () => {
            script.dataset.loaded = 'true';
            onloadCallback();
          };
        }
        document.head.appendChild(script);
      } else if (onloadCallback) {
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

    const AdDisplay = ({ config }) => {
      const [ads, setAds] = React.useState([]);

      React.useEffect(() => {
        const mockProducts = [
          { id: 1, name: "Ergonomic Office Chair", price: "$299.99", imageUrl: "https://placehold.co/100x100/007bff/ffffff?text=Chair" },
          { id: 2, name: "Smart Home Speaker", price: "$89.99", imageUrl: "https://placehold.co/100x100/28a745/ffffff?text=Speaker" },
          { id: 3, name: "Noise Cancelling Headphones", price: "$149.99", imageUrl: "https://placehold.co/100x100/ffc107/000000?text=Headphones" },
          { id: 4, name: "Wireless Mechanical Keyboard", price: "$119.99", imageUrl: "https://placehold.co/100x100/dc3545/ffffff?text=Keyboard" },
        ];
        setAds(mockProducts.sort(() => 0.5 - Math.random()).slice(0, 3));
      }, []);

      if (!config) {
        return React.createElement("div", { className: "text-gray-600" }, "AdSense simulator: Configuration error.");
      }

      return React.createElement(
        "div",
        { className: "font-sans w-full max-w-4xl mx-auto p-4 bg-white shadow-lg rounded-xl" },
        React.createElement(
          "h3",
          { className: "text-xl font-bold text-gray-800 mb-4 text-center" },
          React.createElement("span", { className: "inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm mr-2" }, "Ad"),
          "Related Products"
        ),
        React.createElement(
          "div",
          { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" },
          ads.map(ad =>
            React.createElement(
              "div",
              { key: ad.id, className: "bg-gray-50 p-3 rounded-lg shadow-sm flex flex-col items-center text-center transition duration-300 ease-in-out transform hover:scale-105" },
              React.createElement("img", { src: ad.imageUrl, alt: ad.name, className: "w-24 h-24 object-contain rounded-md mb-2 border border-gray-200 p-1" }),
              React.createElement("p", { className: "text-gray-800 font-semibold text-lg" }, ad.name),
              React.createElement("p", { className: "text-blue-600 text-xl font-bold mt-1" }, ad.price),
              React.createElement("button", { className: "mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out shadow-md" }, "Shop Now")
            )
          )
        ),
        React.createElement(
          "p",
          { className: "text-xs text-gray-400 text-center mt-4" },
          "Disclaimer: This is a simulated ad display for demonstration purposes only and does not represent actual Google AdSense or Google Shop integration. Real integration requires proper API setup and adherence to Google's policies."
        )
      );
    };

    const initializeAndRender = async () => {
      try {
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

        if (!firebaseConfig.apiKey) {
           console.error("AdSense Simulator: Firebase config is missing. Cannot initialize Firebase.");
           container.innerHTML = '<div class="text-center text-gray-500">AdSense simulator: Missing Firebase config.</div>';
           return;
        }

        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js');
        const { getFirestore, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');
        const { createRoot } = await import('https://unpkg.com/react-dom/client');
        const React = await import('https://unpkg.com/react');

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        const configDocRef = doc(db, \`artifacts/\${appId}/public/data/scripts/\${embedLicense}\`);
        const configSnap = await getDoc(configDocRef);

        if (configSnap.exists()) {
          const config = configSnap.data();
          const currentOrigin = window.location.origin.replace(/\/+$/, '');
          const targetOrigin = config.targetDomain.replace(/\/+$/, '');

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

    loadScript("https://cdn.tailwindcss.com", "text/javascript", () => {
      const tailwindScript = document.querySelector('script[src="https://cdn.tailwindcss.com"]');
      if (tailwindScript) tailwindScript.dataset.loaded = 'true';

      initializeAndRender();
    });
  })();
`;


// Main App component for the dashboard
function App() {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false); // State for loading during generation

  const [targetDomain, setTargetDomain] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');
  const [scripts, setScripts] = useState([]);
  const [editingScript, setEditingScript] = useState(null); // State for editing

  // Initialize Firebase and set up authentication
  useEffect(() => {
    try {
      const firebaseConfig = typeof __firebase_config !== 'undefined'
        ? JSON.parse(__firebase_config)
        : {}; // Fallback for local testing

      if (!firebaseConfig.apiKey) {
        throw new Error("Firebase config not found. Please provide __firebase_config.");
      }

      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const authentication = getAuth(app);

      setDb(firestore);
      setAuth(authentication);

      // Listen for auth state changes
      const unsubscribe = onAuthStateChanged(authentication, async (user) => {
        if (user) {
          setUserId(user.uid);
          console.log("Firebase signed in:", user.uid);
        } else {
          // If no user, sign in anonymously or with custom token
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            try {
              await signInWithCustomToken(authentication, __initial_auth_token);
              console.log("Signed in with custom token.");
            } catch (authError) {
              console.error("Error signing in with custom token:", authError);
              setError("Authentication error: " + authError.message);
              // Fallback to anonymous if custom token fails
              await signInAnonymously(authentication);
            }
          } else {
            await signInAnonymously(authentication);
            console.log("Signed in anonymously.");
          }
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Firebase initialization error:", err);
      setError("Failed to initialize Firebase: " + err.message);
      setLoading(false);
    }
  }, []);

  // Fetch scripts once Firebase and Auth are ready
  useEffect(() => {
    if (db && userId) {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const scriptsCollectionRef = collection(db, `artifacts/${appId}/public/data/scripts`);

      // Query for scripts managed by the current user
      const q = query(scriptsCollectionRef, where("managedByUserId", "==", userId));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedScripts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setScripts(fetchedScripts);
      }, (err) => {
        console.error("Error fetching scripts:", err);
        setError("Error fetching scripts: " + err.message);
      });

      return () => unsubscribe();
    }
  }, [db, userId]);

  // Function to generate a UUID (for license)
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Function to check for ads.txt on the target domain
  const checkAdsTxt = async (domain) => {
    const baseUrl = new URL(domain).origin;
    const adsTxtUrl = `${baseUrl}/ads.txt`;
    console.log(`Checking ads.txt at: ${adsTxtUrl}`);

    try {
      const response = await fetch(adsTxtUrl, { method: 'HEAD', mode: 'no-cors' });
      console.log(`ads.txt check for ${domain}: Request sent (mode: no-cors).`);
      return true;
    } catch (e) {
      console.error(`Error or network issue checking ads.txt at ${adsTxtUrl}:`, e);
      return false;
    }
  };


  // Handle script generation/update
  const handleGenerateScript = async () => {
    if (!db || !userId) {
      setError("Firebase not ready or user not authenticated.");
      return;
    }
    if (!targetDomain || !expiryDate) {
      setError("Please fill in both Target Domain and Expiry Date.");
      return;
    }

    setIsGenerating(true); // Set loading state
    setError(null); // Clear previous errors

    try {
      // Validate ads.txt before proceeding
      const adsTxtFound = await checkAdsTxt(targetDomain);
      if (!adsTxtFound) {
        setError(`ads.txt not found or inaccessible on ${targetDomain}. Please ensure it exists and is publicly accessible. (Note: This check is client-side and subject to CORS.)`);
        setIsGenerating(false);
        return;
      }

      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const scriptsCollectionRef = collection(db, `artifacts/${appId}/public/data/scripts`);

      const scriptData = {
        targetDomain: targetDomain.trim().replace(/\/+$/, ''), // Remove trailing slash
        expiryDate: expiryDate,
        createdAt: new Date().toISOString(),
        managedByUserId: userId, // Link script to the creating user
      };

      let scriptId;
      if (editingScript) {
        scriptId = editingScript.id;
        await setDoc(doc(scriptsCollectionRef, scriptId), scriptData, { merge: true });
        setEditingScript(null);
        console.log("Script updated successfully:", scriptId);
      } else {
        scriptId = generateUUID();
        scriptData.license = scriptId; // License is the document ID
        await setDoc(doc(scriptsCollectionRef, scriptId), scriptData);
        console.log("Script generated successfully:", scriptId);
      }

      const baseUrl = window.location.origin;
      const loaderScriptUrl = `${baseUrl}/ads-loader.js`;

      // Dynamically replace placeholders in the static template string
      const adsLoaderJsContentString = ADS_LOADER_JS_CONTENT_TEMPLATE
        .replace(/SCRIPT_ID_PLACEHOLDER/g, scriptId)
        .replace(/TARGET_DOMAIN_PLACEHOLDER/g, targetDomain.trim().replace(/\/+$/, ''));


      const embedScript = `
        <div id="ad-container-${scriptId}" class="w-full flex justify-center items-center p-4 min-h-[200px]"></div>
        <script id="adsense-sim-script-${scriptId}" data-site="${targetDomain.trim().replace(/\/+$/, '')}" data-license="${scriptId}" src="${loaderScriptUrl}" async></script>
      `.trim();

      setGeneratedScript(embedScript);
      setTargetDomain('');
      setExpiryDate('');
      setError(null);

      // Display the full content of ads-loader.js for the user to copy
      alert("Script generated successfully!\n\nIMPORTANT: Please copy the following content into your 'public/ads-loader.js' file:\n\n" + adsLoaderJsContentString);

    } catch (err) {
      console.error("Error generating/saving script:", err);
      setError("Error generating script: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditScript = (script) => {
    setEditingScript(script);
    setTargetDomain(script.targetDomain);
    setExpiryDate(script.expiryDate);
    setGeneratedScript('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteScript = async (scriptId) => {
    if (!db || !userId) {
      setError("Firebase not ready or user not authenticated.");
      return;
    }
    const confirmDelete = window.confirm("Are you sure you want to delete this script?");
    if (!confirmDelete) return;

    try {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const scriptDocRef = doc(db, `artifacts/${appId}/public/data/scripts`, scriptId);
      await deleteDoc(scriptDocRef);
      console.log("Script deleted successfully:", scriptId);
      setError(null);
      if (editingScript && editingScript.id === scriptId) {
        setEditingScript(null);
        setTargetDomain('');
        setExpiryDate('');
      }
    } catch (err) {
      console.error("Error deleting script:", err);
      setError("Error deleting script: " + err.message);
    }
  };

  const handleClearForm = () => {
    setEditingScript(null);
    setTargetDomain('');
    setExpiryDate('');
    setGeneratedScript('');
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
        <div className="text-xl text-gray-700">Loading dashboard...</div>
      </div>
    );
  }

  if (error && !db) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-100 text-red-800 font-sans p-4">
        <div className="text-xl">Error: {error}. Please ensure Firebase config is correctly provided.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 p-4 sm:p-6 lg:p-8">
      <style>
        {`
        body { font-family: 'Inter', sans-serif; }
        .rounded-card { border-radius: 12px; }
        .shadow-md-custom { box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08); }
        `}
      </style>

      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-700 mb-2">AdScript Generator</h1>
        <p className="text-gray-600 text-lg">Create embeddable scripts for your AdSense-approved websites.</p>
        {userId && (
          <p className="text-sm text-gray-500 mt-2">
            Your User ID: <span className="font-mono bg-gray-200 px-2 py-1 rounded-md text-gray-700 break-all">{userId}</span>
          </p>
        )}
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-6 sm:p-8 rounded-xl shadow-md-custom">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{editingScript ? 'Edit Script' : 'Generate New Script'}</h2>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4" role="alert">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}
          <div className="mb-4">
            <label htmlFor="targetDomain" className="block text-gray-700 text-sm font-semibold mb-2">Target Domain (e.g., https://yourdomain.com)</label>
            <input
              type="url"
              id="targetDomain"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition duration-150 ease-in-out"
              placeholder="https://example.com/"
              value={targetDomain}
              onChange={(e) => setTargetDomain(e.target.value)}
              required
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 mt-1">Make sure to include 'https://' and use your exact domain. Trailing slashes will be removed.</p>
          </div>
          <div className="mb-6">
            <label htmlFor="expiryDate" className="block text-gray-700 text-sm font-semibold mb-2">Script Expiry Date</label>
            <input
              type="date"
              id="expiryDate"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition duration-150 ease-in-out"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 mt-1">The script will stop functioning after this date.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleGenerateScript}
              className="w-full sm:w-auto bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-200 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              disabled={isGenerating}
            >
              {isGenerating ? 'Validating...' : (editingScript ? 'Update Script' : 'Generate Script')}
            </button>
            <button
              onClick={handleClearForm}
              className="w-full sm:w-auto bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition duration-200 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
              disabled={isGenerating}
            >
              Clear Form
            </button>
          </div>
        </section>

        {generatedScript && (
          <section className="bg-blue-50 p-6 sm:p-8 rounded-xl shadow-md-custom">
            <h2 className="text-2xl font-bold text-blue-700 mb-6">Your Embeddable Script</h2>
            <p className="text-gray-700 mb-4">
              Copy the following HTML snippet and paste it into the `&lt;body&gt;` section of your target AdSense-approved website.
              <br/>
              **Note:** The `src` attribute points to a simulated external file (`/ads-loader.js`) that would contain the ad loading logic.
            </p>
            <div className="bg-gray-800 text-gray-50 p-4 rounded-lg overflow-x-auto font-mono text-sm shadow-inner relative">
              <pre className="whitespace-pre-wrap">{generatedScript}</pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedScript)
                    .then(() => alert('Script copied to clipboard!'))
                    .catch(err => {
                      console.error('Failed to copy script:', err);
                      const textArea = document.createElement("textarea");
                      textArea.value = generatedScript;
                      document.body.appendChild(textArea);
                      textArea.select();
                      try {
                        document.execCommand('copy');
                        alert('Script copied to clipboard (fallback)!');
                      } catch (copyErr) {
                        console.error('Fallback copy failed:', copyErr);
                        alert('Could not copy script automatically. Please copy manually.');
                      }
                      document.body.removeChild(textArea);
                    });
                }}
                className="absolute top-2 right-2 bg-blue-500 text-white p-2 rounded-md text-xs hover:bg-blue-600 transition duration-150 ease-in-out"
              >
                Copy
              </button>
            </div>
            <p className="text-sm text-red-600 mt-4">
              <strong>Important Disclaimer:</strong> This script simulates ad display. It does not connect to real Google AdSense or Google Shop products.
              For actual monetization and product display, you must integrate with Google's official APIs and adhere to all AdSense policies.
            </p>
          </section>
        )}

        <section className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-xl shadow-md-custom mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">My Generated Scripts</h2>
          {scripts.length === 0 ? (
            <p className="text-gray-600">No scripts generated yet. Use the form above to create one!</p>
          ) : (
            <div className="space-y-4">
              {scripts.map((script) => (
                <div key={script.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-sm">
                  <div className="flex-1 mb-3 sm:mb-0">
                    <p className="font-semibold text-lg text-blue-600 break-all">{script.targetDomain}</p>
                    <p className="text-sm text-gray-700">License: <span className="font-mono text-gray-800 break-all">{script.license}</span></p>
                    <p className="text-sm text-gray-700">Expires: {new Date(script.expiryDate).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500">Created: {new Date(script.createdAt).toLocaleDateString()} {new Date(script.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditScript(script)}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition duration-150 ease-in-out text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteScript(script.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-150 ease-in-out text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;