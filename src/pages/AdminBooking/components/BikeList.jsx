// src/pages/AdminBooking/components/BikeList.jsx
import React, { useState, useEffect } from "react";
import { FaMotorcycle, FaArrowLeft, FaCheckCircle, FaTag, FaShoppingCart } from "react-icons/fa";
import { toast } from "react-toastify";
import apiClient from "../../../api/apiConfig";

const BikeList = ({ bikes, loading, onSelect, onBack, bookingData }) => {
  const [selectedPackages, setSelectedPackages] = useState({}); // bikeId -> package
  const [packagesData, setPackagesData] = useState({}); // bikeId -> packages[]
  const [loadingPackages, setLoadingPackages] = useState({});
  const [expandedBikes, setExpandedBikes] = useState({}); // Track which bikes show packages

  // Fetch packages for each bike
  useEffect(() => {
    bikes.forEach(bike => {
      if (!packagesData[bike.id] && bike.categoryId) {
        fetchPackagesForBike(bike.id, bike.categoryId);
      }
    });
  }, [bikes]);

  const fetchPackagesForBike = async (bikeId, categoryId) => {
    setLoadingPackages(prev => ({ ...prev, [bikeId]: true }));
    try {
      const response = await apiClient.get(`/api/prices/category/${categoryId}`);
      const packages = response.data?.data || response.data || [];
      
      // Sort packages
      const sorted = packages.sort((a, b) => {
        if (a.days === 0) return -1;
        if (b.days === 0) return 1;
        return a.days - b.days;
      });
      
      setPackagesData(prev => ({ ...prev, [bikeId]: sorted }));
    } catch (error) {
      console.error(`Error fetching packages for bike ${bikeId}:`, error);
    } finally {
      setLoadingPackages(prev => ({ ...prev, [bikeId]: false }));
    }
  };

  const handlePackageSelect = (bikeId, pkg) => {
  setSelectedPackages(prev => ({ ...prev, [bikeId]: pkg }));
};


  const togglePackageView = (bikeId) => {
    setExpandedBikes(prev => ({ ...prev, [bikeId]: !prev[bikeId] }));
  };

  // helper to add days/hours based on package
const calculateEndDateFromPackage = (startDateString, pkg) => {
  if (!startDateString || !pkg) return null;

  const start = new Date(startDateString);
  const end = new Date(start); // clone

  if (pkg.days === 0) {
    // hourly package → assume pkg.hours or 1 hour default
    const hours = pkg.hours || 1;
    end.setTime(end.getTime() + hours * 60 * 60 * 1000);
  } else {
    end.setDate(end.getDate() + pkg.days);
  }

  return end.toISOString(); // keep ISO for backend
};


  // ✅ Book individual bike (with or without package)
  const handleBookBike = (bike) => {
  const selectedPackage = selectedPackages[bike.id];

  // If package selected → override endDate based on package
  let updatedEndDate = bookingData.endDate;

  if (selectedPackage) {
    const calculatedEnd = calculateEndDateFromPackage(
      bookingData.startDate,
      selectedPackage
    );
    if (calculatedEnd) {
      updatedEndDate = calculatedEnd;
    }
  }

  onSelect({
    // preserve existing booking data and override needed fields
    ...bookingData,
    selectedBike: bike,
    selectedPackage: selectedPackage || null,
    usePackage: !!selectedPackage,
    startDate: bookingData.startDate,  // keep as-is
    endDate: updatedEndDate            // changed according to package
  });

  toast.success(`📦 Proceeding with ${bike.brandName} ${bike.modelName}`);
};


  const getPackageLabel = (pkg) => {
    if (pkg.days === 0) return "Hourly";
    if (pkg.days === 1) return "Daily";
    if (pkg.days === 7) return "Weekly";
    return `${pkg.days} Days`;
  };

  const formatDateDisplay = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};
// Returns the end date that should be displayed (package or original)
const getComputedEndDate = (bikeId) => {
  const selectedPkg = selectedPackages[bikeId];
  if (selectedPkg) {
    // Use package logic to calculate new end date
    return calculateEndDateFromPackage(bookingData.startDate, selectedPkg);
  }
  // If no package selected, return bookingData.endDate as fallback
  return bookingData.endDate;
};


  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        <FaMotorcycle className="inline mr-2 text-[#2B2B80]" />
        Step 4: Select Bike
      </h2>
      
      {/* Date Range Display */}
     {
  /* Date Range Display, using computed end date for the selected/expanded bike */
}
<div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <p className="text-sm text-blue-800">
    📅 <strong>Rental Period:</strong>{" "}
    {formatDateDisplay(bookingData.startDate)} →
    {' '}
    {
      // If any bike is expanded, and a package is selected, show THAT bike's computed end date
      bikes.some(bike => expandedBikes[bike.id])
        ? (() => {
            // Get the first expanded bike
            const expandedBikeId = Object.keys(expandedBikes).find(id => expandedBikes[id]);
            // Compute the date according to package
            return formatDateDisplay(getComputedEndDate(expandedBikeId));
          })()
        : formatDateDisplay(bookingData.endDate)
    }
  </p>
