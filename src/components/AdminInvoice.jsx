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
  FaReceipt,
  FaInfoCircle,
  FaTools,
  FaPiggyBank
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

      const [invoiceResponse, bookingResponse] = await Promise.all([
        invoiceAPI.getByBookingId(bookingId),
        bookingAPI.getById(bookingId)
      ]);

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

  // Parse additional charges - separate base and GST
  const parseAdditionalCharges = (detailsString) => {
  if (!detailsString) return { extensions: [], manualCharges: [] };
  try {
    const entries = detailsString.split(' | ').filter(entry => entry.trim());
    const extensions = [];
    const manualCharges = [];
    entries.forEach((entry, index) => {
      const extMatch = entry.match(/Extend Trip (.+?) -> (.+?): base=([\d.]+), gst\(5%\)=([\d.]+), total=([\d.]+)/);
      if (extMatch) {
        extensions.push({
          id: index,
          fromDate: extMatch[1].trim(),
          toDate: extMatch[2].trim(),
          baseAmount: parseFloat(extMatch[3]),
          gstAmount: parseFloat(extMatch[4]),
          totalAmount: parseFloat(extMatch[5])
        });
      } else {
        const manualMatch = entry.match(/Manual charges: (.+)/);
        if (manualMatch) {
          const chargesStr = manualMatch[1];
          const chargeItems = chargesStr.split(',').map(item => item.trim());
          chargeItems.forEach(item => {
            const [name, amount] = item.split('=');
            if (name && amount && !name.toLowerCase().startsWith('total')) {
              manualCharges.push({
                name: name.trim(),
                amount: parseFloat(amount)
              });
            }
          });
        }
      }
    });
    return { extensions, manualCharges };
  } catch (error) {
    console.error('Error parsing additional charges:', error);
    return { extensions: [], manualCharges: [] };
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
    const roundedAmount = Math.round(amount || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(roundedAmount);
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
      const distance = booking.endTripKm - booking.startTripKm;
      return Math.round(distance);
    }
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-base sm:text-lg">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice || !booking) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 max-w-md w-full text-center">
          <FaExclamationTriangle className="text-red-500 text-4xl sm:text-5xl mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Invoice Not Available</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            {error?.response?.status === 404 
              ? 'Invoice not found. Please complete the booking first.'
              : 'Unable to load invoice data. Please try again.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={fetchInvoiceData}
              className="px-4 sm:px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base rounded-lg transition-colors"
            >
              🔄 Try Again
            </button>
            <button
              onClick={handleBackToBookings}
              className="px-4 sm:px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm sm:text-base rounded-lg transition-colors"
            >
              ← Back to Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Parse additional charges
  const { extensions, manualCharges } = parseAdditionalCharges(booking?.additionalChargesDetails);

  // Get values from response - SEPARATE BASE AND GST
const baseRentalPrice = Math.round(booking?.charges ?? 0);
const baseRentalGst = Math.round(booking?.gst ?? 0);
const deliveryCharges = Math.round(invoice?.deliveryCharges || booking?.deliveryCharges || 0);
const couponDiscount = Math.round(invoice?.couponAmount || booking?.couponAmount || 0);
const lateFee = Math.round(invoice?.lateFeeCharges || booking?.lateFeeCharges || 0);
const extraKmCharges = Math.round(invoice?.lateChargesKm || booking?.lateChargesKm || 0);
const advanceAmount = Math.round(invoice?.advanceAmount || booking?.advanceAmount || 0);

// Extension BASE amounts only (without GST)
const extensionBaseTotal = Math.round(extensions.reduce((sum, ext) => sum + ext.baseAmount, 0));
const extensionGstTotal = Math.round(extensions.reduce((sum, ext) => sum + ext.gstAmount, 0));

// Manual charges (NO GST)
const manualChargesTotal = Math.round(manualCharges.reduce((sum, charge) => sum + charge.amount, 0));

// CLEAR SEPARATED CALCULATION
const subtotalBeforeGst = baseRentalPrice + deliveryCharges + lateFee + extraKmCharges + extensionBaseTotal + manualChargesTotal - couponDiscount;
const totalGstAmount = baseRentalGst + extensionGstTotal; // All GST combined
const grandTotal = subtotalBeforeGst + totalGstAmount + advanceAmount;
const finalAmountPayable = Math.max(0, grandTotal - advanceAmount);


  const tripDistance = calculateTripDistance();

  console.log('💰 SEPARATED GST CALCULATION:', {
    '1. Base Rental (no GST)': baseRentalPrice,
    '2. Delivery': deliveryCharges,
    '3. Late Fee': lateFee,
    '4. Extra KM': extraKmCharges,
    '5. Extensions BASE (no GST)': extensionBaseTotal,
    '6. Manual Charges (no GST)': manualChargesTotal,
    '7. Coupon': -couponDiscount,
    '= Subtotal (before GST)': subtotalBeforeGst,
    '8. Base Rental GST': baseRentalGst,
    '9. Extension GST': extensionGstTotal,
    '= Total GST': totalGstAmount,
    '10. Advance': advanceAmount,
    '= Grand Total': grandTotal,
    '11. Minus Advance': -advanceAmount,
    '✅ Final Payable': finalAmountPayable
  });

  return (
    <div className="min-h-screen bg-gray-100 py-4 sm:py-8 px-2 sm:px-4">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Action Bar */}
      <div className="max-w-4xl mx-auto mb-4 sm:mb-6 print:hidden">
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              onClick={handleBackToBookings}
              className="flex items-center justify-center px-4 py-2.5 text-sm sm:text-base text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
            >
              <FaArrowLeft className="mr-2" />
              Back to Bookings
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-3">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center px-4 py-2.5 text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-md"
              >
                <FaDownload className="mr-2" />
                Download PDF
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center justify-center px-4 py-2.5 text-sm sm:text-base bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-md"
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
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <div className="flex items-center mb-2">
                <FaMotorcycle className="text-2xl sm:text-3xl md:text-4xl mr-2 sm:mr-3" />
                <h1 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold break-words">
                  Admin Invoice - VegoBike
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-indigo-100">Professional Bike Rental Services</p>
            </div>

            <div className="w-full sm:w-auto text-left sm:text-right">
              <div className="bg-white bg-opacity-20 px-3 sm:px-4 py-2 rounded-lg inline-block">
                <p className="text-xs sm:text-sm opacity-90">Invoice Number</p>
                <p className="text-base sm:text-lg md:text-xl font-bold break-all">{invoice.invoiceNumber}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="px-3 sm:px-6 md:px-8 py-3 sm:py-4 bg-gray-50 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:space-x-4 w-full sm:w-auto">
              <div className="flex items-center w-full sm:w-auto">
                <FaCheckCircle className="text-green-500 text-lg sm:text-xl md:text-2xl mr-2 flex-shrink-0" />
                <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${
                  invoice.status === 'PAID' 
                    ? 'bg-green-100 text-green-800' 
                    : booking.status === 'Completed'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {invoice.status === 'PAID' ? 'Payment Completed' : booking.status || 'Payment Pending'}
                </span>
              </div>
              {booking.paymentType && (
                <div className="bg-purple-100 text-purple-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold">
                  {booking.paymentType === 2 ? '💳 Online Payment' : '💵 Cash Payment'}
                </div>
              )}
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <p className="text-xs sm:text-sm text-gray-600">Invoice Date</p>
              <p className="text-sm sm:text-base text-gray-900 font-semibold break-words">{formatDate(invoice.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Customer & Booking Details */}
        <div className="p-4 sm:p-6 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* Customer Information */}
            <div className="bg-gray-50 p-4 sm:p-5 rounded-lg">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FaUser className="mr-2 text-indigo-600 text-sm sm:text-base flex-shrink-0" />
                <span>Customer Details</span>
              </h2>
              <div className="space-y-2">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Name</p>
                  <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">{booking.customerName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 flex items-center">
                    <FaPhone className="mr-1 flex-shrink-0" /> Contact
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-gray-900">{booking.customerNumber || 'N/A'}</p>
                </div>
                {invoice.customerId && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Customer ID</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">{invoice.customerId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Information */}
            <div className="bg-gray-50 p-4 sm:p-5 rounded-lg">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FaFileInvoice className="mr-2 text-indigo-600 text-sm sm:text-base flex-shrink-0" />
                <span>Booking Details</span>
              </h2>
              <div className="space-y-2">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 flex items-center">
                    <FaHashtag className="mr-1 flex-shrink-0" /> Booking ID
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-gray-900 break-all">{booking.bookingId}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 flex items-center">
                    <FaCalendarAlt className="mr-1 flex-shrink-0" /> Booking Period
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 break-words">
                    {formatDate(booking.startDate)}<br />to {formatDate(booking.endDate)}
                  </p>
                </div>
                {booking.addressType && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Address Type</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">{booking.addressType}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="bg-indigo-50 p-4 sm:p-5 rounded-lg mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <FaMotorcycle className="mr-2 text-indigo-600 flex-shrink-0" />
              <span>Vehicle Information</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Registration Number</p>
                <p className="text-sm sm:text-base font-bold text-gray-900 break-all">
                  {booking.bikeDetails?.registrationNumber || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Chassis Number</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 break-all">
                  {booking.bikeDetails?.chassisNumber || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 flex items-center">
                  <FaRoad className="mr-1 flex-shrink-0" /> Trip Distance
                </p>
                <p className="text-sm sm:text-base font-bold text-gray-900">
                  {tripDistance !== 'N/A' ? `${tripDistance} km` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* SEPARATED GST BREAKDOWN */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4 sm:p-5">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaMoneyBillWave className="mr-2 text-green-600 flex-shrink-0" />
              <span>Payment Breakdown</span>
            </h2>

            <div className="space-y-2">
              {/* Base Rental - WITHOUT GST */}
              <div className="flex justify-between items-center py-2 text-sm sm:text-base">
                <span className="text-gray-700">Base Rental Charge</span>
                <span className="font-semibold whitespace-nowrap">{formatCurrency(baseRentalPrice)}</span>
              </div>

              {/* Delivery */}
              {deliveryCharges > 0 && (
                <div className="flex justify-between items-center py-2 text-sm sm:text-base border-t border-gray-100">
                  <span className="text-gray-700">Delivery Charges</span>
                  <span className="font-semibold whitespace-nowrap">{formatCurrency(deliveryCharges)}</span>
                </div>
              )}

              {/* Late Fee */}
              {lateFee > 0 && (
                <div className="flex justify-between items-center py-2 text-sm sm:text-base border-t border-gray-100">
                  <span className="text-orange-600 flex items-center">
                    <FaClock className="mr-1 flex-shrink-0 text-xs" />
                    Late Return Fee
                  </span>
                  <span className="font-semibold text-orange-600 whitespace-nowrap">{formatCurrency(lateFee)}</span>
                </div>
              )}

              {/* Extra KM */}
              {extraKmCharges > 0 && (
                <div className="flex justify-between items-center py-2 text-sm sm:text-base border-t border-gray-100">
                  <span className="text-orange-600 flex items-center">
                    <FaRoad className="mr-1 flex-shrink-0 text-xs" />
                    Extra KM Charges
                  </span>
                  <span className="font-semibold text-orange-600 whitespace-nowrap">{formatCurrency(extraKmCharges)}</span>
                </div>
              )}

              {/* Trip Extensions - BASE ONLY (NO GST) */}
              {extensions.length > 0 && (
                <div className="border-t border-gray-100 pt-2">
                  <div className="flex justify-between items-center py-2 text-sm sm:text-base">
                    <span className="text-purple-700 font-medium">Trip Extensions ({extensions.length})</span>
                    <span className="font-semibold text-purple-700 whitespace-nowrap">{formatCurrency(extensionBaseTotal)}</span>
                  </div>
                  <div className="ml-4 sm:ml-6 mt-1 space-y-1">
                    {extensions.map((ext, index) => (
                      <div key={ext.id} className="text-xs sm:text-sm text-gray-600 py-1">
                        <div className="flex justify-between">
                          <span>#{index + 1}: {formatDate(ext.fromDate).split(',')[0]} → {formatDate(ext.toDate).split(',')[0]}</span>
                          <span className="font-medium ml-2">{formatCurrency(ext.baseAmount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Charges (NO GST) */}
              {manualCharges.length > 0 && (
                <div className="border-t border-gray-100 pt-2">
                  <div className="flex justify-between items-center py-2 text-sm sm:text-base">
                    <span className="text-red-700 font-medium flex items-center">
                      <FaTools className="mr-1 flex-shrink-0 text-xs" />
                      Other Charges ({manualCharges.length}) - No GST
                    </span>
                    <span className="font-semibold text-red-700 whitespace-nowrap">{formatCurrency(manualChargesTotal)}</span>
                  </div>
                  <div className="ml-4 sm:ml-6 mt-1 space-y-1">
                    {manualCharges.map((charge, index) => (
                      <div key={index} className="text-xs sm:text-sm text-gray-600 py-1">
                        <div className="flex justify-between">
                          <span>{charge.name}</span>
                          <span className="font-medium ml-2">{formatCurrency(charge.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coupon Discount */}
              {couponDiscount > 0 && (
                <div className="flex justify-between items-center py-2 text-sm sm:text-base border-t border-gray-100 bg-green-50 -mx-4 sm:-mx-5 px-4 sm:px-5">
                  <span className="text-green-700 font-medium">🎉 Coupon Discount</span>
                  <span className="font-semibold text-green-700 whitespace-nowrap">- {formatCurrency(couponDiscount)}</span>
                </div>
              )}

              {/* Subtotal Before GST */}
              <div className="flex justify-between items-center py-3 text-sm sm:text-base border-t-2 border-gray-300 bg-gray-50 -mx-4 sm:-mx-5 px-4 sm:px-5">
                <span className="font-bold text-gray-900">Subtotal (Before GST)</span>
                <span className="font-bold text-gray-900 text-base sm:text-lg whitespace-nowrap">{formatCurrency(subtotalBeforeGst)}</span>
              </div>

              {/* Advance Amount Received */}
              {advanceAmount > 0 && (
                <div className="flex justify-between items-center py-2 text-sm sm:text-base bg-blue-50 -mx-4 sm:-mx-5 px-4 sm:px-5">
                  <span className="text-blue-900 font-medium flex items-center">
                    <FaPiggyBank className="mr-1 flex-shrink-0 text-xs" />
                    Advance Amount Received
                  </span>
                  <span className="font-semibold text-blue-700 whitespace-nowrap">+ {formatCurrency(advanceAmount)}</span>
                </div>
              )}

              {/* GST - SINGLE ROW */}
              <div className="flex justify-between items-center py-2 text-sm sm:text-base bg-yellow-50 -mx-4 sm:-mx-5 px-4 sm:px-5 border-t border-gray-200">
                <div className="flex flex-col">
                  <span className="text-gray-900 font-bold">GST @ 5%</span>
                  <span className="text-xs text-gray-600">
                    (Base: {formatCurrency(baseRentalGst)} + Extensions: {formatCurrency(extensionGstTotal)})
                  </span>
                </div>
                <span className="font-bold text-gray-900 whitespace-nowrap">+ {formatCurrency(totalGstAmount)}</span>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center py-3 text-base sm:text-lg border-t-2 border-indigo-300 bg-indigo-50 -mx-4 sm:-mx-5 px-4 sm:px-5">
                <span className="font-bold text-indigo-900">Grand Total (incl. Advance)</span>
                <span className="font-bold text-indigo-700 text-lg sm:text-xl whitespace-nowrap">{formatCurrency(grandTotal)}</span>
              </div>

              {/* Advance Adjustment */}
              {advanceAmount > 0 && (
                <div className="flex justify-between items-center py-2 text-sm sm:text-base bg-blue-50 -mx-4 sm:-mx-5 px-4 sm:px-5">
                  <span className="text-blue-900 font-medium">(-) Advance Amount Adjustment</span>
                  <span className="font-semibold text-blue-700 whitespace-nowrap">- {formatCurrency(advanceAmount)}</span>
                </div>
              )}

              {/* Final Payable */}
              <div className="flex justify-between items-center py-4 text-lg sm:text-xl bg-gradient-to-r from-green-100 to-emerald-100 -mx-4 sm:-mx-5 px-4 sm:px-5 rounded-b-lg border-t-2 border-green-400">
                <div>
                  <span className="font-bold text-green-900 block">Amount to Pay</span>
                  <span className="text-xs sm:text-sm text-green-700">{finalAmountPayable === 0 ? 'Fully Paid ✓' : 'Balance Due'}</span>
                </div>
                <span className="font-black text-green-700 text-xl sm:text-2xl md:text-3xl whitespace-nowrap">{formatCurrency(finalAmountPayable)}</span>
              </div>
            </div>
          </div>

          {/* Address */}
          {booking.address && (
            <div className="mt-4 bg-gray-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Pickup/Delivery Address</p>
              <p className="text-sm sm:text-base text-gray-900 break-words">{booking.address}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t">
          <div className="text-center text-xs sm:text-sm text-gray-600">
            <p className="mb-2 font-semibold">Vego - Admin Invoice System</p>
            <p>This is an administrative copy for internal records and accounting.</p>
            <div className="mt-3 flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-4 text-xs text-gray-500">
              <span>📧 admin@vegobike.in</span>
              <span>📞 +91 9921426002</span>
              <span>🌐 www.vegobike.in</span>
            </div>
            <p className="mt-3 text-xs text-gray-500">
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
          .print\:hidden {
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
        @page {
          margin: 0.5cm;
          size: A4;
        }
      `}</style>
    </div>
  );
};

export default AdminInvoice;