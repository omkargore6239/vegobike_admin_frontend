import React, { useEffect, useState } from 'react';
import { FaTimes, FaBatteryHalf, FaSync } from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '../../api/apiConfig';

const ExchangeBatteryModal = ({
  show,
  onClose,
  bookingId,
  bikeId,
  currentBatteryId,
  onExchanged,
}) => {
  const [loading, setLoading] = useState(false);
  const [batteriesLoading, setBatteriesLoading] = useState(false);
  const [batteries, setBatteries] = useState([]);
  const [selectedBatteryId, setSelectedBatteryId] = useState('');

  useEffect(() => {
    if (!show || !bikeId) return;

    const fetchBatteries = async () => {
      setBatteriesLoading(true);
      try {
        const res = await apiClient.get(`/api/bikes/${bikeId}/open-batteries`);
        setBatteries(res.data || []);
      } catch (err) {
        console.error('Error loading open batteries', err);
        toast.error('Failed to load open batteries');
        setBatteries([]);
      } finally {
        setBatteriesLoading(false);
      }
    };

    fetchBatteries();
  }, [show, bikeId]);

  const handleExchange = async () => {
    if (!selectedBatteryId) {
      toast.warning('Please select a battery');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post(`/api/booking-bikes/${bookingId}/exchange-battery`, {
        newBatteryId: Number(selectedBatteryId),
      });
      toast.success('Battery exchanged successfully');
      if (onExchanged) onExchanged();
      onClose();
    } catch (err) {
      console.error('Error exchanging battery', err);
      const msg =
        err.response?.data?.message || 'Failed to exchange battery';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-3">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <FaBatteryHalf className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              Exchange Battery
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="text-xs text-gray-600">
            <p>
              Booking ID: <span className="font-semibold">{bookingId}</span>
            </p>
            <p>
              Bike ID:{' '}
              <span className="font-semibold">
                {bikeId ?? 'Not available'}
              </span>
            </p>
            <p>
              Current Battery ID:{' '}
              <span className="font-semibold">
                {currentBatteryId ?? 'None'}
              </span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Select New Battery
            </label>
            {batteriesLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FaSync className="animate-spin" />
                Loading open batteries...
              </div>
            ) : batteries.length === 0 ? (
              <p className="text-xs text-red-500">
                No OPEN batteries available for this bike store.
              </p>
            ) : (
              <select
                value={selectedBatteryId}
                onChange={(e) => setSelectedBatteryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select battery</option>
                {batteries.map((batt) => (
                  <option key={batt.id} value={batt.id}>
                    ID: {batt.id} | Serial: {batt.serialNumber || 'N/A'}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleExchange}
              disabled={loading || !selectedBatteryId}
              className={`flex-1 px-3 py-2 rounded-lg text-sm text-white flex items-center justify-center ${
                loading || !selectedBatteryId
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? (
                <>
                  <FaSync className="mr-2 animate-spin" /> Exchanging...
                </>
              ) : (
                'Exchange Battery'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExchangeBatteryModal;
