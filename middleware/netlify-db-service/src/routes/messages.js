/**
 * PRD 8 in-app messaging routes.
 *
 * MVP scope is async messaging only. Message content is accepted and returned
 * as encrypted payload envelopes so external channels stay unnecessary and
 * plaintext content is not persisted by the API.
 */

import expressModule from 'express';
import webpush from 'web-push';
import multer from 'multer';
import path from 'path';
import { CONSENT_VERSION, normalizeRole } from '../auth/access-control.js';
import { authenticateToken, authorizeRole } from '../auth/middleware.js';
import { auditLogs, messaging, userConsents, users, pushSubscriptions } from '../db.js';

const express = expressModule.default || expressModule;
const router = express.Router();

const PRIVILEGED_ROLES = new Set(['admin', 'superadmin', 'operations']);
const INSTALLER_MESSAGING_CONSENT = 'installer_messaging';

// Multer storage for MVP local uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// PRD 9: Web Push Configuration
// ... (rest of push config)
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'admin@apolaki.local';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    `mailto:${vapidEmail}`,
    vapidPublicKey,
    vapidPrivateKey
  );
}

async function sendPushNotification(userId, payload) {
  const subscriptions = await pushSubscriptions.getByUserId(userId);
  const results = await Promise.allSettled(subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        sub.subscription_json,
        JSON.stringify(payload)
      );
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        // Subscription expired or removed
        await pushSubscriptions.delete(userId, sub.subscription_json);
      }
      throw error;
    }
  }));
  return results;
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
}

function isPrivileged(user) {
  return PRIVILEGED_ROLES.has(normalizeRole(user.role));
}

function isConversationParticipant(user, conversation) {
  return conversation.consumer_id === user.id || conversation.installer_id === user.id;
}

async function hasInstallerMessagingConsent(consumerId) {
  const records = await userConsents.getByUserId(consumerId);
  return records.some(record =>
    record.consent_key === INSTALLER_MESSAGING_CONSENT &&
    record.consent_version === CONSENT_VERSION &&
    record.decision === 'granted'
  );
}

function consentRequired(res) {
  return res.status(403).json({
    success: false,
    error: 'Installer messaging consent is required before project communication can begin.',
    code: 'CONSENT_REQUIRED',
    requiredConsents: [INSTALLER_MESSAGING_CONSENT],
    disclaimer: 'Messages and attachments stay inside Apolaki and may be reviewed only through audited support, quality, safety, or legal workflows.'
  });
}

function encryptedPayloadRequired(res) {
  return res.status(400).json({
    success: false,
    error: 'encryptedBody is required. Plaintext message bodies are not accepted by this endpoint.',
    code: 'ENCRYPTED_PAYLOAD_REQUIRED'
  });
}

async function audit(req, action, resourceType, resourceId, status, changes = null) {
  try {
    await auditLogs.create({
      userId: req.user?.id || null,
      action,
      resourceType,
      resourceId,
      changes,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
      status
    });
  } catch (error) {
    console.warn(`Messaging audit write failed for ${action}:`, error.message);
  }
}

function sanitizeAttachment(attachment) {
  return {
    fileName: String(attachment.fileName || '').slice(0, 255),
    mimeType: String(attachment.mimeType || 'application/octet-stream').slice(0, 100),
    sizeBytes: Number.parseInt(attachment.sizeBytes || '0', 10),
    storageKey: String(attachment.storageKey || ''),
    encryptionMetadata: attachment.encryptionMetadata || {}
  };
}

function sanitizeLead(payload = {}) {
  const contact = payload.contact || {};
  return {
    source: String(payload.source || 'messaging').slice(0, 100),
    status: String(payload.status || 'new').slice(0, 50),
    priority: String(payload.priority || 'new_lead').slice(0, 50),
    assignedTo: String(payload.assignedTo || payload.assigned_to || '').slice(0, 255),
    contact: {
      name: String(contact.name || payload.name || '').slice(0, 160),
      phone: String(contact.phone || payload.phone || '').slice(0, 80),
      email: String(contact.email || payload.email || '').slice(0, 180)
    },
    message: String(payload.message || '').slice(0, 4000),
    contextType: String(payload.contextType || payload.context_type || 'support').slice(0, 100),
    contextId: payload.contextId || payload.context_id || null,
    installerId: payload.installerId || payload.installer_id || null,
    financierId: payload.financierId || payload.financier_id || null,
    location: String(payload.location || '').slice(0, 255),
    monthlyBill: Number.isFinite(Number(payload.monthlyBill || payload.monthly_bill))
      ? Number(payload.monthlyBill || payload.monthly_bill)
      : null,
    assessment: payload.assessment || null
  };
}

