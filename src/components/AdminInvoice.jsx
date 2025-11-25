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
  FaInfoCircle
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

  // Updated: Format currency WITHOUT decimals (rounded)
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

  // Updated: Calculate trip distance and round
  const calculateTripDistance = () => {
    if (booking?.startTripKm && booking?.endTripKm) {
      const distance = booking.endTripKm - booking.startTripKm;
      return Math.round(distance);
    }
    return 'N/A';
  };

  // Updated: Helper to safely get and round amounts
  const getAmount = (invoiceField, bookingField, defaultValue = 0) => {
    const value = invoiceField || bookingField || defaultValue;
    return Math.round(value);
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
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={fetchInvoiceData}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              🔄 Try Again
            </button>
            <button
              onClick={handleBackToBookings}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              ← Back to Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  

  // === Calculation for Billing Section ===
// Show deposit as plus THEN subtract in final calculation

const basePrice =
  Math.round(booking?.packagePrice ??
  booking?.charges ??
  invoice?.amount ??
  0);

const deliveryCharges = Math.round(invoice?.deliveryCharges || booking?.deliveryCharges || 0);
const couponDiscount = Math.round(invoice?.couponAmount || booking?.couponAmount || 0);
const lateFee = Math.round(invoice?.lateFeeCharges || booking?.lateFeeCharges || 0);
const extraKmCharges = Math.round(invoice?.lateChargesKm || booking?.lateChargesKm || 0);
const additionalCharges = Math.round(invoice?.additionalAmount || booking?.additionalCharges || 0);
const depositAmount = Math.round(invoice?.advanceAmount || booking?.advanceAmount || 0);

// Pre-GST total (includes deposit as received)
const preGstTotal =
  basePrice +
  deliveryCharges +
  lateFee +
  extraKmCharges +
  additionalCharges +
  depositAmount -
  couponDiscount;

// GST
const gstAmount = Math.round(invoice?.taxAmount || booking?.gst || preGstTotal * 0.05);

const totalWithGst = preGstTotal + gstAmount;

// Subtract deposit/advance at the end to get net payable.
const amountPayable = Math.max(0, totalWithGst - depositAmount);


  // Trip distance in full digits
  const tripDistance = calculateTripDistance();
  
  // Debug logs for admin verification
  console.log('💰 ADMIN INVOICE - CALCULATION BREAKDOWN:', {
  '1. Base Rental': basePrice,
  '2. Delivery Charges': deliveryCharges,
  '3. Coupon Discount': `-${couponDiscount}`,
  '4. Late Fee': lateFee,
  '5. Extra KM Charges': extraKmCharges,
  '6. Additional Charges': additionalCharges,
  '7. Deposit/Advance': depositAmount,
  '➡️ Pre-GST Total': preGstTotal,
  '8. GST (5%)': gstAmount,
  '➡️ Total (With GST & Deposit)': totalWithGst,
  '9. Minus Deposit': `-${depositAmount}`,
  '✅ Final Amount Payable': amountPayable,
  '🚴 Trip Distance': `${tripDistance} km`,
  '📊 Status': invoice.status
});


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
                <h1 className="text-3xl font-bold">Admin Invoice - VegoBike</h1>
              </div>
              <p className="text-indigo-100">Professional Bike Rental Services</p>
            </div>

            <div className="text-right">
              <div className=" bg-opacity-20 px-4 py-2 rounded-lg inline-block">
                <p className="text-sm opacity-90">Invoice Number</p>
                <p className="text-xl font-bold">{invoice.invoiceNumber}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="px-8 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <FaCheckCircle className="text-green-500 text-2xl mr-2" />
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  invoice.status === 'PAID' 
                    ? 'bg-green-100 text-green-800' 
                    : booking.status === 'COMPLETED'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {invoice.status === 'PAID' ? 'Payment Completed' : booking.status || 'Payment Pending'}
                </span>
              </div>
              {booking.paymentType && (
                <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold">
                  {booking.paymentType === 2 ? '💳 Online Payment' : '💵 Cash Payment'}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Invoice Date</p>
              <p className="text-gray-900 font-semibold">{formatDate(invoice.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Customer & Booking Details */}
        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
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
                {invoice.customerId && (
                  <div>
                    <p className="text-sm text-gray-600">Customer ID</p>
                    <p className="font-semibold text-gray-900">{invoice.customerId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Information - REMOVED TOTAL HOURS */}
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
                {booking.addressType && (
                  <div>
                    <p className="text-sm text-gray-600">Address Type</p>
                    <p className="font-semibold text-gray-900">{booking.addressType}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle Details - Updated with rounded KM */}
          <div className="bg-indigo-50 p-6 rounded-lg mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaMotorcycle className="mr-2 text-indigo-600" />
              Vehicle Information
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                <p className="font-bold text-gray-900">
                  {tripDistance !== 'N/A' ? `${tripDistance} km` : 'N/A'}
                </p>
              </div>
            </div>

            {booking.startTripKm && booking.endTripKm && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-indigo-200">
                <div>
                  <p className="text-sm text-gray-600">Start Trip KM</p>
                  <p className="font-semibold text-gray-900">{Math.round(booking.startTripKm)} km</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">End Trip KM</p>
                  <p className="font-semibold text-gray-900">{Math.round(booking.endTripKm)} km</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total KM Traveled</p>
                  <p className="font-semibold text-gray-900">{tripDistance} km</p>
                </div>
              </div>
            )}
          </div>

          {/* ============================================ */}
          {/* IMPROVED CHARGES BREAKDOWN - ADMIN VIEW */}
          {/* ============================================ */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaMoneyBillWave className="mr-2 text-green-600" />
              Detailed Financial Breakdown
            </h2>

            {/* Admin Info Banner */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
              <div className="flex items-start">
                <FaInfoCircle className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Admin Financial Summary</p>
                  <p>All amounts are rounded to nearest rupee. This breakdown shows complete transaction details including discounts, extra charges, and payment status.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">

  {/* Base Price for package/date */}
  <div className="flex justify-between items-center py-3 bg-blue-50 -mx-6 px-6 rounded-lg">
    <div className="flex flex-col">
      <span className="text-gray-900 font-semibold text-base">Base Price</span>
      <span className="text-xs text-gray-600">
        {booking.packageName ? `Package: ${booking.packageName}` : 'Selected rental package'}
      </span>
    </div>
    <span className="font-bold text-blue-700 text-xl">{formatCurrency(basePrice)}</span>
  </div>

  {/* Delivery Charges */}
  {deliveryCharges > 0 && (
    <div className="flex justify-between items-center py-2 border-t border-gray-200">
      <span>Delivery Charges</span>
      <span>+ {formatCurrency(deliveryCharges)}</span>
    </div>
  )}

  {/* Late Fee */}
  {lateFee > 0 && (
    <div className="flex justify-between items-center py-2 border-t border-gray-200">
      <span className="text-orange-600 flex items-center">
        <FaClock className="mr-2" />
        Late Return Fee
      </span>
      <span>+ {formatCurrency(lateFee)}</span>
    </div>
  )}

  {/* Extra KM */}
  {extraKmCharges > 0 && (
    <div className="flex justify-between items-center py-2 border-t border-gray-200">
      <span className="text-orange-600 flex items-center">
        <FaRoad className="mr-2" />
        Extra KM Charges
      </span>
      <span>+ {formatCurrency(extraKmCharges)}</span>
    </div>
  )}

  {/* Additional Charges */}
  {additionalCharges > 0 && (
    <div className="flex justify-between items-center py-2 border-t border-gray-200">
      <span className="text-purple-600 flex items-center">
        <FaReceipt className="mr-2" />
        Additional Charges
      </span>
      <span>+ {formatCurrency(additionalCharges)}</span>
    </div>
  )}

  {/* Deposit/Advance as PLUS line */}
  {depositAmount > 0 && (
    <div className="flex justify-between items-center py-2 border-t border-gray-200">
      <span className="text-blue-900 font-medium">Deposit Amount Received</span>
      <span className="font-bold text-blue-700">
        + {formatCurrency(depositAmount)}
      </span>
    </div>
  )}

  {/* Coupon Discount */}
  {couponDiscount > 0 && (
    <div className="flex justify-between items-center py-2 border-t border-gray-200 bg-green-50 -mx-6 px-6">
      <span className="text-green-700 font-medium">🎉 Coupon Discount</span>
      <span>- {formatCurrency(couponDiscount)}</span>
    </div>
  )}

  {/* GST */}
  <div className="flex justify-between items-center py-2 border-t border-gray-200">
    <span className="text-gray-700">GST (5%)</span>
    <span>+ {formatCurrency(gstAmount)}</span>
  </div>

  {/* Grand Total */}
  <div className="flex justify-between items-center py-4 bg-gradient-to-r from-indigo-100 to-blue-100 -mx-6 px-6 border-t-2 border-indigo-300">
    <span className="text-gray-900 font-bold text-lg">Total Amount (With GST & Deposit)</span>
    <span className="text-2xl font-bold text-indigo-700">
      {formatCurrency(totalWithGst)}
    </span>
  </div>

  {/* Deposit/Advance as SUBTRACT */}
  {depositAmount > 0 && (
    <div className="flex justify-between items-center py-3 border-t border-gray-200 bg-blue-50 -mx-6 px-6">
      <span className="text-blue-900 font-medium">(-) Deposit Adjustment</span>
      <span className="font-bold text-blue-700">
        - {formatCurrency(depositAmount)}
      </span>
    </div>
  )}

  {/* Final Net Payable */}
  <div className="flex justify-between items-center py-5 bg-gradient-to-r from-green-100 to-emerald-100 -mx-6 px-6 rounded-b-lg">
    <div className="flex flex-col">
      <span className="text-green-900 font-bold text-xl">Amount Payable</span>
      <span className="text-sm text-green-700 font-medium">
        {amountPayable === 0 ? 'Fully Paid ✓' : 'Balance to be paid'}
      </span>
    </div>
    <span className="text-3xl font-black text-green-700">
      {formatCurrency(amountPayable)}
    </span>
  </div>
</div>

          </div>

          {/* Address Information */}
          {booking.address && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Pickup/Delivery Address</p>
              <p className="text-gray-900">{booking.address}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 border-t">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2 font-semibold">VegoBike - Admin Invoice System</p>
            <p>This is an administrative copy for internal records and accounting.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
              <span>📧 admin@vegobike.in</span>
              <span>📞 +91 9921426002</span>
              <span>🌐 www.vegobike.in</span>
            </div>
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
        @page {
          margin: 0.5cm;
          size: A4;
        }
      `}</style>
    </div>
  );
};

export default AdminInvoice;
