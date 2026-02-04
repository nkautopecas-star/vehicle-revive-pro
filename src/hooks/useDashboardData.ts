import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export interface DashboardStats {
  faturamentoMensal: number;
  faturamentoAnterior: number;
  pecasVendidas: number;
  pecasVendidasAnterior: number;
  veiculosAtivos: number;
  veiculosAtivosAnterior: number;
  margemMedia: number;
  margemMediaAnterior: number;
}

export interface MonthlySalesData {
  name: string;
  vendas: number;
  receita: number;
}

export interface TopPart {
  id: string;
  name: string;
  vehicle: string;
  sold: number;
  revenue: number;
  status: string;
}

export interface MarketplaceStat {
  name: string;
  sales: number;
  revenue: number;
  percentage: number;
  color: string;
}

export interface RecentActivityItem {
  id: string;
  type: "sale" | "question" | "vehicle" | "stock" | "part";
  title: string;
  description: string;
  time: Date;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      const previousMonthStart = startOfMonth(subMonths(now, 1));
      const previousMonthEnd = endOfMonth(subMonths(now, 1));

      // Fetch current month sales
      const { data: currentSales } = await supabase
        .from("sales")
        .select("preco_venda, quantidade")
        .gte("sold_at", currentMonthStart.toISOString())
        .lte("sold_at", currentMonthEnd.toISOString())
        .eq("status", "completed");

      // Fetch previous month sales
      const { data: previousSales } = await supabase
        .from("sales")
        .select("preco_venda, quantidade")
        .gte("sold_at", previousMonthStart.toISOString())
        .lte("sold_at", previousMonthEnd.toISOString())
        .eq("status", "completed");

      // Calculate revenue
      const faturamentoMensal = currentSales?.reduce(
        (acc, sale) => acc + Number(sale.preco_venda) * sale.quantidade,
        0
      ) || 0;
      const faturamentoAnterior = previousSales?.reduce(
        (acc, sale) => acc + Number(sale.preco_venda) * sale.quantidade,
        0
      ) || 0;

      // Calculate parts sold
      const pecasVendidas = currentSales?.reduce(
        (acc, sale) => acc + sale.quantidade,
        0
      ) || 0;
      const pecasVendidasAnterior = previousSales?.reduce(
        (acc, sale) => acc + sale.quantidade,
        0
      ) || 0;

      // Fetch active vehicles count
      const { count: veiculosAtivos } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .in("status", ["ativo", "desmontando"]);

      // Fetch previous month vehicle count (approximation based on created_at)
      const { count: veiculosAtivosAnterior } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .in("status", ["ativo", "desmontando"])
        .lte("created_at", previousMonthEnd.toISOString());

      // Calculate average margin
      const { data: partsWithPrices } = await supabase
        .from("parts")
        .select("preco_custo, preco_venda")
        .not("preco_custo", "is", null)
        .not("preco_venda", "is", null)
        .gt("preco_venda", 0);

      let margemMedia = 0;
      if (partsWithPrices && partsWithPrices.length > 0) {
        const margins = partsWithPrices.map((part) => {
          const custo = Number(part.preco_custo) || 0;
          const venda = Number(part.preco_venda) || 1;
          return ((venda - custo) / venda) * 100;
        });
        margemMedia = margins.reduce((a, b) => a + b, 0) / margins.length;
      }

      return {
        faturamentoMensal,
        faturamentoAnterior,
        pecasVendidas,
        pecasVendidasAnterior,
        veiculosAtivos: veiculosAtivos || 0,
        veiculosAtivosAnterior: veiculosAtivosAnterior || 0,
        margemMedia,
        margemMediaAnterior: margemMedia, // Simplified - would need historical data
      };
    },
  });
}

