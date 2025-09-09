import React, { useState } from "react";

const Offers = () => {
  const [offerData, setOfferData] = useState({
    offerName: "",
    couponCode: "",
    discountType: "",
    discountValue: "",
    appliesTo: "",
    minimumRideAmount: "",
    offerStartDateTime: "",
    offerEndDateTime: "",
    customerEligibility: "Everyone",
    specificCustomer: "",
    limitDiscountUsage: false,
    usageLimitCount: "",
    oneUsePerCustomer: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOfferData({
      ...offerData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Offer Data:", offerData);
    // Call API here
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Add New Offer
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Offer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Offer Name
            </label>
            <input
              type="text"
              name="offerName"
              value={offerData.offerName}
              onChange={handleChange}
              placeholder="Enter Offer Name"
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* Coupon Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Coupon Code
            </label>
            <input
              type="text"
              name="couponCode"
              value={offerData.couponCode}
              onChange={handleChange}
              placeholder="Enter Coupon Code"
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* Discount Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Discount Type
            </label>
            <select
              name="discountType"
              value={offerData.discountType}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="">Select Discount Type</option>
              <option value="percentage">Percentage</option>
              <option value="flat">Flat</option>
            </select>
          </div>

          {/* Discount Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Discount Value
            </label>
            <input
              type="number"
              name="discountValue"
              value={offerData.discountValue}
              onChange={handleChange}
              placeholder="Enter Discount Value"
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* Applies To */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Applies To
            </label>
            <select
              name="appliesTo"
              value={offerData.appliesTo}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="">Select</option>
              <option value="allRides">All Rides</option>
              <option value="specificBikes">Specific Bikes</option>
            </select>
          </div>

          {/* Minimum Ride Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Minimum Ride Amount
            </label>
            <input
              type="number"
              name="minimumRideAmount"
              value={offerData.minimumRideAmount}
              onChange={handleChange}
              placeholder="Enter Minimum Ride Amount"
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* Offer Start Date & Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Offer Start Date & Time
            </label>
            <input
              type="datetime-local"
              name="offerStartDateTime"
              value={offerData.offerStartDateTime}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* Offer End Date & Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Offer End Date & Time
            </label>
            <input
              type="datetime-local"
              name="offerEndDateTime"
              value={offerData.offerEndDateTime}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          {/* Customer Eligibility */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Customer Eligibility
            </label>
            <div className="flex items-center gap-6 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="customerEligibility"
                  value="Everyone"
                  checked={offerData.customerEligibility === "Everyone"}
                  onChange={handleChange}
                />
                Everyone
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="customerEligibility"
                  value="Specific"
                  checked={offerData.customerEligibility === "Specific"}
                  onChange={handleChange}
                />
                Specific Customer
              </label>
            </div>
            {offerData.customerEligibility === "Specific" && (
              <input
                type="text"
                name="specificCustomer"
                value={offerData.specificCustomer}
                onChange={handleChange}
                placeholder="Enter Customer Name/ID"
                className="mt-3 block w-full border border-gray-300 rounded-lg p-2"
              />
            )}
          </div>

          {/* Usage Limits */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Usage Limits
            </label>
            <div className="flex flex-col gap-2 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="limitDiscountUsage"
                  checked={offerData.limitDiscountUsage}
                  onChange={handleChange}
                />
                Limit number of times this discount can be used.
              </label>
              {offerData.limitDiscountUsage && (
                <input
                  type="number"
                  name="usageLimitCount"
                  value={offerData.usageLimitCount}
                  onChange={handleChange}
                  placeholder="Enter Usage Limit Count"
                  className="block w-full border border-gray-300 rounded-lg p-2"
                />
              )}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="oneUsePerCustomer"
                  checked={offerData.oneUsePerCustomer}
                  onChange={handleChange}
                />
                Limit to only one use per customer.
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6">
          <button
            type="submit"
            className="bg-[#2B2B80] text-white px-6 py-2 rounded-lg hover:bg-[#1f1f5c]"
          >
            Save Details
          </button>
        </div>
      </form>
    </div>
  );
};

export default Offers;

