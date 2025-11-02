import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  FaArrowLeft,
  FaDownload,
  FaPrint,
  FaCheckCircle,
  FaMotorcycle,
  FaUser,
  FaPhone,
  FaCalendarAlt,
  FaClock,
  FaMoneyBillWave,
  FaFileInvoice,
  FaHashtag,
  FaRoad,
  FaExclamationTriangle,
  FaReceipt
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { bookingAPI, invoiceAPI } from '../utils/apiClient';

const AdminInvoice = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const printRef = useRef();

  const [invoice, setInvoice] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🚀 AdminInvoice mounted');
    console.log('🆔 Booking ID from params:', bookingId);
  }, []);

  useEffect(() => {
    if (booking && invoice) {
      sessionStorage.setItem('currentInvoiceBookingId', bookingId);
      sessionStorage.setItem('invoiceBookingData', JSON.stringify(booking));
      sessionStorage.setItem('invoiceData', JSON.stringify(invoice));
    }
  }, [booking, invoice, bookingId]);

  useEffect(() => {
    const savedBookingId = sessionStorage.getItem('currentInvoiceBookingId');
    const savedBookingData = sessionStorage.getItem('invoiceBookingData');
    const savedInvoiceData = sessionStorage.getItem('invoiceData');

    if (savedBookingId === bookingId && savedBookingData && savedInvoiceData) {
      try {
        const parsedBooking = JSON.parse(savedBookingData);
        const parsedInvoice = JSON.parse(savedInvoiceData);
        setBooking(parsedBooking);
        setInvoice(parsedInvoice);
        setLoading(false);
        console.log('✅ Invoice data restored from session storage');
        return;
      } catch (e) {
        console.log('⚠️ Failed to parse saved data, fetching fresh data');
      }
    }

    fetchInvoiceData();
  }, [bookingId]);

  const fetchInvoiceData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📄 Fetching invoice and booking data for ID:', bookingId);
      
      // Fetch both invoice and booking data in parallel
      const [invoiceResponse, bookingResponse] = await Promise.all([
        invoiceAPI.getByBookingId(bookingId),
        bookingAPI.getById(bookingId)
      ]);
      
      // Extract data from responses
      const invoiceData = invoiceResponse.data || invoiceResponse;
      const bookingData = bookingResponse.data?.data || bookingResponse.data;
      
      console.log('✅ Invoice data fetched:', invoiceData);
      console.log('✅ Booking data fetched:', bookingData);
      
      setInvoice(invoiceData);
      setBooking(bookingData);

      toast.success('Invoice loaded successfully');
    } catch (err) {
      console.error('❌ Error fetching invoice:', err);
      setError(err);
      
      if (err.response?.status === 404) {
        toast.error('Invoice not found. Please complete the booking first.');
      } else if (err.response?.status === 401) {
        toast.error('Authentication required. Please login again.');
      } else {
        toast.error('Failed to load invoice data');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.info('Download functionality coming soon');
  };

  const handleBackToBookings = () => {
    const backPath = '/dashboard/allBookings';
    
    sessionStorage.removeItem('currentInvoiceBookingId');
    sessionStorage.removeItem('invoiceBookingData');
    sessionStorage.removeItem('invoiceData');
    sessionStorage.removeItem('invoiceReferrer');
    
    navigate(backPath, { 
      replace: false,
      state: { 
        returnFromInvoice: true,
        bookingId: bookingId
      }
    });
  };

  const calculateTripDistance = () => {
    if (booking?.startTripKm && booking?.endTripKm) {
      return (booking.endTripKm - booking.startTripKm).toFixed(2);
    }
    return 'N/A';
  };

  // Helper to safely get value from invoice or booking
  const getAmount = (invoiceField, bookingField, defaultValue = 0) => {
    return invoiceField || bookingField || defaultValue;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice || !booking) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Available</h2>
          <p className="text-gray-600 mb-6">
            {error?.response?.status === 404 
              ? 'Invoice not found. Please complete the booking first.'
              : 'Unable to load invoice data. Please try again.'}
          </p>
          <button
            onClick={handleBackToBookings}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  // Calculate amounts - use booking data as fallback
  const baseAmount = getAmount(invoice.amount, booking.charges);
  const gstAmount = getAmount(invoice.taxAmount, booking.gst);
  const additionalAmount = getAmount(invoice.additionalAmount, booking.additionalCharges);
  const lateFeeCharges = getAmount(invoice.lateFeeCharges, booking.lateFeeCharges);
  const lateChargesKm = getAmount(invoice.lateChargesKm, booking.lateChargesKm);
  const advanceAmount = getAmount(invoice.advanceAmount, booking.advanceAmount);
  const totalAmount = getAmount(invoice.totalAmount, booking.finalAmount);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Action Bar */}
      <div className="max-w-4xl mx-auto mb-6 print:hidden">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToBookings}
              className="flex items-center px-4 py-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
            >
              <FaArrowLeft className="mr-2" />
              Back to Bookings
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleDownload}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-md"
              >
                <FaDownload className="mr-2" />
                Download PDF
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-md"
              >
                <FaPrint className="mr-2" />
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Container */}
      <div ref={printRef} id="print-area" className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Invoice Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <FaMotorcycle className="text-4xl mr-3" />
                <h1 className="text-3xl font-bold">Bike Rental Invoice</h1>
              </div>
              <p className="text-indigo-100">Professional Bike Rental Services</p>
            </div>

            <div className="text-right">
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg inline-block">
                <p className="text-sm opacity-90">Invoice Number</p>
                <p className="text-xl font-bold">{invoice.invoiceNumber}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="px-8 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              
              {/* <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                invoice.status === 'PAID' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {invoice.status === 'PAID' ? 'Payment Completed' : 'Payment Pending'}
              </span> */}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Invoice Date</p>
              <p className="text-gray-900 font-semibold">{formatDate(invoice.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Customer & Booking Details */}
        <div className="p-8">
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Customer Information */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaUser className="mr-2 text-indigo-600" />
                Customer Details
              </h2>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-900">{booking.customerName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 flex items-center">
                    <FaPhone className="mr-1" /> Contact
                  </p>
                  <p className="font-semibold text-gray-900">{booking.customerNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer ID</p>
                  <p className="font-semibold text-gray-900">{invoice.customerId}</p>
                </div>
              </div>
            </div>

            {/* Booking Information */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaFileInvoice className="mr-2 text-indigo-600" />
                Booking Details
              </h2>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600 flex items-center">
                    <FaHashtag className="mr-1" /> Booking ID
                  </p>
                  <p className="font-semibold text-gray-900">{booking.bookingId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 flex items-center">
                    <FaCalendarAlt className="mr-1" /> Booking Period
                  </p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {formatDate(booking.startDate)}
                    <br />
                    to {formatDate(booking.endDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Hours</p>
                  <p className="font-semibold text-gray-900">{booking.totalHours} hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="bg-indigo-50 p-6 rounded-lg mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaMotorcycle className="mr-2 text-indigo-600" />
              Vehicle Information
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Registration Number</p>
                <p className="font-bold text-gray-900 text-lg">
                  {booking.bikeDetails?.registrationNumber || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Chassis Number</p>
                <p className="font-semibold text-gray-900">
                  {booking.bikeDetails?.chassisNumber || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 flex items-center">
                  <FaRoad className="mr-1" /> Trip Distance
                </p>
                <p className="font-bold text-gray-900">{calculateTripDistance()} km</p>
              </div>
            </div>

            {booking.startTripKm && booking.endTripKm && (
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-indigo-200">
                <div>
                  <p className="text-sm text-gray-600">Start Trip KM</p>
                  <p className="font-semibold text-gray-900">{booking.startTripKm} km</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">End Trip KM</p>
                  <p className="font-semibold text-gray-900">{booking.endTripKm} km</p>
                </div>
              </div>
            )}
          </div>

          {/* Charges Breakdown */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaMoneyBillWave className="mr-2 text-green-600" />
              Charges Breakdown
            </h2>

            <div className="space-y-3">
              {/* Base Charges */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">Base Ride Fee ({booking.totalHours} hours)</span>
                <span className="font-semibold text-gray-900">{formatCurrency(booking.charges)}</span>
              </div>

              {/* Delivery Charges */}
              {booking.deliveryCharges > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700">Delivery Charges</span>
                  <span className="font-semibold text-gray-900">
                    +{formatCurrency(booking.deliveryCharges)}
                  </span>
                </div>
              )}

              {/* Late Fee (Hours) */}
              {lateFeeCharges > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700 flex items-center">
                    <FaClock className="mr-2 text-orange-500" />
                    Late Fee (Hours)
                  </span>
                  <span className="font-semibold text-orange-600">
                    +{formatCurrency(lateFeeCharges)}
                  </span>
                </div>
              )}

              {/* Late Fee (KM) */}
              {lateChargesKm > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700 flex items-center">
                    <FaRoad className="mr-2 text-orange-500" />
                    Extra KM Charges
                  </span>
                  <span className="font-semibold text-orange-600">
                    +{formatCurrency(lateChargesKm)}
                  </span>
                </div>
              )}

              {/* Additional Charges */}
              {additionalAmount > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <div className="flex flex-col">
                    <span className="text-gray-700 flex items-center">
                      <FaReceipt className="mr-2 text-purple-500" />
                      Additional Charges
                    </span>
                    {(invoice.additionalDetails || booking.additionalChargesDetails) && (
                      <span className="text-xs text-gray-500 ml-6 mt-1">
                        {invoice.additionalDetails || booking.additionalChargesDetails}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-purple-600">
                    +{formatCurrency(additionalAmount)}
                  </span>
                </div>
              )}

              {/* GST */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">GST (5%)</span>
                <span className="font-semibold text-gray-900">
                  +{formatCurrency(gstAmount)}
                </span>
              </div>

              {/* Subtotal */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200 bg-gray-50 -mx-6 px-6">
                <span className="text-gray-700 font-medium">Subtotal</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(booking.totalCharges || totalAmount)}
                </span>
              </div>

              {/* Advance Deposit */}
              {advanceAmount > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700">Advance Deposit (Paid)</span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(advanceAmount)}
                  </span>
                </div>
              )}

              {/* Total Amount */}
              <div className="flex justify-between items-center py-4 bg-gradient-to-r from-indigo-50 to-blue-50 -mx-6 px-6 mt-4">
                <span className="text-lg font-bold text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method & Address */}
          {/* <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Payment Method</p>
              <p className="font-semibold text-gray-900">
                {booking.paymentType === 2 ? 'Online Payment' : 'Cash'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Address Type</p>
              <p className="font-semibold text-gray-900">{booking.addressType}</p>
            </div>
          </div> */}

          {booking.address && (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Pickup/Delivery Address</p>
              <p className="text-gray-900">{booking.address}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 border-t">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">Thank you for choosing our bike rental service!</p>
            <p>For any queries, please contact our support team.</p>
            <p className="mt-4 text-xs text-gray-500">
              This is a computer-generated invoice and does not require a signature.
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          #print-area,
          #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminInvoice;
