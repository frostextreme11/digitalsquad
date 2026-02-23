import { useEffect, useRef } from 'react';

export function useSectionTracking() {
    const trackedSections = useRef<Set<string>>(new Set());

    useEffect(() => {
        // Create an intersection observer
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    // If the section is at least 50% visible on screen
                    if (entry.isIntersecting) {
                        const sectionName = entry.target.getAttribute('data-track-section');

                        // Only track each section once per page load to avoid spamming analytics
                        if (sectionName && !trackedSections.current.has(sectionName)) {
                            trackedSections.current.add(sectionName);

                            // 1. Log to console for easy debugging
                            console.log(`👁️ Section Viewed: ${sectionName}`);

                            // 2. Send to Google Ads / Google Analytics (gtag) if available
                            if (typeof window !== 'undefined' && (window as any).gtag) {
                                (window as any).gtag('event', 'section_viewed', {
                                    event_category: 'engagement',
                                    event_label: sectionName,
                                    section_name: sectionName
                                });
                            }

                            // 3. Send to Meta Pixel (fbq) if available
                            if (typeof window !== 'undefined' && (window as any).fbq) {
                                (window as any).fbq('trackCustom', 'SectionViewed', {
                                    section_name: sectionName
                                });
                            }
                        }
                    }
                });
            },
            {
                threshold: 0.5, // 50% of the section must be visible to count as "viewed"
            }
        );

        // Find all sections that have the 'data-track-section' attribute
        const sections = document.querySelectorAll('[data-track-section]');
        sections.forEach((section) => {
            observer.observe(section);
        });

        // Cleanup observer on unmount
        return () => {
            sections.forEach((section) => {
                observer.unobserve(section);
            });
            observer.disconnect();
        };
    }, []); // Run once on mount

    return null;
}
