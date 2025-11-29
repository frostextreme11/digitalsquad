import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const messages = [
    "Budi dari Jakarta baru saja bergabung",
    "Siti baru saja menarik komisi Rp 500.000",
    "User88 baru saja menjual Ebook",
    "Andi dari Surabaya upgrade membership",
    "Rina baru saja cairkan Rp 1.000.000",
    "Doni baru saja bergabung",
    "Komisi Rp 250.000 dikirim ke Sarah",
    "Eko baru saja menjual Template Canva",
    "Tono dari Bandung baru saja bergabung",
    "Putri baru saja menarik komisi Rp 750.000",
    "User123 sukses menjual Software",
    "Lina baru saja bergabung",
    "Komisi Rp 100.000 mendarat di Dedi",
    "Fajar baru saja menjual Kursus SEO",
    "Rizky dari Medan baru saja bergabung",
    "Dewi baru saja cairkan Rp 2.000.000",
    "User99 baru saja menjual Ebook Premium",
    "Agus baru saja bergabung",
    "Komisi Rp 50.000 dikirim ke Bayu",
    "Nia baru saja menjual Preset Lightroom"
]

export default function FloatingToast() {
  const [message, setMessage] = useState("")
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const showRandomToast = () => {
        const randomMsg = messages[Math.floor(Math.random() * messages.length)]
        setMessage(randomMsg)
        setVisible(true)
        
        // Hide after 4 seconds
        setTimeout(() => setVisible(false), 4000)
    }

    // Initial delay
    const timer = setTimeout(() => {
        showRandomToast()
        
        // Loop interval random 5-10 seconds
        const interval = setInterval(() => {
             showRandomToast()
        }, Math.random() * 5000 + 5000) 

        return () => clearInterval(interval)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
        {visible && (
            <motion.div 
                initial={{ opacity: 0, x: -50, y: 50 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: -50, transition: { duration: 0.3 } }}
                className="fixed bottom-6 left-6 z-50 bg-slate-800/90 backdrop-blur-md border border-slate-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-xs"
            >
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <p className="text-sm font-medium">{message}</p>
            </motion.div>
        )}
    </AnimatePresence>
  )
}
