import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  History, 
  Settings, 
  LogOut, 
  ShieldAlert // <--- 1. NOVO ÍCONE IMPORTADO
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/novo-contrato', label: 'Novo Contrato', icon: FileText },
  { path: '/contratos', label: 'Histórico', icon: History },
  { path: '/modulos', label: 'Módulos', icon: Package },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/configuracoes', label: 'Config', icon: Settings },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="font-semibold tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" /> {/* Branding sutil no logo */}
              Blinscopo
            </Link>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-card/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="page-container animate-fade-in py-6 max-w-5xl mx-auto px-4 sm:px-6">
        {children}
      </main>
    </div>
  );
}
