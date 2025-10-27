import { BrowserRouter, Route, Routes, Navigate, Router } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Bikes from "./pages/Bikes";
import SellBikes from "./pages/SellBikes"; // ✅ NEW IMPORT FOR SELL BIKES
import DeliveryAtLocationPrices from "./pages/PriceMaster/DeliveryAtLocationPrices";
import PickUpTariffPlan from "./pages/PriceMaster/PickUpTariffPlan";
import LateCharges from "./pages/PriceMaster/LateCharges";
import AllCategories from "./pages/MasterRecords/AllCategories";
import AllBrands from "./pages/MasterRecords/AllBrands";
import AllModels from "./pages/MasterRecords/AllModels";
import AllCity from "./pages/MasterRecords/AllCity";
import AllVehicleTypes from "./pages/MasterRecords/AllVechicleTypes"; // ✅ NEW IMPORT
import AllBookings from "./pages/AllBookings";
import StoreMaster from "./pages/StoreMaster";
import AllUsers from "./pages/AllUsers";
import AllOffers from "./pages/AllOffers";
import AllRegisterCustomers from "./pages/AllRegisterCustomers";
import BookingReport from "./pages/AllReport/BookingReport";
import GstReport from "./pages/AllReport/GstReport";
import SalesReport from "./pages/AllReport/SalesReport";
import Login from "./pages/AdminLogin";
import TimeSlot from "./pages/TimeSlot";
import BikeServices from "./pages/BikeServices";
import SpareParts from "./pages/SpareParts";
import ServiceOrders from "./pages/ServiceOrders";
import TrackVehicle from "./pages/TrackVehicle";
import StoreManagers from "./pages/StoreManagers";
import AddBikeForm from "./pages/Addbikeform";


// Authentication Context Component
const AuthWrapper = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking, true/false = determined


  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      console.log("AuthWrapper - checking auth:", isLoggedIn);
      setIsAuthenticated(isLoggedIn === "true");
    };


    checkAuth();


    // Listen for storage changes
    const handleStorageChange = () => {
      checkAuth();
    };


    window.addEventListener('storage', handleStorageChange);
    // Custom event for when login happens
    window.addEventListener('authChange', handleStorageChange);


    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleStorageChange);
    };
  }, []);


  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }


  return children;
};


// Simple Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  console.log("ProtectedRoute check:", isLoggedIn);
  
  if (isLoggedIn === "true") {
    return children;
  }
  
  return <Navigate to="/" replace />;
};


function App() {
  return (
    <AuthWrapper>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />
          <Route path="/trackvehicle" element={<TrackVehicle />} />


          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="allBikes" element={<Bikes />} />
            <Route path="sellBikes" element={<SellBikes />} /> {/* ✅ NEW SELL BIKES ROUTE */}
            <Route path="addBike" element={<AddBikeForm />} />
            <Route path="allBookings" element={<AllBookings />} />
            <Route path="storeMaster" element={<StoreMaster />} />
            <Route path="allUsers" element={<AllUsers />} />
            <Route path="allOffers" element={<AllOffers />} />
            <Route path="timeslot" element={<TimeSlot />} />
            <Route path="bikeServices" element={<BikeServices />} />
            <Route path="spareParts" element={<SpareParts />} />
            <Route path="serviceOrders" element={<ServiceOrders />} />


            {/* Price Master Submenu Routes */}
            <Route
              path="priceMaster/deliveryAtLocationPrices"
              element={<DeliveryAtLocationPrices />}
            />
            <Route
              path="priceMaster/pickUpTariffPlan"
              element={<PickUpTariffPlan />}
            />
            <Route
              path="priceMaster/lateCharges" 
              element={<LateCharges />} 
            />


            {/* Master Records Submenu Routes */}
            <Route
              path="masterRecords/allCategories"
              element={<AllCategories />}
            />
            <Route path="masterRecords/allBrands" element={<AllBrands />} />
            <Route path="masterRecords/allModels" element={<AllModels />} />
            <Route path="masterRecords/allCity" element={<AllCity />} />
            <Route path="masterRecords/allVehicleTypes" element={<AllVehicleTypes />} /> {/* ✅ NEW ROUTE */}
            
            <Route
              path="allRegisterCustomers"
              element={<AllRegisterCustomers />}
            />
            <Route path="storeManger" element={<StoreManagers />} />
            <Route path="verifiedUsers" element={<AllUsers />} />
            <Route path="unverifiedUsers" element={<AllUsers />} />
            <Route
              path="allReport/bookingReport"
              element={<BookingReport />}
            />
            <Route path="allReport/gstReport" element={<GstReport />} />
            <Route path="allReport/salesReport" element={<SalesReport />} />
          </Route>


          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthWrapper>
  );
}


export default App;