import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownRight, Send } from 'lucide-react';

export default function DashboardTransactions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-1">View and send transactions</p>
        </div>
        <Button>
          <Send className="w-4 h-4 mr-2" />
          Send Transaction
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Placeholder transaction history */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { type: 'received', amount: '+0.05 ETH', from: '0x1a2b...3c4d', date: '2 hours ago' },
              { type: 'sent', amount: '-0.02 ETH', to: '0x5e6f...7g8h', date: '1 day ago' },
              { type: 'received', amount: '+0.001 BTC', from: 'bc1q...xy2z', date: '3 days ago' },
            ].map((tx, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'received' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {tx.type === 'received' ? (
                      <ArrowDownRight className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{tx.type}</p>
                    <p className="text-sm text-gray-500">
                      {tx.type === 'received' ? `From: ${tx.from}` : `To: ${tx.to}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    tx.type === 'received' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.amount}
                  </p>
                  <p className="text-xs text-gray-500">{tx.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
