/**
 * Resolves the appropriate destination route for a given notification
 * based on user role, reference type, notification type, and backend actionUrl.
 * Handles backwards-compatible normalization for legacy or incomplete records.
 *
 * @param {Object} notif - Notification object from API
 * @param {Object} user - Current authenticated user object with roles array
 * @returns {string} Target frontend route URL
 */
export const resolveNotificationRoute = (notif, user) => {
  if (!notif) return '/notifications';

  const roles = user?.roles || [];
  const isAdmin = roles.includes('ROLE_ADMIN');
  const isFaculty = roles.includes('ROLE_STAFF');
  const isAlumni = roles.includes('ROLE_ALUMNI');

  const refType = String(notif.referenceType || '').toUpperCase().trim();
  const type = String(notif.type || '').toUpperCase().trim();
  const rawUrl = String(notif.actionUrl || '').trim();

  // 1. Campus Visits & Visit Approvals / Rejections / Scheduling
  if (
    refType === 'CAMPUS_VISIT' ||
    type.includes('CAMPUS_VISIT') ||
    type.includes('VISIT') ||
    rawUrl.includes('/campus-visits')
  ) {
    if (isAdmin) return '/admin/campus-visits';
    if (isFaculty) return '/faculty/campus-visits';
    return '/alumni/campus-visits';
  }

  // 2. Gate Entry Logs & Arrival Alerts
  if (
    refType === 'GATE_ENTRY' ||
    refType === 'CAMPUSENTRYLOG' ||
    refType === 'ENTRY_LOG' ||
    type.includes('GATE_ENTRY') ||
    type.includes('ENTRY') ||
    rawUrl.includes('entry-log') ||
    rawUrl.includes('campus-entry')
  ) {
    if (isAdmin) return '/admin/campus-entry-logs';
    if (isFaculty) return '/faculty/campus-entry-logs';
    return '/alumni/campus-visits';
  }

  // 3. Virtual / Digital Alumni ID
  if (
    refType === 'VIRTUAL_ID' ||
    refType === 'DIGITAL_ID' ||
    type.includes('DIGITAL_ID') ||
    type.includes('VIRTUAL_ID') ||
    rawUrl.includes('virtual-id') ||
    rawUrl.includes('id-card')
  ) {
    if (isAdmin) return '/admin/rfid-management';
    return '/alumni/virtual-id';
  }

  // 4. Profile Change Requests
  if (
    refType === 'PROFILE_CHANGE_REQUEST' ||
    refType === 'CHANGE_REQUEST' ||
    type.includes('PROFILE_CHANGE') ||
    type.includes('CHANGE_REQUEST') ||
    rawUrl.includes('change-request')
  ) {
    if (isAdmin) {
      if (notif.referenceId) return `/admin/change-requests/${notif.referenceId}`;
      return '/admin/change-requests';
    }
    return '/alumni/profile';
  }

  // 5. Alumni Profile & Verification
  if (
    refType === 'ALUMNI_PROFILE' ||
    refType === 'ALUMNI' ||
    type.includes('ALUMNI_VERIFIED') ||
    type.includes('ALUMNI_REJECTED') ||
    type.includes('NEW_ALUMNI') ||
    rawUrl.includes('alumni') ||
    rawUrl.includes('profile')
  ) {
    if (isAdmin) return '/admin/alumni';
    if (type.includes('REJECTED')) return '/alumni/create-profile';
    return '/alumni/profile';
  }

  // 6. Events & Celebrations
  if (
    refType === 'EVENT' ||
    type.includes('EVENT') ||
    rawUrl.includes('event')
  ) {
    return '/events';
  }

  // 7. Explicit actionUrl normalization
  if (rawUrl) {
    if (rawUrl === '/admin/entry-logs') return '/admin/campus-entry-logs';
    if (rawUrl === '/alumni/id-card') return '/alumni/virtual-id';
    return rawUrl;
  }

  // Default Fallback
  if (isAdmin) return '/admin/dashboard';
  if (isFaculty) return '/faculty/campus-visits';
  if (isAlumni) return '/alumni/dashboard';
  return '/notifications';
};

export default resolveNotificationRoute;
