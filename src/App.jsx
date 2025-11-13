// App.jsx
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Bikes from "./pages/Bikes";
import SellBikes from "./pages/SellBikes";
import DeliveryAtLocationPrices from "./pages/PriceMaster/DeliveryAtLocationPrices";
import PickUpTariffPlan from "./pages/PriceMaster/PickUpTariffPlan";
import LateCharges from "./pages/PriceMaster/LateCharges";
import AllCategories from "./pages/MasterRecords/AllCategories";
import AllBrands from "./pages/MasterRecords/AllBrands";
import AllModels from "./pages/MasterRecords/AllModels";
import AllCity from "./pages/MasterRecords/AllCity";
import AllVehicleTypes from "./pages/MasterRecords/AllVechicleTypes";
import AllBookings from "./pages/AllBookings";
import StoreMaster from "./pages/StoreMaster";
import AllUsers from "./pages/AllUsers";
import AllOffers from "./pages/AllOffers";
import AllRegisterCustomers from "./pages/AllRegisterCustomers";
import BookingReport from "./pages/AllReport/BookingReport";
import GstReport from "./pages/AllReport/GstReport";
import SalesReport from "./pages/AllReport/SalesReport";
import AdminLogin from "./pages/AdminLogin";
import TimeSlot from "./pages/TimeSlot";
import BikeServices from "./pages/BikeServices";
import SpareParts from "./pages/SpareParts";
import ServiceOrders from "./pages/ServiceOrders";
import TrackVehicle from "./pages/TrackVehicle";
import StoreManagers from "./pages/StoreManagers";
import AddBikeForm from "./pages/Addbikeform";
import AdminInvoice from './components/AdminInvoice';
import Unauthorized from "./pages/storemanager/Unauthorized";
import CreateBooking from "./pages/AdminBooking/CreateBooking";

// ✅ UPDATED: Store Manager now has more permissions
const ROLE_PERMISSIONS = {
  1: { // Admin
    name: "Admin",
    allowedRoutes: [
      'dashboard',
      'home',
      'allBikes',
      'sellBikes',
      'addBike',
      'allBookings',
      'createBooking',
      'storeMaster',
      'allUsers',
      'allOffers',
      'timeslot',
      'bikeServices',
      'spareParts',
      'serviceOrders',
      'invoice',
      'priceMaster',
      'masterRecords',
      'allRegisterCustomers',
      'storeManger',
      'verifiedUsers',
      'unverifiedUsers',
      'allReport'
    ]
  },
  2: { // Store Manager - EXPANDED permissions
    name: "Store Manager",
    allowedRoutes: [
      'dashboard',
      'home',
      'allBookings',     // ✅ View all bookings
      'allBikes',        // ✅ View all bikes
      'addBike',         // ✅ NEW: Can add bikes
      'createBooking',   // ✅ NEW: Can create bookings
      'invoice'          // ✅ NEW: Can view invoices
    ]
  }
};

const AuthWrapper = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      setIsAuthenticated(isLoggedIn === "true");
    };

    checkAuth();

    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChange', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleStorageChange);
    };
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return children;
};

const ProtectedRoute = ({ children, routeName }) => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const userRole = parseInt(localStorage.getItem("userRole"));
  
  if (isLoggedIn !== "true") {
    return <Navigate to="/" replace />;
  }

  if (!ROLE_PERMISSIONS[userRole]) {
    return <Navigate to="/" replace />;
  }

  const rolePermissions = ROLE_PERMISSIONS[userRole];
  const hasAccess = rolePermissions.allowedRoutes.includes(routeName);
  
  if (!hasAccess) {
    console.warn(`❌ Access Denied: Role ${userRole} cannot access route "${routeName}"`);
    return <Navigate to="/dashboard" replace />;
  }

  return children;
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
          <Route path="/" element={<AdminLogin />} />
          <Route path="/trackvehicle" element={<TrackVehicle />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute routeName="dashboard">
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard Home */}
            <Route 
              index 
              element={
                <ProtectedRoute routeName="home">
                  <Home />
                </ProtectedRoute>
              } 
            />

            

            {/* ✅ ALL BOOKINGS - Admin & Store Manager */}
            <Route 
              path="allBookings" 
              element={
                <ProtectedRoute routeName="allBookings">
                  <AllBookings />
                </ProtectedRoute>
              } 
            />

            {/* ✅ ALL BIKES - Admin & Store Manager */}
            <Route 
              path="allBikes" 
              element={
                <ProtectedRoute routeName="allBikes">
                  <Bikes />
                </ProtectedRoute>
              } 
            />

            {/* ✅ ADD BIKE - Admin & Store Manager */}
            <Route 
  path="addBike" 
  element={
    <ProtectedRoute routeName="addBike">
      <AddBikeForm />
    </ProtectedRoute>
  } 
