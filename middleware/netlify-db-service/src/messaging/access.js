// Who may SEND a message into a conversation.
// - Participants (consumer/installer) always can.
// - Privileged staff (admin/operations/superadmin) may reply to SUPPORT
//   conversations they aren't assigned to (mirrors the GET read-exemption used
//   for support/quality/legal review). They may NOT inject into private
//   installer<->consumer conversations.

export function canSendToConversation({ isParticipant, isPrivileged, isSupport }) {
  if (isParticipant) return true;
  return Boolean(isPrivileged && isSupport);
}
