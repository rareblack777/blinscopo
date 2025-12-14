import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contratoTexto, mensagemCliente } = await req.json();

    if (!contratoTexto || !mensagemCliente) {
      throw new Error('Dados incompletos. Preciso do contrato e da mensagem.');
    }

    console.log("Iniciando auditoria de escopo...");

    // AQUI MORA A MÁGICA: O PROMPT DO "CÃO DE GUARDA"
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Modelo rápido e inteligente o suficiente
        messages: [
          {
            role: 'system',
            content: `Você é o Auditor Sênior do 'BlinScopo'. Sua função é proteger o prestador de serviços.
            
            Sua tarefa:
            1. Ler o escopo do contrato (o que foi vendido).
            2. Ler a mensagem do cliente (o que foi pedido).
            3. Determinar SEVERAMENTE se o pedido está DENTRO ou FORA do escopo.
            
            Regras de Personalidade:
            - Seja direto, técnico e protetor.
            - Se houver dúvida, assuma que é escopo EXTRA (proteja o dinheiro do prestador).
            - Não use juridiquês excessivo, use linguagem de negócios firme.

            SAÍDA ESPERADA (JSON ESTRITO):
            {
              "status": "safe" | "warning" | "danger",
              "message": "Explicação curta de 1 frase sobre o veredito.",
              "suggestion": "Texto de resposta diplomática mas firme para o usuário copiar e mandar no WhatsApp."
            }
            
            Critérios:
            - SAFE: O pedido está claramente coberto.
            - WARNING: O pedido é ambíguo ou uma pequena alteração aceitável.
            - DANGER: O pedido é claramente trabalho extra não pago.
            `
          },
          {
            role: 'user',
            content: `CONTRATO VIGENTE:\n${contratoTexto}\n\n---\n\nPEDIDO DO CLIENTE:\n${mensagemCliente}`
          }
        ],
        temperature: 0.3, // Baixa criatividade para ser mais analítico
      }),
    });

    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    
    // Limpeza para garantir que venha apenas o JSON (caso a IA fale algo antes)
    const jsonString = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(jsonString);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

