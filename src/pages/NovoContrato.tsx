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
import { FileText, Copy, Check, Download, Share2 } from 'lucide-react';
import jsPDF from 'jspdf';
import type { Cliente, ModuloEscopo, ModuloContratoItem } from '@/types/database';

interface Configuracoes {
  nome_prestador: string | null;
  empresa: string | null;
}

export default function NovoContrato() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [modulos, setModulos] = useState<ModuloEscopo[]>([]);
  const [configuracoes, setConfiguracoes] = useState<Configuracoes | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [selectedModulos, setSelectedModulos] = useState<Set<string>>(new Set());
  const [previewText, setPreviewText] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      const [clientesRes, modulosRes, configRes] = await Promise.all([
        supabase.from('clientes').select('*').order('nome'),
        supabase.from('modulos_escopo').select('*').order('titulo'),
        supabase.from('configuracoes').select('nome_prestador, empresa').maybeSingle(),
      ]);

      setClientes(clientesRes.data || []);
      setModulos(modulosRes.data || []);
      setConfiguracoes(configRes.data);
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

    // Determinar nome do prestador
    let nomePrestador = '[Configure seu nome em Configurações]';
    if (configuracoes?.empresa && configuracoes?.nome_prestador) {
      nomePrestador = `${configuracoes.empresa} (${configuracoes.nome_prestador})`;
    } else if (configuracoes?.empresa) {
      nomePrestador = configuracoes.empresa;
    } else if (configuracoes?.nome_prestador) {
      nomePrestador = configuracoes.nome_prestador;
    }

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
============================================================
           MICRO-CONTRATO DE PRESTAÇÃO DE SERVIÇOS PROFISSIONAIS
============================================================

CONTRATANTE (CLIENTE): ${cliente.nome}
CONTRATADO (PRESTADOR): ${nomePrestador}

DATA DE EMISSÃO: ${dataEmissao}


--- I. INFORMAÇÕES GERAIS E VALOR ---

O presente Micro-Contrato é regido pelo escopo modular detalhado abaixo.
O valor total acordado para os serviços é de: R$ ${valorTotal.toFixed(2)}


--- II. DETALHAMENTO DE ESCOPO E CLÁUSULAS JURÍDICAS ---
${escopoDetalhado}


--- III. CLÁUSULA DE ENCERRAMENTO ---

Este documento substitui qualquer acordo prévio, garantindo que o
Contratado possua amparo contratual limitado ao escopo aqui definido.

A formalização deste contrato ocorre mediante o primeiro pagamento
do Contratante.

