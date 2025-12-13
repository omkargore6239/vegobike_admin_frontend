
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ViewInvoice = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInvoiceData();
  }, [orderId]);

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      
      // Fetch order details
      const orderResponse = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/service-orders/${orderId}`
      );
      
      // Fetch order items
      const itemsResponse = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/service-order-item/order/${orderId}`
      );

      setInvoiceData(orderResponse.data);
      setOrderItems(itemsResponse.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Failed to load invoice data');
      setLoading(false);
    }
  };

  // Calculate item total (same logic as EditServiceOrder)
  const calculateItemTotal = (item) => {
    const price = parseFloat(item?.servicePrice ?? 0);
    const qty = parseInt(item?.quantity ?? 1);
    const discountType = item?.discountType ?? 0;

    const baseAmount = price * qty;
    let discountAmount = 0;

    if (discountType === 0 || discountType === "percent") {
      const discountPercent = parseFloat(item?.percent ?? 0);
      discountAmount = (baseAmount * discountPercent) / 100;
    } else if (discountType === 1 || discountType === "amount") {
      discountAmount = parseFloat(item?.amount ?? 0);
    }

    const finalAmount = Math.max(0, baseAmount - discountAmount);

    return {
      baseAmount,
      discountAmount,
      finalAmount,
    };
  };

  // Calculate totals (same logic as EditServiceOrder)
  const calculateTotals = () => {
    let subtotal = 0;
    let totalServiceDiscount = 0;

    orderItems.forEach(item => {
      const itemCalc = calculateItemTotal(item);
      subtotal += itemCalc.baseAmount || 0;
      totalServiceDiscount += itemCalc.discountAmount || 0;
    });

    const afterServiceDiscount = subtotal - totalServiceDiscount;

    // Add doorstep charge if applicable
    const doorstepCharge = invoiceData?.serviceAddressType === 'DOORSTEP' ? 100 : 0;
    const afterDoorstepCharge = afterServiceDiscount + doorstepCharge;

    // Calculate additional discount
    const orderDiscountType = invoiceData?.discountType ?? 0;
    const orderPercent = invoiceData?.percent ?? 0;
    const orderAmount = invoiceData?.amount ?? 0;

    let additionalDiscountAmount = 0;

    if (orderDiscountType === 0 && orderPercent > 0) {
      additionalDiscountAmount = afterDoorstepCharge * (orderPercent / 100);
    } else if (orderDiscountType === 1 && orderAmount > 0) {
      additionalDiscountAmount = orderAmount;
    }

    const finalAmount = Math.max(0, afterDoorstepCharge - additionalDiscountAmount);

    return {
      subtotal: Number(subtotal),
      totalServiceDiscount: Number(totalServiceDiscount),
      afterServiceDiscount: Number(afterServiceDiscount),
      doorstepCharge: Number(doorstepCharge),
      additionalDiscountAmount: Number(additionalDiscountAmount),
      finalAmount: Number(finalAmount),
    };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Invoice ${invoiceData?.orderId}`,
        text: `Service Order Invoice - ${invoiceData?.orderId}`,
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err));
    } else {
      alert('Sharing is not supported on this device');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoiceData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'Invoice not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      {/* Action Bar - Hidden in print */}
      <div className="max-w-6xl mx-auto px-4 mb-4 print:hidden">
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
              </svg>
              Print
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="text-center py-6 bg-gradient-to-r from-blue-900 to-blue-700 text-white print:bg-white print:text-gray-900 print:border-b-2 print:border-gray-300">
          <h1 className="text-3xl font-bold">VEGO Bike Private Limited</h1>
          <p className="text-sm mt-2">GST Number: 27AAICV6542R1ZF</p>
        </div>

        {/* Invoice Header Section */}
        <div className="grid grid-cols-2 border-b border-gray-300">
          {/* Logo Section */}
          <div className="p-6 flex items-center justify-center border-r border-gray-300 bg-blue-900 print:bg-white">
            <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
              <div className="text-4xl font-bold text-blue-900">VE</div>
            </div>
          </div>
          
          {/* Invoice Details */}
          <div className="p-6 bg-green-50 print:bg-white">
            <h2 className="text-3xl font-bold text-green-600 mb-4">Invoice</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">Invoice No:</span>
                <span>{invoiceData.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Invoice Date:</span>
                <span>{formatDate(invoiceData.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Vehicle Details */}
        <div className="grid grid-cols-2 border-b border-gray-300 text-sm">
          <div className="p-4 border-r border-gray-300">
            <p className="font-semibold mb-1">Customer Name</p>
            <p>{invoiceData.customerName || 'N/A'}</p>
          </div>
          <div className="p-4">
            <p className="font-semibold mb-1">Customer Contact Number</p>
            {/* <p>{invoiceData.customerEmail || 'N/A'}</p> */}
                        <p>{invoiceData.customerPhoneNumber || invoiceData.customerPhone || 'N/A'}</p>


          </div>
        </div>

        <div className="grid grid-cols-2 border-b border-gray-300 text-sm">
          <div className="p-4 border-r border-gray-300">
            <p className="font-semibold mb-1">Reg. Vehicle Number</p>
            <p>{invoiceData.vehicleNumber || 'N/A'}</p>
          </div>
          <div className="p-4">
            <p className="font-semibold mb-1">Engine Number</p>
            <p>{invoiceData.engineNumber || 'N/A'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 border-b border-gray-300 text-sm">
          <div className="p-4 border-r border-gray-300">
            <p className="font-semibold mb-1">Current KM</p>
            <p>{invoiceData.kmsDriven || 'N/A'}</p>
          </div>
          <div className="p-4">
            <p className="font-semibold mb-1">Chassis Number</p>
            <p>{invoiceData.chasisNumber || 'N/A'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 border-b border-gray-300 text-sm">
          <div className="p-4 border-r border-gray-300">
            <p className="font-semibold mb-1">Servicing Date</p>
            <p>{formatDate(invoiceData.createdAt)}</p>
          </div>
          <div className="p-4">
            <p className="font-semibold mb-1">Servicing Delivery Date</p>
            <p>{formatDate(invoiceData.createdAt)}</p>
          </div>
        </div>

        {/* <div className="grid grid-cols-2 border-b border-gray-300 text-sm">
          <div className="p-4 border-r border-gray-300">
            <p className="font-semibold mb-1">Next Servicing Date</p>
            <p>{formatDate(invoiceData.nextServiceDate) || 'N/A'}</p>
          </div>
          <div className="p-4">
            <p className="font-semibold mb-1">Servicing Comments</p>
            <p>{invoiceData.serviceComments || 'N/A'}</p>
          </div>
        </div> */}

        <div className="grid grid-cols-2 border-b-2 border-gray-300 text-sm">
          <div className="p-4 border-r border-gray-300">
            <p className="font-semibold mb-1">Payment Mode</p>
            <p>{invoiceData.paymentMethod || 'Cash On Delivery'}</p>
          </div>
          <div className="p-4">
            <p className="font-semibold mb-1">Payment Date</p>
            <p>{formatDate(invoiceData.createdAt)}</p>
          </div>
        </div>

        {/* ✅ ORDER ITEMS TABLE - Same as Edit Page but without Add buttons */}
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4 text-blue-900">Order Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="p-2 text-left border border-blue-700">ID</th>
                  <th className="p-2 text-left border border-blue-700">Service Name</th>
                  <th className="p-2 text-right border border-blue-700">Price</th>
                  <th className="p-2 text-center border border-blue-700">Qty</th>
                  <th className="p-2 text-right border border-blue-700">Subtotal</th>
                  <th className="p-2 text-center border border-blue-700">Disc Type</th>
                  <th className="p-2 text-right border border-blue-700">Disc Val</th>
                  <th className="p-2 text-right border border-blue-700">Disc Amt</th>
                  <th className="p-2 text-right border border-blue-700">Final</th>
                </tr>
              </thead>
              <tbody>
                {orderItems && orderItems.length > 0 ? (
                  orderItems.map((item, index) => {
                    const itemCalc = calculateItemTotal(item);
                    return (
                      <tr key={item.id || index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="p-2 border border-gray-300">{item.id}</td>
                        <td className="p-2 border border-gray-300">{item.serviceName}</td>
                        <td className="p-2 text-right border border-gray-300">₹{parseFloat(item.servicePrice || 0).toFixed(0)}</td>
                        <td className="p-2 text-center border border-gray-300">{item.quantity || 1}</td>
                        <td className="p-2 text-right border border-gray-300">₹{itemCalc.baseAmount.toFixed(0)}</td>
                        <td className="p-2 text-center border border-gray-300">
                          {item.discountType === 0 || item.discountType === "percent" ? "%" : "₹"}
                        </td>
                        <td className="p-2 text-right border border-gray-300">
                          {item.discountType === 0 || item.discountType === "percent" 
                            ? item.percent || 0 
                            : item.amount || 0}
                        </td>
                        <td className="p-2 text-right border border-gray-300 text-red-600">
                          -₹{itemCalc.discountAmount.toFixed(0)}
                        </td>
                        <td className="p-2 text-right border border-gray-300 font-bold text-green-600">
                          ₹{itemCalc.finalAmount.toFixed(0)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="p-4 text-center text-gray-500 border border-gray-300">
                      No services found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ✅ ORDER SUMMARY - Same as Edit Page */}
        <div className="px-6 pb-6">
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
              <h3 className="font-bold text-gray-800">Order Summary</h3>
            </div>
            
            <div className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Subtotal (all services):</span>
                <span className="font-semibold">₹{totals.subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm text-red-600">
                <span>Service Discounts:</span>
                <span>-₹{totals.totalServiceDiscount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm font-medium border-t pt-2">
                <span className="text-gray-700">After Service Discounts:</span>
                <span>₹{totals.afterServiceDiscount.toFixed(2)}</span>
              </div>

              {totals.doorstepCharge > 0 && (
                <div className="flex justify-between text-sm text-orange-600">
                  <span>Doorstep Service Charge:</span>
                  <span>+₹{totals.doorstepCharge.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center text-sm border-t pt-2">
                <span className="text-gray-700">Additional Admin Discount (on top)</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-xs">
                    {invoiceData?.discountType === 0 ? `${invoiceData?.percent || 0}%` : `₹${invoiceData?.amount || 0}`}
                  </span>
                  <span className="text-red-600">-₹{totals.additionalDiscountAmount.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-lg font-bold border-t-2 border-gray-400 pt-3 mt-3">
                <span className="text-gray-900">Final Amount:</span>
                <span className="text-blue-900">₹{totals.finalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-sm text-gray-600 border-t-2 border-gray-300">
          <p className="font-semibold text-lg">Thank you for choosing VEGO Bike Services</p>
          <p className="mt-2">For any queries, please contact us</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:text-gray-900 {
            color: #111827 !important;
          }
          .print\\:border-b-2 {
            border-bottom-width: 2px !important;
          }
          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ViewInvoice;
