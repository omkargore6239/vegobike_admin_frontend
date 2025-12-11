import React, { useState, useEffect } from 'react';
import { FaTimes, FaExchangeAlt, FaSpinner, FaMotorcycle, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

const ExchangeBikeModal = ({ show, onClose, bookingId, currentBikeId, onExchanged }) => {
  const [availableBikes, setAvailableBikes] = useState([]);
  const [selectedBikeId, setSelectedBikeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exchanging, setExchanging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (show && bookingId) {
      setSelectedBikeId(null);
      fetchAvailableBikes();
    }
  }, [show, bookingId]);

  const fetchAvailableBikes = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching available bikes for booking:', bookingId);
      
      const baseUrl = import.meta.env.VITE_BASE_URL;
      const token = localStorage.getItem('authtoken') || localStorage.getItem('token');
      
      const response = await fetch(
        `${baseUrl}/api/booking-bikes/${bookingId}/exchange-available-bikes`,
        {
          method: 'GET',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch available bikes');
      }

      const data = await response.json();
      
      console.log('✅ Available bikes fetched:', data);
      console.log('📋 First bike structure:', data[0]); // Debug: See actual bike object structure
      
      setAvailableBikes(data || []);
      
      if (!data || data.length === 0) {
        toast.info('No bikes available for exchange in the same category', {
          position: 'top-center',
          theme: 'colored'
        });
      }
      
    } catch (error) {
      console.error('❌ Error fetching available bikes:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        toast.error('Session expired. Please login again.', {
          position: 'top-center',
          theme: 'colored'
        });
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }
      
      toast.error(error.message || 'Failed to load available bikes', {
        position: 'top-center',
        theme: 'colored'
      });
      setAvailableBikes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExchangeBike = async () => {
    if (!selectedBikeId) {
      toast.error('Please select a bike to exchange', {
        position: 'top-center',
        theme: 'colored'
      });
      return;
    }

    if (selectedBikeId === currentBikeId) {
      toast.error('Selected bike is the same as current bike', {
        position: 'top-center',
        theme: 'colored'
      });
      return;
    }

    const confirmed = window.confirm(
      `⚠️ Are you sure you want to exchange the bike?\n\nThis action will update the booking with the new vehicle.`
    );
    
    if (!confirmed) return;

    setExchanging(true);
    try {
      console.log('🔄 Exchanging bike:', {
        bookingId,
        currentBikeId,
        newBikeId: selectedBikeId
      });

      const baseUrl = import.meta.env.VITE_BASE_URL;
      const token = localStorage.getItem('authtoken') || localStorage.getItem('token');

      const response = await fetch(
        `${baseUrl}/api/booking-bikes/${bookingId}/exchange-bike?newBikeId=${selectedBikeId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to exchange bike');
      }

      const data = await response.json();
      
      console.log('✅ Bike exchanged successfully:', data);
      
      toast.success(data?.message || '🎉 Bike exchanged successfully!', {
        position: 'top-center',
        autoClose: 3000,
        theme: 'colored'
      });

      handleClose();
      
      if (onExchanged) {
        setTimeout(() => {
          onExchanged();
        }, 500);
      }

    } catch (error) {
      console.error('❌ Error exchanging bike:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        toast.error('Session expired. Please login again.', {
          position: 'top-center',
          theme: 'colored'
        });
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }
      
      const errorMessage = error.message || 'Failed to exchange bike';
      
      toast.error(`❌ ${errorMessage}`, {
        position: 'top-center',
        autoClose: 4000,
        theme: 'colored'
      });
    } finally {
      setExchanging(false);
    }
  };

  const handleClose = () => {
    setSelectedBikeId(null);
    setSearchQuery('');
    onClose();
  };

  // ✅ Get bike ID - handle different possible property names from backend
  const getBikeId = (bike) => {
    return bike.bikeId || bike.id || bike.vehicleId || bike.bike_id;
  };

  // ✅ Handle bike selection
  const handleSelectBike = (bike, e) => {
    if (e) {
      e.stopPropagation();
    }

    const bikeId = getBikeId(bike);
    
    if (!bikeId) {
      console.error('❌ Bike ID not found in bike object:', bike);
      toast.error('Invalid bike data');
      return;
    }

    if (bikeId === currentBikeId) {
      toast.warning('This is the current bike. Please select a different one.', {
        position: 'top-center',
        theme: 'colored'
      });
      return;
    }

    // Toggle selection
    if (selectedBikeId === bikeId) {
      setSelectedBikeId(null);
      console.log('🔄 Bike deselected');
    } else {
      setSelectedBikeId(bikeId);
      console.log('🎯 Bike selected:', bikeId);
    }
  };

  // Filter bikes based on search query
  const filteredBikes = availableBikes.filter(bike => {
    const query = searchQuery.toLowerCase();
    return (
      bike.registrationNumber?.toLowerCase().includes(query) ||
      bike.brandName?.toLowerCase().includes(query) ||
      bike.modelName?.toLowerCase().includes(query) ||
      bike.categoryName?.toLowerCase().includes(query)
    );
  });

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <FaExchangeAlt className="text-2xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Exchange Vehicle</h2>
                <p className="text-sm text-blue-100">Select a replacement bike from available options</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all"
              aria-label="Close"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by registration number, brand, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <FaMotorcycle className="absolute left-3 top-3.5 text-gray-400" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FaSpinner className="text-4xl text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading available bikes...</p>
            </div>
          ) : filteredBikes.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FaMotorcycle className="text-5xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium">
                {searchQuery ? 'No bikes match your search' : 'No bikes available for exchange'}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {searchQuery ? 'Try a different search term' : 'All bikes in this category are currently booked'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBikes.map((bike, index) => {
                const bikeId = getBikeId(bike);
                return (
                  <BikeCard
                    key={bikeId || index} // Fallback to index if no ID
                    bike={bike}
                    bikeId={bikeId}
                    isSelected={selectedBikeId === bikeId}
                    isCurrent={bikeId === currentBikeId}
                    onSelect={(e) => handleSelectBike(bike, e)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedBikeId ? (
              <span className="flex items-center gap-2 text-green-600 font-medium">
                <FaCheckCircle />
                Bike selected for exchange
              </span>
            ) : (
              <span>Select a bike to proceed with exchange</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold text-sm transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleExchangeBike}
              disabled={!selectedBikeId || exchanging}
              className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all shadow-md flex items-center gap-2 ${
                !selectedBikeId || exchanging
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-lg'
              }`}
            >
              {exchanging ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Exchanging...
                </>
              ) : (
                <>
                  <FaExchangeAlt />
                  Exchange Bike
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Bike Card Component
const BikeCard = ({ bike, bikeId, isSelected, isCurrent, onSelect }) => {
  return (
    <div
      onClick={isCurrent ? undefined : onSelect}
      className={`
        relative border-2 rounded-xl p-4 transition-all
        ${isCurrent 
          ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60' 
          : isSelected
          ? 'border-blue-500 bg-blue-50 shadow-lg scale-105 cursor-pointer'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md cursor-pointer'
        }
      `}
    >
      {/* Current Bike Badge */}
      {isCurrent && (
        <div className="absolute top-2 right-2 bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
          Current Bike
        </div>
      )}

      {/* Selected Badge */}
      {isSelected && !isCurrent && (
        <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 z-10">
          <FaCheckCircle />
          Selected
        </div>
      )}

      {/* Bike Image */}
      <div className="mb-3 bg-gray-100 rounded-lg overflow-hidden h-32 flex items-center justify-center">
        {bike.imageUrl ? (
          <img
            src={bike.imageUrl}
            alt={bike.registrationNumber}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = '<div class="text-gray-400 text-4xl flex items-center justify-center h-full"><svg class="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z"></path></svg></div>';
            }}
          />
        ) : (
          <FaMotorcycle className="text-gray-400 text-4xl" />
        )}
      </div>

      {/* Bike Details */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900">{bike.registrationNumber}</h3>
          {!isCurrent && (
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
              Available
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-500 text-xs">Brand</p>
            <p className="font-medium text-gray-900">{bike.brandName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Model</p>
            <p className="font-medium text-gray-900">{bike.modelName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Category</p>
            <p className="font-medium text-gray-900">{bike.categoryName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Year</p>
            <p className="font-medium text-gray-900">{bike.registrationYear || 'N/A'}</p>
          </div>
        </div>

        {bike.fuelType && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
              {bike.fuelType}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExchangeBikeModal;
