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
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import type { Cliente } from '@/types/database';

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  // Form state
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    fetchClientes();
  }, []);

  async function fetchClientes() {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar clientes');
      return;
    }

    setClientes(data || []);
    setLoading(false);
  }

  function resetForm() {
    setNome('');
    setEmail('');
    setTelefone('');
    setObservacoes('');
    setEditingCliente(null);
  }

  function openEditDialog(cliente: Cliente) {
    setEditingCliente(cliente);
    setNome(cliente.nome);
    setEmail(cliente.email || '');
    setTelefone(cliente.telefone || '');
    setObservacoes(cliente.observacoes || '');
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (editingCliente) {
      const { error } = await supabase
        .from('clientes')
        .update({ nome, email, telefone, observacoes })
        .eq('id', editingCliente.id);

      if (error) {
        toast.error('Erro ao atualizar cliente');
        return;
      }

      toast.success('Cliente atualizado');
    } else {
      const { error } = await supabase
        .from('clientes')
        .insert({ nome, email, telefone, observacoes });

      if (error) {
        toast.error('Erro ao criar cliente');
        return;
      }

      toast.success('Cliente criado');
    }

    setDialogOpen(false);
    resetForm();
    fetchClientes();
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este cliente?')) return;

    const { error } = await supabase.from('clientes').delete().eq('id', id);

    if (error) {
      if (error.message.includes('foreign key')) {
        toast.error('Este cliente possui contratos vinculados');
      } else {
        toast.error('Erro ao excluir cliente');
      }
      return;
    }

    toast.success('Cliente excluído');
    fetchClientes();
  }

  const filteredClientes = clientes.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase())
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
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{clientes.length} cliente(s) cadastrado(s)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do cliente"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Notas sobre o cliente"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCliente ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente..."
          className="pl-10"
        />
      </div>

      {/* List */}
      {filteredClientes.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredClientes.map((cliente) => (
            <Card key={cliente.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{cliente.nome}</div>
                  <div className="text-sm text-muted-foreground">
                    {cliente.email || cliente.telefone || 'Sem contato'}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(cliente)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(cliente.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}