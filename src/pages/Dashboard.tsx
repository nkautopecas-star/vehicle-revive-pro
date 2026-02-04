import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { TopPartsTable } from "@/components/dashboard/TopPartsTable";
import { MarketplaceStats } from "@/components/dashboard/MarketplaceStats";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { DollarSign, Package, Car, TrendingUp } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { data: stats, isLoading } = useDashboardStats();

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { value: current > 0 ? 100 : 0, trend: "up" as const };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(change * 10) / 10),
      trend: change >= 0 ? ("up" as const) : ("down" as const),
    };
  };

  return (
    <AppLayout title="Dashboard" description="Visão geral do seu negócio">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </>
          ) : (
            <>
              <StatCard
                title="Faturamento Mensal"
                value={`R$ ${(stats?.faturamentoMensal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                change={calculateChange(stats?.faturamentoMensal || 0, stats?.faturamentoAnterior || 0)}
                icon={<DollarSign className="w-6 h-6" />}
              />
              <StatCard
                title="Peças Vendidas"
                value={stats?.pecasVendidas || 0}
                change={calculateChange(stats?.pecasVendidas || 0, stats?.pecasVendidasAnterior || 0)}
                icon={<Package className="w-6 h-6" />}
              />
              <StatCard
                title="Veículos Ativos"
                value={stats?.veiculosAtivos || 0}
                change={calculateChange(stats?.veiculosAtivos || 0, stats?.veiculosAtivosAnterior || 0)}
                icon={<Car className="w-6 h-6" />}
              />
              <StatCard
                title="Margem Média"
                value={`${Math.round(stats?.margemMedia || 0)}%`}
                change={calculateChange(stats?.margemMedia || 0, stats?.margemMediaAnterior || 0)}
                icon={<TrendingUp className="w-6 h-6" />}
              />
            </>
          )}
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SalesChart />
          <MarketplaceStats />
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopPartsTable />
          <RecentActivity />
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
