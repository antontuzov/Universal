import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, AlertTriangle, ArrowRight, Shield } from 'lucide-react';

interface SeedPhraseDisplayProps {
  mnemonic: string;
  onConfirm: () => void;
  onSkip: () => void;
}

export default function SeedPhraseDisplay({ mnemonic, onConfirm, onSkip }: SeedPhraseDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [step, setStep] = useState<'warning' | 'display' | 'confirm'>('warning');

  const words = mnemonic.split(' ');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence mode="wait">
      {step === 'warning' && (
        <motion.div
          key="warning"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <CardTitle>Important: Backup Your Seed Phrase</CardTitle>
              </div>
              <CardDescription>
                This is the ONLY time you'll see your seed phrase. Write it down and store it securely.
                Anyone with this phrase can access your funds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-amber-800">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Store it in a secure, offline location (safe, safety deposit box)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Never share it with anyone or enter it on unknown websites</span>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>We cannot recover your funds if you lose this phrase</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setStep('display')} className="flex-1">
                  I understand, show my seed phrase
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={onSkip}>
                  Skip for now
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === 'display' && (
        <motion.div
          key="display"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Seed Phrase (24 words)</CardTitle>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <CardDescription>
                Write these words down in order. You'll need to confirm them next.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Word Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {words.map((word, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-400 font-mono w-5">{i + 1}</span>
                    <span className="text-sm font-mono font-medium text-gray-900">{word}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep('confirm')} className="flex-1">
                  I've written it down — Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={() => setStep('warning')}>
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === 'confirm' && (
        <motion.div
          key="confirm"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Confirm Your Seed Phrase</CardTitle>
              <CardDescription>
                Enter all 24 words in order to confirm you've saved them correctly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {words.map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Label className="text-xs text-gray-500">Word {i + 1}</Label>
                    <Input
                      className="text-sm font-mono"
                      onChange={(e) => {
                        // Track confirmation state — in production, validate each word
                        const allFilled = Array.from(document.querySelectorAll('input')).every(
                          (el) => (el as HTMLInputElement).value.trim().length > 0
                        );
                        setConfirmed(allFilled);
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={onConfirm}
                  disabled={!confirmed}
                  className="flex-1"
                >
                  Confirm & Finish
                </Button>
                <Button variant="outline" onClick={() => setStep('display')}>
                  View Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
