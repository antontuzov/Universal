import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Plus, Upload, Trash2, Download, Edit2, Key, Check, X, ChevronDown, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { showSuccess, showError, showWarning } from '@/lib/toast';

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
  const [showImportKey, setShowImportKey] = useState(false);
  const [showSend, setShowSend] = useState(false);

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
    onError: () => showError('Delete failed', 'Could not delete the wallet.'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Wallets</h1>
          <p className="text-gray-600 mt-1">Manage your crypto wallets</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowSend(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Send
          </Button>
          <Button variant="outline" onClick={() => setShowImportKey(true)}>
            <Key className="w-4 h-4 mr-2" />
            Import Key
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
              <Button variant="outline" onClick={() => setShowImportKey(true)}>
                <Key className="w-4 h-4 mr-2" />
                Import Key
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showImportKey && <ImportKeyModal onClose={() => setShowImportKey(false)} />}
      {showSend && <SendTransactionModal onClose={() => setShowSend(false)} />}
    </div>
  );
}

function WalletCard({ wallet, onDelete }: { wallet: WalletData; onDelete: (id: string) => void }) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(wallet.name);
  const queryClient = useQueryClient();

  const renameMutation = useMutation({
    mutationFn: async ({ walletId, name }: { walletId: string; name: string }) => {
      await api.post('/wallets/rename', { walletId, name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      showSuccess('Renamed', 'Wallet name updated.');
      setIsRenaming(false);
    },
    onError: () => showError('Error', 'Could not rename wallet.'),
  });

  const exportMutation = useMutation({
    mutationFn: async (walletId: string) => {
      const { data } = await api.post('/wallets/export', { walletId });
      return data.wallet;
    },
    onSuccess: (walletData) => {
      const blob = new Blob([JSON.stringify(walletData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${walletData.name || 'wallet'}-export.json`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Exported', 'Wallet data downloaded.');
    },
    onError: () => showError('Export failed', 'Could not export wallet.'),
  });

  const colors = chainColors[wallet.chain] ?? 'from-gray-500 to-gray-600';
  const logo = chainLogos[wallet.chain] ?? '?';

  const handleRename = () => {
    if (newName.trim() && newName !== wallet.name) {
      renameMutation.mutate({ walletId: wallet.id, name: newName.trim() });
    } else {
      setIsRenaming(false);
    }
  };

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
        {isRenaming ? (
          <div className="flex items-center gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="text-sm font-semibold h-8"
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              autoFocus
            />
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={handleRename}>
              <Check className="w-3 h-3 text-green-600" />
            </Button>
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => { setIsRenaming(false); setNewName(wallet.name); }}>
              <X className="w-3 h-3 text-red-600" />
            </Button>
          </div>
        ) : (
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            {wallet.name}
            <Button variant="ghost" size="icon" className="w-5 h-5 ml-auto" onClick={() => setIsRenaming(true)}>
              <Edit2 className="w-3 h-3 text-gray-400" />
            </Button>
          </h3>
        )}
        <p className="text-sm text-gray-500 font-mono truncate">{wallet.address}</p>
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <span className="text-sm text-gray-500">Balance</span>
            <p className="text-lg font-bold text-gray-900">{wallet.balance || '0.00'}</p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400 hover:text-blue-600" onClick={() => exportMutation.mutate(wallet.id)}>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400 hover:text-red-600" onClick={() => { if (confirm('Delete this wallet?')) onDelete(wallet.id); }}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ImportKeyModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [chain, setChain] = useState('ethereum');
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState('');
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async () => {
      await api.post('/wallets/import-key', { name, chain, private_key: privateKey, password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      showSuccess('Imported', 'Wallet imported from private key.');
      onClose();
    },
    onError: (err: any) => showError('Import failed', err?.response?.data?.message ?? 'Check your private key format.'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Import from Private Key
          </CardTitle>
          <CardDescription>Enter your raw private key. Keep it secure!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Never share your private key. This data will be encrypted with your password.</span>
          </div>
          <div className="space-y-2">
            <Label>Wallet Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My ETH Wallet" />
          </div>
          <div className="space-y-2">
            <Label>Chain</Label>
            <select value={chain} onChange={(e) => setChain(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="ethereum">Ethereum</option>
              <option value="bitcoin">Bitcoin</option>
              <option value="solana">Solana</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Private Key</Label>
            <Input value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} placeholder={chain === 'ethereum' ? '0x...' : 'Enter private key'} />
          </div>
          <div className="space-y-2">
            <Label>Password (for encryption)</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your account password" />
          </div>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => importMutation.mutate()} disabled={importMutation.isPending || !name || !privateKey || !password}>
              {importMutation.isPending ? 'Importing...' : 'Import Wallet'}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SendTransactionModal({ onClose }: { onClose: () => void }) {
  const [walletId, setWalletId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const { data } = await api.get<WalletData[]>('/wallets');
      return data;
    },
  });

  const estimateMutation = useMutation({
    mutationFn: async ({ chain }: { chain: string }) => {
      const { data } = await api.post('/wallets/estimate-fee', { chain });
      return data.estimatedFee;
    },
    onSuccess: (fee) => setEstimatedFee(fee),
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      await api.post('/transactions/send', { walletId, recipientAddress: recipient, amount, password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      showSuccess('Transaction sent', 'Your transaction has been broadcast.');
      onClose();
    },
    onError: (err: any) => showError('Send failed', err?.response?.data?.message ?? 'Transaction could not be processed.'),
  });

  const selectedWallet = wallets?.find((w) => w.id === walletId);

  const handleNext = () => {
    if (selectedWallet) {
      estimateMutation.mutate({ chain: selectedWallet.chain });
    }
    setStep('confirm');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-md">
        <CardHeader>
          <CardTitle>Send Transaction</CardTitle>
          <CardDescription>{step === 'confirm' ? 'Review and confirm details' : 'Enter transaction details'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'form' ? (
            <>
              <div className="space-y-2">
                <Label>From Wallet</Label>
                <select value={walletId} onChange={(e) => setWalletId(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Select a wallet</option>
                  {wallets?.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} ({w.chain})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Recipient Address</Label>
                <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="0x..." />
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" step="any" />
              </div>
              <div className="space-y-2">
                <Label>Password (to sign)</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your account password" />
              </div>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={handleNext} disabled={!walletId || !recipient || !amount || !password}>
                  Review
                </Button>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">From</span>
                  <span className="font-medium">{selectedWallet?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">To</span>
                  <span className="font-mono text-xs">{recipient.slice(0, 6)}...{recipient.slice(-4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-bold">{amount} {selectedWallet?.chain.slice(0, 3).toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Est. Fee</span>
                  <span>{estimatedFee ?? 'Calculating...'} {selectedWallet?.chain.slice(0, 3).toUpperCase()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{(parseFloat(amount || '0') + parseFloat(estimatedFee || '0')).toFixed(6)}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1 bg-gradient-to-r from-universal-dark to-universal-cyan" onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}>
                  {sendMutation.isPending ? 'Sending...' : 'Confirm & Send'}
                </Button>
                <Button variant="outline" onClick={() => setStep('form')}>Back</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
