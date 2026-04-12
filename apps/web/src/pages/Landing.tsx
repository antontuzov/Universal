import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Shield, Key, Wallet, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import AuthModal from '@/components/auth/AuthModal';

export default function LandingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedGradient />

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-universal-dark via-universal-cyan to-universal-indigo mb-6 shadow-2xl">
              <Wallet className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            One Wallet.
            <span className="block bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              All Chains.
            </span>
          </h1>

          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed">
            A secure, non-custodial Hierarchical Deterministic (HD) wallet that lets you manage
            Ethereum, Bitcoin, and Solana from a single seed phrase.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => setAuthModalOpen(true)}
              className="bg-white text-universal-dark hover:bg-blue-50 font-semibold px-8 py-6 text-lg shadow-xl transition-all duration-300 hover:scale-105"
            >
              Launch App
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setAuthModalOpen(true)}
              className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg backdrop-blur-sm transition-all duration-300"
            >
              Create Wallet
            </Button>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-12"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2"
          >
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white text-center mb-16"
          >
            Built for Security & Simplicity
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Self-Custody"
              description="Your keys, your crypto. We never store your private keys on our servers."
              delay={0.2}
            />
            <FeatureCard
              icon={<Key className="w-8 h-8" />}
              title="HD Wallet"
              description="Generate unlimited wallets from a single BIP39 mnemonic phrase."
              delay={0.4}
            />
            <FeatureCard
              icon={<Wallet className="w-8 h-8" />}
              title="Multi-Chain"
              description="Support for Ethereum, Bitcoin, and Solana all in one place."
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center text-blue-200">
          <p>&copy; 2026 Universal Wallet. Secure by Rust.</p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

function AnimatedGradient() {
  return (
    <motion.div
      className="absolute inset-0 z-0"
      animate={{
        background: [
          'linear-gradient(135deg, #1e3a8a 0%, #06b6d4 50%, #6366f1 100%)',
          'linear-gradient(135deg, #6366f1 0%, #1e3a8a 50%, #06b6d4 100%)',
          'linear-gradient(135deg, #06b6d4 0%, #6366f1 50%, #1e3a8a 100%)',
          'linear-gradient(135deg, #1e3a8a 0%, #06b6d4 50%, #6366f1 100%)',
        ],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'linear',
      }}
    >
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <FloatingElement key={i} index={i} />
        ))}
      </div>
    </motion.div>
  );
}

function FloatingElement({ index }: { index: number }) {
  const positions = [
    { top: '20%', left: '10%' },
    { top: '60%', left: '85%' },
    { top: '40%', left: '75%' },
    { top: '80%', left: '20%' },
    { top: '30%', left: '50%' },
    { top: '70%', left: '40%' },
  ];

  return (
    <motion.div
      className="absolute w-32 h-32 bg-white/5 rounded-full backdrop-blur-sm"
      style={positions[index]}
      animate={{
        y: [0, -30, 0],
        scale: [1, 1.1, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 4 + index,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105"
    >
      <div className="text-white mb-4">{icon}</div>
      <h3 className="text-2xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-blue-100 leading-relaxed">{description}</p>
    </motion.div>
  );
}
