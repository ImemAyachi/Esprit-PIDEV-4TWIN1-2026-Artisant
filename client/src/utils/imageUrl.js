export const getImageUrl = (input) => {
    if (!input) return '';
    
    // Handle if input is an object with a url property
    let url = typeof input === 'string' ? input : input.url;
    
    if (!url || typeof url !== 'string') return '';
    if (url.startsWith('http')) return url;

    // Fallback to local server address if VITE_API_URL is not set or relative
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const baseUrl = apiBase.split('/api')[0];

    // Ensure we don't end up with professional double slashes or missing ones
    // and that the path starts with /
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;

    return `${baseUrl}${cleanUrl}`;
};