function serializeLead(row) {
  if (!row) return null;
  return {
    id: row.id,
    source: row.source,
    status: row.status,
    priority: row.priority,
    assignedTo: row.assigned_to || '',
    contact: row.contact || {},
    message: row.message || '',
    contextType: row.context_type,
    contextId: row.context_id,
    installerId: row.installer_id,
    financierId: row.financier_id,
    location: row.location || '',
    monthlyBill: row.monthly_bill,
    assessment: row.assessment || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function userLeadAliases(user) {
  return [
    user.id,
    user.email,
    user.first_name,
    user.last_name,
    [user.first_name, user.last_name].filter(Boolean).join(' '),
    normalizeRole(user.role) === 'dealer' ? 'installer' : ''
  ].filter(Boolean).map(value => String(value).toLowerCase());
}

function canSeeLead(user, lead) {
  if (isPrivileged(user)) return true;
  const role = normalizeRole(user.role);
  if (role !== 'dealer') return false;
  const assignee = String(lead.assigned_to || '').trim().toLowerCase();
  if (!assignee) return true;
  return userLeadAliases(user).some(alias => assignee.includes(alias));
}

router.post('/anonymous-leads', async (req, res) => {
  try {
    const lead = await messaging.createAnonymousLead(sanitizeLead(req.body));
    await audit(req, 'ANONYMOUS_LEAD_CREATED', 'anonymous_lead', lead.id, 'success', {
      source: lead.source,
      contextType: lead.context_type
    });
    res.status(201).json({ success: true, data: serializeLead(lead) });
  } catch (error) {
    console.error('Anonymous lead create failed:', error.message);
    res.status(500).json({ success: false, error: 'Unable to save lead request.' });
  }
});

router.get('/anonymous-leads', authenticateToken, authorizeRole('operations', 'dealer', 'installer', 'admin', 'superadmin'), async (req, res) => {
  try {
    const leads = await messaging.listAnonymousLeads();
    const visibleLeads = leads.filter(lead => canSeeLead(req.user, lead)).map(serializeLead);
    res.json({ success: true, count: visibleLeads.length, data: visibleLeads });
  } catch (error) {
    console.error('Anonymous lead list failed:', error.message);
    res.status(500).json({ success: false, error: 'Unable to load lead inbox.' });
  }
});

router.patch('/anonymous-leads/:leadId', authenticateToken, authorizeRole('operations', 'dealer', 'installer', 'admin', 'superadmin'), async (req, res) => {
  try {
    const existing = await messaging.getAnonymousLeadById(req.params.leadId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Lead not found.', code: 'LEAD_NOT_FOUND' });
    }
    if (!canSeeLead(req.user, existing)) {
      return res.status(403).json({ success: false, error: 'Lead access denied.', code: 'LEAD_DENIED' });
    }

    const sanitized = sanitizeLead(req.body);
    const updated = await messaging.updateAnonymousLead(req.params.leadId, {
      status: req.body?.status !== undefined ? sanitized.status : undefined,
      assignedTo: req.body?.assignedTo !== undefined || req.body?.assigned_to !== undefined ? sanitized.assignedTo : undefined
    });

    await audit(req, 'ANONYMOUS_LEAD_UPDATED', 'anonymous_lead', updated.id, 'success', {
      status: updated.status,
      assignedTo: updated.assigned_to
    });

    res.json({ success: true, data: serializeLead(updated) });
  } catch (error) {
    console.error('Anonymous lead update failed:', error.message);
    res.status(500).json({ success: false, error: 'Unable to update lead.' });
  }
});

router.post('/push-subscription', authenticateToken, async (req, res) => {
  const { subscription, platform = 'web' } = req.body || {};
  if (!subscription) {
    return res.status(400).json({ success: false, error: 'subscription object is required.' });
  }

  await pushSubscriptions.upsert(
    req.user.id,
    subscription,
    platform,
    req.get('user-agent')
  );

  res.status(201).json({ success: true, message: 'Push subscription registered.' });
});

router.post('/attachments', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded.' });
  }

  // PRD 8: Secure metadata. For MVP, we return a local storage key.
  const storageKey = `local://uploads/${req.file.filename}`;
  
  res.status(201).json({
    success: true,
    data: {
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      storageKey,
      encryptionMetadata: {
        scheme: 'client_envelope_v1',
        storage: 'local_mvp'
      }
    }
  });
});

