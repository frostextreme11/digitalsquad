import React, { useEffect, useRef, useState } from 'react';

interface TrackSectionProps {
    name: string;
    children: React.ReactNode;
    className?: string;
}

export function TrackSection({ name, children, className = '' }: TrackSectionProps) {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [hasTracked, setHasTracked] = useState(false);

    useEffect(() => {
        if (hasTracked) return; // Only track once

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting && !hasTracked) {
                    setHasTracked(true);

                    // 1. Log to console for easy monitoring
                    console.log(`👁️ Section Viewed: ${name}`);

                    // 2. Track on Google Ads Tag (gtag)
                    if (typeof window !== 'undefined' && (window as any).gtag) {
                        (window as any).gtag('event', 'section_viewed', {
                            event_category: 'engagement',
                            event_label: name,
                            section_name: name
                        });
                    }

                    // 3. Track on Meta Pixel (fbq)
                    if (typeof window !== 'undefined' && (window as any).fbq) {
                        (window as any).fbq('trackCustom', 'SectionViewed', {
                            section_name: name
                        });
                    }

                    observer.disconnect();
                }
            },
            {
                threshold: 0.3, // 30% visible to count as viewed
            }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [name, hasTracked]);

    return (
        <div ref={sectionRef} className={className}>
            {children}
        </div>
    );
}
