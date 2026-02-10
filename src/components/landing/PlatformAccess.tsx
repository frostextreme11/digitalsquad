import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Monitor, GraduationCap, Gift } from 'lucide-react'; // ArrowRight removed

const accessItems = [
    {
        title: "Academy Digital Squad",
        description: "Bukan sekadar teori. Anda akan mengakses 'Dapur Rahasia' para top earner. Pelajari strategi traffic organic yang meledak dan paid traffic yang menghasilkan ROI tinggi, langsung dari praktisi.",
        image: "https://cdn.jsdelivr.net/gh/frostextreme11/DigitalSquadStorage@main/Public/cover/academy_ds.png", // Preserved user's change to .png
        icon: GraduationCap,
        color: "from-blue-500 to-cyan-400",
        shadowColor: "shadow-blue-500/30",
        features: [ // Tailored features
            "Bongkar Rahasia Traffic Gratisan Melimpah",
            "Studi Kasus Real: Tiru & Modifikasi Cara Cuan",
            "Akses Ribuan Aset Konten Siap Posting"
        ]
    },
    {
        title: "Dashboard Agent Pro", // Renamed for impact
        description: "Lupakan cara manual yang membosankan. Dashboard ini adalah 'Kokpit Pesawat' bisnis Anda. Pantau setiap klik, leads, dan konversi rupiah yang masuk secara real-time dari genggaman.",
        image: "https://cdn.jsdelivr.net/gh/frostextreme11/DigitalSquadStorage@main/Public/cover/dashboard_agent.png",
        icon: Monitor,
        color: "from-violet-500 to-purple-400",
        shadowColor: "shadow-violet-500/30",
        features: [ // Tailored features
            "Pantau Profit & Komisi Secara Real-time",
            "Database Leads & Customer Terpusat Aman",
            "Sistem Otomatis: Hemat Waktu Follow-up"
        ]
    },
    {
        title: "Gudang Produk PLR Premium", // Renamed for impact
        description: "Bayangkan memiliki toko digital sendiri tanpa harus membuat produk dari nol. Kami sediakan produk premium yang bisa Anda jual kembali dan klaim 100% keuntungannya masuk kantong Anda.",
        image: "https://cdn.jsdelivr.net/gh/frostextreme11/DigitalSquadStorage@main/Public/cover/free_product_digital.png",
        icon: Gift,
        color: "from-emerald-500 to-teal-400",
        shadowColor: "shadow-emerald-500/30",
        features: [ // Tailored features
            "Jual Ulang & 100% Profit Milik Anda",
            "Hemat Puluhan Juta Biaya Produksi",
            "Terima Beres: Landing Page & Marketing Kit Ready"
        ]
    }
];

export default function PlatformAccess() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const y2 = useTransform(scrollYProgress, [0, 1], [-100, 100]);

    return (
        <div ref={containerRef} className="py-16 md:py-32 bg-slate-950 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <motion.div style={{ y }} className="absolute top-1/4 -left-64 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
                <motion.div style={{ y: y2 }} className="absolute bottom-1/4 -right-64 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 relative z-10">
                <div className="text-center mb-16 md:mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400 mb-6 leading-tight">
                            Senjata Rahasia Member<br className="hidden md:block" /> Digital Squad
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Ekosistem lengkap yang dirancang khusus untuk mengubah pemula menjadi pebisnis digital profesional dalam waktu singkat.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 gap-20 md:gap-32">
                    {accessItems.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-10 md:gap-20`}
                        >
                            {/* Text Content */}
                            <div className="flex-1 space-y-8 w-full">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br ${item.color} p-0.5 shadow-lg ${item.shadowColor}`}>
                                        <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                                            <item.icon className="w-7 h-7 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">{item.title}</h3>
                                </div>

                                <p className="text-slate-400 text-lg leading-relaxed border-l-2 border-slate-800 pl-6">
                                    {item.description}
                                </p>

                                <ul className="space-y-4">
                                    {item.features.map((feature, i) => (
                                        <li key={i} className="flex items-start text-slate-200 bg-slate-900/50 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                                            <span className={`mt-1.5 w-2 h-2 shrink-0 rounded-full bg-gradient-to-r ${item.color} mr-4`} />
                                            <span className="font-medium text-[15px]">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* Button removed as requested */}
                            </div>

                            {/* Image Preview */}
                            <div className="flex-1 w-full relative group">
                                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-3xl blur-2xl opacity-10 group-hover:opacity-20 transition-all duration-700`} />
                                <motion.div
                                    whileHover={{ scale: 1.02, rotate: 1 }}
                                    transition={{ type: "spring", stiffness: 100 }}
                                    className="relative rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl bg-slate-800/50 backdrop-blur-sm"
                                >
                                    <div className="aspect-[16/10] relative">
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                                        />
                                    </div>

                                    {/* Glass overlay reflection */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
