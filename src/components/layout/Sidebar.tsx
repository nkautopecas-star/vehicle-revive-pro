import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Car,
  Package,
  ShoppingCart,
  MessageSquare,
  Sparkles,
  Calculator,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Warehouse,
  Link2,
  LogOut,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Veículos", href: "/veiculos", icon: Car },
  { label: "Peças", href: "/pecas", icon: Package },
  { label: "Estoque", href: "/estoque", icon: Warehouse },
  { label: "Marketplaces", href: "/marketplaces", icon: ShoppingCart, badge: "3" },
  { label: "Perguntas", href: "/perguntas", icon: MessageSquare, badge: "12" },
  { label: "IA", href: "/ia", icon: Sparkles },
  { label: "Precificação", href: "/precificacao", icon: Calculator },
  { label: "Notas Fiscais", href: "/notas", icon: FileText },
  { label: "Integrações", href: "/integracoes", icon: Link2 },
  { label: "Usuários", href: "/usuarios", icon: Users, adminOnly: true },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { hasRole } = useAuth();
  
  const isAdmin = hasRole('admin');
  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            DP
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-foreground text-sm">Desmonte Pro</span>
              <span className="text-[10px] text-muted-foreground">Gestão Automotiva</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            const linkContent = (
              <Link
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <li key={item.href}>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="flex items-center gap-2">
                      {item.label}
                      {item.badge && (
                        <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                          {item.badge}
                        </span>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            }

            return <li key={item.href}>{linkContent}</li>;
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border">
        {/* User section */}
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-lg mb-2",
          !collapsed && "bg-sidebar-accent/50"
        )}>
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
            U
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Usuário</p>
              <p className="text-xs text-muted-foreground truncate">Admin</p>
            </div>
          )}
        </div>

        {/* Collapse button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-muted-foreground hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="ml-2">Recolher</span>}
        </Button>
      </div>
    </aside>
  );
}