router.get('/security-banner', authenticateToken, (_req, res) => {
  res.json({
    success: true,
    data: {
      title: 'Protected in-app messaging',
      body: 'Messages and attachments are protected with end-to-end style encrypted envelopes. Apolaki discourages moving installer communication to external apps until sufficient trust controls are enabled.',
      auditNotice: 'Admin review is governed, logged, and limited to support, quality control, safety, dispute, or legal workflows.',
      externalChannels: 'Push notifications are enabled. Email, SMS, and WhatsApp stay intentionally disabled for the MVP.'
    }
  });
});

router.get('/recommendations', authenticateToken, async (req, res) => {
  const role = normalizeRole(req.user.role);
  const recommendations = await messaging.listRecommendations({ userId: req.user.id, role });
  res.json({ success: true, count: recommendations.length, data: recommendations });
});

router.post('/recommendations', authenticateToken, authorizeRole('admin', 'superadmin'), async (req, res) => {
  const { consumerId, installerId, contextType = 'general', contextId = null, reason = null } = req.body || {};
  if (!consumerId || !installerId) {
    return res.status(400).json({ success: false, error: 'consumerId and installerId are required.', code: 'VALIDATION_ERROR' });
  }

  const installer = await users.getById(installerId);
  if (!installer || normalizeRole(installer.role) !== 'dealer') {
    return res.status(400).json({ success: false, error: 'installerId must reference an installer/dealer user.', code: 'INVALID_INSTALLER' });
  }

  const recommendation = await messaging.createRecommendation({
    consumerId,
    installerId,
    contextType,
    contextId,
    source: 'admin_allocation',
    reason,
    createdBy: req.user.id
  });

  await audit(req, 'INSTALLER_RECOMMENDATION_CREATED', 'installer_recommendation', recommendation.id, 'success', {
    consumerId,
    installerId,
    contextType,
    contextId,
    reason
  });

  res.status(201).json({ success: true, data: recommendation });
});

router.get('/conversations', authenticateToken, async (req, res) => {
  const role = normalizeRole(req.user.role);
  const conversations = await messaging.listConversations({ userId: req.user.id, role });
  res.json({ success: true, count: conversations.length, data: conversations });
});

router.post('/conversations', authenticateToken, async (req, res) => {
  const role = normalizeRole(req.user.role);
  const {
    recommendationId,
    consumerId: requestedConsumerId,
    installerId: requestedInstallerId,
    financierId,
    isSupport = false,
    contextType = 'general',
    contextId = null
  } = req.body || {};

  let consumerId = req.user.id;
  let installerId = requestedInstallerId;
  let recommendation = null;
  let assignmentSource = 'recommendation';
  let targetContextType = contextType;

  if (recommendationId) {
    recommendation = await messaging.getRecommendationById(recommendationId);
    if (!recommendation || recommendation.status !== 'active') {
      return res.status(404).json({ success: false, error: 'Active installer recommendation not found.', code: 'RECOMMENDATION_NOT_FOUND' });
    }
    if (!isPrivileged(req.user) && recommendation.consumer_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'This recommendation is not assigned to you.', code: 'RECOMMENDATION_DENIED' });
    }
    consumerId = recommendation.consumer_id;
    installerId = recommendation.installer_id;
    assignmentSource = recommendation.source === 'admin_allocation' ? 'admin_allocation' : 'recommendation';
    targetContextType = recommendation.context_type || targetContextType;
  } else if (isPrivileged(req.user)) {
    consumerId = requestedConsumerId;
    assignmentSource = 'admin_allocation';
  } else if (isSupport) {
    // Users can always start support chats
    assignmentSource = 'contextual_initiation';
    targetContextType = 'support';
    // Find a support user or use a placeholder
    const supportUsers = await users.getByRole('admin');
    installerId = supportUsers[0]?.id;
  } else if (installerId || financierId) {
    // SECURITY HARDENING: Verify boundary for direct initiation
    if (role === 'customer') {
      const activeRecs = await messaging.listRecommendations({ userId: req.user.id, role: 'customer' });
      const isAllowedInstaller = activeRecs.some(r => r.installer_id === installerId && r.status === 'active');
      
      // If it's a marketplace booking, it should be allowed (v2.1 event-driven flow handles this automatically, 
      // but if manually called, we check recommendations)
      if (!isAllowedInstaller && !financierId) {
        return res.status(403).json({
          success: false,
          error: 'You can only start conversations with recommended or allocated installers.',
          code: 'RECIPIENT_BOUNDARY_DENIED'
        });
      }
    }
    assignmentSource = 'contextual_initiation';
    if (financierId) {
      targetContextType = 'finance';
      installerId = financierId;
    }
  } else {
    return res.status(403).json({
      success: false,
      error: 'Conversations must start from a recommendation, contextual target, or admin allocation.',
      code: 'INITIATION_DENIED'
    });
  }

  if (!consumerId || !installerId) {
    return res.status(400).json({ success: false, error: 'consumerId and target (installer/financier/support) are required.', code: 'VALIDATION_ERROR' });
  }

  const targetUser = await users.getById(installerId);
  if (!targetUser) {
    return res.status(400).json({ success: false, error: 'Target user not found.', code: 'INVALID_TARGET' });
  }

  if (!(await hasInstallerMessagingConsent(consumerId))) {
    return consentRequired(res);
  }

  const conversation = await messaging.createConversation({
    consumerId,
    installerId,
    recommendationId: recommendation?.id || null,
    contextType: targetContextType,
    contextId: recommendation?.context_id || contextId,
    assignmentSource,
    createdBy: req.user.id
  });

  await audit(req, 'MESSAGING_CONVERSATION_CREATED', 'messaging_conversation', conversation.id, 'success', {
    consumerId,
    installerId,
    assignmentSource,
    contextType: targetContextType
  });

  res.status(201).json({ success: true, data: conversation });
});

