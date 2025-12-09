import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é um advogado especialista em contratos para prestadores de serviço autônomos e freelancers.

Sua função é gerar cláusulas jurídicas curtas e objetivas que protejam o freelancer/prestador de serviço.

Regras:
1. Seja direto e use linguagem clara
2. Foque na proteção do prestador de serviço
3. Inclua limitações de escopo
4. Defina exclusões importantes
5. Mantenha o texto em português brasileiro formal
6. Gere no máximo 3 parágrafos curtos

Estrutura sugerida:
- Parágrafo 1: Limitação de escopo e entregáveis
- Parágrafo 2: Exclusões e propriedade intelectual  
- Parágrafo 3: Validade e condições`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { titulo, valor, descricao } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const horasEstimadas = Math.floor(valor / 150);
    
    const userPrompt = `Gere uma cláusula jurídica para o seguinte serviço de freelancer:

Serviço: ${titulo}
Descrição: ${descricao || 'Não especificada'}
Valor: R$ ${valor.toFixed(2)}
Horas estimadas: ${horasEstimadas} horas

A cláusula deve proteger o prestador limitando o escopo ao descrito acima.`;

    console.log('Generating clause for:', titulo);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao seu workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const clausula = data.choices?.[0]?.message?.content || '';

    console.log('Clause generated successfully');

    return new Response(JSON.stringify({ clausula }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gerar-clausula:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro ao gerar cláusula' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});