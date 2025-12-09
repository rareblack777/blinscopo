import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { FileText, Copy, Check } from 'lucide-react';
import type { Cliente, ModuloEscopo, ModuloContratoItem } from '@/types/database';

export default function NovoContrato() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [modulos, setModulos] = useState<ModuloEscopo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [selectedModulos, setSelectedModulos] = useState<Set<string>>(new Set());
  const [previewText, setPreviewText] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      const [clientesRes, modulosRes] = await Promise.all([
        supabase.from('clientes').select('*').order('nome'),
        supabase.from('modulos_escopo').select('*').order('titulo'),
      ]);

      setClientes(clientesRes.data || []);
      setModulos(modulosRes.data || []);
      setLoading(false);
    }

    fetchData();
  }, []);

  // Generate preview when selections change
  useEffect(() => {
    if (!selectedCliente || selectedModulos.size === 0) {
      setPreviewText('');
      return;
    }

    const cliente = clientes.find((c) => c.id === selectedCliente);
    const modulosSelecionados = modulos.filter((m) => selectedModulos.has(m.id));

    if (!cliente) return;

    const valorTotal = modulosSelecionados.reduce((sum, m) => sum + Number(m.valor_padrao), 0);
    const dataEmissao = new Date().toLocaleDateString('pt-BR');

    const escopoDetalhado = modulosSelecionados
      .map((m) => {
        let text = `\n━━━ MÓDULO: ${m.titulo} (R$ ${Number(m.valor_padrao).toFixed(2)}) ━━━\n`;
        if (m.clausula_ia) {
          text += `\n${m.clausula_ia}`;
        }
        return text;
      })
      .join('\n');

    const contratoTexto = `
══════════════════════════════════════════════════════════════════
    MICRO-CONTRATO DE PRESTAÇÃO DE SERVIÇOS PROFISSIONAIS
══════════════════════════════════════════════════════════════════

CONTRATANTE (CLIENTE): ${cliente.nome}
CONTRATADO (PRESTADOR): [SEU NOME OU EMPRESA]

DATA DE EMISSÃO: ${dataEmissao}


╔══════════════════════════════════════════════════════════════════╗
║  I. INFORMAÇÕES GERAIS E VALOR                                   ║
╚══════════════════════════════════════════════════════════════════╝

O presente Micro-Contrato é regido pelo escopo modular detalhado abaixo.
O valor total acordado para os serviços é de: R$ ${valorTotal.toFixed(2)}


╔══════════════════════════════════════════════════════════════════╗
║  II. DETALHAMENTO DE ESCOPO E CLÁUSULAS JURÍDICAS                ║
╚══════════════════════════════════════════════════════════════════╝
${escopoDetalhado}


╔══════════════════════════════════════════════════════════════════╗
║  III. CLÁUSULA DE ENCERRAMENTO                                   ║
╚══════════════════════════════════════════════════════════════════╝

Este documento substitui qualquer acordo prévio, garantindo que o
Contratado possua amparo contratual limitado ao escopo aqui definido.

A formalização deste contrato ocorre mediante o primeiro pagamento
do Contratante.

══════════════════════════════════════════════════════════════════
`.trim();

    setPreviewText(contratoTexto);
  }, [selectedCliente, selectedModulos, clientes, modulos]);

  function toggleModulo(id: string) {
    const newSet = new Set(selectedModulos);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedModulos(newSet);
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(previewText);
    setCopied(true);
    toast.success('Contrato copiado!');
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSave() {
    if (!selectedCliente || selectedModulos.size === 0) {
      toast.error('Selecione um cliente e pelo menos um módulo');
      return;
    }

    setSaving(true);

    const cliente = clientes.find((c) => c.id === selectedCliente);
    const modulosSelecionados = modulos.filter((m) => selectedModulos.has(m.id));
    const valorTotal = modulosSelecionados.reduce((sum, m) => sum + Number(m.valor_padrao), 0);

    const modulosJson: ModuloContratoItem[] = modulosSelecionados.map((m) => ({
      id: m.id,
      titulo: m.titulo,
      valor: Number(m.valor_padrao),
      clausula: m.clausula_ia,
    }));

    const { error } = await supabase.from('contratos').insert([{
      cliente_id: selectedCliente,
      titulo: `Contrato ${cliente?.nome} - R$ ${valorTotal.toFixed(2)}`,
      modulos_json: modulosJson as any,
      valor_total: valorTotal,
      texto_contrato: previewText,
    }]);

    setSaving(false);

    if (error) {
      toast.error('Erro ao salvar contrato');
      return;
    }

    toast.success('Contrato salvo com sucesso!');
    navigate('/contratos');
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const valorTotal = modulos
    .filter((m) => selectedModulos.has(m.id))
    .reduce((sum, m) => sum + Number(m.valor_padrao), 0);

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
        <h1 className="page-title">Novo Contrato</h1>
        <p className="page-subtitle">Selecione cliente e módulos para gerar o contrato</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Selection */}
        <div className="space-y-6">
          {/* Client Selection */}
          <Card className="p-4">
            <Label className="mb-2 block">Cliente</Label>
            {clientes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum cliente cadastrado. Cadastre um cliente primeiro.
              </p>
            ) : (
              <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Card>

          {/* Module Selection */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Label>Módulos</Label>
              <span className="text-sm font-semibold">
                Total: {formatCurrency(valorTotal)}
              </span>
            </div>

            {modulos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum módulo cadastrado. Crie módulos primeiro.
              </p>
            ) : (
              <div className="space-y-3">
                {modulos.map((modulo) => (
                  <div
                    key={modulo.id}
                    className="flex items-start gap-3 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => toggleModulo(modulo.id)}
                  >
                    <Checkbox
                      checked={selectedModulos.has(modulo.id)}
                      onCheckedChange={() => toggleModulo(modulo.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{modulo.titulo}</div>
                      <div className="text-sm text-success">
                        {formatCurrency(Number(modulo.valor_padrao))}
                      </div>
                      {modulo.descricao && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {modulo.descricao}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Pré-visualização
              </Label>
              {previewText && (
                <Button variant="secondary" size="sm" onClick={copyToClipboard}>
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
              )}
            </div>

            {previewText ? (
              <pre className="text-xs font-mono bg-secondary p-4 rounded-md overflow-x-auto whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                {previewText}
              </pre>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                Selecione um cliente e módulos para ver a pré-visualização
              </div>
            )}
          </Card>

          {previewText && (
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Contrato'}
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}