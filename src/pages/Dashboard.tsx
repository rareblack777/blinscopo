import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Package, FileText, Plus, ArrowRight } from 'lucide-react';
import type { Contrato, Cliente } from '@/types/database';

interface DashboardStats {
  totalClientes: number;
  totalModulos: number;
  totalContratos: number;
  valorMes: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    totalModulos: 0,
    totalContratos: 0,
    valorMes: 0,
  });
  const [recentContratos, setRecentContratos] = useState<(Contrato & { clientes: Cliente })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      const [clientesRes, modulosRes, contratosRes, recentRes] = await Promise.all([
        supabase.from('clientes').select('id', { count: 'exact', head: true }),
        supabase.from('modulos_escopo').select('id', { count: 'exact', head: true }),
        supabase.from('contratos').select('id, valor_total', { count: 'exact' }),
        supabase.from('contratos')
          .select('*, clientes(*)')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      // Calculate month's value
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data: monthContratos } = await supabase
        .from('contratos')
        .select('valor_total')
        .gte('created_at', startOfMonth);

      const valorMes = monthContratos?.reduce((sum, c) => sum + Number(c.valor_total), 0) || 0;

      setStats({
        totalClientes: clientesRes.count || 0,
        totalModulos: modulosRes.count || 0,
        totalContratos: contratosRes.count || 0,
        valorMes,
      });

      setRecentContratos((recentRes.data as any) || []);
      setLoading(false);
    }

    fetchDashboard();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-muted-foreground">Carregando...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Visão geral do seu sistema de contratos</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary rounded-md">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="stat-value">{stats.totalClientes}</div>
              <div className="stat-label">Clientes</div>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary rounded-md">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <div className="stat-value">{stats.totalModulos}</div>
              <div className="stat-label">Módulos</div>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary rounded-md">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <div className="stat-value">{stats.totalContratos}</div>
              <div className="stat-label">Contratos</div>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-value text-success">{formatCurrency(stats.valorMes)}</div>
          <div className="stat-label">Este mês</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-8">
        <Button asChild>
          <Link to="/novo-contrato">
            <Plus className="h-4 w-4 mr-2" />
            Novo Contrato
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link to="/clientes">
            <Users className="h-4 w-4 mr-2" />
            Clientes
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link to="/modulos">
            <Package className="h-4 w-4 mr-2" />
            Módulos
          </Link>
        </Button>
      </div>

      {/* Recent Contracts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Contratos Recentes</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/contratos">
              Ver todos
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        {recentContratos.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Nenhum contrato criado ainda</p>
            <Button asChild>
              <Link to="/novo-contrato">Criar primeiro contrato</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentContratos.map((contrato) => (
              <Card key={contrato.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{contrato.titulo}</div>
                    <div className="text-sm text-muted-foreground">
                      {contrato.clientes?.nome} • {formatDate(contrato.created_at)}
                    </div>
                  </div>
                  <div className="font-semibold">
                    {formatCurrency(Number(contrato.valor_total))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}