</div>



      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin w-16 h-16 border-4 border-[#2B2B80] border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking availability...</p>
        </div>
      ) : bikes.length === 0 ? (
        <div className="text-center py-16">
          <FaMotorcycle className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-600">No bikes available</p>
          <p className="text-sm text-gray-500 mt-2">Try different dates or store</p>
        </div>
      ) : (
        <div className="space-y-6">
          {bikes.map((bike) => {
            const packages = packagesData[bike.id] || [];
            const selectedPkg = selectedPackages[bike.id];
            const isExpanded = expandedBikes[bike.id];

            return (
              <div
                key={bike.id}
                className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-[#2B2B80] transition-all"
              >
                {/* Bike Header */}
                <div className="p-6 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-start gap-4">
                    {/* Bike Image */}
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {bike.bikeImages?.[0] ? (
                        <img
                          src={bike.bikeImages[0]}
                          alt={bike.brandName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaMotorcycle className="text-4xl text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Bike Details */}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {bike.brandName} {bike.modelName}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        <strong>Registration:</strong> {bike.registrationNumber}
                      </p>
                      <p className="text-gray-600">
                        <strong>Category:</strong> {bike.categoryName || "N/A"}
                      </p>
                      {bike.storeName && (
                        <p className="text-gray-600">
                          <strong>Store:</strong> {bike.storeName}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          {bike.status || "AVAILABLE"}
                        </span>
                        {bike.depositAmount && (
                          <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
                            Deposit: ₹{bike.depositAmount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      {/* ✅ Book Now Button (Primary Action) */}
                      <button
                        onClick={() => handleBookBike(bike)}
                        className="px-6 py-3 bg-gradient-to-r from-[#2B2B80] to-[#1a1a4d] text-white rounded-lg hover:from-[#1f1f60] hover:to-[#0f0f3a] transition-all shadow-lg hover:shadow-xl font-semibold flex items-center gap-2"
                      >
                        <FaShoppingCart />
                        Book Now
                      </button>

                      {/* ✅ Optional: Show Packages Button */}
                      {packages.length > 0 && (
                        <button
                          onClick={() => togglePackageView(bike.id)}
                          className="px-6 py-2 bg-white border-2 border-[#2B2B80] text-[#2B2B80] rounded-lg hover:bg-blue-50 transition-all font-semibold text-sm"
                        >
                          {isExpanded ? "Hide Packages" : "View Packages"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ✅ Optional Package Selection (Collapsible) */}
                {isExpanded && packages.length > 0 && (
                  <div className="p-6 border-t bg-white">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <FaTag className="mr-2 text-[#2B2B80]" />
                      Available Packages (Optional)
                    </h4>

                    {loadingPackages[bike.id] ? (
                      <div className="text-center py-8">
                        <div className="animate-spin w-8 h-8 border-4 border-[#2B2B80] border-t-transparent rounded-full mx-auto"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {packages.map((pkg) => (
                          <button
                            key={pkg.id}
                            onClick={() => handlePackageSelect(bike.id, pkg)}
                            className={`relative border-2 rounded-lg p-4 transition-all text-left ${
                              selectedPkg?.id === pkg.id
                                ? "border-[#2B2B80] bg-blue-50 shadow-md"
                                : "border-gray-300 hover:border-[#2B2B80]"
                            }`}
                          >
                            {selectedPkg?.id === pkg.id && (
                              <div className="absolute top-2 right-2">
                                <FaCheckCircle className="text-[#2B2B80]" />
                              </div>
                            )}

                            <div className="text-xs text-gray-600 font-semibold mb-1">
                              {getPackageLabel(pkg)}
                            </div>
                            <div className="text-sm text-gray-700 mb-1">
                              {pkg.days === 0 ? "Per Hour" : `${pkg.days} Day${pkg.days > 1 ? "s" : ""}`}
                            </div>
                            <div className="text-lg font-bold text-[#2B2B80]">
                              ₹{pkg.price}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Selected Package Indicator */}
                    {selectedPkg && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          ✅ <strong>Package Selected:</strong> {getPackageLabel(selectedPkg)} - ₹{selectedPkg.price}
                        </p>
                      </div>
                    )}

                    {/* Info Message */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700">
                        💡 Packages are optional. If you don't select a package, pricing will be calculated based on your selected dates.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Back Button Only */}
      <div className="mt-8 flex justify-start">
        <button
          onClick={onBack}
          className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2 font-semibold"
        >
          <FaArrowLeft />
          Back to Dates
        </button>
      </div>
    </div>
  );
};

export default BikeList;
