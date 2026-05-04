import { useEffect } from 'react';

/**
 * Optional: VITE_PLAUSIBLE_DOMAIN=flowseekerlab.io (no protocol)
 * Optional: VITE_GA_MEASUREMENT_ID=G-XXXXXXXX (GA4)
 */
function Analytics() {
  useEffect(() => {
    const plausibleDomain = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
    if (plausibleDomain && typeof document !== 'undefined') {
      const s = document.createElement('script');
      s.defer = true;
      s.dataset.domain = plausibleDomain;
      s.src = 'https://plausible.io/js/script.js';
      document.head.appendChild(s);
    }

    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (gaId && /^G-[A-Z0-9]+$/i.test(gaId) && typeof document !== 'undefined') {
      const ext = document.createElement('script');
      ext.async = true;
      ext.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(ext);
      const inline = document.createElement('script');
      inline.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}', { anonymize_ip: true });
      `;
      document.head.appendChild(inline);
    }
  }, []);

  return null;
}

export default Analytics;
