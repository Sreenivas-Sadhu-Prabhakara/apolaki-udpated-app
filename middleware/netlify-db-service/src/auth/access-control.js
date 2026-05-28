export const CANONICAL_ROLES = ['customer', 'dealer', 'operations', 'admin', 'superadmin'];
export const LEGACY_ROLE_ALIASES = Object.freeze({ installer: 'dealer' });
export const ASSIGNABLE_ROLES = [...CANONICAL_ROLES];

const ROLE_PERMISSIONS = Object.freeze({
  customer: [
    'view:dashboard',
    'view:installations',
    'view:monitoring',
    'view:marketplace',
    'create:assessment',
    'view:contracts',
    'view:finance',
    'message:installer',
    'trade:energy'
  ],
  dealer: [
    'view:dashboard',
    'view:installations',
    'create:installation',
    'commission:installation',
    'view:contracts',
    'create:contract',
    'view:quotes',
    'create:quote',
    'message:consumer'
  ],
  operations: [
    'view:dashboard',
    'view:installations',
    'view:monitoring',
    'view:alerts',
    'resolve:alerts',
    'create:maintenance',
    'update:maintenance',
    'dispatch:crew'
  ],
  admin: [
    'view:dashboard',
    'view:installations',
    'view:monitoring',
    'view:marketplace',
    'manage:users',
    'assign:roles',
    'view:audit-logs',
    'view:billing',
    'view:messages:audit',
    'manage:org-settings'
  ],
  superadmin: [
    'all',
    'break-glass:activate',
    'break-glass:action',
    'break-glass:end',
    'manage:superadmins'
  ]
});

export function normalizeRole(role) {
  if (LEGACY_ROLE_ALIASES[role]) return LEGACY_ROLE_ALIASES[role];
  return CANONICAL_ROLES.includes(role) ? role : 'customer';
}

export function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[normalizeRole(role)] || ROLE_PERMISSIONS.customer;
}

export const CONSENT_VERSION = '1.0';
export const CONSENT_DEFINITIONS = Object.freeze([
  {
    key: 'profile_account',
    title: 'Profile and account data',
    required: true,
    purpose: 'Create your account, maintain your profile, and apply your access role.',
    dataScope: ['identity', 'contact_profile', 'access_role']
  },
  {
    key: 'location_assessment',
    title: 'Location and solar assessment data',
    required: true,
    purpose: 'Calculate solar potential and save assessments you request.',
    dataScope: ['property_location', 'solar_assessment']
  },
  {
    key: 'installation_monitoring',
    title: 'Installation and monitoring data',
    required: false,
    purpose: 'Display system production, alerts, and service history after installation.',
    dataScope: ['installation', 'monitoring']
  },
  {
    key: 'contracts_signing',
    title: 'Contract access and signing',
    required: false,
    purpose: 'Prepare, review, and sign energy or installation agreements.',
    dataScope: ['contracts', 'signatures']
  },
  {
    key: 'finance_data',
    title: 'Finance data',
    required: false,
    purpose: 'Support financing offers, billing, and related financial workflows.',
    dataScope: ['finance']
  },
  {
    key: 'partner_sharing',
    title: 'Sharing with dealers and operations',
    required: false,
    purpose: 'Share relevant project data with assigned delivery and support teams.',
    dataScope: ['dealer_sharing', 'operations_sharing']
  },
  {
    key: 'installer_messaging',
    title: 'In-app messaging with recommended installers',
    required: false,
    purpose: 'Coordinate installation questions, support requests, and project documents with your recommended or admin-assigned installer inside Apolaki.',
    dataScope: ['message_envelopes', 'project_context', 'attachment_metadata', 'in_app_notifications']
  }
]);

export function getConsentDefinition(consentKey) {
  return CONSENT_DEFINITIONS.find(consent => consent.key === consentKey);
}

export function buildConsentStatus(records = []) {
  const recordMap = new Map(
    records
      .filter(record => record.consent_version === CONSENT_VERSION)
      .map(record => [record.consent_key, record])
  );

  const consents = CONSENT_DEFINITIONS.map(definition => {
    const record = recordMap.get(definition.key);
    return {
      ...definition,
      version: CONSENT_VERSION,
      decision: record?.decision || 'pending',
      grantedAt: record?.granted_at || null,
      revokedAt: record?.revoked_at || null
    };
  });

  return {
    version: CONSENT_VERSION,
    onboardingComplete: consents
      .filter(consent => consent.required)
      .every(consent => consent.decision === 'granted'),
    consents
  };
}
