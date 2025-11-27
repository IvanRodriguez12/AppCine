// functions/src/routes/paymentsMp.ts
import { Router } from 'express';
import { crearOrdenCandyDesdePagoMp } from '../services/candyOrders';
import { reservarAsientos } from '../services/firestoreTickets';
import {
  crearPreferenciaCandyMp,
  crearPreferenciaTicketMp,
  obtenerPagoMp,
  crearPreferenciaSubscriptionMp,   
} from '../services/paymentsMP';
import { db } from '../config/firebase'; 
import { PREMIUM_PLAN } from '../config/subscriptionPlan'; 

const router = Router();

/**
 * POST /payments/mp/create-preference
 * Candy
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

/**
 * POST /payments/mp/create-ticket-preference
 * Tickets
 */
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
 * POST /payments/mp/create-subscription-preference
 * Suscripción Premium
 */
router.post('/create-subscription-preference', async (req, res) => {
  try {
    const { userId } = req.body;

    const pref = await crearPreferenciaSubscriptionMp({ userId });

    return res.status(201).json(pref);
  } catch (error: any) {
    console.error('Error creando preferencia de suscripción MP:', error);
    return res
      .status(500)
      .json({ error: 'No se pudo crear la preferencia de pago para suscripción' });
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

    // Leer pago real de MercadoPago
    const pago: any = await obtenerPagoMp(paymentId);

    console.log(
      'Pago obtenido desde MP:',
      pago.id,
      pago.status,
      pago.status_detail
    );

    console.log('=== METADATA PAGO ===');
    console.log(JSON.stringify(pago.metadata, null, 2));

    // Procesamiento
    if (pago.status === 'approved' && pago.metadata) {
      const metadata = pago.metadata as any;

      // 1) Candy
      if (metadata?.tipo === 'candy') {
        try {
          const userId = metadata.userId || metadata.user_id;
          if (
            !userId ||
            !Array.isArray(metadata.items) ||
            metadata.items.length === 0
          ) {
            console.warn('Metadata de Candy incompleta:', metadata);
          } else {
            await crearOrdenCandyDesdePagoMp({
              userId,
              items: metadata.items,
              paymentId: pago.id,
              descuento: metadata.descuento ?? 0,
              feeServicio: metadata.feeServicio ?? 0,
            });

            console.log(`Orden de Candy creada. paymentId=${pago.id}`);
          }
        } catch (ordenError) {
          console.error('Error creando orden de Candy:', ordenError);
        }
      }

      // 2) Tickets
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
            console.warn('Metadata de ticket incompleta:', metadata);
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
          console.error('Error creando ticket:', ticketError);
        }
      }

      // 3) NUEVO: Suscripción Premium
      else if (metadata?.tipo === 'subscription') {
        try {
          const userId = metadata.userId || metadata.user_id;
          const months =
            typeof metadata.months === 'number' ? metadata.months : PREMIUM_PLAN.months;

          if (!userId) {
            console.warn('Metadata de suscripción sin userId');
          } else {
            const userRef = db.collection('users').doc(userId);
            const userSnap = await userRef.get();

            let baseDate = new Date();

            // Extender si ya tenía premium activo
            if (userSnap.exists) {
              const data = userSnap.data() as any;
              if (data.premiumUntilAt) {
                const currentUntil = new Date(data.premiumUntilAt);
                if (!isNaN(currentUntil.getTime()) && currentUntil > baseDate) {
                  baseDate = currentUntil;
                }
              }
            }

            // Sumar meses del plan
            const newUntil = new Date(baseDate);
            newUntil.setMonth(newUntil.getMonth() + months);

            await userRef.update({
              isPremium: true,
              premiumUntilAt: newUntil.toISOString(),
              accountLevel: 'premium',
              updatedAt: new Date().toISOString(),
            });

            console.log(
              `Usuario ${userId} actualizado a PREMIUM hasta ${newUntil.toISOString()}`
            );
          }
        } catch (subError) {
          console.error('Error procesando suscripción premium:', subError);
        }
      }
    }

    return res.status(200).send('ok');

  } catch (error) {
    console.error('Error procesando webhook MP:', error);
    return res.status(200).send('ok');
  }
});

export default router;