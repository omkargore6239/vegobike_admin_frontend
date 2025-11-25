// src/pages/AdminBooking/components/CustomerSearchForm.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaArrowRight, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";

const CustomerSearchForm = ({
  customerPhone,
  setCustomerPhone,
  customerData,
  isExistingCustomer,
  customerFetching,
  searchCustomer,
  updateCustomerData,
  onNext
}) => {
  const [searchStatus, setSearchStatus] = useState(""); // "searching", "found", "not_found", ""
  const debounceTimerRef = useRef(null);

  // Auto-search when phone number changes
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Reset search status if phone number is incomplete
    if (customerPhone.length < 10) {
      setSearchStatus("");
      return;
    }

    // If phone number is exactly 10 digits, trigger search after debounce
    if (customerPhone.length === 10) {
      setSearchStatus("searching");
      
      // Debounce the search by 500ms to avoid rapid API calls
      debounceTimerRef.current = setTimeout(() => {
        searchCustomer(customerPhone);
      }, 500);
    }

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [customerPhone]); // Trigger when customerPhone changes

  // Update search status based on customer data
  useEffect(() => {
    if (customerPhone.length === 10 && !customerFetching) {
      if (isExistingCustomer) {
        setSearchStatus("found");
      } else if (customerData.phoneNumber === customerPhone) {
        setSearchStatus("not_found");
      }
    }
  }, [isExistingCustomer, customerFetching, customerPhone, customerData.phoneNumber]);

  const handleNext = () => {
    if (!customerData.name || !customerData.phoneNumber) {
      toast.error("Please enter customer name and phone number");
      return;
    }

    if (customerData.phoneNumber.length !== 10) {
      toast.error("Phone number must be 10 digits");
      return;
    }

    onNext({
      customerId: isExistingCustomer ? customerData.id : null,
      customerInfo: customerData,
      isExistingCustomer: isExistingCustomer,
    });
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        <FaUser className="inline mr-2 text-[#2B2B80]" />
        Step 1: Customer Information
      </h2>

      {/* Phone Number Input with Auto-Search */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Customer Phone Number *
        </label>
        <div className="relative">
          <input
            type="tel"
            maxLength={10}
            placeholder="Enter 10-digit phone number (auto-searches)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B2B80] focus:border-transparent"
          />
          
          {/* Auto-search status indicator */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {searchStatus === "searching" && (
              <FaSpinner className="animate-spin text-blue-500 text-xl" />
            )}
            {searchStatus === "found" && (
              <span className="text-green-500 text-2xl">✓</span>
            )}
            {searchStatus === "not_found" && (
              <span className="text-orange-500 text-xl">⚠</span>
            )}
          </div>
        </div>

        {/* Helper text */}
        <p className="mt-2 text-xs text-gray-500">
          {customerPhone.length === 0 && "Start typing to auto-search customer"}
          {customerPhone.length > 0 && customerPhone.length < 10 && `${10 - customerPhone.length} digit${10 - customerPhone.length > 1 ? 's' : ''} remaining`}
          {searchStatus === "searching" && "Searching..."}
          {searchStatus === "found" && "✓ Customer found! Details loaded automatically."}
          {searchStatus === "not_found" && "⚠ New customer - please fill in the details below."}
        </p>
      </div>

      {/* Customer Details Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaUser className="inline mr-2" />
            Full Name *
          </label>
          <input
            type="text"
            required
            placeholder="Customer name"
            value={customerData.name}
            onChange={(e) => updateCustomerData("name", e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B2B80]"
          />
        </div>

        {/* Phone (read-only if searching) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaPhone className="inline mr-2" />
            Phone Number *
          </label>
          <input
            type="tel"
            required
            maxLength={10}
            placeholder="10-digit phone"
            value={customerData.phoneNumber}
            onChange={(e) => updateCustomerData("phoneNumber", e.target.value.replace(/\D/g, ""))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B2B80] bg-gray-50"
            readOnly
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaEnvelope className="inline mr-2" />
            Email (Optional)
          </label>
          <input
            type="email"
            placeholder="customer@example.com"
            value={customerData.email}
            onChange={(e) => updateCustomerData("email", e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B2B80]"
          />
        </div>

        {/* Alternate Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaPhone className="inline mr-2" />
            Alternate Number (Optional)
          </label>
          <input
            type="tel"
            maxLength={10}
            placeholder="Alternate phone"
            value={customerData.alternateNumber}
            onChange={(e) => updateCustomerData("alternateNumber", e.target.value.replace(/\D/g, ""))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B2B80]"
          />
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaMapMarkerAlt className="inline mr-2" />
            Address (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Customer address"
            value={customerData.address}
            onChange={(e) => updateCustomerData("address", e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B2B80]"
          />
        </div>
      </div>

      {/* Status Badge */}
      {isExistingCustomer && (
        <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
          <div className="flex items-center">
            <span className="text-2xl mr-3">✅</span>
            <div>
              <p className="text-green-800 font-semibold">Existing Customer Found</p>
              <p className="text-green-600 text-sm mt-1">
                Customer details have been automatically loaded from our database.
              </p>
            </div>
          </div>
        </div>
      )}

      {searchStatus === "not_found" && customerPhone.length === 10 && (
        <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
          <div className="flex items-center">
            <span className="text-2xl mr-3">👤</span>
            <div>
              <p className="text-blue-800 font-semibold">New Customer</p>
              <p className="text-blue-600 text-sm mt-1">
                This phone number is not in our system. Please fill in the customer details to create a new profile.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleNext}
          disabled={!customerData.name || !customerData.phoneNumber || customerData.phoneNumber.length !== 10}
          className="px-8 py-3 bg-[#2B2B80] text-white rounded-lg hover:bg-[#1a1a4d] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold transition-all"
        >
          Next: Select Location
          <FaArrowRight />
        </button>
      </div>
    </div>
  );
};

export default CustomerSearchForm;
