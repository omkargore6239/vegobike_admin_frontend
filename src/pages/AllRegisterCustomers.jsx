// AllRegisterCustomers.jsx - PROFESSIONAL MODERN UI/UX

import React, { useEffect, useState } from "react";
import { 
  FaEye, FaCheckCircle, FaTimesCircle, FaUser, FaSearch, 
  FaExclamationTriangle, FaRedo, FaCheck, FaTimes, FaPhone, 
  FaEnvelope, FaMapMarkerAlt, FaCreditCard, FaUniversity,
  FaCalendarAlt, FaShieldAlt, FaArrowLeft, FaIdCard
} from "react-icons/fa";
import apiClient, { BASE_URL } from "../api/apiConfig";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AllRegisterCustomers = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documentUpdating, setDocumentUpdating] = useState({});
  
  const [documentStatus, setDocumentStatus] = useState({
    aadharFrontSide: 'PENDING',
    aadharBackSide: 'PENDING',
    drivingLicense: 'PENDING',
  });

  const showErrorNotification = (error, context = "") => {
    const contextMessage = context ? `${context}: ` : "";
    const errorMessage = error.response?.data?.message || error.message || "An error occurred";
    
    console.error(`❌ ${contextMessage}${errorMessage}`, error);
    
    toast.error(
      <div>
        <div className="font-medium">{contextMessage}{errorMessage}</div>
      </div>,
      {
        position: "top-right",
        autoClose: 5000,
      }
    );

    setError(`${contextMessage}${errorMessage}`);
  };

  const getImageUrl = (imagePath, type = 'profile') => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    let cleanPath = imagePath.trim();
    cleanPath = cleanPath.replace(/^\/+/, '');
    
    if (type === 'profile') {
      cleanPath = cleanPath.replace(/^uploads\/profile\/+/, '');
      cleanPath = cleanPath.replace(/^uploads\/+/, '');
      cleanPath = cleanPath.replace(/^profile\/+/, '');
      const filename = cleanPath.split('/').pop();
      return `${BASE_URL}/uploads/profile/${filename}`;
    } else {
      cleanPath = cleanPath.replace(/^uploads\/documents\/+/, '');
      cleanPath = cleanPath.replace(/^uploads\/+/, '');
      cleanPath = cleanPath.replace(/^documents\/+/, '');
      const filename = cleanPath.split('/').pop();
      return `${BASE_URL}/uploads/documents/${filename}`;
    }
  };

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredData(data);
    } else {
      const filtered = data.filter((user) =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchQuery, data]);

  const fetchUsers = async (page = 0, size = 10, retryAttempt = 0) => {
    setLoading(true);
    setError("");
    
    try {
      console.log(`🔄 Fetching users: page=${page}, size=${size}`);
      
      const response = await apiClient.get("/api/auth/users", {
        params: { page, size }
      });
      
      console.log("✅ Users response:", response.data);
      
      if (response.data && response.data.users) {
        const users = response.data.users;
        
        const processedUsers = users.map(user => ({
          id: user.id,
          name: user.name || 'N/A',
          email: user.email || user.username || '',
          phoneNumber: user.phoneNumber || '',
          alternateNumber: user.alternateNumber || '',
          address: user.address || '',
          isActive: user.isActive,
          isDocumentVerified: user.isDocumentVerified || 0,
          roleId: user.roleId,
          storeId: user.storeId,
          accountNumber: user.accountNumber || '',
          ifsc: user.ifsc || '',
          upiId: user.upiId || '',
          firebaseToken: user.firebaseToken || '',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          profileImage: user.profileImage ? getImageUrl(user.profileImage, 'profile') : null,
          aadharFrontSide: user.aadharFrontSide || null,
          aadharBackSide: user.aadharBackSide || null,
          drivingLicense: user.drivingLicense || null,
          aadharFrontStatus: user.aadharFrontStatus || 'PENDING',
          aadharBackStatus: user.aadharBackStatus || 'PENDING',
          drivingLicenseStatus: user.drivingLicenseStatus || 'PENDING'
        }));
        
        setData(processedUsers);
        setFilteredData(processedUsers);
        setTotalPages(response.data.totalPages || Math.ceil(users.length / size));
        setTotalElements(response.data.count || users.length);
        setCurrentPage(response.data.currentPage || page);
        setRetryCount(0);
        
        if (processedUsers.length > 0) {
          setSuccess(`Successfully loaded ${processedUsers.length} users`);
          setTimeout(() => setSuccess(""), 3000);
        }
      } else {
        setError("No users found");
        setData([]);
        setFilteredData([]);
      }
    } catch (error) {
      showErrorNotification(error, "Failed to fetch users");
      setData([]);
      setFilteredData([]);
      
      if (retryAttempt < 2) {
        console.log(`🔄 Retrying users fetch (attempt ${retryAttempt + 1}/3)...`);
        setRetryCount(retryAttempt + 1);
        setTimeout(() => fetchUsers(page, size, retryAttempt + 1), 3000 * (retryAttempt + 1));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, itemsPerPage);
    window.scrollTo(0, 0);
  }, []);

  const getUserVerificationStatus = (user) => {
    const statuses = [
      user.aadharFrontStatus || 'PENDING',
      user.aadharBackStatus || 'PENDING', 
      user.drivingLicenseStatus || 'PENDING'
    ];
    
    if (statuses.every(status => status === 'APPROVED')) {
      return { status: "Verified", color: "green", icon: <FaCheckCircle />, gradient: "from-green-500 to-emerald-600" };
    } else if (statuses.some(status => status === 'REJECTED')) {
      return { status: "Rejected", color: "red", icon: <FaTimesCircle />, gradient: "from-red-500 to-rose-600" };
    } else {
      return { status: "Pending", color: "yellow", icon: <FaExclamationTriangle />, gradient: "from-yellow-500 to-amber-600" };
    }
  };

  const handleView = (user) => {
    console.log('👁️ Viewing user:', user);
    setSelectedUser(user);
    setViewMode(true);
    setDocumentStatus({
      aadharFrontSide: user.aadharFrontStatus || 'PENDING',
      aadharBackSide: user.aadharBackStatus || 'PENDING',
      drivingLicense: user.drivingLicenseStatus || 'PENDING',
    });
  };

  const handleBack = () => {
    setViewMode(false);
    setSelectedUser(null);
  };

  const handleImageClick = (imageData) => {
    if (!imageData) {
      toast.warning("No image available to preview");
      return;
    }
    setSelectedImage(imageData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
    setIsModalOpen(false);
  };

  const handleDocumentAction = async (docType, action) => {
    if (!selectedUser || !selectedUser.id) {
      toast.error("Invalid user selected");
      return;
    }

    setDocumentUpdating(prev => ({ ...prev, [docType]: true }));

    try {
      console.log(`🔄 Updating document ${docType} to ${action} for user ${selectedUser.id}`);
      
      const fieldMapping = {
        'aadharFrontSide': 'adhaarFrontStatus',
        'aadharBackSide': 'adhaarBackStatus',
        'drivingLicense': 'licenseStatus'
      };
      
      const backendFieldName = fieldMapping[docType];
      
      if (!backendFieldName) {
        throw new Error(`Invalid document type: ${docType}`);
      }
      
      console.log(`📤 API Call: PATCH /api/documents/verify/${selectedUser.id}?${backendFieldName}=${action}`);
      
      const response = await apiClient.patch(
        `/api/documents/verify/${selectedUser.id}`,
        null,
        {
          params: {
            [backendFieldName]: action
          }
        }
      );

      console.log('✅ Document update response:', response.data);

      if (response.status === 200) {
        setDocumentStatus((prevStatus) => ({
          ...prevStatus,
          [docType]: action,
        }));
        
        toast.success(
          <div>
            <div className="font-medium">Document Verified</div>
            <div className="text-sm opacity-90">{docType} {action.toLowerCase()} successfully</div>
          </div>
        );
        
        setData((prevData) =>
          prevData.map((user) =>
            user.id === selectedUser.id
              ? {
                  ...user,
                  [`${docType}Status`]: action,
                }
              : user
          )
        );
        
        setSelectedUser(prev => ({
          ...prev,
          [`${docType}Status`]: action
        }));
        
        setTimeout(() => {
          fetchUsers(currentPage, itemsPerPage);
        }, 1000);
        
      } else {
        throw new Error("Failed to update document status");
      }
    } catch (error) {
      console.error("❌ Error updating document status:", error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update document verification';
      toast.error(errorMessage);
    } finally {
      setDocumentUpdating(prev => ({ ...prev, [docType]: false }));
    }
  };

  const handleRetry = () => {
    setError("");
    fetchUsers(currentPage, itemsPerPage);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      fetchUsers(newPage, itemsPerPage);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages - 1, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const InfoCard = ({ icon, label, value, colorClass = "text-indigo-600" }) => (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100">
      <div className="flex items-start space-x-3">
        <div className={`${colorClass} mt-1`}>{icon}</div>
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-sm font-semibold text-gray-900 mt-1 break-words">{value || 'Not provided'}</p>
        </div>
      </div>
    </div>
  );

  const handleImageError = (e, userName) => {
    console.error(`Profile image failed to load for user "${userName}":`, e.target.src);
    e.target.style.display = 'none';
    const fallbackDiv = e.target.nextElementSibling;
    if (fallbackDiv) {
      fallbackDiv.style.display = 'flex';
    }
  };

  const handleImageLoad = (e) => {
    e.target.style.display = 'block';
    const fallbackDiv = e.target.nextElementSibling;
    if (fallbackDiv) {
      fallbackDiv.style.display = 'none';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <ToastContainer position="top-right" />
      
      {viewMode ? (
        /* ✅ USER DETAIL VIEW - PROFESSIONAL CARD DESIGN */
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all backdrop-blur-sm"
              >
                <FaArrowLeft />
                <span>Back to List</span>
              </button>
              
              <div className="flex items-center space-x-4">
                {(() => {
                  const status = getUserVerificationStatus(selectedUser);
                  return (
                    <div className={`flex items-center space-x-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm`}>
                      {status.icon}
                      <span className="font-semibold">{status.status}</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-indigo-500 to-blue-500 h-32"></div>
            <div className="px-8 pb-8">
              <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 mb-6">
                <div className="relative">
                  {selectedUser.profileImage ? (
                    <>
                      <img
                        src={selectedUser.profileImage}
                        alt={selectedUser.name}
                        className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-xl"
                        onError={(e) => handleImageError(e, selectedUser.name)}
                        onLoad={(e) => handleImageLoad(e)}
                        style={{ display: 'block' }}
                      />
                      <div 
                        className="w-32 h-32 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 border-4 border-white shadow-xl flex items-center justify-center absolute top-0 left-0"
                        style={{ display: 'none' }}
                      >
                        <FaUser className="h-16 w-16 text-indigo-400" />
                      </div>
                    </>
                  ) : (
                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 border-4 border-white shadow-xl flex items-center justify-center">
                      <FaUser className="h-16 w-16 text-indigo-400" />
                    </div>
                  )}
                  <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white ${
                    selectedUser.isActive === 1 ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                
                <div className="md:ml-6 mt-4 md:mt-0 flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">{selectedUser.name}</h1>
                  <p className="text-gray-500 flex items-center space-x-2">
                    <FaIdCard className="text-indigo-500" />
                    <span>Customer ID: {selectedUser.id}</span>
                  </p>
                  <div className="flex items-center space-x-3 mt-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedUser.isActive === 1 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedUser.isActive === 1 ? '● Active' : '● Inactive'}
                    </span>
                    <span className="text-gray-400 text-sm">
                      Joined {formatDate(selectedUser.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact & Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <InfoCard 
                  icon={<FaPhone size={18} />}
                  label="Primary Phone"
                  value={selectedUser.phoneNumber}
                  colorClass="text-green-600"
                />
                <InfoCard 
                  icon={<FaPhone size={18} />}
                  label="Alternate Phone"
                  value={selectedUser.alternateNumber}
                  colorClass="text-blue-600"
                />
                <InfoCard 
                  icon={<FaEnvelope size={18} />}
                  label="Email Address"
                  value={selectedUser.email}
                  colorClass="text-purple-600"
                />
                <InfoCard 
                  icon={<FaMapMarkerAlt size={18} />}
                  label="Address"
                  value={selectedUser.address}
                  colorClass="text-red-600"
                />
                <InfoCard 
                  icon={<FaCreditCard size={18} />}
                  label="Account Number"
                  value={selectedUser.accountNumber}
                  colorClass="text-indigo-600"
                />
                <InfoCard 
                  icon={<FaUniversity size={18} />}
                  label="IFSC Code"
                  value={selectedUser.ifsc}
                  colorClass="text-cyan-600"
                />
                <InfoCard 
                  icon={<FaCreditCard size={18} />}
                  label="UPI ID"
                  value={selectedUser.upiId}
                  colorClass="text-orange-600"
                />
                <InfoCard 
                  icon={<FaCalendarAlt size={18} />}
                  label="Last Updated"
                  value={formatDate(selectedUser.updatedAt)}
                  colorClass="text-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Document Verification Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-indigo-100 p-3 rounded-xl">
                <FaShieldAlt className="text-indigo-600 text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Document Verification</h2>
                <p className="text-gray-500 text-sm">Review and verify customer documents</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DocumentCard
                label="Aadhar Front Side"
                imageData={selectedUser.aadharFrontSide}
                status={documentStatus.aadharFrontSide}
                updating={documentUpdating.aadharFrontSide}
                onVerify={() => handleDocumentAction('aadharFrontSide', 'APPROVED')}
                onReject={() => handleDocumentAction('aadharFrontSide', 'REJECTED')}
                onImageClick={handleImageClick}
              />
              <DocumentCard
                label="Aadhar Back Side"
                imageData={selectedUser.aadharBackSide}
                status={documentStatus.aadharBackSide}
                updating={documentUpdating.aadharBackSide}
                onVerify={() => handleDocumentAction('aadharBackSide', 'APPROVED')}
                onReject={() => handleDocumentAction('aadharBackSide', 'REJECTED')}
                onImageClick={handleImageClick}
              />
              <DocumentCard
                label="Driving License"
                imageData={selectedUser.drivingLicense}
                status={documentStatus.drivingLicense}
                updating={documentUpdating.drivingLicense}
                onVerify={() => handleDocumentAction('drivingLicense', 'APPROVED')}
                onReject={() => handleDocumentAction('drivingLicense', 'REJECTED')}
                onImageClick={handleImageClick}
              />
            </div>
          </div>
        </div>
      ) : (
        /* ✅ USER LIST VIEW */
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  Customer Management
                </h1>
                <p className="text-gray-500 mt-1">Manage and verify customer registrations</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-6 py-3 rounded-xl shadow-lg">
                  <div className="text-2xl font-bold">{totalElements}</div>
                  <div className="text-xs opacity-90">Total Customers</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone number..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 rounded-r-xl p-4 shadow-sm animate-fade-in">
              <div className="flex items-center">
                <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                <p className="text-green-700 font-medium">{success}</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4 shadow-sm animate-fade-in">
              <div className="flex items-start">
                <FaExclamationTriangle className="text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-700 font-medium">{error}</p>
                  {error.includes("connect to server") && (
                    <button
                      onClick={handleRetry}
                      className="mt-2 inline-flex items-center px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <FaRedo className="mr-1" />
                      Retry Connection
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                    <th className="px-6 py-4 text-left text-sm font-semibold">Customer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Verification</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Joined</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-16">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                          <p className="text-gray-500 font-medium">Loading customers...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-16">
                        <div className="flex flex-col items-center">
                          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <FaUser className="text-gray-400 text-3xl" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
                          <p className="text-gray-500">
                            {searchQuery ? `No results for "${searchQuery}"` : "No registered customers yet"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((user, index) => {
                      const verificationStatus = getUserVerificationStatus(user);
                      return (
                        <tr
                          key={user.id}
                          className="hover:bg-indigo-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              {user.profileImage ? (
                                <>
                                  <img
                                    src={user.profileImage}
                                    alt={user.name}
                                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-gray-200"
                                    onError={(e) => handleImageError(e, user.name)}
                                    onLoad={(e) => handleImageLoad(e)}
                                    style={{ display: 'block' }}
                                  />
                                  <div 
                                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 ring-2 ring-gray-200 flex items-center justify-center absolute"
                                    style={{ display: 'none' }}
                                  >
                                    <FaUser className="text-indigo-400" />
                                  </div>
                                </>
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 ring-2 ring-gray-200 flex items-center justify-center">
                                  <FaUser className="text-indigo-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500">ID: {user.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <p className="text-sm text-gray-900 flex items-center">
                                <FaPhone className="text-green-500 mr-2 text-xs" />
                                {user.phoneNumber}
                              </p>
                              {user.email && (
                                <p className="text-xs text-gray-500 flex items-center">
                                  <FaEnvelope className="text-purple-500 mr-2 text-xs" />
                                  {user.email}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              user.isActive === 1 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                user.isActive === 1 ? 'bg-green-500' : 'bg-gray-500'
                              }`}></span>
                              {user.isActive === 1 ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r ${verificationStatus.gradient} text-white shadow-sm`}>
                              {verificationStatus.icon}
                              <span className="ml-1.5">{verificationStatus.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600">{formatDate(user.createdAt)}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleView(user)}
                              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all shadow-sm hover:shadow-md"
                            >
                              <FaEye className="mr-2" />
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && !searchQuery && data.length > 0 && totalPages > 1 && (
              <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{currentPage * itemsPerPage + 1}</span> to{" "}
                    <span className="font-semibold text-gray-900">
                      {Math.min((currentPage + 1) * itemsPerPage, totalElements)}
                    </span>{" "}
                    of <span className="font-semibold text-gray-900">{totalElements}</span> customers
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    
                    {getPageNumbers().map((pageNumber) => (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                          currentPage === pageNumber
                            ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md"
                            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                        }`}
                      >
                        {pageNumber + 1}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages - 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Document Preview</h3>
              <button
                onClick={handleCloseModal}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-6 flex justify-center items-center min-h-[500px] bg-gray-50">
              {selectedImage ? (
                <img
                  src={`data:image/png;base64,${selectedImage}`}
                  alt="Document"
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg"
                  onError={(e) => {
                    e.target.style.display = "none";
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'text-red-500 text-center';
                    errorDiv.innerHTML = '<p class="text-lg font-semibold">Unable to load image</p>';
                    e.target.parentNode.appendChild(errorDiv);
                  }}
                />
              ) : (
                <div className="text-gray-500 text-center">
                  <FaExclamationTriangle className="text-4xl mx-auto mb-2" />
                  <p>Unable to load image</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ Professional Document Card Component
const DocumentCard = ({ label, imageData, status, updating, onVerify, onReject, onImageClick }) => {
  const getImageSource = () => {
    if (!imageData) return null;
    if (typeof imageData === "string" && imageData.startsWith("data:image/")) {
      return imageData;
    }
    return `data:image/png;base64,${imageData}`;
  };

  const handleImageClick = () => {
    if (!imageData) {
      toast.warning("No image available to preview");
      return;
    }
    const base64Data = typeof imageData === "string" && imageData.startsWith("data:image/")
      ? imageData.split(',')[1]
      : imageData;
    onImageClick(base64Data);
  };

  const statusConfig = {
    'APPROVED': { bg: 'bg-green-100', text: 'text-green-700', badge: 'bg-green-500' },
    'REJECTED': { bg: 'bg-red-100', text: 'text-red-700', badge: 'bg-red-500' },
    'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-700', badge: 'bg-yellow-500' }
  };

  const config = statusConfig[status] || statusConfig['PENDING'];

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">{label}</h3>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} flex items-center`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.badge} mr-1.5`}></span>
            {status}
          </span>
        </div>
        
        <div
          className={`w-full h-56 bg-gray-100 border-2 ${imageData ? 'border-indigo-200 hover:border-indigo-400' : 'border-gray-200'}
            flex items-center justify-center rounded-xl overflow-hidden transition-all cursor-pointer hover:shadow-md`}
          onClick={handleImageClick}
        >
          {imageData ? (
            <img
              src={getImageSource()}
              alt={label}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
                const errorDiv = document.createElement("div");
                errorDiv.innerHTML = '<div class="text-center"><p class="text-red-500 font-medium">Invalid image</p></div>';
                e.target.parentNode.appendChild(errorDiv);
              }}
            />
          ) : (
            <div className="text-center">
              <FaUser className="text-gray-300 text-4xl mx-auto mb-2" />
              <p className="text-gray-400 text-sm font-medium">No Image Available</p>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex gap-2">
          <button
            onClick={onVerify}
            disabled={status === 'APPROVED' || updating}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center ${
              status === 'APPROVED' || updating
                ? 'bg-green-200 text-green-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg'
            }`}
          >
            {updating ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </>
            ) : (
              <>
                <FaCheck className="mr-2" />
                Approve
              </>
            )}
          </button>
          <button
            onClick={onReject}
            disabled={status === 'REJECTED' || updating}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center ${
              status === 'REJECTED' || updating
                ? 'bg-red-200 text-red-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 shadow-md hover:shadow-lg'
            }`}
          >
            {updating ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </>
            ) : (
              <>
                <FaTimes className="mr-2" />
                Reject
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllRegisterCustomers;
