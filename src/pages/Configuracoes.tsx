import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Settings, Save } from 'lucide-react';

interface Configuracoes {
  id?: string;
  nome_prestador: string;
  empresa: string;
  cnpj_cpf: string;
  endereco: string;
  telefone: string;
  email: string;
}

export default function Configuracoes() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<Configuracoes>({
    nome_prestador: '',
    empresa: '',
    cnpj_cpf: '',
    endereco: '',
    telefone: '',
    email: '',
  });

  useEffect(() => {
    async function fetchConfig() {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .maybeSingle();

      if (data) {
        setConfig({
          id: data.id,
          nome_prestador: data.nome_prestador || '',
          empresa: data.empresa || '',
          cnpj_cpf: data.cnpj_cpf || '',
          endereco: data.endereco || '',
          telefone: data.telefone || '',
          email: data.email || '',
        });
      }
      setLoading(false);
    }

    fetchConfig();
  }, []);

  async function handleSave() {
    if (!config.nome_prestador.trim() && !config.empresa.trim()) {
      toast.error('Preencha pelo menos o nome ou empresa');
      return;
    }

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      setSaving(false);
      return;
    }

    if (config.id) {
      // Update existing
      const { error } = await supabase
        .from('configuracoes')
        .update({
          nome_prestador: config.nome_prestador || null,
          empresa: config.empresa || null,
          cnpj_cpf: config.cnpj_cpf || null,
          endereco: config.endereco || null,
          telefone: config.telefone || null,
          email: config.email || null,
        })
        .eq('id', config.id);

      if (error) {
        toast.error('Erro ao salvar configurações');
        setSaving(false);
        return;
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('configuracoes')
        .insert([{
          user_id: user.id,
          nome_prestador: config.nome_prestador || null,
          empresa: config.empresa || null,
          cnpj_cpf: config.cnpj_cpf || null,
          endereco: config.endereco || null,
          telefone: config.telefone || null,
          email: config.email || null,
        }]);

      if (error) {
        toast.error('Erro ao salvar configurações');
        setSaving(false);
        return;
      }
    }

    toast.success('Configurações salvas!');
    setSaving(false);
  }

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
        <h1 className="page-title flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configurações
        </h1>
        <p className="page-subtitle">Dados do prestador que aparecem nos contratos</p>
      </div>

      <Card className="p-6 max-w-2xl">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome_prestador">Nome do Prestador</Label>
              <Input
                id="nome_prestador"
                value={config.nome_prestador}
                onChange={(e) => setConfig({ ...config, nome_prestador: e.target.value })}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa (opcional)</Label>
              <Input
                id="empresa"
                value={config.empresa}
                onChange={(e) => setConfig({ ...config, empresa: e.target.value })}
                placeholder="Nome da empresa"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cnpj_cpf">CPF/CNPJ (opcional)</Label>
              <Input
                id="cnpj_cpf"
                value={config.cnpj_cpf}
                onChange={(e) => setConfig({ ...config, cnpj_cpf: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone (opcional)</Label>
              <Input
                id="telefone"
                value={config.telefone}
                onChange={(e) => setConfig({ ...config, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (opcional)</Label>
            <Input
              id="email"
              type="email"
              value={config.email}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço (opcional)</Label>
            <Input
              id="endereco"
              value={config.endereco}
              onChange={(e) => setConfig({ ...config, endereco: e.target.value })}
              placeholder="Rua, número, cidade - UF"
            />
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </div>
      </Card>
    </Layout>
  );
}
