  import React, { useState } from "react";
  import { toast } from "react-toastify";
  import CustomerSearchForm from "./components/CustomerSearchForm";
  import LocationSelector from "./components/LocationSelector";
  import DateTimePackageSelector from "./components/DateTimePackageSelector";
  import BikeList from "./components/BikeList";
  import BookingSummary from "./components/BookingSummary";
  import SuccessModal from "./components/SuccessModal";
  import { useCustomerSearch } from "./hooks/useCustomerSearch";
  import { useBikeAvailability } from "./hooks/useBikeAvailability";
  import { useBookingCreation } from "./hooks/useBookingCreation";

  const CreateAdminBooking = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [bookingData, setBookingData] = useState({
      customerId: null,
      customerInfo: null,
      isExistingCustomer: false,
      cityId: null,
      storeId: null,
      startDate: null,
      endDate: null,
      selectedBike: null,
      selectedPackage: null,
      usePackage: false,
      deposit: 1000,
    });
    const [bookingError, setBookingError] = useState(null);
    const [successData, setSuccessData] = useState(null);

    const {
      customerPhone,
      setCustomerPhone,
      customerData,
      isExistingCustomer,
      customerFetching,
      searchCustomer,
      updateCustomerData,
    } = useCustomerSearch();

    const {
      availableBikes,
      bikesLoading,
      checkAvailability,
    } = useBikeAvailability();

    const {
      loading: bookingLoading,
      createBooking,
    } = useBookingCreation();

    // Properly resolve customerId from all possible sources
    const handleStepComplete = (step, data) => {
      console.log(`📝 Step ${step} completed with data:`, data);

      setBookingData((prev) => {
        const updated = { ...prev, ...data };

        if (step === 1) {
          const resolvedId =
            data.customerId ||
            data.customerInfo?.id ||
            customerData?.id ||  // This ensures id comes from hook if missing in data
            null;

          updated.customerId = resolvedId;
          updated.customerInfo = {
            ...(data.customerInfo || customerData || {}),
            id: resolvedId,
          };
          updated.isExistingCustomer =
            typeof data.isExistingCustomer === "boolean"
              ? data.isExistingCustomer
              : isExistingCustomer;
        }

        console.log("📦 Updated booking data:", updated);
        return updated;
      });

      if (step < 5) setCurrentStep(step + 1);
    };

    const handleBackStep = () => {
      if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleCreateBooking = async (finalData) => {
      setBookingError(null);
      try {
        const result = await createBooking(finalData);
        if (result.success) {
          setSuccessData(result.data);
          toast.success("✅ Booking created successfully!", {
            position: "top-center",
            autoClose: 3000,
          });
        } else {
          setBookingError(result.error || "Booking failed");
        }
      } catch (error) {
        setBookingError(error?.message || "Booking failed with unknown error");
      }
    };

    const resetForm = () => {
      setCurrentStep(1);
      setBookingData({
        customerId: null,
        customerInfo: null,
        isExistingCustomer: false,
        cityId: null,
        storeId: null,
        startDate: null,
        endDate: null,
        selectedBike: null,
        selectedPackage: null,
        usePackage: false,
        deposit: 1000,
      });
      setCustomerPhone("");
      setBookingError(null);
      setSuccessData(null);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-[#2B2B80] mb-2">
              🏍️ Admin Booking Panel
            </h1>
            <p className="text-gray-600 text-lg">Create bike bookings (COD Only)</p>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      currentStep >= step
                        ? "bg-[#2B2B80] text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {step}
                  </div>
                  <span className="text-xs mt-2 hidden md:block">
                    {step === 1 && "Customer"}
                    {step === 2 && "Location"}
                    {step === 3 && "Dates"}
                    {step === 4 && "Bike"}
                    {step === 5 && "Confirm"}
                  </span>
                  {step < 5 && (
                    <div
                      className={`flex-1 h-1 w-full ${
                        currentStep > step ? "bg-[#2B2B80]" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {currentStep === 1 && (
              <CustomerSearchForm
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
                customerData={customerData}
                isExistingCustomer={isExistingCustomer}
                customerFetching={customerFetching}
                searchCustomer={searchCustomer}
                updateCustomerData={updateCustomerData}
                onNext={(data) => handleStepComplete(1, data)}
              />
            )}

            {currentStep === 2 && (
              <LocationSelector
                initialData={bookingData}
                onNext={(data) => handleStepComplete(2, data)}
                onBack={handleBackStep}
              />
            )}

            {currentStep === 3 && (
              <DateTimePackageSelector
                initialData={bookingData}
                onNext={(data) => {
                  handleStepComplete(3, data);
                  checkAvailability(bookingData.storeId, data.startDate, data.endDate);
                }}
                onBack={handleBackStep}
              />
            )}

            {currentStep === 4 && (
              <BikeList
                bikes={availableBikes}
                loading={bikesLoading}
                bookingData={bookingData}
                onSelect={(data) => handleStepComplete(4, data)}
                onBack={handleBackStep}
              />
            )}

            {currentStep === 5 && (
              <BookingSummary
                bookingData={bookingData}
                customerData={customerData}
                bookingError={bookingError}
                loading={bookingLoading}
                onConfirm={handleCreateBooking}
                onBack={handleBackStep}
              />
            )}
          </div>

          {successData && (
            <SuccessModal
              bookingDetails={successData}
              onClose={() => {
                resetForm();
              }}
            />
          )}
        </div>
      </div>
    );
  };

  export default CreateAdminBooking;
