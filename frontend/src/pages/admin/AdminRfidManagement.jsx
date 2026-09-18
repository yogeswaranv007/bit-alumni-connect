import React, { useState, useEffect } from 'react';
import { campusVisitApi } from '../../api/campusVisitApi';
import {
  Radio,
  Plus,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Search,
  CreditCard,
  X
} from 'lucide-react';

export const AdminRfidManagement = () => {
  const [rfids, setRfids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Issue modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    alumniProfileId: '',
    rfidUid: '',
    cardNumber: '',
    notes: 'Physical smart alumni card',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRfids();
  }, []);

  const fetchRfids = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await campusVisitApi.getAdminRfidMappings();
      if (res.success && res.data) {
        const rfidList = res.data.content || (Array.isArray(res.data) ? res.data : []);
        setRfids(rfidList);
      }
    } catch (err) {
      setError(err.message || 'Failed to load RFID card mappings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        alumniProfileId: parseInt(formData.alumniProfileId),
        rfidUid: formData.rfidUid.trim(),
        cardNumber: formData.cardNumber.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      const res = await campusVisitApi.createAdminRfidMapping(payload);
      if (res.success) {
        setSuccess('RFID card issued and mapped successfully!');
        setIsModalOpen(false);
        setFormData({ alumniProfileId: '', rfidUid: '', cardNumber: '', notes: '' });
        fetchRfids();
      } else {
        setError(res.message || 'Failed to issue RFID');
      }
    } catch (err) {
      setError(err.message || 'Failed to create RFID mapping');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await campusVisitApi.updateAdminRfidStatus(id, { status, notes: `Status set to ${status}` });
      if (res.success) {
        setSuccess(`RFID card status updated to ${status}.`);
        fetchRfids();
      }
    } catch (err) {
      setError(err.message || 'Failed to update RFID status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Radio className="w-6 h-6 text-bit-700" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Physical RFID Card Management
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Issue, bind, and control physical RFID smart credentials for verified BIT alumni.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchRfids}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-bit-700 hover:bg-bit-800 text-white text-xs font-bold shadow-sm shadow-bit-700/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Issue New RFID Card</span>
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading RFID cards...</div>
        ) : rfids.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No RFID card mappings registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">RFID UID / Card No</th>
                  <th className="px-6 py-4">Alumnus Holder</th>
                  <th className="px-6 py-4">Department & Batch</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Issued Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {rfids.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="font-mono font-extrabold text-slate-900">{r.rfidUid}</div>
                      {r.cardNumber && <div className="text-[10px] text-slate-400">Card: {r.cardNumber}</div>}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div>{r.alumniName}</div>
                      <div className="text-[11px] font-mono text-bit-700 font-bold">{r.alumniIdNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{r.department}</div>
                      <div className="text-[10px] text-slate-400">Batch {r.batch}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          r.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'LOST'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{r.issuedDate}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {r.status === 'ACTIVE' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'LOST')}
                            className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-[10px] font-bold cursor-pointer"
                          >
                            Mark Lost
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'SUSPENDED')}
                            className="px-2.5 py-1 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 text-[10px] font-bold cursor-pointer"
                          >
                            Suspend
                          </button>
                        </>
                      )}
                      {r.status !== 'ACTIVE' && (
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'ACTIVE')}
                          className="px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-[10px] font-bold cursor-pointer"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Issue New RFID Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Issue Physical RFID Card
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Alumni Profile ID *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1"
                  value={formData.alumniProfileId}
                  onChange={(e) => setFormData({ ...formData, alumniProfileId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-bit-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  RFID UID (Hex / Scanner String) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RFID-BIT-001245 or scan card"
                  value={formData.rfidUid}
                  onChange={(e) => setFormData({ ...formData, rfidUid: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-bit-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Printed Card Serial Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. CARD-2024-8849"
                  value={formData.cardNumber}
                  onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-bit-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Notes / Batch
                </label>
                <input
                  type="text"
                  placeholder="e.g. Issued at alumni convention"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-bit-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-bit-700 hover:bg-bit-800 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Issuing...' : 'Issue & Bind Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRfidManagement;
