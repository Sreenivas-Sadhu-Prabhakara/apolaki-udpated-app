import amqp from 'amqplib';
import { messaging } from './db.js';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
let channel = null;

export const connectMQ = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange('marketplace_events', 'topic', { durable: true });
    
    const q = await channel.assertQueue('', { exclusive: true });
    await channel.bindQueue(q.queue, 'marketplace_events', 'booking.created');

    console.log('Connected to RabbitMQ and listening for marketplace events');

    channel.consume(q.queue, async (msg) => {
      if (msg.content) {
        const data = JSON.parse(msg.content.toString());
        console.log('Received booking.created event:', data);
        
        try {
          // 1. Auto-create a messaging conversation when a booking is made
          const conversation = await messaging.createConversation({
            consumerId: data.userId,
            installerId: data.dealerId,
            contextType: 'marketplace',
            contextId: data.bookingId,
            assignmentSource: 'marketplace_booking'
          });

          // 2. Add an initial system message to start the thread
          await messaging.createMessage({
            conversationId: conversation.id,
            senderId: data.userId, // Message appears as from the user
            senderRole: 'customer',
            encryptedBody: `New marketplace booking request initiated for ${data.bookingType || 'consultation'}. Scheduled for: ${data.scheduledAt || 'TBD'}. Notes: ${data.notes || 'None'}`,
            encryptionMetadata: { type: 'plain_text_system' }
          });

          console.log('Auto-created messaging conversation and initial message for booking:', data.bookingId);
        } catch (error) {
          console.error('Failed to auto-process booking event:', error);
        }
      }
    }, { noAck: true });

  } catch (error) {
    console.error('RabbitMQ connection/subscription failed:', error);
  }
};
