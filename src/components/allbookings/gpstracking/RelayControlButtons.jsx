import React, { useState, useEffect } from 'react';
import { FaPowerOff, FaPlay, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { gpsTrackingApi } from '../utils/gpsTrackingApi';

const RelayControlButtons = ({ bookingId, initialEngineStatus, bookingStatus, onStatusChange }) => {
  const [loading, setLoading] = useState(false);
  const [engineStatus, setEngineStatus] = useState(initialEngineStatus ?? 0);

  // ✅ Sync engine status when prop changes (on refresh or data update)
  useEffect(() => {
    if (initialEngineStatus !== undefined) {
      console.log('🔄 Engine status synced:', initialEngineStatus);
      setEngineStatus(initialEngineStatus);
    }
  }, [initialEngineStatus]);

  // ✅ Enable buttons for these statuses (INCLUDING "Trip Extend")
  const isButtonDisabled = !['Accepted', 'Start Trip', 'End Trip', 'Trip Extend'].includes(bookingStatus);

  const handleRelayOn = async () => {
    if (!bookingId) {
      toast.error('Booking ID not found', {
        position: 'top-center',
        theme: 'colored'
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🔌 Turning engine ON for booking:', bookingId);
      
      const response = await gpsTrackingApi.relayOn(bookingId);
      
      console.log('✅ Engine ON response:', response.data);
      
      // ✅ Update local state immediately for better UX
      setEngineStatus(1);
      
      // ✅ Notify parent component to refresh booking data
      if (onStatusChange) {
        onStatusChange(1);
      }
      
      toast.success(response.data?.message || '🚀 Engine started successfully!', {
        position: 'top-center',
        autoClose: 3000,
        theme: 'colored'
      });
      
    } catch (error) {
      console.error('❌ Error turning engine ON:', error);
      
      // ✅ 401 errors are handled by axios interceptor - just show message
      if (error.response?.status === 401) {
        console.log('🔐 Token expired - interceptor will handle redirect');
        toast.error('Session expired. Please login again.', {
          position: 'top-center',
          theme: 'colored'
        });
        return;
      }
      
      // ✅ Handle other errors
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message || 
                          'Failed to start engine';
      
      toast.error(`❌ ${errorMessage}`, {
        position: 'top-center',
        autoClose: 4000,
        theme: 'colored'
      });
      
      // ✅ Revert status on error (keep it OFF)
      setEngineStatus(0);
      
    } finally {
      setLoading(false);
    }
  };

  const handleRelayOff = async () => {
    if (!bookingId) {
      toast.error('Booking ID not found', {
        position: 'top-center',
        theme: 'colored'
      });
      return;
    }

    // ✅ Confirmation dialog for safety
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to stop the engine?\n\nThis will immediately shut down the vehicle.'
    );
    
    if (!confirmed) return;

    setLoading(true);
    try {
      console.log('🔌 Turning engine OFF for booking:', bookingId);
      
      const response = await gpsTrackingApi.relayOff(bookingId);
      
      console.log('✅ Engine OFF response:', response.data);
      
      // ✅ Update local state immediately
      setEngineStatus(0);
      
      // ✅ Notify parent component
      if (onStatusChange) {
        onStatusChange(0);
      }
      
      toast.success(response.data?.message || '🛑 Engine stopped successfully!', {
        position: 'top-center',
        autoClose: 3000,
        theme: 'colored'
      });
      
    } catch (error) {
      console.error('❌ Error turning engine OFF:', error);
      
      // ✅ 401 handled by interceptor
      if (error.response?.status === 401) {
        console.log('🔐 Token expired - interceptor will handle redirect');
        toast.error('Session expired. Please login again.', {
          position: 'top-center',
          theme: 'colored'
        });
        return;
      }
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message || 
                          'Failed to stop engine';
      
      toast.error(`❌ ${errorMessage}`, {
        position: 'top-center',
        autoClose: 4000,
        theme: 'colored'
      });
      
      // ✅ Revert status on error (keep it ON)
      setEngineStatus(1);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-xl shadow-md border border-gray-200 p-4 mb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center">
            <FaPowerOff className="mr-2 text-indigo-600" />
            Engine Control
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Remote engine start/stop via GPS tracker
          </p>
        </div>
        
        {/* Status Badge */}
        <div className={`
          px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2
          ${engineStatus === 1 
            ? 'bg-green-100 text-green-700 border border-green-300' 
            : 'bg-red-100 text-red-700 border border-red-300'}
        `}>
          <span className={`
            w-2 h-2 rounded-full 
            ${engineStatus === 1 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}
          `}></span>
          {engineStatus === 1 ? 'Engine ON' : 'Engine OFF'}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Engine ON Button */}
        <button
          onClick={handleRelayOn}
          disabled={loading || engineStatus === 1 || isButtonDisabled}
          className={`
            flex items-center justify-center gap-2 px-4 py-3 rounded-lg
            font-semibold text-sm transition-all shadow-md
            ${loading || engineStatus === 1 || isButtonDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:shadow-lg hover:scale-105'
            }
          `}
        >
          {loading && engineStatus === 0 ? (
            <>
              <FaSpinner className="animate-spin" />
              <span className="hidden sm:inline">Starting...</span>
              <span className="sm:hidden">...</span>
            </>
          ) : (
            <>
              <FaPlay />
              <span className="hidden sm:inline">Start Engine</span>
              <span className="sm:hidden">Start</span>
            </>
          )}
        </button>

        {/* Engine OFF Button */}
        <button
          onClick={handleRelayOff}
          disabled={loading || engineStatus === 0 || isButtonDisabled}
          className={`
            flex items-center justify-center gap-2 px-4 py-3 rounded-lg
            font-semibold text-sm transition-all shadow-md
            ${loading || engineStatus === 0 || isButtonDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white hover:shadow-lg hover:scale-105'
            }
          `}
        >
          {loading && engineStatus === 1 ? (
            <>
              <FaSpinner className="animate-spin" />
              <span className="hidden sm:inline">Stopping...</span>
              <span className="sm:hidden">...</span>
            </>
          ) : (
            <>
              <FaPowerOff />
              <span className="hidden sm:inline">Stop Engine</span>
              <span className="sm:hidden">Stop</span>
            </>
          )}
        </button>
      </div>

      {/* Status Messages */}
      {isButtonDisabled && (
        <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-xs text-orange-800 flex items-start">
            <span className="text-orange-500 mr-2 flex-shrink-0">🔒</span>
            <span>
              <strong>Trip Not Active:</strong> Engine controls are only available for active bookings (Accepted, Start Trip, End Trip, Trip Extend).
            </span>
          </p>
        </div>
      )}

      {!isButtonDisabled && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800 flex items-start">
            <span className="text-yellow-500 mr-2 flex-shrink-0">⚠️</span>
            <span>
              <strong>Note:</strong> Engine control commands may take 10-30 seconds to execute depending on GPS signal strength and device response time.
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default RelayControlButtons;