router.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  const conversation = await messaging.getConversationById(req.params.conversationId);
  if (!conversation) {
    return res.status(404).json({ success: false, error: 'Conversation not found.', code: 'CONVERSATION_NOT_FOUND' });
  }
  if (!isConversationParticipant(req.user, conversation) && !isPrivileged(req.user)) {
    return res.status(403).json({ success: false, error: 'Conversation access denied.', code: 'CONVERSATION_DENIED' });
  }

  if (isPrivileged(req.user) && !isConversationParticipant(req.user, conversation)) {
    await audit(req, 'MESSAGING_ADMIN_REVIEW', 'messaging_conversation', conversation.id, 'success', {
      reason: 'support_quality_control_or_legal_review'
    });
  }

  const messages = await messaging.listMessages(req.params.conversationId);
  res.json({ success: true, count: messages.length, data: messages });
});

router.post('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  const conversation = await messaging.getConversationById(req.params.conversationId);
  if (!conversation) {
    return res.status(404).json({ success: false, error: 'Conversation not found.', code: 'CONVERSATION_NOT_FOUND' });
  }
  if (!isConversationParticipant(req.user, conversation)) {
    return res.status(403).json({ success: false, error: 'Only conversation participants can send messages.', code: 'CONVERSATION_DENIED' });
  }
  if (!(await hasInstallerMessagingConsent(conversation.consumer_id))) {
    return consentRequired(res);
  }

  const encryptedBody = req.body?.encryptedBody;
  if (typeof encryptedBody !== 'string' || encryptedBody.trim().length < 12) {
    return encryptedPayloadRequired(res);
  }

  const attachments = Array.isArray(req.body?.attachments)
    ? req.body.attachments.map(sanitizeAttachment).filter(attachment => attachment.fileName && attachment.storageKey)
    : [];

  const message = await messaging.createMessage({
    conversationId: conversation.id,
    senderId: req.user.id,
    senderRole: normalizeRole(req.user.role),
    encryptedBody,
    encryptionMetadata: req.body?.encryptionMetadata || { scheme: 'client_envelope_v1' },
    attachments
  });

  const recipientId = req.user.id === conversation.consumer_id
    ? conversation.installer_id
    : conversation.consumer_id;
  await messaging.createNotification({
    userId: recipientId,
    type: 'message:new',
    title: 'New in-app message',
    body: 'You have a new protected message in Apolaki.',
    resourceType: 'messaging_conversation',
    resourceId: conversation.id
  });

  // PRD 9: Send Web Push notification
  sendPushNotification(recipientId, {
    title: 'New Message - Apolaki',
    body: 'You have a new protected message from ' + (normalizeRole(req.user.role) === 'dealer' ? 'your installer.' : 'a customer.'),
    url: `/messaging?id=${conversation.id}`,
    conversationId: conversation.id
  }).catch(err => console.warn('Web Push delivery failed:', err.message));

  await audit(req, 'MESSAGING_MESSAGE_SENT', 'messaging_message', message.id, 'success', {
    conversationId: conversation.id,
    attachmentCount: attachments.length
  });

  res.status(201).json({ success: true, data: message });
});

export default router;
