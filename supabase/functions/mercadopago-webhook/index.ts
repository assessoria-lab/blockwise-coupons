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
    const body = await req.json();
    console.log('Mercado Pago webhook received:', body);

    // Verifica se é notificação de pagamento
    if (body.type !== 'payment') {
      console.log('Ignoring non-payment notification');
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    const paymentId = body.data.id;

    // Busca detalhes do pagamento
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!paymentResponse.ok) {
      throw new Error('Erro ao buscar pagamento no Mercado Pago');
    }

    const payment = await paymentResponse.json();
    console.log('Payment details:', { id: payment.id, status: payment.status, external_reference: payment.external_reference });

    // Busca o pagamento no banco
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: pagamentoDb, error: pagamentoError } = await supabase
      .from('pagamentos')
      .select('*')
      .eq('id', payment.external_reference)
      .single();

    if (pagamentoError || !pagamentoDb) {
      console.error('Pagamento não encontrado no banco:', payment.external_reference);
      throw new Error('Pagamento não encontrado');
    }

    // Atualiza status do pagamento
    let novoStatus = 'pendente';
    if (payment.status === 'approved') {
      novoStatus = 'aprovado';
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      novoStatus = 'cancelado';
    }

    await supabase
      .from('pagamentos')
      .update({
        status_pagamento: novoStatus,
        data_aprovacao: payment.status === 'approved' ? new Date().toISOString() : null,
        dados_pagamento: payment,
      })
      .eq('id', pagamentoDb.id);

    // Se aprovado, transfere os blocos
    if (payment.status === 'approved' && pagamentoDb.status_pagamento !== 'aprovado') {
      console.log('Processing approved payment:', { pagamentoId: pagamentoDb.id, lojistaId: pagamentoDb.lojista_id });

      const { data: resultado, error: vendaError } = await supabase.rpc('vender_blocos_para_lojista_v2', {
        p_lojista_id: pagamentoDb.lojista_id,
        p_quantidade_blocos: pagamentoDb.quantidade_blocos,
        p_valor_total: pagamentoDb.valor,
        p_forma_pagamento: pagamentoDb.forma_pagamento,
      });

      if (vendaError) {
        console.error('Erro ao vender blocos:', vendaError);
        throw vendaError;
      }

      console.log('Blocos vendidos com sucesso:', resultado);

      // Log da transação
      await supabase.from('logs_sistema').insert({
        lojista_id: pagamentoDb.lojista_id,
        evento: 'compra_blocos_mercadopago',
        descricao: 'Compra de blocos via Mercado Pago aprovada',
        dados_contexto: {
          pagamento_id: pagamentoDb.id,
          mercadopago_payment_id: payment.id,
          quantidade_blocos: pagamentoDb.quantidade_blocos,
          valor: pagamentoDb.valor,
        },
        nivel: 'info',
      });
    }

    return new Response(
      JSON.stringify({ received: true, processed: payment.status === 'approved' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in mercadopago-webhook:', error);
    return new Response(
      JSON.stringify({ received: true, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Sempre retorna 200 para não receber novamente
      }
    );
  }
});
