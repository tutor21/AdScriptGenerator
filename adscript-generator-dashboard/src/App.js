// Inside your App.js, within the handleGenerateScript function:
const baseUrl = window.location.origin; // This will be your Vercel deployment URL
const embedScript = `
  <div id="ad-container-${scriptId}" class="w-full flex justify-center items-center p-4 min-h-[200px]"></div>
  <script id="adsense-sim-script-${scriptId}" data-site="${targetDomain.trim().replace(/\/+$/, '')}" data-license="${scriptId}" src="${baseUrl}/ads-loader.js" async></script>
`.trim();