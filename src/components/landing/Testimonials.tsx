import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

const testimonials = [
  { id: 1, name: "Budi Santoso", earning: "10 Juta", video: "https://assets.mixkit.co/videos/preview/mixkit-man-working-on-his-laptop-308-large.mp4" },
  { id: 2, name: "Siti Aminah", earning: "5 Juta", video: "https://assets.mixkit.co/videos/preview/mixkit-young-woman-working-on-laptop-in-cafe-1559-large.mp4" },
  { id: 3, name: "Rizky Pratama", earning: "15 Juta", video: "https://assets.mixkit.co/videos/preview/mixkit-man-under-multicolored-lights-1237-large.mp4" },
]

const VideoCard = ({ data }: { data: any, index: number }) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(e => console.log("Autoplay prevented", e))
          } else {
            videoRef.current?.pause()
          }
        })
      },
      { threshold: 0.5 }
    )

    if (videoRef.current) {
      observer.observe(videoRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[9/16] bg-black group"
    >
      <div className="absolute inset-0 bg-black/20 z-10"></div>
      <video 
        ref={videoRef}
        src={data.video} 
        className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition duration-700"
        loop 
        muted 
        playsInline
      />
      <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/60 to-transparent z-20">
        <p className="text-white font-bold text-xl mb-1">{data.name}</p>
        <p className="text-green-400 font-bold flex items-center gap-2">
          <span className="bg-green-500/20 p-1 rounded text-xs">PROFIT</span> 
          {data.earning}
        </p>
      </div>
    </motion.div>
  )
}

export default function Testimonials() {
  return (
    <section className="py-20 bg-slate-900">
       <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4 text-white">
            Kata Mereka yang Udah Cuan
          </h2>
          <p className="text-center text-slate-400 mb-12">Real testimony, bukan kaleng-kaleng.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <VideoCard key={t.id} data={t} index={i} />
            ))}
          </div>
       </div>
    </section>
  )
}
