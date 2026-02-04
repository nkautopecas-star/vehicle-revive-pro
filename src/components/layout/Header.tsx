import { Bell, Search, Plus, LogOut, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  title: string;
  description?: string;
}

const roleLabels: Record<string, { label: string; className: string }> = {
  admin: { label: 'Admin', className: 'bg-destructive/20 text-destructive' },
  vendedor: { label: 'Vendedor', className: 'bg-success/20 text-success' },
};

export function Header({ title, description }: HeaderProps) {
  const { user, userRole, signOut } = useAuth();

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar peças, veículos..."
            className="w-64 pl-9 bg-muted/50 border-muted focus:bg-background"
          />
        </div>

        {/* Quick add */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Novo cadastro</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span>🚗 Veículo</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>🔧 Peça</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>📦 Anúncio</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-auto py-1.5 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                </span>
                {userRole && (
                  <Badge className={`text-[10px] px-1.5 py-0 h-4 ${roleLabels[userRole].className}`}>
                    <Shield className="w-2.5 h-2.5 mr-0.5" />
                    {roleLabels[userRole].label}
                  </Badge>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {user?.user_metadata?.full_name || 'Usuário'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
                {userRole && (
                  <Badge className={`text-xs w-fit mt-1 ${roleLabels[userRole].className}`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {roleLabels[userRole].label}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
