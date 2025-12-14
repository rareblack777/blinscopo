import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { Contrato, Cliente } from '@/types/database';

type ContratoComCliente = Contrato & { clientes: Cliente };

export default function Auditor() {
  const [contratos, setContratos] = useState<ContratoComCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Inputs
  const [selectedContratoId, setSelectedContratoId] = useState<string>('');
  const [clientMessage, setClientMessage] = useState('');
  
  // Resultado da IA
  const [analise, setAnalise] = useState<{
    status: 'safe' | 'danger' | 'warning';
    message: string;
    suggestion: string;
  } | null>(null);

  useEffect(() => {
    fetchContratos();
  }, []);

  async function fetchContratos() {
    const { data, error } = await supabase
      .from('contratos')
      .select('*, clientes(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setContratos(data as any);
    }
    setLoading(false);
  }

  async function handleAnalyze() {
    if (!selectedContratoId || !clientMessage) {
      toast.error('Selecione um contrato e cole a mensagem do cliente');
      return;
    }

    setAnalyzing(true);
    setAnalise(null);

    try {
      // 1. Pega o texto do contrato selecionado
      const contrato = contratos.find(c => c.id === selectedContratoId);
      
      if (!contrato?.texto_contrato) {
        toast.error('O contrato selecionado não possui texto salvo para análise.');
        setAnalyzing(false);
        return;
      }

      // 2. Chama a IA de verdade (Edge Function)
      const { data, error } = await supabase.functions.invoke('audit-scope', {
        body: {
          contratoTexto: contrato.texto_contrato,
          mensagemCliente: clientMessage,
        },
      });

      if (error) throw error;

      // 3. Atualiza com o resultado real
      setAnalise(data);
      toast.success('Análise da IA concluída!');

    } catch (error) {
      console.error('Erro na auditoria:', error);
      toast.error('Falha ao conectar com o Auditor IA. Verifique se a Edge Function está ativa.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function copyResponse() {
    if (analise?.suggestion) {
      await navigator.clipboard.writeText(analise.suggestion);
      toast.success('Resposta copiada para a área de transferência');
    }
  }

  if (loading) {
    return <Layout><div className="p-8 text-muted-foreground">Carregando auditor...</div></Layout>;
  }

  return (
    <Layout>
      <div className="page-header mb-8">
        <h1 className="page-title flex items-center gap-2">
          <ShieldAlert className="h-8 w-8 text-primary" />
          Auditor de Escopo
        </h1>
        <p className="page-subtitle">
          A IA analisa se o pedido do cliente está dentro ou fora do contrato.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* LADO ESQUERDO: O CENÁRIO (INPUTS) */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>1. Qual contrato devemos defender?</Label>
              <Select value={selectedContratoId} onValueChange={setSelectedContratoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o contrato ativo..." />
                </SelectTrigger>
                <SelectContent>
                  {contratos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.clientes?.nome} - {c.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>2. O que o cliente pediu? (Cole o WhatsApp/Email)</Label>
              <Textarea 
                placeholder="Ex: 'Oi, pode mudar a cor do botão rapidinho? E adicionar mais uma página?'"
                className="h-40 resize-none"
                value={clientMessage}
                onChange={(e) => setClientMessage(e.target.value)}
              />
            </div>

            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleAnalyze} 
              disabled={analyzing || !selectedContratoId || !clientMessage}
            >
              {analyzing ? 'A IA está lendo o contrato...' : 'Auditar Pedido'}
              {!analyzing && <ShieldAlert className="ml-2 h-4 w-4" />}
            </Button>
          </Card>
        </div>

        {/* LADO DIREITO: O VEREDITO (OUTPUT) */}
        <div className="space-y-6">
          {analise ? (
            <Card className={`p-6 border-l-4 ${
              analise.status === 'danger' ? 'border-l-red-500 bg-red-50/50' : 
              analise.status === 'warning' ? 'border-l-yellow-500' : 'border-l-green-500'
            }`}>
              <div className="flex items-start gap-4">
                {analise.status === 'danger' ? (
                  <AlertTriangle className="h-6 w-6 text-red-600 mt-1 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-1 shrink-0" />
                )}
                <div className="space-y-4 w-full">
                  <div>
                    <h3 className="font-bold text-lg">Veredito da IA</h3>
                    <p className="text-muted-foreground">{analise.message}</p>
                  </div>
                  
                  <div className="bg-background p-4 rounded-md border border-dashed">
                    <Label className="text-xs uppercase text-muted-foreground mb-2 block">Sugestão de Resposta</Label>
                    <p className="text-sm italic mb-3">"{analise.suggestion}"</p>
                    <Button variant="outline" size="sm" onClick={copyResponse}>
                      Copiar Resposta
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 border-dashed flex flex-col items-center justify-center text-center text-muted-foreground h-full min-h-[300px]">
              <ShieldAlert className="h-12 w-12 mb-4 opacity-20" />
              <p>Selecione um contrato e cole a mensagem para receber o veredito.</p>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
