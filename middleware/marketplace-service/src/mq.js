import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
let channel = null;

export const connectMQ = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange('marketplace_events', 'topic', { durable: true });
    console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('RabbitMQ connection failed:', error);
    // Retry logic could go here
  }
};

export const publishEvent = async (routingKey, data) => {
  if (!channel) {
    console.warn('MQ channel not established, skipping event publish');
    return;
  }
  channel.publish('marketplace_events', routingKey, Buffer.from(JSON.stringify(data)), {
    persistent: true
  });
};