============================================================
`.trim();

    setPreviewText(contratoTexto);
  }, [selectedCliente, selectedModulos, clientes, modulos, configuracoes]);

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

  // --- NOVA FUNÇÃO DE PDF PROFISSIONAL ---
  function downloadPDF() {
    // 1. Prepara os dados
    const cliente = clientes.find((c) => c.id === selectedCliente);
    const modulosSelecionados = modulos.filter((m) => selectedModulos.has(m.id));
    
    if (!cliente) {
        toast.error('Selecione um cliente primeiro');
        return;
    }

    const valorTotal = modulosSelecionados.reduce((sum, m) => sum + Number(m.valor_padrao), 0);

    // 2. Configura o documento
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let y = 20; // Cursor vertical inicial

    // Função auxiliar para quebrar texto longo
    const addWrappedText = (text: string, fontSize: number = 10, fontType: string = 'normal', color: string = '#000000') => {
      doc.setFont('helvetica', fontType);
      doc.setFontSize(fontSize);
      doc.setTextColor(color);
      
      const lines = doc.splitTextToSize(text, contentWidth);
      
      // Verifica se cabe na página
      if (y + (lines.length * 5) > 280) {
        doc.addPage();
        y = 20;
      }
      
      doc.text(lines, margin, y);
      y += (lines.length * 5) + 2; // Avança o cursor
    };

    // --- CABEÇALHO ---
    doc.setFillColor(26, 26, 26); // Cor escura (quase preto)
    doc.rect(0, 0, pageWidth, 40, 'F'); // Faixa no topo
    
    doc.setTextColor(255, 255, 255); // Texto branco
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('MICRO-CONTRATO DE SERVIÇOS', margin, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Documento gerado via Blinscopo', margin, 28);

    y = 55; // Pula a faixa escura

    // --- PARTES ---
    doc.setTextColor(0, 0, 0); // Volta para preto
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('1. PARTES ENVOLVIDAS', margin, y);
    y += 8;

    // Caixa cinza para os dados
    doc.setFillColor(245, 245, 245);
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, y, contentWidth, 35, 'FD');
    
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATANTE (CLIENTE):', margin + 5, y);
    doc.setFont('helvetica', 'normal');
    doc.text(cliente.nome.toUpperCase(), margin + 60, y);
    
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATADO (PRESTADOR):', margin + 5, y);
    doc.setFont('helvetica', 'normal');
    // Pega o nome das configurações ou usa um placeholder
    const prestadorNome = configuracoes?.empresa || configuracoes?.nome_prestador || 'PRESTADOR DE SERVIÇOS';
    doc.text(prestadorNome.toUpperCase(), margin + 60, y);

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('DATA DE EMISSÃO:', margin + 5, y);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString('pt-BR'), margin + 60, y);

    y += 25; // Sai da caixa

    // --- ESCOPO (O CORAÇÃO) ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('2. ESCOPO E VALORES', margin, y);
    y += 10;

    modulosSelecionados.forEach((modulo, index) => {
      // Verifica quebra de página antes de começar um módulo novo
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Título do Módulo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`2.${index + 1} ${modulo.titulo}`, margin, y);
      
      // Valor na direita
      const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(modulo.valor_padrao));
      doc.text(valorFormatado, pageWidth - margin - doc.getTextWidth(valorFormatado), y);
      
      y += 6;

      // Descrição do serviço
      if (modulo.descricao) {
        addWrappedText(modulo.descricao, 10, 'normal', '#444444');
        y += 2;
      }

      // Cláusula IA (Destaque)
      if (modulo.clausula_ia) {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.1);
        doc.line(margin, y, margin + 2, y + 10); // Linha vertical decorativa
        
        doc.setFont('courier', 'normal'); // Fonte monoespaçada para parecer "código/lei"
        const lines = doc.splitTextToSize(modulo.clausula_ia, contentWidth - 5);
        
        if (y + (lines.length * 4) > 280) { doc.addPage(); y = 20; }

        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(lines, margin + 5, y + 4);
        y += (lines.length * 4) + 8;
      }

      y += 5; // Espaço entre módulos
    });

    // --- TOTAL ---
    y += 5;
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, y, pageWidth - margin, y); // Linha separadora
    y += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('VALOR TOTAL:', margin, y);
    
    const totalFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal);
    doc.text(totalFormatado, pageWidth - margin - doc.getTextWidth(totalFormatado), y);

    // --- ASSINATURAS ---
    // Joga para o final da página (ou cria nova se não couber)
    if (y < 220) y = 240;
    else {
        doc.addPage();
        y = 240;
    }

    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 70, y); // Linha 1
    doc.line(pageWidth - margin - 70, y, pageWidth - margin, y); // Linha 2

    y += 5;
    doc.setFontSize(8);
    doc.text('CONTRATANTE', margin, y);
    doc.text('CONTRATADO', pageWidth - margin - 70, y);

    // Salva o arquivo
    const fileName = `Contrato-${cliente.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`;
    doc.save(fileName);
    toast.success('PDF Profissional gerado!');
  }

  function handleShare() {
    const shareUrl = 'https://blinscopo.lovable.app/'; 
    
    const shareData = {
        title: 'Micro-Contrato Blinscopo',
        text: 'Segue o Micro-Contrato Blinscopo para análise e aprovação:',
        url: shareUrl, 
    };

    if (navigator.share) {
        navigator.share(shareData)
            .then(() => toast.success('Conteúdo compartilhado com sucesso!'))
            .catch((error) => console.error('Erro ao compartilhar:', error));
    } else {
        const encodedText = encodeURIComponent(shareData.text + "\n\n" + previewText);
        const whatsappUrl = `https://wa.me/?text=${encodedText}`;
        window.open(whatsappUrl, '_blank');
        toast.info('Abrindo WhatsApp...');
    }
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
            <div className="flex flex-col sm:flex-row gap-2">
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Contrato'}
              </Button>
              <Button variant="secondary" onClick={downloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}