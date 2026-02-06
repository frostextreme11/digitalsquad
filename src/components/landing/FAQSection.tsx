import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

export const faqs = [
    {
        question: "Digital Squad itu apa?",
        answer: "Digital Squad adalah platform affiliate & jual produk digital untuk membantu kamu dapat penghasilan tambahan."
    },
    {
        question: "Saya pemula apa bisa ikut?",
        answer: "Bisa. Sistemnya dibuat untuk pemula, ada panduan step by step di Academy Digital Squad."
    },
    {
        question: "Apakah sekali bayar untuk selamanya?",
        answer: "Ya, betul! Cukup bayar Rp 50.000 di awal pendaftaran, Anda langsung mendapatkan akses seumur hidup ke semua fitur, produk digital, dan sistem affiliate tanpa biaya bulanan atau tahunan."
    },
    {
        question: "Apakah saya harus stock barang?",
        answer: "Tidak. Karena ini produk digital, jadi tidak perlu stock barang."
    },
    {
        question: "Kapan saya bisa tarik tunai?",
        answer: "Anda bisa melakukan penarikan (withdraw) kapan saja setelah saldo komisi mencapai batas minimum. Proses pencairan dana biasanya memakan waktu 1x24 jam kerja ke rekening bank atau e-wallet Anda."
    },
    {
        question: "Apakah saya diajari cara jualannya?",
        answer: "Tentu saja! Di member area, Anda akan dibimbing melalui Academy Digital Squad langkah demi langkah mudah untuk menghasilkan uang dengan Digital Squad."
    },
    {
        question: "Apa saja produk yang bisa saya jual?",
        answer: "Tersedia gudang produk digital (PLR) seperti Ebook yang bisa Anda jual kembali dengan keuntungan masuk ke kantong Anda sendiri."
    },
    {
        question: "Kapan saya dapat komisi?",
        answer: "Komisi masuk saat ada transaksi dari link affiliate kamu. Link affiliate bisa diakses di dashboard member setelah bergabung."
    }
]

export default function FAQSection() {
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    return (
        <section className="py-20 bg-slate-950">
            <div className="container mx-auto px-4 max-w-3xl">
                <h2 className="text-3xl font-bold text-center text-white mb-12">Sering Ditanyakan</h2>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={index} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                            <button
                                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                                className="w-full flex justify-between items-center p-6 text-left focus:outline-none hover:bg-slate-800/50 transition"
                            >
                                <span className="text-white font-medium text-lg">{faq.question}</span>
                                <span className="text-slate-400">
                                    {activeIndex === index ? <Minus size={20} /> : <Plus size={20} />}
                                </span>
                            </button>

                            <AnimatePresence>
                                {activeIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <div className="p-6 pt-0 text-slate-400 leading-relaxed border-t border-slate-800/50">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
