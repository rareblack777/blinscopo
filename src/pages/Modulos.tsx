import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Sparkles, Loader2 } from 'lucide-react';
import type { ModuloEscopo } from '@/types/database';

export default function Modulos() {
  const [modulos, setModulos] = useState<ModuloEscopo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModulo, setEditingModulo] = useState<ModuloEscopo | null>(null);
  const [generatingClause, setGeneratingClause] = useState(false);

  // Form state
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorPadrao, setValorPadrao] = useState('');
  const [clausulaIa, setClausulaIa] = useState('');

  useEffect(() => {
    fetchModulos();
  }, []);

  async function fetchModulos() {
    const { data, error } = await supabase
      .from('modulos_escopo')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar módulos');
      return;
    }

    setModulos(data || []);
    setLoading(false);
  }

  function resetForm() {
    setTitulo('');
    setDescricao('');
    setValorPadrao('');
    setClausulaIa('');
    setEditingModulo(null);
  }

  function openEditDialog(modulo: ModuloEscopo) {
    setEditingModulo(modulo);
    setTitulo(modulo.titulo);
    setDescricao(modulo.descricao || '');
    setValorPadrao(modulo.valor_padrao.toString());
    setClausulaIa(modulo.clausula_ia || '');
    setDialogOpen(true);
  }

  async function generateClause() {
    if (!titulo.trim() || !valorPadrao) {
      toast.error('Preencha título e valor antes de gerar');
      return;
    }

    setGeneratingClause(true);

    try {
      const { data, error } = await supabase.functions.invoke('gerar-clausula', {
        body: {
          titulo,
          valor: parseFloat(valorPadrao),
          descricao,
        },
      });

      if (error) throw error;

      if (data.clausula) {
        setClausulaIa(data.clausula);
        toast.success('Cláusula gerada com sucesso!');
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (err) {
      console.error('Error generating clause:', err);
      toast.error('Erro ao gerar cláusula');
    } finally {
      setGeneratingClause(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!titulo.trim() || !valorPadrao) {
      toast.error('Título e valor são obrigatórios');
      return;
    }

    const moduloData = {
      titulo,
      descricao,
      valor_padrao: parseFloat(valorPadrao),
      clausula_ia: clausulaIa,
    };

    if (editingModulo) {
      const { error } = await supabase
        .from('modulos_escopo')
        .update(moduloData)
        .eq('id', editingModulo.id);

      if (error) {
        toast.error('Erro ao atualizar módulo');
        return;
      }

      toast.success('Módulo atualizado');
    } else {
      const { error } = await supabase
        .from('modulos_escopo')
        .insert(moduloData);

      if (error) {
        toast.error('Erro ao criar módulo');
        return;
      }

      toast.success('Módulo criado');
    }

    setDialogOpen(false);
    resetForm();
    fetchModulos();
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este módulo?')) return;

    const { error } = await supabase.from('modulos_escopo').delete().eq('id', id);

    if (error) {
      toast.error('Erro ao excluir módulo');
      return;
    }

    toast.success('Módulo excluído');
    fetchModulos();
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Módulos de Escopo</h1>
          <p className="page-subtitle">Seus serviços pré-definidos com cláusulas jurídicas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Módulo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingModulo ? 'Editar Módulo' : 'Novo Módulo'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título do Serviço *</Label>
                  <Input
                    id="titulo"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Criação de Landing Page"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor Padrão (R$) *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={valorPadrao}
                    onChange={(e) => setValorPadrao(e.target.value)}
                    placeholder="1500.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva brevemente o que está incluso neste serviço"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="clausula">Cláusula Jurídica</Label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={generateClause}
                    disabled={generatingClause}
                  >
                    {generatingClause ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Gerar com IA
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  id="clausula"
                  value={clausulaIa}
                  onChange={(e) => setClausulaIa(e.target.value)}
                  placeholder="Clique em 'Gerar com IA' ou escreva manualmente a cláusula de proteção"
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingModulo ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* List */}
      {modulos.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Nenhum módulo cadastrado</p>
          <p className="text-sm text-muted-foreground">
            Crie módulos para seus serviços mais comuns e a IA gerará cláusulas de proteção
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {modulos.map((modulo) => (
            <Card key={modulo.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium">{modulo.titulo}</div>
                  <div className="text-lg font-semibold text-success">
                    {formatCurrency(Number(modulo.valor_padrao))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(modulo)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(modulo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {modulo.descricao && (
                <p className="text-sm text-muted-foreground mb-2">{modulo.descricao}</p>
              )}
              {modulo.clausula_ia && (
                <div className="mt-3 p-3 bg-secondary rounded-md">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Cláusula gerada
                  </p>
                  <p className="text-xs font-mono line-clamp-3">{modulo.clausula_ia}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}