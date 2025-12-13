import React, { useState, useEffect } from 'react';
import {
  FaArrowLeft, FaEdit, FaSave, FaCheckCircle, FaClock,
  FaMoneyBillWave, FaFileAlt, FaPlus, FaTimes, FaExclamationTriangle,
  FaCamera, FaFileInvoice, FaInfoCircle, FaIdCard, FaMotorcycle, FaEye
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { bookingAPI, documentAPI, additionalChargeAPI } from '../../utils/apiClient';
import apiClient, { BASE_URL } from '../../api/apiConfig';
import DocumentCard from './DocumentCard';
import TripImageCard from './TripImageCard';
import AdditionalCharges from './AdditionalCharges';
import EndTripKmModal from './EndTripKmModal';
import ExtendTripModal from './ExtendTripModal';
import ImagePreviewModal from './ImagePreviewModal';
import { toDateTimeLocal } from './utils/bookingHelpers';
import ExchangeBatteryModal from './ExchangeBatteryModal';
import TrackVehicleButton from './gpstracking/TrackVehicleButton';
import RelayControlButtons from "./gpstracking/RelayControlButtons";
import useLiveTracking from './hooks/useLiveTracking';
import MapModal from './gpstracking/MapModal';
import ExchangeBikeButton from './exchangebike/ExchangeBikeButton';


const BookingDetailView = ({
  booking,
  onBack,
  formatDate,
  formatCurrency,
  getStatusColor,
  getPaymentMethodIcon,
  refreshBookings,
  setBookings,
  navigate,
  showEndTripKmModal,
  setShowEndTripKmModal,
  endTripKmValue,
  setEndTripKmValue,
  showExtendTripModal,
  setShowExtendTripModal,
  newEndDateTime,
  setNewEndDateTime,
  extendLoading,
  setExtendLoading
}) => {
  const [formData, setFormData] = useState({});
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [newCharge, setNewCharge] = useState({ type: 'Additional Charges', amount: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingCharges, setIsSavingCharges] = useState(false);
  const [loadingCharges, setLoadingCharges] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  
  // Document verification states
  const [userDocuments, setUserDocuments] = useState(null);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [documentUpdating, setDocumentUpdating] = useState({});
  const { location, fetchLocation } = useLiveTracking(booking.bookingId);
const [showMapModal, setShowMapModal] = useState(false);

const handleOpenLiveMap = async () => {
  await fetchLocation();
  setShowMapModal(true);
};

  const handleBatteryExchanged = () => {
    if (refreshBookings) {
      refreshBookings();
    }
    toast.success('Battery information updated');
  };

  // Fetch additional charges when booking changes
  useEffect(() => {
    if (booking?.id) {
      fetchAdditionalCharges(booking.id);
    }
  }, [booking?.id]);

  const fetchAdditionalCharges = async (bookingId) => {
    setLoadingCharges(true);
    try {
      console.log('🔍 Fetching additional charges for booking:', bookingId);
      const response = await additionalChargeAPI.getByBookingId(bookingId);
      const charges = response.data || [];
      
      const mappedCharges = charges.map(charge => ({
        id: charge.id,
        type: charge.chargeType,
        amount: parseFloat(charge.amount),
        savedToBackend: true
      }));
      
      setAdditionalCharges(mappedCharges);
      console.log('✅ Loaded', mappedCharges.length, 'additional charges');
    } catch (error) {
      console.error('❌ Error fetching additional charges:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load additional charges');
      }
    } finally {
      setLoadingCharges(false);
    }
  };

  useEffect(() => {
    if (booking) {
      setFormData({
        bookingId: booking.bookingId || '',
        startDate: toDateTimeLocal(booking.startDate),
        endDate: toDateTimeLocal(booking.endDate),
        vehicleNumber: booking.bikeDetails?.registrationNumber || booking.vehicleNumber || '',
        customerName: booking.customerName || '',
        customerContact: booking.customerNumber || '',
        address: booking.address || '',
        addressType: booking.addressType || 'Self Pickup',
        rideFee: booking.charges || booking.rideFee || 0,
        lateFeeCharges: booking.lateFeeCharges || 0,
        gstFee: booking.gst || booking.gstFee || 0,
        refundableDeposit: booking.advanceAmount || booking.refundableDeposit || 0,
        totalRideFair: booking.finalAmount || booking.totalRideFair || 0,
        paymentMode: booking.paymentType === 2 ? 'ONLINE' : 'CASH',
        currentBookingStatus: booking.status || 'Confirmed',
        bookingStatus: booking.status || 'Accepted',
        startTripKm: booking.startTripKm || null,
        endTripKm: booking.endTripKm || null,
      });

      if (booking.customerId) {
        fetchUserDocuments(booking.customerId);
      }
    }
  }, [booking]);

  const fetchUserDocuments = async (userId) => {
    if (!userId) return;
    
    setLoadingDocuments(true);
    try {
      console.log(`📥 Fetching documents for user ${userId}`);
      const response = await apiClient.get(`/api/documents/userdocuments/${userId}`);
      
      console.log('📄 Document API Response:', response.data);

      if (response.data) {
        const docs = {
          aadharFrontSide: response.data.adhaarFrontImageUrl || null,
          aadharBackSide: response.data.adhaarBackImageUrl || null,
          drivingLicense: response.data.drivingLicenseImageUrl || null,
          adhaarFrontStatus: response.data.adhaarFrontStatus || 'PENDING',
          adhaarBackStatus: response.data.adhaarBackStatus || 'PENDING',
          licenseStatus: response.data.licenseStatus || 'PENDING',
        };
        
        console.log('✅ Mapped documents:', docs);
        setUserDocuments(docs);
      }
    } catch (error) {
      console.error('❌ Error fetching documents:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status !== 404) {
        toast.warning('Could not load customer documents');
      }
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleDocumentAction = async (docType, action) => {
    if (!booking?.customerId) {
      toast.error("Invalid customer selected");
      return;
    }

    setDocumentUpdating(prev => ({ ...prev, [docType]: true }));

    try {
      const fieldMapping = {
        'aadharFrontSide': 'adhaarFrontStatus',
        'aadharBackSide': 'adhaarBackStatus',
        'drivingLicense': 'licenseStatus'
      };
      
      const backendFieldName = fieldMapping[docType];
      if (!backendFieldName) {
        throw new Error(`Invalid document type: ${docType}`);
      }

      const statusUpdates = { [backendFieldName]: action };

      console.log(`📤 Updating ${docType} to ${action} for user ${booking.customerId}`);
      console.log('Request payload:', statusUpdates);

      const response = await documentAPI.verify(booking.customerId, statusUpdates);

      if (response.status === 200) {
        console.log('✅ Backend updated successfully');

        setUserDocuments(prev => ({
          ...prev,
          [backendFieldName]: action
        }));

        toast.success(`✅ Document ${action === 'VERIFIED' ? 'Verified' : 'Rejected'} successfully`);

        setTimeout(async () => {
          try {
            const verifyResponse = await apiClient.get(`/api/documents/userdocuments/${booking.customerId}`);
            
            if (verifyResponse.data) {
              setUserDocuments({
                aadharFrontSide: verifyResponse.data.adhaarFrontImageUrl || null,
                aadharBackSide: verifyResponse.data.adhaarBackImageUrl || null,
                drivingLicense: verifyResponse.data.drivingLicenseImageUrl || null,
                adhaarFrontStatus: verifyResponse.data.adhaarFrontStatus || 'PENDING',
                adhaarBackStatus: verifyResponse.data.adhaarBackStatus || 'PENDING',
                licenseStatus: verifyResponse.data.licenseStatus || 'PENDING',
              });
              
              console.log('✅ Confirmed status from backend:', verifyResponse.data);
            }
          } catch (err) {
            console.error('⚠️ Failed to verify update:', err);
          }
        }, 1500);

      } else {
        throw new Error("Failed to update document status");
      }
    } catch (error) {
      console.error("❌ Error updating document:", error);
      console.error("Error details:", error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update document verification';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setDocumentUpdating(prev => ({ ...prev, [docType]: false }));
    }
  };

  const handleExtendTrip = async () => {
  if (!booking?.id) {
    toast.error("Booking ID not found");
    return;
  }

  if (!newEndDateTime) {
    toast.error("Please select new end date & time");
    return;
  }

  const newDate = new Date(newEndDateTime);
  if (isNaN(newDate.getTime())) {
    toast.error("Invalid date");
    return;
  }

  setExtendLoading(true);

  try {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const token = localStorage.getItem("authtoken") || localStorage.getItem("token");

    const url = `${baseUrl}/api/booking-bikes/admin/bookings/${booking.id}/extend?newEndDateTime=${newDate.getTime()}`;

    console.log("➡️ Calling extend API:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Trip extension failed");
    }

    toast.success(data.message || "Trip extended successfully!");

    setShowExtendTripModal(false);
    setNewEndDateTime("");

    if (refreshBookings) {
      setTimeout(() => refreshBookings(), 1000);
    }

  } catch (err) {
    toast.error(err.message);
    console.error("Extend error:", err);
  } finally {
    setExtendLoading(false);
  }
};


  const handleCloseExtendModal = () => {
    setShowExtendTripModal(false);
    setNewEndDateTime('');
  };

  const openImageModal = (imageUrl, documentName) => {
    setSelectedImage({ url: imageUrl, name: documentName });
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const handleInputChange = (field, value) => {
    if (field === 'bookingStatus') {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };
  const handleAddCharge = () => {
    if (newCharge.type !== 'Additional Charges' && newCharge.amount && !isNaN(parseFloat(newCharge.amount))) {
      const charge = {
        id: Date.now(),
        type: newCharge.type,
        amount: parseFloat(newCharge.amount),
        savedToBackend: false
      };
      setAdditionalCharges(prev => [...prev, charge]);
      setNewCharge({ type: 'Additional Charges', amount: '' });
      toast.success(`Added ${charge.type}: ${charge.amount}`);
    } else {
      if (newCharge.type === 'Additional Charges') {
        toast.error('Please select a specific charge type');
      } else if (!newCharge.amount) {
        toast.error('Please enter amount');
      } else {
        toast.error('Please enter a valid amount');
      }
    }
  };

  const handleRemoveCharge = async (chargeId, savedToBackend) => {
    const chargeToRemove = additionalCharges.find(charge => charge.id === chargeId);
    
    if (savedToBackend) {
      try {
        console.log('Removing charge from backend:', chargeId);
        await additionalChargeAPI.remove(chargeId);
        toast.success(`Removed ${chargeToRemove.type}: ${chargeToRemove.amount}`);
        await fetchAdditionalCharges(booking.id);
        if (refreshBookings) refreshBookings();
      } catch (error) {
        console.error('Error removing charge:', error);
        toast.error('Failed to remove charge');
      }
    } else {
      setAdditionalCharges(prev => prev.filter(charge => charge.id !== chargeId));
      if (chargeToRemove) {
        toast.success(`Removed ${chargeToRemove.type}: ${chargeToRemove.amount}`);
      }
    }
  };

  const handleSaveCharges = async () => {
    const unsavedCharges = additionalCharges.filter(charge => !charge.savedToBackend);
    
    if (unsavedCharges.length === 0) {
      toast.info('All charges are already saved');
      return;
    }

    setIsSavingCharges(true);
    try {
      console.log('Saving additional charges to backend:', unsavedCharges);
      
      const chargesType = unsavedCharges.map(charge => charge.type);
      const chargesAmount = unsavedCharges.map(charge => charge.amount);

      const response = await additionalChargeAPI.save(booking.id, chargesType, chargesAmount);

      console.log('Backend response:', response.data);
      toast.success(`Saved ${unsavedCharges.length} additional charges successfully!`);
      
      await fetchAdditionalCharges(booking.id);
      
      if (refreshBookings) {
        setTimeout(() => refreshBookings(), 500);
      }
    } catch (error) {
      console.error('Error saving additional charges:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to save additional charges');
      }
    } finally {
      setIsSavingCharges(false);
    }
  };

  const handleUpdateBookingDetails = async () => {
    if (!booking?.id) {
      toast.error('Booking ID not found');
      return;
    }

    if (formData.bookingStatus === formData.currentBookingStatus) {
      toast.info('Status is already up to date');
      return;
    }

    if (formData.bookingStatus === 'Completed' && !formData.endTripKm) {
      setShowEndTripKmModal(true);
      return;
    }

    setIsUpdating(true);
    try {
      console.log('Updating booking status:', {
        bookingId: booking.id,
        newStatus: formData.bookingStatus,
        previousStatus: formData.currentBookingStatus,
        endTripKm: formData.endTripKm
      });

      let response;
      if (formData.bookingStatus === 'Accepted') {
        response = await bookingAPI.accept(booking.id);
      } else if (formData.bookingStatus === 'Cancelled') {
        response = await bookingAPI.cancel(booking.id);
      } else if (formData.bookingStatus === 'Completed') {
        response = await bookingAPI.complete(booking.id, formData.endTripKm);
      } else {
        toast.warning('Status update not implemented for this status');
        return;
      }

      setFormData(prev => ({ ...prev, currentBookingStatus: formData.bookingStatus }));
      toast.success(`Status changed from ${formData.currentBookingStatus} to ${formData.bookingStatus}`, { autoClose: 4000 });

      if (refreshBookings) {
        setTimeout(() => refreshBookings(), 1500);
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      
      if (error.response?.data?.requireEndTripKm === true) {
        toast.warning(error.response.data.message || 'End Trip KM is required');
        setShowEndTripKmModal(true);
        return;
      }

      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to update booking status');
      }
      
      setFormData(prev => ({ ...prev, bookingStatus: prev.currentBookingStatus }));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmitEndTripKm = async () => {
    console.log('handleSubmitEndTripKm called');
    console.log('endTripKmValue from state:', endTripKmValue);

    const bookingId = booking?.id;
    if (!bookingId) {
      toast.error('Booking ID not found');
      return;
    }

    const kmValue = parseFloat(endTripKmValue);
    if (!kmValue || isNaN(kmValue) || kmValue <= 0) {
      toast.error('Please enter a valid End Trip KM value');
      return;
    }

    const startKm = formData?.startTripKm || 0;
    if (kmValue <= startKm) {
      toast.error(`End Trip KM must be greater than Start Trip KM (${startKm} km)`);
      return;
    }

    console.log('Submitting with:');
    console.log('- bookingId:', bookingId);
    console.log('- kmValue:', kmValue);

    setIsUpdating(true);
    try {
      console.log('[DIRECT] Making direct API call with endTripKm:', kmValue);

      const baseUrl = import.meta.env.VITE_BASE_URL;
      const url = `${baseUrl}/api/booking-bikes/${bookingId}/complete?endTripKm=${kmValue}`;
      console.log('[ENV URL]:', url);

      const token = localStorage.getItem('authtoken') || localStorage.getItem('token');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      console.log('[DIRECT] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[DIRECT] Error:', errorData);
        throw new Error(errorData.message || 'Failed to complete trip');
      }

      const data = await response.json();
      console.log('[DIRECT] Success:', data);

      setFormData(prev => ({
        ...prev,
        currentBookingStatus: 'Completed',
        bookingStatus: 'Completed',
        endTripKm: kmValue
      }));

      setShowEndTripKmModal(false);
      setEndTripKmValue('');
      toast.success('Trip completed successfully!', { autoClose: 4000 });

      if (refreshBookings) {
        setTimeout(() => refreshBookings(), 1500);
      }
    } catch (error) {
      console.error('[DIRECT] Error completing trip:', error);
      toast.error(error.message || 'Failed to complete trip');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewInvoice = () => {
    console.log('Opening invoice for booking:', booking.id);
    navigate(`/dashboard/invoice/${booking.id}`, {
      state: { from: '/dashboard/allBookings', booking: booking }
    });
  };

  const totalAdditionalCharges = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
  const unsavedChargesCount = additionalCharges.filter(c => !c.savedToBackend).length;

    return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header - Mobile Responsive */}
        {/* Header - Updated with Exchange Bike button */}
<div className="bg-white border-b px-3 sm:px-4 py-2 sm:py-3">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
    <div className="flex items-center space-x-2 sm:space-x-3">
      <button
        onClick={onBack}
        className="flex items-center px-2 sm:px-3 py-1.5 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-xs sm:text-sm font-medium"
      >
        <FaArrowLeft className="mr-1 sm:mr-2" />
        <span className="hidden sm:inline">Back to List</span>
        <span className="sm:hidden">Back</span>
      </button>
      <h1 className="text-sm sm:text-base font-medium text-gray-900">View Booking Details</h1>
    </div>
    
    <div className="flex gap-2">
      {/* Exchange Bike Button */}
      <ExchangeBikeButton 
        booking={booking}
        onBikeExchanged={() => {
          if (refreshBookings) {
            refreshBookings();
          }
          toast.success('Vehicle exchanged successfully!');
        }}
      />
      
      {/* View Invoice Button */}
      {(booking.status === 'Completed' || booking.bookingStatus === 5) && (
        <button
          onClick={handleViewInvoice}
          className="flex items-center justify-center px-3 sm:px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all shadow-md text-xs sm:text-sm font-semibold"
        >
          <FaFileInvoice className="mr-1 sm:mr-2" />
          View Invoice
        </button>
      )}
    </div>
  </div>
</div>


        <div className="p-3 sm:p-4 lg:p-6">
          {/* Vehicle Image - Mobile Responsive */}
         {/* Vehicle Image Section */}
<div className="mb-4 sm:mb-6">
  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
    <FaMotorcycle className="inline mr-2" />
    Vehicle Image
  </label>
  
  {(() => {
    const vehicleImageUrl = 
      booking.bikeDetails?.imageUrl ||
      booking.bikeDetails?.image ||
      booking.vehicleImage ||
      booking.bikeImage;

    if (!vehicleImageUrl) {
      return (
        <div className="w-full h-48 bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <FaMotorcycle className="text-gray-400 text-5xl mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No vehicle image available</p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full bg-white border-2 border-indigo-200 rounded-lg overflow-hidden shadow-md">
        <img
          src={vehicleImageUrl}
          alt="Vehicle"
          className="w-full h-auto max-h-96 object-contain bg-gray-50 cursor-pointer hover:scale-105 transition-transform"
          onClick={() => openImageModal(vehicleImageUrl, 'Vehicle Image')}
          onError={(e) => {
            console.error('Failed to load vehicle image:', vehicleImageUrl);
            e.target.style.display = 'none';
            e.target.parentNode.innerHTML = `
              <div class="flex flex-col items-center justify-center h-48 bg-gray-100">
                <svg class="w-16 h-16 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54
                    0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464
                    0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p class="text-red-500 text-sm font-medium">Failed to load image</p>
              </div>
            `;
          }}
        />
      </div>
    );
  })()}
</div>

{/* ✅ GPS Tracking Controls - Conditional Rendering Based on IMEI */}
{booking.bikeDetails?.imeiNumber && booking.bikeDetails.imeiNumber.trim() !== '' ? (
  <>
    {/* Show GPS controls for active trip statuses - INCLUDING "Trip Extend" */}
    {['Accepted', 'Start Trip', 'End Trip', 'Trip Extend'].includes(booking.status) && (
      <>
        {/* View Live Location Button */}
        <div className="mb-4">
          <button
            className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-semibold text-sm"
            onClick={handleOpenLiveMap}
          >
            <FaEye className="text-lg" />
            View Live Location
          </button>
          
          <MapModal
            show={showMapModal}
            onClose={() => setShowMapModal(false)}
            location={location}
          />
        </div>

        {/* Engine Control Buttons */}
        <RelayControlButtons 
          bookingId={booking.bookingId}  
          initialEngineStatus={booking.bikeDetails?.engineStatus ?? 0}
          bookingStatus={booking.status}
          onStatusChange={(newStatus) => {
            console.log('🔄 Engine status changed to:', newStatus);
            if (refreshBookings) {
              setTimeout(() => {
                refreshBookings();
              }, 2000);
            }
          }}
        />
      </>
    )}
  </>
) : (
  <>
    {/* Warning message if IMEI is not available for active trips */}
    {['Accepted', 'Start Trip', 'End Trip', 'Trip Extend'].includes(booking.status) && (
      <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 shadow-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <FaExclamationTriangle className="text-yellow-600 text-xl" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-semibold text-yellow-800 mb-1">
              GPS Tracking Not Available
            </h4>
            <p className="text-xs text-yellow-700 leading-relaxed">
              This vehicle does not have a GPS tracker (IMEI number not available). 
              Live location tracking and remote engine controls are not available for this booking.
            </p>
          </div>
        </div>
      </div>
    )}
  </>
)}


          {/* Form Grid - Mobile Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
            {/* Row 1 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Booking ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bookingId}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                End Date <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-1">
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  readOnly
                  className="flex-1 px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
                />
                <button
  onClick={() => setShowExtendTripModal(true)}
  className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition-colors"
>
  Extend
</button>

              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Vehicle Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.vehicleNumber}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>

            {/* Row 2 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.customerName}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Customer Contact <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.customerContact}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Address</label>
              <input
                type="text"
                value={formData.address}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Address Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.addressType}
                disabled
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              >
                <option value="Self Pickup">Self Pickup</option>
                <option value="Home Delivery">Home Delivery</option>
                <option value="Office Delivery">Office Delivery</option>
              </select>
            </div>

            {/* Row 3 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Ride Fee <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.rideFee}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Late Fee Charges</label>
              <input
                type="number"
                value={formData.lateFeeCharges}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                GST Fee <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.gstFee}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Refundable Deposit <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.refundableDeposit}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>

            {/* Row 4 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Total Ride Fair <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.totalRideFair}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Payment Mode <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.paymentMode}
                disabled
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              >
                <option value="CASH">CASH</option>
                <option value="ONLINE">ONLINE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Start Trip KM</label>
              <input
                type="number"
                value={formData.startTripKm || ''}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
                placeholder="Not started"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">End Trip KM</label>
              <input
                type="number"
                value={formData.endTripKm || ''}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
                placeholder="Not completed"
              />
            </div>
          </div>

          {booking.bikeDetails?.electricBatteryId && (
  <div className="mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2 shadow-sm gap-2">
    <div className="text-xs sm:text-sm text-gray-800">
      <span className="font-semibold">Battery: </span>
      <span className="text-green-800 font-semibold">
        {booking.bikeDetails.electricBatteryName || `ID: ${booking.bikeDetails.electricBatteryId}`}
      </span>
    </div>


              <button
                onClick={() => setShowExchangeModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 rounded bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <span>Exchange Battery</span>
              </button>
            </div>
          )}

          {/* Booking Status Update - Mobile Responsive */}
          <div className="bg-indigo-50 rounded-lg p-3 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Update Booking Status
                </label>
                <select
                  value={formData.bookingStatus}
                  onChange={(e) => handleInputChange('bookingStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="sm:ml-3">
                <button
                  onClick={handleUpdateBookingDetails}
                  disabled={isUpdating || formData.bookingStatus === formData.currentBookingStatus}
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center ${
                    isUpdating || formData.bookingStatus === formData.currentBookingStatus
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  <FaSave className="mr-2" />
                  {isUpdating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Current Status: <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${getStatusColor(formData.currentBookingStatus)} text-white`}>
                {formData.currentBookingStatus}
              </span>
            </div>
          </div>

          {/* Additional Charges Component */}
          <AdditionalCharges
            charges={additionalCharges}
            newCharge={newCharge}
            setNewCharge={setNewCharge}
            onAddCharge={handleAddCharge}
            onRemoveCharge={handleRemoveCharge}
            loading={isSavingCharges || loadingCharges}
            formatCurrency={formatCurrency}
          />

          {/* Save Charges Button - Mobile Responsive */}
          {unsavedChargesCount > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-3 mb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-yellow-600 mr-2 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-yellow-800 font-medium">
                    You have {unsavedChargesCount} unsaved charge(s)
                  </span>
                </div>
                <button
                  onClick={handleSaveCharges}
                  disabled={isSavingCharges}
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                    isSavingCharges
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isSavingCharges ? 'Saving...' : 'Save All Charges'}
                </button>
              </div>
            </div>
          )}

          {/* Start Trip Images - Mobile Responsive Grid */}
          {booking.startTripImages && booking.startTripImages.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                <h2 className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center">
                  <FaCamera className="mr-2 text-purple-600" />
                  Start Trip Images ({booking.startTripImages.length})
                </h2>
                {booking.startTripKm && (
                  <span className="bg-purple-100 text-purple-800 px-2 sm:px-3 py-1 rounded-full text-xs font-medium inline-block">
                    Start KM: {booking.startTripKm} km
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                {booking.startTripImages.map((imagePath, index) => (
                  <TripImageCard
                    key={`start-${index}`}
                    label={`Start - Image ${index + 1}`}
                    imageData={imagePath}
                    onImageClick={openImageModal}
                  />
                ))}
              </div>
            </div>
          )}

          {/* End Trip Images - Mobile Responsive Grid */}
          {booking.endTripImages && booking.endTripImages.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                <h2 className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center">
                  <FaCamera className="mr-2 text-orange-600" />
                  End Trip Images ({booking.endTripImages.length})
                </h2>
                {booking.endTripKm && (
                  <span className="bg-orange-100 text-orange-800 px-2 sm:px-3 py-1 rounded-full text-xs font-medium inline-block">
                    End KM: {booking.endTripKm} km
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                {booking.endTripImages.map((imagePath, index) => (
                  <TripImageCard
                    key={`end-${index}`}
                    label={`End - Image ${index + 1}`}
                    imageData={imagePath}
                    onImageClick={openImageModal}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Customer Documents - Mobile Responsive */}
          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 mt-4">
            <h2 className="text-sm sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <FaIdCard className="mr-2 text-indigo-600" />
              Customer Documents Verification
            </h2>

            {loadingDocuments ? (
              <div className="text-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-indigo-600 mx-auto mb-3 sm:mb-4"></div>
                <p className="text-gray-500 text-xs sm:text-sm">Loading documents...</p>
              </div>
            ) : !userDocuments ? (
              <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
                <FaInfoCircle className="text-gray-400 text-3xl sm:text-4xl mx-auto mb-2 sm:mb-3" />
                <p className="text-gray-600 text-xs sm:text-sm">No documents available for this customer</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <DocumentCard
                  label="Aadhar Card (Front)"
                  docType="aadharFrontSide"
                  imageData={userDocuments.aadharFrontSide}
                  status={userDocuments.adhaarFrontStatus}
                  updating={documentUpdating.aadharFrontSide}
                  onVerify={(docType) => handleDocumentAction(docType, 'VERIFIED')}
                  onReject={(docType) => handleDocumentAction(docType, 'REJECTED')}
                  onImageClick={openImageModal}
                />
                <DocumentCard
                  label="Aadhar Card (Back)"
                  docType="aadharBackSide"
                  imageData={userDocuments.aadharBackSide}
                  status={userDocuments.adhaarBackStatus}
                  updating={documentUpdating.aadharBackSide}
                  onVerify={(docType) => handleDocumentAction(docType, 'VERIFIED')}
                  onReject={(docType) => handleDocumentAction(docType, 'REJECTED')}
                  onImageClick={openImageModal}
                />
                <DocumentCard
                  label="Driving License"
                  docType="drivingLicense"
                  imageData={userDocuments.drivingLicense}
                  status={userDocuments.licenseStatus}
                  updating={documentUpdating.drivingLicense}
                  onVerify={(docType) => handleDocumentAction(docType, 'VERIFIED')}
                  onReject={(docType) => handleDocumentAction(docType, 'REJECTED')}
                  onImageClick={openImageModal}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Modals */}
      <EndTripKmModal
        show={showEndTripKmModal}
        onClose={() => setShowEndTripKmModal(false)}
        value={endTripKmValue}
        onChange={setEndTripKmValue}
        onConfirm={handleSubmitEndTripKm}
        loading={isUpdating}
      />

      <ExtendTripModal
        show={showExtendTripModal}
        onClose={handleCloseExtendModal}
        newEndDateTime={newEndDateTime}
        setNewEndDateTime={setNewEndDateTime}
        onConfirm={handleExtendTrip}
        loading={extendLoading}
        currentEndDate={booking.endDate}
      />

      <ImagePreviewModal
        selectedImage={selectedImage}
        onClose={closeImageModal}
      />

      <ExchangeBatteryModal
        show={showExchangeModal && !!booking.bikeDetails?.electricBatteryId}
        onClose={() => setShowExchangeModal(false)}
        bookingId={booking.id}
        bikeId={booking.bikeDetails?.id || booking.vehicleId}
        currentBatteryId={booking.bikeDetails?.electricBatteryId}
        onExchanged={handleBatteryExchanged}
      />
    </div>
  );
};

export default BookingDetailView;