/>
<Route 
  path="addBike/:id" 
  element={
    <ProtectedRoute routeName="addBike">
      <AddBikeForm />
    </ProtectedRoute>
  } 
/>

            <Route 
  path="createBooking" 
  element={
    <ProtectedRoute routeName="createBooking">
      <CreateBooking />
    </ProtectedRoute>
  } 
/>

            {/* ✅ INVOICE - Admin & Store Manager */}
            <Route 
              path="invoice/:bookingId" 
              element={
                <ProtectedRoute routeName="invoice">
                  <AdminInvoice />
                </ProtectedRoute>
              } 
            />

            {/* ❌ ADMIN ONLY ROUTES */}
            <Route 
              path="sellBikes" 
              element={
                <ProtectedRoute routeName="sellBikes">
                  <SellBikes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="storeMaster" 
              element={
                <ProtectedRoute routeName="storeMaster">
                  <StoreMaster />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="allUsers" 
              element={
                <ProtectedRoute routeName="allUsers">
                  <AllUsers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="allOffers" 
              element={
                <ProtectedRoute routeName="allOffers">
                  <AllOffers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="timeslot" 
              element={
                <ProtectedRoute routeName="timeslot">
                  <TimeSlot />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="bikeServices" 
              element={
                <ProtectedRoute routeName="bikeServices">
                  <BikeServices />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="spareParts" 
              element={
                <ProtectedRoute routeName="spareParts">
                  <SpareParts />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="serviceOrders" 
              element={
                <ProtectedRoute routeName="serviceOrders">
                  <ServiceOrders />
                </ProtectedRoute>
              } 
            />

            {/* Price Master */}
            <Route
              path="priceMaster/deliveryAtLocationPrices"
              element={
                <ProtectedRoute routeName="priceMaster">
                  <DeliveryAtLocationPrices />
                </ProtectedRoute>
              }
            />
            <Route
              path="priceMaster/pickUpTariffPlan"
              element={
                <ProtectedRoute routeName="priceMaster">
                  <PickUpTariffPlan />
                </ProtectedRoute>
              }
            />
            <Route
              path="priceMaster/lateCharges" 
              element={
                <ProtectedRoute routeName="priceMaster">
                  <LateCharges />
                </ProtectedRoute>
              }
            />

            {/* Master Records */}
            <Route
              path="masterRecords/allCategories"
              element={
                <ProtectedRoute routeName="masterRecords">
                  <AllCategories />
                </ProtectedRoute>
              }
            />
            <Route 
              path="masterRecords/allBrands" 
              element={
                <ProtectedRoute routeName="masterRecords">
                  <AllBrands />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="masterRecords/allModels" 
              element={
                <ProtectedRoute routeName="masterRecords">
                  <AllModels />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="masterRecords/allCity" 
              element={
                <ProtectedRoute routeName="masterRecords">
                  <AllCity />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="masterRecords/allVehicleTypes" 
              element={
                <ProtectedRoute routeName="masterRecords">
                  <AllVehicleTypes />
                </ProtectedRoute>
              } 
            />
            
            <Route
              path="allRegisterCustomers"
              element={
                <ProtectedRoute routeName="allRegisterCustomers">
                  <AllRegisterCustomers />
                </ProtectedRoute>
              }
            />
            <Route 
              path="storeManger" 
              element={
                <ProtectedRoute routeName="storeManger">
                  <StoreManagers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="verifiedUsers" 
              element={
                <ProtectedRoute routeName="verifiedUsers">
                  <AllUsers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="unverifiedUsers" 
              element={
                <ProtectedRoute routeName="unverifiedUsers">
                  <AllUsers />
                </ProtectedRoute>
              } 
            />
            <Route
              path="allReport/bookingReport"
              element={
                <ProtectedRoute routeName="allReport">
                  <BookingReport />
                </ProtectedRoute>
              }
            />
            <Route 
              path="allReport/gstReport" 
              element={
                <ProtectedRoute routeName="allReport">
                  <GstReport />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="allReport/salesReport" 
              element={
                <ProtectedRoute routeName="allReport">
                  <SalesReport />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthWrapper>
  );
}

export default App;
