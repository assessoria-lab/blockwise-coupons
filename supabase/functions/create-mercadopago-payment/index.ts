import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lojistaId, quantidadeBlocos, valorTotal } = await req.json();

    console.log('Creating Mercado Pago payment:', { lojistaId, quantidadeBlocos, valorTotal });

    // Valida entrada
    if (!lojistaId || !quantidadeBlocos || !valorTotal) {
      throw new Error('Dados incompletos');
    }

    // Busca dados do lojista
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verifica se há blocos disponíveis no pool
    const { count: blocosDisponiveis, error: countError } = await supabase
      .from('blocos')
      .select('*', { count: 'exact', head: true })
      .is('lojista_id', null)
      .eq('status', 'disponivel');

    if (countError) {
      console.error('Erro ao verificar blocos disponíveis:', countError);
      throw new Error('Erro ao verificar disponibilidade de blocos');
    }

    if (!blocosDisponiveis || blocosDisponiveis < quantidadeBlocos) {
      console.warn('Blocos insuficientes:', { solicitado: quantidadeBlocos, disponivel: blocosDisponiveis });
      throw new Error(`Não há blocos suficientes disponíveis. Disponível: ${blocosDisponiveis || 0}, Solicitado: ${quantidadeBlocos}`);
    }

    const { data: lojista, error: lojistaError } = await supabase
      .from('lojistas')
      .select('nome_loja, email')
      .eq('id', lojistaId)
      .single();

    if (lojistaError || !lojista) {
      throw new Error('Lojista não encontrado');
    }

    // Cria registro de pagamento (usa 'pix' como forma padrão já que MP aceita múltiplas formas)
    const { data: pagamento, error: pagamentoError } = await supabase
      .from('pagamentos')
      .insert({
        lojista_id: lojistaId,
        quantidade_blocos: quantidadeBlocos,
        valor: valorTotal,
        forma_pagamento: 'pix',
        status_pagamento: 'pendente',
      })
      .select()
      .single();

    if (pagamentoError) {
      console.error('Erro ao criar pagamento:', pagamentoError);
      throw new Error(`Erro ao criar registro de pagamento: ${pagamentoError.message}`);
    }

    // Cria preferência no Mercado Pago
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('Token do Mercado Pago não configurado');
    }

    // Detecta se é ambiente de teste (token começa com TEST-)
    const isTestMode = accessToken.startsWith('TEST-');
    console.log('Mercado Pago mode:', isTestMode ? 'TEST' : 'PRODUCTION');

    const preference = {
      items: [
        {
          title: `${quantidadeBlocos} Bloco${quantidadeBlocos > 1 ? 's' : ''} de Cupons - ${lojista.nome_loja}`,
          description: `Compra de ${quantidadeBlocos} bloco(s) com 100 cupons cada`,
          quantity: 1,
          unit_price: valorTotal,
          currency_id: 'BRL',
        }
      ],
      payer: {
        email: lojista.email || 'contato@showpremios.com.br',
        name: lojista.nome_loja,
      },
      back_urls: {
        success: `${Deno.env.get('APP_URL')}/lojista?payment=success`,
        failure: `${Deno.env.get('APP_URL')}/lojista?payment=failure`,
        pending: `${Deno.env.get('APP_URL')}/lojista?payment=pending`,
      },
      auto_return: 'approved',
      external_reference: pagamento.id,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
      payment_methods: {
        installments: 12,
      },
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.json();
      console.error('Mercado Pago error:', errorData);
      throw new Error('Erro ao criar pagamento no Mercado Pago');
    }

    const mpData = await mpResponse.json();

    // Atualiza pagamento com referência externa
    await supabase
      .from('pagamentos')
      .update({
        referencia_externa: mpData.id,
        dados_pagamento: mpData,
      })
      .eq('id', pagamento.id);

    // Usa sandbox_init_point se for ambiente de teste
    const initPoint = isTestMode ? mpData.sandbox_init_point : mpData.init_point;
    
    console.log('Payment created successfully:', { 
      paymentId: pagamento.id, 
      preferenceId: mpData.id,
      mode: isTestMode ? 'TEST' : 'PRODUCTION',
      initPoint 
    });

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: pagamento.id,
        initPoint: initPoint,
        preferenceId: mpData.id,
        testMode: isTestMode,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-mercadopago-payment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
