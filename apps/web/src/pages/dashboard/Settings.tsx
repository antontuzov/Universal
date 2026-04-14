import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useNetworkStore } from '@/stores/networkStore';
import { showSuccess } from '@/lib/toast';
import { Globe, Check } from 'lucide-react';

type Network = 'mainnet' | 'sepolia' | 'goerli';

const networkLabels: Record<Network, string> = {
  mainnet: 'Mainnet',
  sepolia: 'Sepolia (Testnet)',
  goerli: 'Görli (Testnet)',
};

export default function DashboardSettings() {
  const { ethereum, bitcoin, solana, setNetwork } = useNetworkStore();
  const [password, setPassword] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your network and security preferences</p>
      </div>

      {/* Network Switcher */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Network Configuration</CardTitle>
              <CardDescription>Choose between mainnet and testnet for each chain</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {(['ethereum', 'bitcoin', 'solana'] as const).map((chain) => {
            const current = chain === 'ethereum' ? ethereum : chain === 'bitcoin' ? bitcoin : solana;
            return (
              <div key={chain} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900 capitalize">{chain}</p>
                  <p className="text-sm text-gray-500">
                    Currently on <span className="font-medium text-blue-600">{networkLabels[current]}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  {(['mainnet', 'sepolia', 'goerli'] as Network[]).map((net) => (
                    <Button
                      key={net}
                      variant={current === net ? 'default' : 'outline'}
                      size="sm"
                      className={current === net ? 'bg-blue-600' : ''}
                      onClick={() => {
                        setNetwork(chain, net);
                        showSuccess('Network changed', `${chain} switched to ${networkLabels[net]}`);
                      }}
                    >
                      {current === net && <Check className="w-3 h-3 mr-1" />}
                      {net === 'sepolia' && chain !== 'ethereum' ? 'Testnet' : networkLabels[net]}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
