export const PIXEL_ID = '1172148028339626' // Replace with your actual Pixel ID

export const trackEvent = (name: string, data = {}) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', name, data)
    }
}
