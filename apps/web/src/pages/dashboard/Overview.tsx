import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '@/lib/api';

interface WalletData {
  id: string;
  name: string;
  chain: string;
  address: string;
  balance: string;
  createdAt: string;
}

export default function DashboardOverview() {
  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const { data } = await api.get<WalletData[]>('/wallets');
      return data;
    },
  });

  // Calculate total balance from real wallet data
  const totalBalance = wallets?.reduce((sum, w) => {
    const balance = parseFloat(w.balance) || 0;
    return sum + balance;
  }, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your portfolio overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Balance"
          value={walletsLoading ? '...' : `$${totalBalance.toFixed(2)}`}
          change={`${wallets?.length ?? 0} wallets`}
          icon={Wallet}
          positive
        />
        <StatCard
          title="Wallets"
          value={walletsLoading ? '...' : String(wallets?.length ?? 0)}
          change="Across all chains"
          icon={Wallet}
          positive
        />
        <StatCard
          title="Ethereum"
          value={walletsLoading ? '...' : String(wallets?.filter(w => w.chain === 'ethereum').length ?? 0)}
          change="ETH wallets"
          icon={TrendingUp}
          positive
        />
        <StatCard
          title="Bitcoin"
          value={walletsLoading ? '...' : String(wallets?.filter(w => w.chain === 'bitcoin').length ?? 0)}
          change="BTC wallets"
          icon={ArrowDownRight}
          positive
        />
      </div>

      {/* Portfolio Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center bg-gray-100 rounded-lg">
            <p className="text-gray-500">Chart will be integrated here</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Wallets */}
      <Card>
        <CardHeader>
          <CardTitle>Your Wallets</CardTitle>
        </CardHeader>
        <CardContent>
          {walletsLoading ? (
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
          ) : wallets && wallets.length > 0 ? (
            <div className="space-y-4">
              {wallets.slice(0, 5).map((wallet) => (
                <div key={wallet.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{wallet.name}</p>
                      <p className="text-sm text-gray-500 font-mono truncate max-w-[200px]">
                        {wallet.address}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900">{wallet.balance || '0.00'}</span>
                    <p className="text-xs text-gray-500 capitalize">{wallet.chain}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No wallets yet. Create one to get started!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  positive,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  positive: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
        <p className={`text-sm ${positive ? 'text-green-600' : 'text-red-600'}`}>{change}</p>
      </CardContent>
    </Card>
  );
}
