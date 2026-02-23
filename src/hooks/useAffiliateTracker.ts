import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAffiliateTracker() {
  useEffect(() => {
    const track = async () => {
      const params = new URLSearchParams(window.location.search)
      const ref = params.get('ref')

      if (ref) {
        // Save to localStorage safely
        try {
          localStorage.setItem('affiliate_ref', ref)
        } catch (e) {
          console.warn('localStorage access denied')
        }

        // Log visit safely
        let sessionLogged = false
        try {
          sessionLogged = !!sessionStorage.getItem('visit_logged_' + ref)
        } catch (e) {
          console.warn('sessionStorage access denied')
        }

        if (!sessionLogged) {
          try {
            // Get IP and Location
            const response = await fetch('https://ipapi.co/json/')
            const data = await response.json()

            const location = data.city ? `${data.city}, ${data.region || ''}, ${data.country_name}` : 'Unknown Location'

            await supabase.from('visits').insert({
              affiliate_code: ref,
              user_agent: navigator.userAgent,
              visitor_ip: data.ip,
              location: location
            })

            try { sessionStorage.setItem('visit_logged_' + ref, 'true') } catch (e) { }
          } catch (error) {
            // Fallback if IP/Location fetch fails
            console.error('Error tracking visit:', error)
            await supabase.from('visits').insert({
              affiliate_code: ref,
              user_agent: navigator.userAgent
            })
            try { sessionStorage.setItem('visit_logged_' + ref, 'true') } catch (e) { }
          }
        }
      }
    }
    track()
  }, [])
}
