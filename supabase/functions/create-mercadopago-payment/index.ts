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
    const { lojistaId, quantidadeBlocos, valorTotal, formaPagamento } = await req.json();

    console.log('Creating Mercado Pago payment:', { lojistaId, quantidadeBlocos, valorTotal, formaPagamento });

    // Valida entrada
    if (!lojistaId || !quantidadeBlocos || !valorTotal || !formaPagamento) {
      throw new Error('Dados incompletos');
    }

    // Busca dados do lojista
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: lojista, error: lojistaError } = await supabase
      .from('lojistas')
      .select('nome_loja, email')
      .eq('id', lojistaId)
      .single();

    if (lojistaError || !lojista) {
      throw new Error('Lojista não encontrado');
    }

    // Cria registro de pagamento
    const { data: pagamento, error: pagamentoError } = await supabase
      .from('pagamentos')
      .insert({
        lojista_id: lojistaId,
        quantidade_blocos: quantidadeBlocos,
        valor: valorTotal,
        forma_pagamento: formaPagamento,
        status_pagamento: 'pendente',
      })
      .select()
      .single();

    if (pagamentoError) {
      throw new Error('Erro ao criar registro de pagamento');
    }

    // Cria preferência no Mercado Pago
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('Token do Mercado Pago não configurado');
    }

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
        success: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}.lovableproject.com/lojista?payment=success`,
        failure: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}.lovableproject.com/lojista?payment=failure`,
        pending: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}.lovableproject.com/lojista?payment=pending`,
      },
      auto_return: 'approved',
      external_reference: pagamento.id,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
      payment_methods: {
        excluded_payment_types: formaPagamento === 'pix' ? [{ id: 'credit_card' }, { id: 'debit_card' }] : [],
        installments: formaPagamento === 'cartao' ? 12 : 1,
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

    console.log('Payment created successfully:', { paymentId: pagamento.id, preferenceId: mpData.id });

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: pagamento.id,
        initPoint: mpData.init_point,
        preferenceId: mpData.id,
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
