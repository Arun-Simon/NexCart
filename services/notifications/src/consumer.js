'use strict';

const amqp = require('amqplib');
const { pool } = require('./db');

const RABBITMQ_URL  = process.env.RABBITMQ_URL  || 'amqp://guest:guest@localhost:5672';
const EXCHANGE_NAME = 'nexcart';
const QUEUE_NAME    = 'order.placed';
const RETRY_DELAY   = 3000;
const MAX_RETRIES   = 10;

const saveNotification = async (payload) => {
  const { orderId, userId, total } = payload;
  const title = 'Order Placed Successfully!';
  const body  = `Your order #${orderId.slice(0, 8)} has been placed. Total: $${total}`;

  await pool.query(
    `INSERT INTO notifications.notifications
       (user_id, type, title, body, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, 'order.placed', title, body, JSON.stringify(payload)]
  );
  console.log(`[notifications-mq] Saved notification for user ${userId}, order ${orderId}`);
};

const startConsumer = async (retries = 0) => {
  try {
    const conn = await amqp.connect(RABBITMQ_URL);
    conn.on('error',  (err) => console.error('[notifications-mq] Connection error:', err.message));
    conn.on('close',  ()    => {
      console.warn('[notifications-mq] Connection closed — reconnecting in 3s');
      setTimeout(() => startConsumer(0), RETRY_DELAY);
    });

    const ch = await conn.createChannel();
    await ch.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    const q  = await ch.assertQueue(QUEUE_NAME, { durable: true });
    await ch.bindQueue(q.queue, EXCHANGE_NAME, 'order.placed');
    ch.prefetch(1);

    console.log(`[notifications-mq] Listening on queue "${QUEUE_NAME}"`);

    ch.consume(q.queue, async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        await saveNotification(payload);
        ch.ack(msg);
      } catch (err) {
        console.error('[notifications-mq] Failed to process message:', err.message);
        ch.nack(msg, false, false); // dead-letter
      }
    });
  } catch (err) {
    if (retries < MAX_RETRIES) {
      console.warn(`[notifications-mq] RabbitMQ not ready — retry ${retries + 1}/${MAX_RETRIES}`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY));
      return startConsumer(retries + 1);
    }
    console.error('[notifications-mq] Could not connect after max retries:', err.message);
  }
};

module.exports = { startConsumer };
