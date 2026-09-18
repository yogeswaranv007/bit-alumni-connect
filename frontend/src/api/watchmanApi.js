import axiosClient from './axiosClient';

export const watchmanApi = {
  verifyByQr: (qrToken) =>
    axiosClient.post('/watchman/verify/qr', { qrToken }),

  verifyByRfid: (rfidUid) =>
    axiosClient.post('/watchman/verify/rfid', { rfidUid }),

  verifyByAlumniId: (alumniIdNumber) =>
    axiosClient.post('/watchman/verify/alumni-id', { alumniIdNumber }),

  verifyByRegisterNumber: (registerNumber) =>
    axiosClient.post('/watchman/verify/register-number', { registerNumber }),

  recordEntry: ({ alumniProfileId, verificationMethod, gate, remarks }) =>
    axiosClient.post('/watchman/entry', {
      alumniProfileId,
      verificationMethod,
      gate: gate || 'Main Gate',
      remarks: remarks || '',
    }),

  getTodayLogs: () =>
    axiosClient.get('/watchman/today-logs'),

  getLiveCheckin: (gate) =>
    axiosClient.get('/watchman/live-checkin', { params: { gate: gate || 'Main Gate' } }),
};
