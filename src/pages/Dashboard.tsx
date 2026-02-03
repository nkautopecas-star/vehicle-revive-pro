import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { TopPartsTable } from "@/components/dashboard/TopPartsTable";
import { MarketplaceStats } from "@/components/dashboard/MarketplaceStats";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { DollarSign, Package, Car, TrendingUp } from "lucide-react";

const Dashboard = () => {
  return (
    <AppLayout title="Dashboard" description="Visão geral do seu negócio">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Faturamento Mensal"
            value="R$ 368.000"
            change={{ value: 12.5, trend: "up" }}
            icon={<DollarSign className="w-6 h-6" />}
          />
          <StatCard
            title="Peças Vendidas"
            value="268"
            change={{ value: 8.2, trend: "up" }}
            icon={<Package className="w-6 h-6" />}
          />
          <StatCard
            title="Veículos Ativos"
            value="45"
            change={{ value: 4.1, trend: "up" }}
            icon={<Car className="w-6 h-6" />}
          />
          <StatCard
            title="Margem Média"
            value="34%"
            change={{ value: -2.3, trend: "down" }}
            icon={<TrendingUp className="w-6 h-6" />}
          />
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
