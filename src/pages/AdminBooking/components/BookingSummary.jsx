import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaArrowLeft, FaSpinner, FaExclamationCircle, FaCalculator } from "react-icons/fa";
import { toast } from "react-toastify";
import apiClient from "../../../api/apiConfig";
import { 
  calculateDuration, 
  calculateEstimatedPrice, 
  formatDateDisplay,
  getPackageLabel,
  calculateGST,
  calculateTotalWithGST,
  calculateTotalPayable,
  getPricingBreakdown
} from "../utils/priceCalculator";

const BookingSummary = ({
  bookingData,
  customerData,
  loading,
  bookingError,
  onConfirm,
  onBack
}) => {
  const [appliedCouponData, setAppliedCouponData] = useState(null);
  const [packagesData, setPackagesData] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);

  const duration = calculateDuration(bookingData.startDate, bookingData.endDate);

  // Fetch packages for pricing rates (NOT for recommendation)
  useEffect(() => {
    if (bookingData.selectedBike?.categoryId) {
      fetchPackages(bookingData.selectedBike.categoryId);
    }
  }, [bookingData.selectedBike?.categoryId]);

  const fetchPackages = async (categoryId) => {
    setLoadingPackages(true);
    try {
      const response = await apiClient.get(`/api/prices/category/${categoryId}`);
      const packages = response.data?.data || response.data || [];
      
      const sorted = packages.sort((a, b) => {
        if (a.days === 0) return -1;
        if (b.days === 0) return 1;
        return a.days - b.days;
      });
      
      setPackagesData(sorted);
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast.error("Could not fetch pricing rates", { position: "top-center" });
    } finally {
      setLoadingPackages(false);
    }
  };

  // Calculate prices based ONLY on selected dates
  const rentalAmount = calculateEstimatedPrice(bookingData, duration, packagesData);
  const discountAmount = appliedCouponData?.discount || 0;
  const rentalAfterDiscount = rentalAmount - discountAmount;
  const gstAmount = calculateGST(rentalAfterDiscount, 5);
  const rentalWithGST = rentalAfterDiscount + gstAmount;
  
  // Fetch deposit from selected bike (NOT hardcoded)
  const depositAmount = bookingData.selectedBike?.depositAmount || 0;
  
  const totalPayable = rentalWithGST + depositAmount;

  // Get detailed breakdown
  const pricingBreakdown = packagesData.length > 0 ? getPricingBreakdown(duration.hours, packagesData) : [];

  const handleCouponApplied = (couponData) => setAppliedCouponData(couponData);
  const handleCouponRemoved = () => setAppliedCouponData(null);

  const validateBookingData = () => {
    const vehicleId = bookingData.selectedBike?.id;
    const storeId = bookingData.storeId;

    if (!customerData.name || !customerData.phoneNumber) {
      toast.error("Customer name and phone are required", { position: "top-center" });
      return false;
    }
    if (!vehicleId) {
      toast.error("Please select a bike", { position: "top-center" });
      return false;
    }
    if (!storeId) {
      toast.error("Store information missing", { position: "top-center" });
      return false;
    }
    if (!bookingData.startDate || !bookingData.endDate) {
      toast.error("Booking dates missing", { position: "top-center" });
      return false;
    }
    const start = new Date(bookingData.startDate);
    const end = new Date(bookingData.endDate);
    if (end <= start) {
      toast.error("End date must be after start date", { position: "top-center" });
      return false;
    }
    return true;
  };

  const handleConfirm = () => {
    if (!validateBookingData()) return;

    const resolvedCustomerId =
      bookingData.customerId ||
      bookingData.customerInfo?.id ||
      customerData?.id ||
      null;

    const completeBookingData = {
      ...bookingData,
      customerId: resolvedCustomerId,
      customerInfo: {
        name: customerData.name,
        phoneNumber: customerData.phoneNumber,
        email: customerData.email || null,
        alternateNumber: customerData.alternateNumber || null,
        id: resolvedCustomerId,
      },
      isExistingCustomer: !!resolvedCustomerId,
      couponCode: appliedCouponData?.code || null,
      couponAmount: discountAmount,
      estimatedRentalAmount: rentalAmount,
      depositAmount: depositAmount,
      gstAmount: gstAmount,
      totalAmount: totalPayable
    };

    onConfirm(completeBookingData);
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        <FaCheckCircle className="inline mr-2 text-[#2B2B80]" />
        Step 5: Review & Confirm Booking
      </h2>

      {/* Global error block */}
      {bookingError && (
        <div className="mb-6 px-4 py-3 bg-red-100 border border-red-400 rounded-lg text-red-800 flex items-center gap-3">
          <FaExclamationCircle className="text-2xl flex-shrink-0" />
          <div>
            {typeof bookingError === "object" && bookingError.errorCode === "ACTIVE_BOOKING_EXISTS" ? (
              <>
                <div className="font-bold">Active Booking Exists!</div>
                <div>{bookingError.message}</div>
                {bookingError.currentBookingId && (
                  <div className="mt-2">
                    <a
                      href={`/admin/bookings/${bookingError.currentBookingId}`}
                      className="text-blue-700 underline hover:text-blue-900"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Current Booking ({bookingError.currentBookingId})
                    </a>
                  </div>
                )}
              </>
            ) : (
              <span>
                {typeof bookingError === "string"
                  ? bookingError
                  : (bookingError.message || "Booking failed")}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Customer Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-bold text-lg mb-4 text-blue-900">
            👤 Customer Details
            {bookingData.isExistingCustomer ? (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Existing</span>
            ) : (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">New Customer</span>
            )}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Name:</span>
              <p className="font-semibold text-gray-900">{customerData.name}</p>
            </div>
            <div>
              <span className="text-blue-700">Phone:</span>
              <p className="font-semibold text-gray-900">{customerData.phoneNumber}</p>
            </div>
            {customerData.email && (
              <div className="col-span-2">
                <span className="text-blue-700">Email:</span>
                <p className="font-semibold text-gray-900">{customerData.email}</p>
              </div>
            )}
            {customerData.alternateNumber && (
              <div className="col-span-2">
                <span className="text-blue-700">Alternate Phone:</span>
                <p className="font-semibold text-gray-900">{customerData.alternateNumber}</p>
              </div>
            )}
            {customerData.id && (
              <div className="col-span-2 pt-2 border-t border-blue-200">
                <span className="text-blue-700">Customer ID:</span>
                <p className="font-mono font-semibold text-gray-900">{customerData.id}</p>
              </div>
            )}
          </div>
        </div>

        {/* Bike Info */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
          <h3 className="font-bold text-lg mb-4 text-purple-900">🏍️ Bike Details</h3>
          <div className="flex items-start gap-4">
            {bookingData.selectedBike?.bikeImages?.[0] && (
              <img
                src={bookingData.selectedBike.bikeImages[0]}
                alt="Bike"
                className="w-24 h-24 rounded-lg object-cover"
              />
            )}
            <div>
              <p className="font-bold text-xl text-gray-900">
                {bookingData.selectedBike?.brandName} {bookingData.selectedBike?.modelName}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Registration:</strong> {bookingData.selectedBike?.registrationNumber}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Category:</strong> {bookingData.selectedBike?.categoryName}
              </p>
              <p className="text-sm text-gray-700 font-mono">
                <strong>Bike ID:</strong> {bookingData.selectedBike?.id}
              </p>
            </div>
          </div>
        </div>

        {/* Rental Period */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <h3 className="font-bold text-lg mb-4 text-green-900">📅 Rental Period</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">From:</span>
              <span className="font-semibold text-gray-900">
                {formatDateDisplay(bookingData.startDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">To:</span>
              <span className="font-semibold text-gray-900">
                {formatDateDisplay(bookingData.endDate)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-green-200">
              <span className="text-green-700">Total Duration:</span>
              <span className="font-bold text-gray-900">
                {duration.days > 0 && `${duration.days}d `}
                {duration.remainingHours.toFixed(1)}h
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700 text-xs">Total Hours:</span>
              <span className="text-gray-700 text-xs">{duration.hours.toFixed(1)} hours</span>
            </div>
          </div>
        </div>

        {/* Show only if user explicitly selected a package */}
        {bookingData.selectedPackage && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
            <h3 className="font-bold text-lg mb-4 text-amber-900">📦 Selected Package</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-xl text-gray-900">
                  {getPackageLabel(bookingData.selectedPackage)}
                </p>
                <p className="text-sm text-gray-600 mt-1">Fixed package price</p>
              </div>
              <p className="text-3xl font-bold text-[#2B2B80]">
                ₹{bookingData.selectedPackage.price}
              </p>
            </div>
          </div>
        )}

        {/* Detailed Pricing Breakdown - ONLY calculation, NO recommendations */}
        {loadingPackages ? (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 flex items-center justify-center">
            <FaSpinner className="animate-spin mr-2" />
            <span>Calculating pricing...</span>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
            <h3 className="font-bold text-lg mb-4 text-indigo-900 flex items-center gap-2">
              <FaCalculator />
              Price Calculation (Based on Your Selected Dates)
            </h3>
            
            {/* Breakdown of calculation */}
            {!bookingData.selectedPackage && pricingBreakdown.length > 0 && (
              <div className="mb-4 p-4 bg-white rounded-lg border border-indigo-200">
                <p className="text-sm font-semibold text-indigo-800 mb-2">Calculation Breakdown:</p>
                <div className="space-y-1">
                  {pricingBreakdown.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.description}</span>
                      <span className="font-semibold text-gray-900">₹{item.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 text-sm">
              {/* Rental Charges */}
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <div>
                  <span className="text-indigo-800 font-semibold">Rental Charges</span>
                  <p className="text-xs text-gray-600">
                    For {duration.hours.toFixed(1)} hours
                    {bookingData.selectedPackage ? " (Package)" : " (Duration-based)"}
                  </p>
                </div>
                <span className="font-bold text-lg text-gray-900">₹{rentalAmount}</span>
              </div>

              {/* Coupon Discount */}
              {appliedCouponData && (
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <span className="text-green-800 font-semibold">Coupon Discount</span>
                    <p className="text-xs text-green-600">Code: {appliedCouponData.code}</p>
                  </div>
                  <span className="font-bold text-lg text-green-700">-₹{discountAmount}</span>
                </div>
              )}

              {/* Subtotal after discount */}
              {appliedCouponData && (
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-semibold">Subtotal after discount</span>
                  <span className="font-bold text-gray-900">₹{rentalAfterDiscount}</span>
                </div>
              )}

              {/* GST (5% on rental only, NOT on deposit) */}
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <span className="text-blue-800 font-semibold">GST (5%)</span>
                  <p className="text-xs text-blue-600">Calculated on rental amount only</p>
                </div>
                <span className="font-bold text-lg text-blue-900">₹{gstAmount}</span>
              </div>

              {/* Rental Amount with GST */}
              {/* <div className="flex justify-between items-center p-3 bg-indigo-100 rounded-lg border-2 border-indigo-300">
                <span className="text-indigo-900 font-bold">Rental Amount (with GST)</span>
                <span className="font-bold text-xl text-indigo-900">₹{rentalWithGST}</span>
              </div> */}

              {/* Security Deposit (fetched from bike, NOT hardcoded) */}
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div>
                  <span className="text-amber-800 font-semibold">Security Deposit</span>
                  <p className="text-xs text-amber-600">100% Refundable (No GST)</p>
                </div>
                <span className="font-bold text-lg text-amber-900">₹{depositAmount}</span>
              </div>

              {/* Total Payable */}
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border-2 border-green-400 mt-4">
                <div>
                  <span className="text-green-900 font-bold text-lg">Total Payable</span>
                  <p className="text-xs text-green-700">Rental + GST + Deposit</p>
                </div>
                <span className="font-bold text-3xl text-green-900">₹{totalPayable}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700 flex items-center gap-2">
                <span className="text-lg">💳</span>
                <span><strong>Payment Mode:</strong> Cash on Delivery (COD)</span>
              </p>
              <p className="text-xs text-blue-600 mt-1 italic">
                * Deposit will be refunded after bike return in good condition
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          disabled={loading}
          className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center gap-2 font-semibold transition-all"
        >
          <FaArrowLeft />
          Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading || Boolean(bookingError) || loadingPackages}
          className="px-10 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-bold shadow-xl hover:shadow-2xl transition-all text-lg"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin text-xl" />
              Creating Booking...
            </>
          ) : (
            <>
              <FaCheckCircle className="text-xl" />
              Confirm Booking - ₹{totalPayable}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BookingSummary;