export function useMonthlySalesChart() {
  return useQuery({
    queryKey: ["monthly-sales-chart"],
    queryFn: async (): Promise<MonthlySalesData[]> => {
      const now = new Date();
      const months: MonthlySalesData[] = [];

      // Get last 7 months of data
      for (let i = 6; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const { data: sales } = await supabase
          .from("sales")
          .select("preco_venda, quantidade")
          .gte("sold_at", monthStart.toISOString())
          .lte("sold_at", monthEnd.toISOString())
          .eq("status", "completed");

        const vendas = sales?.reduce((acc, sale) => acc + sale.quantidade, 0) || 0;
        const receita = sales?.reduce(
          (acc, sale) => acc + Number(sale.preco_venda) * sale.quantidade,
          0
        ) || 0;

        months.push({
          name: format(monthDate, "MMM"),
          vendas,
          receita,
        });
      }

      return months;
    },
  });
}

export function useTopParts() {
  return useQuery({
    queryKey: ["top-parts"],
    queryFn: async (): Promise<TopPart[]> => {
      // Get all completed sales with part info
      const { data: sales } = await supabase
        .from("sales")
        .select(`
          part_id,
          preco_venda,
          quantidade,
          parts(nome, vehicle_id, quantidade, vehicles(marca, modelo, ano))
        `)
        .eq("status", "completed")
        .order("sold_at", { ascending: false });

      if (!sales) return [];

      // Aggregate by part
      const partSales = new Map<string, { 
        id: string;
        name: string; 
        vehicle: string; 
        sold: number; 
        revenue: number;
        stock: number;
      }>();

      for (const sale of sales) {
        if (!sale.part_id || !sale.parts) continue;
        
        const part = sale.parts as any;
        const existing = partSales.get(sale.part_id);
        
        const vehicleInfo = part.vehicles 
          ? `${part.vehicles.marca} ${part.vehicles.modelo} ${part.vehicles.ano}`
          : "N/A";

        if (existing) {
          existing.sold += sale.quantidade;
          existing.revenue += Number(sale.preco_venda) * sale.quantidade;
        } else {
          partSales.set(sale.part_id, {
            id: sale.part_id,
            name: part.nome,
            vehicle: vehicleInfo,
            sold: sale.quantidade,
            revenue: Number(sale.preco_venda) * sale.quantidade,
            stock: part.quantidade || 0,
          });
        }
      }

      // Sort by revenue and take top 5
      return Array.from(partSales.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map((part) => ({
          ...part,
          status: part.stock <= 2 ? "Baixo" : "Ativo",
        }));
    },
  });
}

export function useMarketplaceStats() {
  return useQuery({
    queryKey: ["marketplace-stats"],
    queryFn: async (): Promise<MarketplaceStat[]> => {
      const colors = ["bg-chart-1", "bg-chart-2", "bg-chart-3"];
      const marketplaceNames: Record<string, string> = {
        mercadolivre: "Mercado Livre",
        shopee: "Shopee",
        olx: "OLX",
      };

      // Get sales with marketplace account info
      const { data: sales } = await supabase
        .from("sales")
        .select(`
          preco_venda,
          quantidade,
          marketplace_account_id,
          marketplace_accounts(marketplace, nome_conta)
        `)
        .eq("status", "completed")
        .not("marketplace_account_id", "is", null);

      if (!sales || sales.length === 0) {
        // Return empty stats with available marketplaces
        const { data: accounts } = await supabase
          .from("marketplace_accounts")
          .select("marketplace, nome_conta")
          .eq("status", "active");

        return (accounts || []).map((acc, index) => ({
          name: marketplaceNames[acc.marketplace] || acc.nome_conta,
          sales: 0,
          revenue: 0,
          percentage: 0,
          color: colors[index % colors.length],
        }));
      }

      // Aggregate by marketplace
      const marketplaceSales = new Map<string, { sales: number; revenue: number }>();

      for (const sale of sales) {
        const account = sale.marketplace_accounts as any;
        if (!account) continue;

        const key = account.marketplace;
        const existing = marketplaceSales.get(key);

        if (existing) {
          existing.sales += sale.quantidade;
          existing.revenue += Number(sale.preco_venda) * sale.quantidade;
        } else {
          marketplaceSales.set(key, {
            sales: sale.quantidade,
            revenue: Number(sale.preco_venda) * sale.quantidade,
          });
        }
      }

      const totalRevenue = Array.from(marketplaceSales.values()).reduce(
        (acc, mp) => acc + mp.revenue,
        0
      );

      return Array.from(marketplaceSales.entries())
        .map(([key, data], index) => ({
          name: marketplaceNames[key] || key,
          sales: data.sales,
          revenue: data.revenue,
          percentage: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0,
          color: colors[index % colors.length],
        }))
        .sort((a, b) => b.revenue - a.revenue);
    },
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["recent-activity"],
    queryFn: async (): Promise<RecentActivityItem[]> => {
      const activities: RecentActivityItem[] = [];

      // Recent sales
      const { data: recentSales } = await supabase
        .from("sales")
        .select(`
          id,
          sold_at,
          parts(nome, vehicles(marca, modelo, ano))
        `)
        .eq("status", "completed")
        .order("sold_at", { ascending: false })
        .limit(5);

      for (const sale of recentSales || []) {
        const part = sale.parts as any;
        const vehicle = part?.vehicles;
        activities.push({
          id: `sale-${sale.id}`,
          type: "sale",
          title: "Venda realizada",
          description: part 
            ? `${part.nome}${vehicle ? ` - ${vehicle.marca} ${vehicle.modelo} ${vehicle.ano}` : ""}`
            : "Peça vendida",
          time: new Date(sale.sold_at),
        });
      }

      // Recent questions
      const { data: recentQuestions } = await supabase
        .from("marketplace_questions")
        .select(`
          id,
          received_at,
          marketplace_listings(titulo)
        `)
        .eq("status", "pending")
        .order("received_at", { ascending: false })
        .limit(3);

      for (const question of recentQuestions || []) {
        const listing = question.marketplace_listings as any;
        activities.push({
          id: `question-${question.id}`,
          type: "question",
          title: "Nova pergunta",
          description: listing?.titulo || "Pergunta pendente",
          time: new Date(question.received_at),
        });
      }

      // Recent vehicles
      const { data: recentVehicles } = await supabase
        .from("vehicles")
        .select("id, marca, modelo, ano, placa, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      for (const vehicle of recentVehicles || []) {
        activities.push({
          id: `vehicle-${vehicle.id}`,
          type: "vehicle",
          title: "Veículo cadastrado",
          description: `${vehicle.marca} ${vehicle.modelo} ${vehicle.ano} - ${vehicle.placa}`,
          time: new Date(vehicle.created_at),
        });
      }

      // Low stock alerts
      const { data: lowStockParts } = await supabase
        .from("parts")
        .select("id, nome, quantidade")
        .eq("status", "ativa")
        .lt("quantidade", 3)
        .gt("quantidade", 0)
        .order("updated_at", { ascending: false })
        .limit(3);

      for (const part of lowStockParts || []) {
        activities.push({
          id: `stock-${part.id}`,
          type: "stock",
          title: "Estoque baixo",
          description: `${part.nome} - ${part.quantidade} unidade${part.quantidade > 1 ? "s" : ""}`,
          time: new Date(),
        });
      }

      // Recent parts added
      const { data: recentParts } = await supabase
        .from("parts")
        .select(`
          id,
          nome,
          quantidade,
          created_at,
          vehicles(marca, modelo, ano)
        `)
        .order("created_at", { ascending: false })
        .limit(3);

      for (const part of recentParts || []) {
        const vehicle = part.vehicles as any;
        activities.push({
          id: `part-${part.id}`,
          type: "part",
          title: "Peça adicionada",
          description: vehicle 
            ? `${part.quantidade}x ${part.nome} do ${vehicle.marca} ${vehicle.modelo} ${vehicle.ano}`
            : `${part.quantidade}x ${part.nome}`,
          time: new Date(part.created_at),
        });
      }

      // Sort all activities by time and return top 5
      return activities
        .sort((a, b) => b.time.getTime() - a.time.getTime())
        .slice(0, 5);
    },
  });
}
