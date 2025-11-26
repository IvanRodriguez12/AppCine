// functions/src/routes/paymentsMp.ts
import { Router } from 'express';
import { crearOrdenCandyDesdePagoMp } from '../services/candyOrders';
import { reservarAsientos } from '../services/firestoreTickets';
import {
  crearPreferenciaCandyMp,
  crearPreferenciaTicketMp,
  obtenerPagoMp,
} from '../services/paymentsMP';

const router = Router();

/**
 * POST /payments/mp/create-preference
 * Body esperado:
 * {
 *   "userId": "abc123",
 *   "items": [
 *     { "productId": "candyId1", "tamanio": "mediano", "quantity": 2 },
 *     { "productId": "candyId2", "tamanio": "único", "quantity": 1 }
 *   ],
 *   "description": "Opcional"
 * }
 */
router.post('/create-preference', async (req, res) => {
  try {
    const pref = await crearPreferenciaCandyMp(req.body);
    return res.status(201).json(pref);
  } catch (error: any) {
    console.error('Error creando preferencia MP:', error);
    return res
      .status(400)
      .json({ error: error.message ?? 'Error creando preferencia' });
  }
});

router.post('/create-ticket-preference', async (req, res) => {
  try {
    const { userId, showtimeId, asientos, total, description } = req.body;

    const preference = await crearPreferenciaTicketMp({
      userId,
      showtimeId,
      asientos,
      total,
      description,
    });

    return res.status(201).json(preference);
  } catch (error) {
    console.error('Error creando preferencia MP para tickets:', error);
    return res
      .status(500)
      .json({ error: 'No se pudo crear la preferencia de pago para tickets' });
  }
});

/**
 * POST /payments/mp/webhook
 * Mercado Pago envía notificaciones acá
 */
router.post('/webhook', async (req, res) => {
  try {
    console.log('Webhook Mercado Pago recibido');
    console.log('Query:', req.query);
    console.log('Body:', JSON.stringify(req.body));

    // Formatos típicos:
    // ?type=payment&data.id=123
    // ?topic=payment&id=123
    const paymentId =
      (req.query['data.id'] as string) ||
      (req.query.id as string) ||
      (req.body?.data && req.body.data.id);

    const type =
      (req.query.type as string) ||
      (req.query.topic as string) ||
      req.body?.type;

    if (!paymentId || type !== 'payment') {
      console.warn('Webhook inválido: falta paymentId o type != payment');
      return res.status(200).send('ignored');
    }

    // Consultar el pago en MP
    const pago: any = await obtenerPagoMp(paymentId);

    console.log(
      'Pago obtenido desde MP:',
      pago.id,
      pago.status,
      pago.status_detail
    );

    // Log extra para ver qué nos está mandando MP
    console.log('=== METADATA PAGO ===');
    console.log(JSON.stringify(pago.metadata, null, 2));

    // Si el pago está aprobado y trae metadata, procesamos
    if (pago.status === 'approved' && pago.metadata) {
      const metadata = pago.metadata as any;

      // 1) Compras de Candy
      if (metadata?.tipo === 'candy') {
        try {
          const userId = metadata.userId || metadata.user_id;
          if (
            !userId ||
            !Array.isArray(metadata.items) ||
            metadata.items.length === 0
          ) {
            console.warn(
              'Metadata de Candy incompleta en pago MP:',
              metadata
            );
          } else {
            await crearOrdenCandyDesdePagoMp({
              userId,
              items: metadata.items,
              paymentId: pago.id,
              descuento: metadata.descuento ?? 0,
              feeServicio: metadata.feeServicio ?? 0,
            });

            console.log(
              `Orden de Candy creada desde pago MP. paymentId=${pago.id}`
            );
          }
        } catch (ordenError) {
          console.error(
            'Error creando orden de Candy desde webhook MP:',
            ordenError
          );
          // Igual respondemos 200 para que MP no reintente infinitamente
        }
      }

      // 2) Compras de Tickets
      else if (metadata?.tipo === 'ticket') {
        try {
          const { userId, showtimeId, asientos, total } = metadata;

          if (
            !userId ||
            !showtimeId ||
            !Array.isArray(asientos) ||
            asientos.length === 0 ||
            typeof total !== 'number'
          ) {
            console.warn(
              'Metadata de ticket incompleta en pago MP:',
              metadata
            );
          } else {
            const { ticketId } = await reservarAsientos(
              showtimeId,
              userId,
              asientos,
              total,
              'mercadopago'
            );

            console.log(
              `Ticket creado desde pago MP. paymentId=${pago.id}, ticketId=${ticketId}`
            );
          }
        } catch (ticketError) {
          console.error('Error creando ticket desde webhook MP:', ticketError);
          // Igual respondemos 200 para que MP no reintente infinitamente
        }
      }
    }

    // Importante: MP puede reenviar el mismo webhook varias veces → siempre responder 200
    return res.status(200).send('ok');
  } catch (error) {
    console.error('Error procesando webhook MP:', error);
    // Igual respondemos 200 para que MP no siga reintentando indefinidamente
    return res.status(200).send('ok');
  }
});

export default router;