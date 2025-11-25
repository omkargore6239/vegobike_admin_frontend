import { useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../../../api/apiConfig";

export const useBookingCreation = () => {
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const createBooking = async (bookingData) => {
    setLoading(true);
    try {
      if (!bookingData.customerInfo) throw new Error("Customer info missing");
      if (!bookingData.selectedBike?.id) throw new Error("Select a bike");
      if (!bookingData.storeId) throw new Error("Select a store");
      if (!bookingData.startDate || !bookingData.endDate) throw new Error("Select dates");

      // Decide endpoint.
      const isExistingCustomer = !!(bookingData.customerId || bookingData.customerInfo.id);
      let endpoint, payload;
      if (isExistingCustomer) {
        endpoint = "/api/booking-bikes/admin/create";
        payload = {
          customerId: bookingData.customerId || bookingData.customerInfo.id,
          vehicleId: parseInt(bookingData.selectedBike.id),
          storeId: parseInt(bookingData.storeId),
          startDate: new Date(bookingData.startDate).toISOString(),
          endDate: new Date(bookingData.endDate).toISOString(),
          charges: 0, gst: 0, totalCharges: 0, finalAmount: 0,
          advanceAmount: parseFloat(bookingData.selectedBike?.depositAmount || 0),
          paymentType: 1, paymentStatus: "PENDING",
          couponCode: bookingData.couponCode || null,
        };
      } else {
        endpoint = "/api/booking-bikes/admin/bookings/register-and-book";
        payload = {
          customer: {
            name: bookingData.customerInfo.name,
            phoneNumber: bookingData.customerInfo.phoneNumber,
            alternateNumber: bookingData.customerInfo.alternateNumber || null,
            email: bookingData.customerInfo.email || null,
          },
          booking: {
            vehicleId: parseInt(bookingData.selectedBike.id),
            storeId: parseInt(bookingData.storeId),
            startDate: new Date(bookingData.startDate).toISOString(),
            endDate: new Date(bookingData.endDate).toISOString(),
            charges: 0, gst: 0, totalCharges: 0, finalAmount: 0,
            advanceAmount: parseFloat(bookingData.selectedBike?.depositAmount || 0),
            paymentType: 1, paymentStatus: "PENDING",
            couponCode: bookingData.couponCode || null,
          }
        };
      }

      const response = await apiClient.post(endpoint, payload);

      const bookingResult = response.data?.data || response.data;
      const bookingId = bookingResult.bookingId || bookingResult.id;
      setSuccessData({
        bookingId,
        message: bookingResult.message || "Booking created successfully",
        ...bookingResult
      });

      toast.success(`✅ Booking created! ID: ${bookingId}`, { position: "top-center", autoClose: 4000 });
      return { success: true, data: bookingResult };
    } catch (error) {
      let errorMsg = "Failed to create booking";
      if (error.message && !error.response) errorMsg = error.message;
      else if (error.response?.data) {
        const errData = error.response.data;
        errorMsg = errData.message || errData.error || errorMsg;
      }
      toast.error(errorMsg, { position: "top-center", autoClose: 5000 });
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };
  return { loading, successData, createBooking };
};
