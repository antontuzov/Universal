import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Plus, Upload, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { showSuccess, showError } from '@/lib/toast';

interface WalletData {
  id: string;
  name: string;
  chain: string;
  address: string;
  balance: string;
  createdAt: string;
}

const chainColors: Record<string, string> = {
  ethereum: 'from-blue-500 to-purple-500',
  bitcoin: 'from-orange-500 to-yellow-500',
  solana: 'from-green-500 to-teal-500',
};

const chainLogos: Record<string, string> = {
  ethereum: 'Ξ',
  bitcoin: '₿',
  solana: '◎',
};

export default function DashboardWallets() {
  const queryClient = useQueryClient();

  const { data: wallets, isLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const { data } = await api.get<WalletData[]>('/wallets');
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (walletId: string) => {
      await api.post(`/wallets/${walletId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      showSuccess('Wallet deleted', 'The wallet has been removed successfully.');
    },
    onError: () => {
      showError('Delete failed', 'Could not delete the wallet.');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Wallets</h1>
          <p className="text-gray-600 mt-1">Manage your crypto wallets</p>
        </div>
        <div className="flex gap-3">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Wallet
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import Wallet
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-12 bg-gray-200 rounded mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : wallets && wallets.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map((wallet) => (
            <WalletCard key={wallet.id} wallet={wallet} onDelete={(id) => deleteMutation.mutate(id)} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No wallets yet</h3>
            <p className="text-gray-500 mb-6">
              Create a new wallet or import an existing one to get started.
            </p>
            <div className="flex gap-3 justify-center">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Wallet
              </Button>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function WalletCard({ wallet, onDelete }: { wallet: WalletData; onDelete: (id: string) => void }) {
  const colors = chainColors[wallet.chain] ?? 'from-gray-500 to-gray-600';
  const logo = chainLogos[wallet.chain] ?? '?';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors} flex items-center justify-center text-white font-bold`}>
            {logo}
          </div>
          <span className="text-xs font-medium text-gray-500 uppercase">{wallet.chain}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <h3 className="font-semibold text-gray-900">{wallet.name}</h3>
        <p className="text-sm text-gray-500 font-mono truncate">
          {wallet.address}
        </p>
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <span className="text-sm text-gray-500">Balance</span>
            <p className="text-lg font-bold text-gray-900">{wallet.balance || '0.00'}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(wallet.id)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
