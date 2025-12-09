import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, Eye, Copy, Check, Trash2 } from 'lucide-react';
import type { Contrato, Cliente } from '@/types/database';

type ContratoComCliente = Contrato & { clientes: Cliente };

export default function Contratos() {
  const [contratos, setContratos] = useState<ContratoComCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewingContrato, setViewingContrato] = useState<ContratoComCliente | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchContratos();
  }, []);

  async function fetchContratos() {
    const { data, error } = await supabase
      .from('contratos')
      .select('*, clientes(*)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar contratos');
      return;
    }

    setContratos((data as any) || []);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este contrato?')) return;

    const { error } = await supabase.from('contratos').delete().eq('id', id);

    if (error) {
      toast.error('Erro ao excluir contrato');
      return;
    }

    toast.success('Contrato excluído');
    fetchContratos();
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Contrato copiado!');
    setTimeout(() => setCopied(false), 2000);
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const filteredContratos = contratos.filter(
    (c) =>
      c.titulo.toLowerCase().includes(search.toLowerCase()) ||
      c.clientes?.nome.toLowerCase().includes(search.toLowerCase())
  );

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
        <h1 className="page-title">Histórico de Contratos</h1>
        <p className="page-subtitle">{contratos.length} contrato(s) gerado(s)</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título ou cliente..."
          className="pl-10"
        />
      </div>

      {/* List */}
      {filteredContratos.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {search ? 'Nenhum contrato encontrado' : 'Nenhum contrato gerado'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredContratos.map((contrato) => (
            <Card key={contrato.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{contrato.titulo}</div>
                  <div className="text-sm text-muted-foreground">
                    {contrato.clientes?.nome} • {formatDate(contrato.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-success">
                    {formatCurrency(Number(contrato.valor_total))}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewingContrato(contrato)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(contrato.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewingContrato} onOpenChange={() => setViewingContrato(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{viewingContrato?.titulo}</DialogTitle>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => viewingContrato?.texto_contrato && copyToClipboard(viewingContrato.texto_contrato)}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
          </DialogHeader>
          {viewingContrato?.texto_contrato && (
            <pre className="text-xs font-mono bg-secondary p-4 rounded-md overflow-x-auto whitespace-pre-wrap">
              {viewingContrato.texto_contrato}
            </pre>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}