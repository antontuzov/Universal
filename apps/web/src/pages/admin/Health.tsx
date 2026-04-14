import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Activity, Users, Wallet, ArrowLeftRight, Server, Wifi } from 'lucide-react';
import api from '@/lib/api';

interface HealthData {
  databaseStatus: string;
  redisStatus: string;
  uptimeSeconds: number;
  totalUsers: number;
  totalWallets: number;
  totalTransactions: number;
  activeSessions: number;
}

export default function AdminHealth() {
  const { data: health, isLoading } = useQuery({
    queryKey: ['admin-health'],
    queryFn: async () => {
      const { data } = await api.get<HealthData>('/admin/health');
      return data;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-gray-200 rounded w-64 animate-pulse" />
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
        <p className="text-gray-600 mt-1">Real-time monitoring of system components</p>
      </div>

      {/* Service Status */}
      <div className="grid md:grid-cols-2 gap-6">
        <ServiceStatusCard
          title="Database"
          status={health?.databaseStatus ?? 'unknown'}
          icon={Database}
          color={health?.databaseStatus === 'connected' ? 'green' : 'red'}
        />
        <ServiceStatusCard
          title="Redis"
          status={health?.redisStatus ?? 'unknown'}
          icon={Wifi}
          color={health?.redisStatus === 'connected' ? 'green' : 'red'}
        />
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={health?.totalUsers ?? 0} icon={Users} />
        <StatCard title="Total Wallets" value={health?.totalWallets ?? 0} icon={Wallet} />
        <StatCard title="Transactions" value={health?.totalTransactions ?? 0} icon={ArrowLeftRight} />
        <StatCard title="Active Sessions" value={health?.activeSessions ?? 0} icon={Server} />
      </div>

      {/* Uptime */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Server Uptime
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-gray-900">
            {health ? formatUptime(health.uptimeSeconds) : 'Calculating...'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ServiceStatusCard({
  title,
  status,
  icon: Icon,
  color,
}: {
  title: string;
  status: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            color === 'green' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <Icon className={`w-6 h-6 ${color === 'green' ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            color === 'green' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {status}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </CardContent>
    </Card>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
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
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

function formatUptime(seconds: number): string {
  if (seconds === 0) return 'Just started';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
