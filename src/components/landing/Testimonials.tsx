import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react'

const testimonials = [
  { id: 1, name: "Rizky Pratama", earning: "Mahasiswa", video: "https://res.cloudinary.com/dusyghcnl/video/upload/v1764416382/rizky_pratama_baru_lulus_sma_uevvir.mp4" },
  { id: 2, name: "Siti Aminah", earning: "Ibu Rumah Tangga", video: "https://res.cloudinary.com/dusyghcnl/video/upload/v1764416364/siti_aminah_anak_4_gqdibx.mp4" },
  { id: 3, name: "Nabilah", earning: "Anak SMA", video: "https://res.cloudinary.com/dusyghcnl/video/upload/v1764416389/nabilah_16_tahun_um8cim.mp4" },
  { id: 4, name: "Faris", earning: "Mahasiswa", video: "https://res.cloudinary.com/dusyghcnl/video/upload/v1764416397/Mahasiswa_kuliah_bn0oql.mp4" },
  { id: 5, name: "Budi Santoso", earning: "Ojek Online", video: "https://res.cloudinary.com/dusyghcnl/video/upload/v1764416373/budi_santoso_umur_35_dzra2t.mp4" },
  { id: 6, name: "Farah", earning: "Anak SMP", video: "https://res.cloudinary.com/dusyghcnl/video/upload/v1764416795/Digen_video_1764413365349_wluu8e.mp4" },
]

const CARD_WIDTH_DESKTOP = 320
const CARD_WIDTH_MOBILE = 280
const GAP = 24

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const sectionRef = useRef<HTMLElement>(null)
  const [isInView, setIsInView] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const [xOffset, setXOffset] = useState(0)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!isClient) return
    const cardWidth = isMobile ? CARD_WIDTH_MOBILE : CARD_WIDTH_DESKTOP
    const newOffset = isMobile
      ? -(activeIndex * (cardWidth + GAP)) + (window.innerWidth / 2 - cardWidth / 2) - 20
      : -(activeIndex * (cardWidth + GAP)) + (window.innerWidth / 2 - cardWidth / 2)
    setXOffset(newOffset)
  }, [activeIndex, isMobile, isClient])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
        if (!entry.isIntersecting) {
          // Pause all when out of view
          videoRefs.current.forEach(v => v?.pause())
        }
      },
      { threshold: 0.4 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return

      if (index === activeIndex && isInView) {
        // Enforce muted state from component state
        // If isMuted is false (default), this sets muted=false
        video.muted = isMuted;

        const playPromise = video.play()
        if (playPromise !== undefined) {
          playPromise.catch((e) => {
            // If autoplay fails (e.g. browser policy), we capture it but DO NOT FALLBACK TO MUTED
            // This ensures if it plays, it plays with sound.
            // It will remain paused until user interaction.
            console.log("Autoplay with sound blocked. Waiting for interaction.", e);
          })
        }
      } else {
        video.pause()
        if (index !== activeIndex) {
          video.currentTime = 0
        }
      }
    })
  }, [activeIndex, isInView, isMuted])

  const handleVideoEnd = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }

  const handleCardClick = (index: number) => {
    setActiveIndex(index)
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  }

  const cardWidth = isMobile ? CARD_WIDTH_MOBILE : CARD_WIDTH_DESKTOP

  return (
    <section ref={sectionRef} className="py-24 bg-slate-950 overflow-hidden relative">
      {/* Background Elements for style */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="container mx-auto px-4 mb-16 relative z-10">
        <h1 className="text-center text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Jangan Percaya Kata Kami
        </h1>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
          Tapi Kata Mereka yang Udah Cuan!
        </h2>
        <p className="text-center text-slate-400 text-lg max-w-2xl mx-auto">
          Ribuan member telah membuktikan keberhasilan metode kami. Tonton testimoni asli tanpa rekayasa.
        </p>
      </div>

      <div className="relative w-full flex flex-col items-center justify-center min-h-[500px] z-10">

        {/* Carousel Track */}
        <div className="w-full h-[500px] relative flex items-center">
          <motion.div
            className="absolute left-0 flex items-center pl-4 md:pl-0"
            animate={{ x: xOffset }}
            transition={{ type: "spring", stiffness: 200, damping: 25, mass: 0.5 }}
            style={{ gap: GAP }}
          >
            {testimonials.map((t, i) => {
              const isActive = i === activeIndex
              return (
                <motion.div
                  key={t.id}
                  onClick={() => handleCardClick(i)}
                  animate={{
                    scale: isActive ? 1 : 0.85,
                    opacity: isActive ? 1 : 0.4,
                    y: isActive ? 0 : 20,
                  }}
                  className={`relative rounded-3xl overflow-hidden shadow-2xl bg-slate-900 group shrink-0 cursor-pointer border-[3px] transition-all duration-300 ${isActive ? 'border-green-500 shadow-green-500/20' : 'border-slate-800'}`}
                  style={{
                    width: cardWidth,
                    aspectRatio: '9/16',
                    willChange: 'transform, opacity'
                  }}
                >
                  {/* Video Layer */}
                  <div className="w-full h-full relative bg-black">
                    <video
                      ref={(el) => { videoRefs.current[i] = el }}
                      src={t.video}
                      preload={isActive ? "auto" : "none"}
                      className="w-full h-full object-cover scale-[1.15]"
                      onEnded={isActive ? handleVideoEnd : undefined}
                      playsInline
                    // Removed muted prop to let useEffect control it completely
                    />

                    {/* Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 opacity-90"></div>

                    {/* Content Info */}
                    <div className="absolute bottom-0 left-0 w-full p-6 z-20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                          Verified Member
                        </span>
                      </div>
                      <p className="text-white font-bold text-xl leading-tight mb-1 text-shadow-sm">{t.name}</p>
                      <p className="text-slate-300 text-sm font-medium flex items-center gap-2">
                        {t.earning}
                      </p>
                    </div>

                    {/* Mute Toggle (Only on active) */}
                    {isActive && (
                      <button
                        onClick={toggleMute}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-colors z-30"
                      >
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                      </button>
                    )}
                  </div>

                  {/* Inactive overlay */}
                  {!isActive && <div className="absolute inset-0 bg-slate-950/60 z-30 backdrop-blur-[1px]" />}
                </motion.div>
              )
            })}
          </motion.div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-8 z-20">
          <button
            onClick={handlePrev}
            className="p-4 rounded-full bg-slate-800/50 hover:bg-green-500 hover:text-white text-slate-300 border border-slate-700 hover:border-green-500 transition-all duration-300 backdrop-blur-sm group"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={handleNext}
            className="p-4 rounded-full bg-slate-800/50 hover:bg-green-500 hover:text-white text-slate-300 border border-slate-700 hover:border-green-500 transition-all duration-300 backdrop-blur-sm group"
            aria-label="Next testimonial"
          >
            <ChevronRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

      </div>
    </section>
  )
}
