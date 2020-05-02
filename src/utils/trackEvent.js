const trackEvent = (eventName, properties) => {
  if (window.analytics) {
    window.analytics.track(eventName, properties)
  }
}

export default trackEvent
