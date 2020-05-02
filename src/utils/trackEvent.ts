declare global {
  interface Window {
    analytics: any
  }
}

const trackEvent = (eventName: string, properties: { category: string }) => {
  if (window.analytics) {
    window.analytics.track(eventName, properties)
  }
}

export default trackEvent
