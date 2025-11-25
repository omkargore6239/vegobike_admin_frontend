// src/pages/AdminBooking/hooks/useCustomerSearch.js
import { useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../../../api/apiConfig";

export const useCustomerSearch = () => {
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerData, setCustomerData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    alternateNumber: "",
    address: ""
  });
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [customerFetching, setCustomerFetching] = useState(false);

  const searchCustomer = async (phone) => {
    if (!phone || phone.length !== 10) {
      toast.warning("Please enter a valid 10-digit phone number");
      return;
    }

    setCustomerFetching(true);
    
    try {
      const response = await apiClient.get(`/api/auth/by-phone/${phone}`);
      const userData = response.data?.data || response.data;
      
      if (userData) {
        setCustomerData({
          name: userData.name || "",
          phoneNumber: userData.phoneNumber || phone,
          email: userData.email || "",
          alternateNumber: userData.alternateNumber || "",
          address: userData.address || ""
        });
        setIsExistingCustomer(true);
        toast.success(`✅ Existing customer: ${userData.name}`);
      }
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 400) {
        setCustomerData({
          name: "",
          phoneNumber: phone,
          email: "",
          alternateNumber: "",
          address: ""
        });
        setIsExistingCustomer(false);
        toast.info("📝 New customer - will be registered automatically");
      } else {
        console.error("Error fetching customer:", error);
        toast.error("Failed to fetch customer details");
      }
    } finally {
      setCustomerFetching(false);
    }
  };

  const updateCustomerData = (field, value) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
  };

  return {
    customerPhone,
    setCustomerPhone,
    customerData,
    isExistingCustomer,
    customerFetching,
    searchCustomer,
    updateCustomerData
  };
};
