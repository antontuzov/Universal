import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownRight, Send, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

interface Transaction {
  id: string;
  walletId: string;
  chain: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  fee: string;
  status: string;
  txHash: string | null;
  createdAt: string;
}

export default function DashboardTransactions() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data } = await api.get('/transactions');
      return data;
    },
  });

  const transactions: Transaction[] = data?.transactions ?? [];
  const pagination = data?.pagination ?? { total: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-1">
            {pagination.total > 0
              ? `${pagination.total} transaction${pagination.total > 1 ? 's' : ''} found`
              : 'View and send transactions'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Send className="w-4 h-4 mr-2" />
            Send Transaction
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-48" />
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-20" />
                </div>
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((tx) => {
                const isIncoming = tx.toAddress !== tx.fromAddress; // Simplified logic
                return (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.status === 'confirmed' ? 'bg-green-100' : tx.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        {tx.status === 'confirmed' ? (
                          <ArrowDownRight className="w-5 h-5 text-green-600" />
                        ) : tx.status === 'pending' ? (
                          <RefreshCw className="w-5 h-5 text-yellow-600 animate-spin" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{tx.status}</p>
                        <p className="text-sm text-gray-500 font-mono truncate max-w-[200px]">
                          {tx.toAddress.slice(0, 6)}...{tx.toAddress.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{tx.amount} {tx.chain.slice(0, 3).toUpperCase()}</p>
                      <p className="text-xs text-gray-500">Fee: {tx.fee}</p>
                      <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <ArrowUpRight className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
              <p className="text-gray-500 mb-6">
                Transactions will appear here once you start using your wallets.
              </p>
              <Button>
                <Send className="w-4 h-4 mr-2" />
                Send Transaction
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
