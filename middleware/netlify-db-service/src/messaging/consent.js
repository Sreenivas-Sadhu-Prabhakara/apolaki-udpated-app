// Support conversations route to the Apolaki team (admin/support), not to an
// installer, so they must NOT be gated behind the installer_messaging consent —
// that consent only governs installer/project communication.

export function isSupportContext(contextType) {
  return contextType === 'support';
}

export function requiresInstallerMessagingConsent(contextType) {
  return !isSupportContext(contextType);
}
