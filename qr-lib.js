(function () {
  const CDN_URL = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
  let loadingPromise = null;

  const load = () => {
    if (window.QRCode) return Promise.resolve();
    if (loadingPromise) return loadingPromise;

    loadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = CDN_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("QR library failed to load"));
      document.head.appendChild(script);
    });

    return loadingPromise;
  };

  const render = (el, value, options = {}) => {
    if (!window.QRCode) throw new Error("QRCode library not loaded");
    const config = {
      text: value,
      width: options.size || 220,
      height: options.size || 220,
      correctLevel: window.QRCode.CorrectLevel.M
    };
    return new window.QRCode(el, config);
  };

  window.QR_LIB = { load, render };
})();
