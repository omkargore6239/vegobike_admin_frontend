import React, { useState } from "react";
import { FaTicketAlt, FaCheckCircle, FaSpinner, FaTimes, FaExclamationCircle, FaInfoCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import { validateCoupon, getCouponErrorMessage } from "../services/couponService";

const CouponApply = ({
  estimatedPrice,
  vehicleId,
  customerId,
  onCouponApplied,
  onCouponRemoved
}) => {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Helpful debug logger
  function devLog(...args) {
    if (import.meta.env.DEV || true) { // always logs in dev, remove || true in prod
      // eslint-disable-next-line
      console.log("[COUPON APPLY]", ...args);
    }
  }

  const handleApplyCoupon = async () => {
    setError("");
    // Strong validation checks, with dev logs and alerts for debugging

    devLog("User clicked Apply. Form values:", {
      couponCode, vehicleId, customerId, estimatedPrice
    });

    if (!couponCode.trim()) {
      setError("Please enter a coupon code");
      toast.error("Please enter a coupon code");
      devLog("Block: missing coupon code");
      return;
    }
    if (couponCode.trim().length < 3) {
      setError("Coupon code must be at least 3 characters");
      toast.error("Coupon code must be at least 3 characters");
      devLog("Block: short coupon code");
      return;
    }
    if (!vehicleId) {
      setError("Vehicle information is missing");
      toast.error("Please select a bike first");
      devLog("Block: missing vehicleId");
      return;
    }
    // This is usually the critical fail point (as in your error screenshot!)
    if (!customerId || isNaN(Number(customerId)) || String(customerId).length < 1) {
      setError("Customer information is missing");
      toast.error("Customer information is missing");
      devLog("Block: missing customerId", { customerId });
      alert("DEBUG: You must select a customer before using coupon. If this is a stepper, ensure customerId flows from step 1 to the CouponApply props. Value passed: " + customerId);
      return;
    }
    if (!estimatedPrice || isNaN(Number(estimatedPrice))) {
      setError("Invalid booking amount");
      toast.error("Cannot calculate booking amount");
      devLog("Block: bad price", { estimatedPrice });
      return;
    }

    setLoading(true);

    try {
      devLog("Firing coupon validation...", {
        couponCode: couponCode.trim().toUpperCase(),
        vehicleId,
        customerId,
        estimatedPrice
      });

      const response = await validateCoupon({
        couponCode: couponCode.trim().toUpperCase(),
        vehicleId: parseInt(vehicleId, 10),
        customerId: Number(customerId),
        originalPrice: parseFloat(estimatedPrice)
      });

      devLog("API Response:", response);

      if (!response.valid) {
        const errorMsg = response.message || "Coupon is not valid";
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      const discountedPrice = parseFloat(response.discountedPrice) || estimatedPrice;
      const couponAmount = parseFloat(response.couponAmount) || 0;

      if (couponAmount <= 0) {
        const errorMsg = "No discount applicable with this coupon";
        setError(errorMsg);
        toast.warning(errorMsg);
        return;
      }

      const couponData = {
        code: couponCode.trim().toUpperCase(),
        discount: Math.round(couponAmount),
        discountedPrice: Math.round(discountedPrice),
        originalPrice: Math.round(estimatedPrice),
      };

      setAppliedCoupon(couponData);
      setError("");
      toast.success(`🎉 Coupon applied! You saved ₹${couponData.discount}`, {
        position: "top-center",
        autoClose: 3000
      });
      onCouponApplied(couponData);

    } catch (err) {
      devLog("API ERROR!", err);
      const errorMsg = getCouponErrorMessage(err);
      setError(errorMsg);
      toast.error(errorMsg, { autoClose: 4000 });
      setAppliedCoupon(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
    setError("");
    toast.info("Coupon removed");
    onCouponRemoved();
  };

  return (
    <div className="bg-gradient-to-r from-rose-50 to-red-50 rounded-xl p-6 border-2 border-rose-200">
      <h3 className="font-bold text-lg mb-4 text-rose-900 flex items-center">
        <FaTicketAlt className="mr-2" />
        Apply Coupon Code (Optional)
      </h3>
      {!appliedCoupon ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="Enter coupon code"
              maxLength={20}
              disabled={loading}
              className={`flex-1 px-4 py-3 border-2 rounded-lg uppercase font-mono text-lg focus:ring-2 focus:ring-[#2B2B80] focus:border-transparent transition-all ${
                error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && couponCode.trim() && !loading) {
                  handleApplyCoupon();
                }
              }}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={loading || !couponCode.trim()}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all min-w-[120px] justify-center"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Checking</span>
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  <span>Apply</span>
                </>
              )}
            </button>
          </div>
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-100 border-2 border-red-300 rounded-lg animate-slideIn">
              <FaExclamationCircle className="text-red-600 mt-0.5 flex-shrink-0 text-lg" />
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <FaInfoCircle className="text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              Enter coupon code and click <strong>Apply</strong> to validate instantly.
              <br />
              <span style={{ color: '#d22', fontWeight: 500 }}>Debug: customerId={String(customerId)}, vehicleId={String(vehicleId)}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 rounded-xl px-5 py-4 shadow-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <FaCheckCircle className="text-green-600 text-2xl" />
                <p className="text-sm text-green-700 font-semibold">Coupon Applied!</p>
              </div>
              <p className="font-bold text-green-900 text-2xl font-mono mb-2">
                {appliedCoupon.code}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-green-700">Original:</p>
                  <p className="font-semibold text-gray-900">₹{appliedCoupon.originalPrice}</p>
                </div>
                <div>
                  <p className="text-green-700">After Discount:</p>
                  <p className="font-bold text-green-800 text-lg">₹{appliedCoupon.discountedPrice}</p>
                </div>
              </div>
              <p className="text-green-700 mt-2 font-semibold">
                💰 Savings: <span className="text-xl text-green-900">₹{appliedCoupon.discount}</span>
              </p>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="p-3 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all border-2 border-red-300 hover:border-red-600 ml-4"
              title="Remove coupon"
            >
              <FaTimes className="text-2xl" />
            </button>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-slideIn { animation: slideIn 0.3s ease-out;}
      `}</style>
    </div>
  );
};
export default CouponApply;
