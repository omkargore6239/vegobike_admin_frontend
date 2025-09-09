import React, { useEffect, useState } from "react";
import { FaEye, FaCheckCircle, FaTimesCircle, FaUser, FaSearch } from "react-icons/fa";
import apiClient from "../api/apiConfig";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AllRegisterCustomers = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0); // Backend uses 0-based indexing
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Pagination states from backend response
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // View modes
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Document verification status
  const [documentStatus, setDocumentStatus] = useState({
    aadharFrontSide: 'PENDING',
    aadharBackSide: 'PENDING',
    drivingLicense: 'PENDING',
  });

  // Backend base URL for images
  const BACKEND_URL = "http://localhost:8081";

  // Helper function to get full image URL
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
      return `${BACKEND_URL}/uploads/profile/${filename}`;
    } else {
      // For documents
      cleanPath = cleanPath.replace(/^uploads\/documents\/+/, '');
      cleanPath = cleanPath.replace(/^uploads\/+/, '');
      cleanPath = cleanPath.replace(/^documents\/+/, '');
      const filename = cleanPath.split('/').pop();
      return `${BACKEND_URL}/uploads/documents/${filename}`;
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Handle search
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

  // Fetch users with proper backend integration
  const fetchUsers = async (page = 0, size = 10) => {
    setLoading(true);
    setError("");
    try {
      console.log(`Fetching users: page=${page}, size=${size}`);
      
      // Use the correct endpoint from your backend: /api/auth/users
      const response = await apiClient.get("/auth/users", {
        params: { page, size }
      });
      
      console.log("Users response:", response.data);
      
      if (response.data) {
        const users = response.data.users || [];
        
        // Process users to include proper image URLs
        const processedUsers = users.map(user => ({
          ...user,
          profileImage: user.profileImage ? getImageUrl(user.profileImage, 'profile') : null,
          aadharFrontSide: user.aadharFrontSide || null,
          aadharBackSide: user.aadharBackSide || null,
          drivingLicense: user.drivingLicense || null,
          // Document status fields
          aadharFrontStatus: user.aadharFrontStatus || 'PENDING',
          aadharBackStatus: user.aadharBackStatus || 'PENDING',
          drivingLicenseStatus: user.drivingLicenseStatus || 'PENDING'
        }));
        
        setData(processedUsers);
        setFilteredData(processedUsers);
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.count || 0);
        setCurrentPage(response.data.currentPage || 0);
        setSuccess(`Successfully loaded ${processedUsers.length} users`);
        
        // Clear success message after showing briefly
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to fetch users");
        setData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error.response?.data?.message || "Error fetching users");
      toast.error("Failed to fetch users");
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUsers(currentPage, itemsPerPage);
    window.scrollTo(0, 0);
  }, []);

  // Compute verification status based on document statuses
  const getUserVerificationStatus = (user) => {
    const statuses = [
      user.aadharFrontStatus || 'PENDING',
      user.aadharBackStatus || 'PENDING', 
      user.drivingLicenseStatus || 'PENDING'
    ];
    
    if (statuses.every(status => status === 'APPROVED')) {
      return { status: "Verified User", color: "green", class: "bg-green-100 text-green-800" };
    } else if (statuses.some(status => status === 'REJECTED')) {
      return { status: "Unverified User", color: "red", class: "bg-red-100 text-red-800" };
    } else {
      return { status: "Pending Verification", color: "orange", class: "bg-yellow-100 text-yellow-800" };
    }
  };

  // Handle user view
  const handleView = (user) => {
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

  // Handle image modal
  const handleImageClick = (imageData) => {
    if (!imageData) {
      console.log("No image data available");
      return;
    }
    setSelectedImage(imageData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
    setIsModalOpen(false);
  };

  // Handle document verification actions
  const handleDocumentAction = async (docType, action) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Unauthorized access.");
      return;
    }

    try {
      const response = await apiClient.put(
        `/booking/verify-documents/${selectedUser.id}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            status: action,
            docType: docType,
          },
        }
      );

      if (response.status === 200) {
        setDocumentStatus((prevStatus) => ({
          ...prevStatus,
          [docType]: action,
        }));
        toast.success(`Document ${docType} ${action.toLowerCase()} successfully!`);
        
        // Update the user data in the state
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
        
        // Update selected user
        setSelectedUser(prev => ({
          ...prev,
          [`${docType}Status`]: action
        }));
      } else {
        toast.error("Failed to update document status.");
      }
    } catch (error) {
      console.error("Error updating document status:", error);
      toast.error("Failed to update document status.");
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      fetchUsers(newPage, itemsPerPage);
    }
  };

  // Generate page numbers for pagination
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

  // Verification Status Card Component
  const VerificationStatusCard = ({ user }) => {
    const verificationStatus = getUserVerificationStatus(user);

    return (
      <div className={`p-3 rounded-lg shadow-md border-l-4 flex items-center ${verificationStatus.class} border-${verificationStatus.color}-500`}>
        {verificationStatus.color === 'green' ? (
          <FaCheckCircle className={`text-${verificationStatus.color}-500 mr-2`} size={20} />
        ) : verificationStatus.color === 'red' ? (
          <FaTimesCircle className={`text-${verificationStatus.color}-500 mr-2`} size={20} />
        ) : (
          <div className={`w-5 h-5 rounded-full bg-${verificationStatus.color}-500 mr-2`}></div>
        )}
        <span className="font-medium">
          {verificationStatus.status}
        </span>
      </div>
    );
  };

  // Image error handler
  const handleImageError = (e, userName) => {
    console.error(`Profile image failed to load for user "${userName}":`, e.target.src);
    e.target.style.display = 'none';
    const fallbackDiv = e.target.nextElementSibling;
    if (fallbackDiv) {
      fallbackDiv.style.display = 'flex';
    }
  };

  // Image load success handler
  const handleImageLoad = (e) => {
    e.target.style.display = 'block';
    const fallbackDiv = e.target.nextElementSibling;
    if (fallbackDiv) {
      fallbackDiv.style.display = 'none';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <ToastContainer />
      {viewMode ? (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">User Details</h3>
            <VerificationStatusCard user={selectedUser} />
          </div>

          {/* User Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.phoneNumber}</p>
              </div>
            </div>
            
            {/* Profile Image */}
            <div className="flex justify-center">
              <div className="w-32 h-32 relative">
                {selectedUser.profileImage ? (
                  <>
                    <img
                      src={selectedUser.profileImage}
                      alt={selectedUser.name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-lg"
                      onError={(e) => handleImageError(e, selectedUser.name)}
                      onLoad={(e) => handleImageLoad(e)}
                      style={{ display: 'block' }}
                    />
                    <div 
                      className="w-32 h-32 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center absolute top-0 left-0"
                      style={{ display: 'none' }}
                    >
                      <FaUser className="h-12 w-12 text-gray-400" />
                    </div>
                  </>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
                    <FaUser className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Document Verification Section */}
          <div className="border-t pt-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-6">Document Verification</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ProfileImageDetail
                label="Aadhar Front Side"
                imageData={selectedUser.aadharFrontSide}
                status={documentStatus.aadharFrontSide}
                onVerify={() => handleDocumentAction('aadharFrontSide', 'APPROVED')}
                onReject={() => handleDocumentAction('aadharFrontSide', 'REJECTED')}
                onImageClick={handleImageClick}
              />
              <ProfileImageDetail
                label="Aadhar Back Side"
                imageData={selectedUser.aadharBackSide}
                status={documentStatus.aadharBackSide}
                onVerify={() => handleDocumentAction('aadharBackSide', 'APPROVED')}
                onReject={() => handleDocumentAction('aadharBackSide', 'REJECTED')}
                onImageClick={handleImageClick}
              />
              <ProfileImageDetail
                label="Driving License"
                imageData={selectedUser.drivingLicense}
                status={documentStatus.drivingLicense}
                onVerify={() => handleDocumentAction('drivingLicense', 'APPROVED')}
                onReject={() => handleDocumentAction('drivingLicense', 'REJECTED')}
                onImageClick={handleImageClick}
              />
            </div>
          </div>

          <button
            className="mt-8 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200"
            onClick={handleBack}
          >
            Back to List
          </button>
        </div>
      ) : (
        <>
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Registered Customers</h1>
              <p className="text-gray-600 mt-1">Manage customer registrations ({totalElements} customers)</p>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
              <p className="text-sm text-green-700 font-medium">{success}</p>
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow-lg">
            {/* Search Section */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-indigo-900 mb-4">All Registered Users List</h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by user name, email, or phone..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-80"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
            <div className="relative overflow-x-auto shadow-md rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-indigo-900 text-white">
                  <tr>
                    <th scope="col" className="px-6 py-3 rounded-tl-lg">No.</th>
                    <th scope="col" className="px-6 py-3">Profile</th>
                    <th scope="col" className="px-6 py-3">Name</th>
                    <th scope="col" className="px-6 py-3">Email</th>
                    <th scope="col" className="px-6 py-3">Phone Number</th>
                    <th scope="col" className="px-6 py-3">Verification Status</th>
                    <th scope="col" className="px-6 py-3 rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12">
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-900 mb-4"></div>
                          <p className="text-gray-500">Loading users...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12">
                        <div className="text-gray-500">
                          <FaUser className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                          <p className="text-gray-500">
                            {searchQuery ? `No users match "${searchQuery}"` : "No registered customers yet"}
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
                          className={`border-b hover:bg-indigo-50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-6 py-4 font-medium">{currentPage * itemsPerPage + index + 1}</td>
                          <td className="px-6 py-4">
                            <div className="flex-shrink-0 h-12 w-12 relative">
                              {user.profileImage ? (
                                <>
                                  <img
                                    src={user.profileImage}
                                    alt={user.name}
                                    className="h-12 w-12 rounded-full object-cover border border-gray-200 shadow-sm"
                                    onError={(e) => handleImageError(e, user.name)}
                                    onLoad={(e) => handleImageLoad(e)}
                                    style={{ display: 'block' }}
                                  />
                                  <div 
                                    className="h-12 w-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center absolute top-0 left-0"
                                    style={{ display: 'none' }}
                                  >
                                    <FaUser className="h-6 w-6 text-gray-400" />
                                  </div>
                                </>
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                                  <FaUser className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium">{user.name}</td>
                          <td className="px-6 py-4">{user.email || 'Not provided'}</td>
                          <td className="px-6 py-4">{user.phoneNumber}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${verificationStatus.class}`}>
                              {verificationStatus.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              className="px-3 py-1.5 flex items-center text-white bg-indigo-800 hover:bg-indigo-600 rounded transition duration-200"
                              onClick={() => handleView(user)}
                            >
                              <FaEye className="mr-1.5" size={14} />
                              View
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
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">{currentPage * itemsPerPage + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min((currentPage + 1) * itemsPerPage, totalElements)}
                    </span>{" "}
                    of <span className="font-medium">{totalElements}</span> results
                  </p>
                </div>
                <div className="flex space-x-1">
                  <button
                    className="px-3 py-1.5 text-sm text-white bg-indigo-800 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    disabled={currentPage === 0}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Previous
                  </button>
                  
                  {getPageNumbers().map((pageNumber) => (
                    <button
                      key={pageNumber}
                      className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                        currentPage === pageNumber
                          ? "bg-indigo-800 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber + 1}
                    </button>
                  ))}
                  
                  <button
                    className="px-3 py-1.5 text-sm rounded-md bg-indigo-800 text-white hover:bg-indigo-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Image Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full relative">
            <button
              className="absolute top-3 right-3 text-gray-700 hover:text-gray-900 bg-gray-200 hover:bg-gray-300 rounded-full p-2 z-10"
              onClick={handleCloseModal}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="flex justify-center items-center p-4 min-h-[400px]">
              {selectedImage ? (
                <img
                  src={`data:image/png;base64,${selectedImage}`}
                  alt="Document"
                  className="max-w-full max-h-[70vh] object-contain border-4 border-gray-300 rounded shadow-lg"
                  onError={(e) => {
                    console.error("Image loading error");
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
              ) : (
                <div className="text-xl text-gray-500">Unable to load image</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Profile Image Detail Component for Document Verification
const ProfileImageDetail = ({ label, imageData, status, onVerify, onReject, onImageClick }) => {
  const getImageSource = () => {
    if (!imageData) return null;
    if (typeof imageData === "string" && imageData.startsWith("data:image/")) {
      return imageData;
    }
    return `data:image/png;base64,${imageData}`;
  };

  const handleImageClick = () => {
    if (!imageData) return;
    const base64Data = typeof imageData === "string" && imageData.startsWith("data:image/")
      ? imageData.split(',')[1]
      : imageData;
    onImageClick(base64Data);
  };

  return (
    <div className="relative bg-gray-50 rounded-lg p-4 border border-gray-200">
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      <div
        className={`w-full h-48 bg-white border ${imageData ? 'border-indigo-400 hover:border-indigo-600' : 'border-gray-300'}
          flex items-center justify-center rounded-md overflow-hidden transition-all duration-300
          ${imageData ? 'cursor-pointer hover:shadow-lg' : 'cursor-default'}`}
        onClick={handleImageClick}
      >
        {imageData ? (
          <img
            src={getImageSource()}
            alt={label}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              console.error(`Error loading ${label} image`);
              e.target.style.display = "none";
              const errorDiv = document.createElement("div");
              errorDiv.innerHTML = '<p class="font-medium text-red-500">Invalid image data</p>';
              e.target.parentNode.appendChild(errorDiv);
            }}
          />
        ) : (
          <p className="font-medium text-gray-500">No Image Available</p>
        )}
      </div>
      
      {/* Status Badge */}
      <div className="mt-3 flex justify-between items-center">
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          status === 'APPROVED' ? 'bg-green-100 text-green-800' :
          status === 'REJECTED' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {status}
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 text-xs rounded transition duration-200 ${
              status === 'APPROVED' 
                ? 'bg-green-500 text-white cursor-not-allowed' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
            onClick={onVerify}
            disabled={status === 'APPROVED'}
          >
            Approve
          </button>
          <button
            className={`px-3 py-1 text-xs rounded transition duration-200 ${
              status === 'REJECTED' 
                ? 'bg-red-500 text-white cursor-not-allowed' 
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
            onClick={onReject}
            disabled={status === 'REJECTED'}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllRegisterCustomers;
