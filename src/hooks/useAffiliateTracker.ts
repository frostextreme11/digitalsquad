import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAffiliateTracker() {
  useEffect(() => {
    const track = async () => {
      const params = new URLSearchParams(window.location.search)
      const ref = params.get('ref')
      
      if (ref) {
        // Save to localStorage
        localStorage.setItem('affiliate_ref', ref)
        
        // Log visit
        const sessionLogged = sessionStorage.getItem('visit_logged_' + ref)
        if (!sessionLogged) {
            await supabase.from('visits').insert({
                affiliate_code: ref,
                user_agent: navigator.userAgent
            })
            sessionStorage.setItem('visit_logged_' + ref, 'true')
        }
      }
    }
    track()
  }, [])
}
