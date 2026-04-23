'use strict';

const amqp = require('amqplib');

const RABBITMQ_URL  = process.env.RABBITMQ_URL  || 'amqp://guest:guest@localhost:5672';
const EXCHANGE_NAME = 'nexcart';
const RETRY_DELAY   = 3000;
const MAX_RETRIES   = 10;

let channel = null;

const connectRabbitMQ = async (retries = 0) => {
  try {
    const conn = await amqp.connect(RABBITMQ_URL);
    conn.on('error', (err) => { console.error('[orders-mq] Connection error:', err.message); });
    conn.on('close', () => {
      console.warn('[orders-mq] Connection closed — reconnecting in 3s');
      setTimeout(() => connectRabbitMQ(0), RETRY_DELAY);
    });

    channel = await conn.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    console.log('[orders-mq] Connected to RabbitMQ');
    return channel;
  } catch (err) {
    if (retries < MAX_RETRIES) {
      console.warn(`[orders-mq] RabbitMQ not ready — retry ${retries + 1}/${MAX_RETRIES}`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY));
      return connectRabbitMQ(retries + 1);
    }
    console.error('[orders-mq] Could not connect to RabbitMQ after max retries:', err.message);
    throw err;
  }
};

/**
 * Publish a message to the nexcart exchange with the given routing key.
 */
const publish = async (routingKey, payload) => {
  if (!channel) {
    console.warn('[orders-mq] Channel not ready — skipping publish');
    return;
  }
  const content = Buffer.from(JSON.stringify(payload));
  channel.publish(EXCHANGE_NAME, routingKey, content, {
    persistent:  true,
    contentType: 'application/json',
  });
  console.log(`[orders-mq] Published to ${routingKey}:`, payload);
};

module.exports = { connectRabbitMQ, publish };
