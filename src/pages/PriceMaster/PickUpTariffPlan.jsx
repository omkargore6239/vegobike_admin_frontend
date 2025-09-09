import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaToggleOn, FaToggleOff } from "react-icons/fa";
import { toast } from "react-toastify";
import apiClient from "../../api/apiConfig";

const PriceManagement = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination from backend
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Form states
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    categoryId: "",
    days: "",
    price: "",
    deposit: "",
    isActive: true,
  });

  const [categories, setCategories] = useState([]);

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
      const filtered = data.filter((item) =>
        item.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.days?.toString().includes(searchQuery.toLowerCase()) ||
        item.price?.toString().includes(searchQuery.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchQuery, data]);

  // Fetch Price Lists with pagination
  const fetchPriceLists = async (page = 0, size = 10, sortBy = "id", sortDir = "desc") => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/prices", {
        params: { page, size, sortBy, sortDir }
      });
      
      console.log("Fetched price lists:", response.data);
      
      if (response.data && response.data.success) {
        const priceData = response.data.data || [];
        setData(priceData);
        setFilteredData(priceData);
        
        if (response.data.pagination) {
          setCurrentPage(response.data.pagination.currentPage);
          setTotalPages(response.data.pagination.totalPages);
          setTotalElements(response.data.pagination.totalElements);
          setHasNext(response.data.pagination.hasNext);
          setHasPrevious(response.data.pagination.hasPrevious);
        }
      } else {
        setError("Failed to fetch price lists");
        setData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error("Error fetching price lists:", error);
      setError(error.response?.data?.message || "Error fetching price data");
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const response = await apiClient.get("/category/all");
      if (response.data && response.data.success) {
        setCategories(response.data.data || []);
      } else if (Array.isArray(response.data.content)) {
        setCategories(response.data.content);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchPriceLists(currentPage, itemsPerPage);
    fetchCategories();
  }, []);

  // Add Price List
  const handleAddPrice = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    if (!formData.categoryId || !formData.days || !formData.price) {
      setError("Category, days, and price are required");
      setSubmitting(false);
      return;
    }

    const payload = {
      categoryId: parseInt(formData.categoryId),
      days: parseInt(formData.days),
      price: parseFloat(formData.price),
      deposit: formData.deposit ? parseFloat(formData.deposit) : 0,
      isActive: formData.isActive,
    };

    try {
      const response = await apiClient.post("/prices/add", payload);
      
      if (response.data && response.data.success) {
        setSuccess("Price list added successfully!");
        toast.success("Price list added successfully!");
        resetForm();
        await fetchPriceLists(currentPage, itemsPerPage);
      } else {
        setError(response.data?.message || "Failed to add price list");
        toast.error("Failed to add price list");
      }
    } catch (error) {
      console.error("Error adding price list:", error);
      setError(error.response?.data?.message || "Error adding price list");
      toast.error("Failed to add price list");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Price List
  const handleEditPrice = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    if (!formData.categoryId || !formData.days || !formData.price) {
      setError("Category, days, and price are required");
      setSubmitting(false);
      return;
    }

    if (!editingId) {
      setError("Invalid price list ID");
      setSubmitting(false);
      return;
    }

    const payload = {
      categoryId: parseInt(formData.categoryId),
      days: parseInt(formData.days),
      price: parseFloat(formData.price),
      deposit: formData.deposit ? parseFloat(formData.deposit) : 0,
      isActive: formData.isActive,
    };

    try {
      const response = await apiClient.put(`/prices/${editingId}`, payload);
      
      if (response.data && response.data.success) {
        setSuccess("Price list updated successfully!");
        toast.success("Price list updated successfully!");
        resetForm();
        await fetchPriceLists(currentPage, itemsPerPage);
      } else {
        setError(response.data?.message || "Failed to update price list");
        toast.error("Failed to update price list");
      }
    } catch (error) {
      console.error("Error updating price list:", error);
      setError(error.response?.data?.message || "Error updating price list");
      toast.error("Failed to update price list");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Price List
  const handleDeletePrice = async (id) => {
    if (!id) {
      setError("Invalid price list ID");
      setConfirmDeleteId(null);
      return;
    }

    setError("");
    setSuccess("");
    try {
      const response = await apiClient.delete(`/prices/${id}`);
      if (response.data && response.data.success) {
        setSuccess("Price list deleted successfully!");
        toast.success("Price list deleted successfully!");
        setConfirmDeleteId(null);
        
        if (data.length === 1 && currentPage > 0) {
          await fetchPriceLists(currentPage - 1, itemsPerPage);
        } else {
          await fetchPriceLists(currentPage, itemsPerPage);
        }
      } else {
        setError(response.data?.message || "Failed to delete price list");
        toast.error("Failed to delete price list");
        setConfirmDeleteId(null);
      }
    } catch (error) {
      console.error("Error deleting price list:", error);
      setError(error.response?.data?.message || "Error deleting price list");
      toast.error("Failed to delete price list");
      setConfirmDeleteId(null);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (id, currentStatus) => {
    if (!id) {
      setError("Invalid price list ID");
      return;
    }

    setError("");
    setSuccess("");
    try {
      const response = await apiClient.put(`/prices/${id}/status`, null, {
        params: { isActive: !currentStatus }
      });
      
      if (response.data && response.data.success) {
        setSuccess(response.data.message);
        toast.success("Status updated successfully!");
        await fetchPriceLists(currentPage, itemsPerPage);
      } else {
        setError(response.data?.message || "Failed to update status");
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      setError(error.response?.data?.message || "Error updating status");
      toast.error("Failed to update status");
    }
  };

  // Edit form prefill
  const handleEditPriceClick = (priceItem) => {
    if (!priceItem || !priceItem.id) {
      setError("Invalid price data or missing ID");
      return;
    }

    setEditingId(priceItem.id);
    setFormData({
      categoryId: priceItem.categoryId || "",
      days: priceItem.days || "",
      price: priceItem.price || "",
      deposit: priceItem.deposit || "",
      isActive: priceItem.isActive !== false,
    });
    
    setFormVisible(true);
    setError("");
    setSuccess("");
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset Form
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      categoryId: "",
      days: "",
      price: "",
      deposit: "",
      isActive: true,
    });
    setFormVisible(false);
    setError("");
    setSuccess("");
    setSubmitting(false);
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (hasNext) {
      const nextPage = currentPage + 1;
      fetchPriceLists(nextPage, itemsPerPage);
    }
  };

  const handlePrevPage = () => {
    if (hasPrevious) {
      const prevPage = currentPage - 1;
      fetchPriceLists(prevPage, itemsPerPage);
    }
  };

  const handlePageClick = (pageNumber) => {
    fetchPriceLists(pageNumber, itemsPerPage);
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

  // Get current page data
  const getCurrentPageData = () => {
    return searchQuery.trim() !== "" ? filteredData : filteredData;
  };

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : `Category ${categoryId}`;
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Price Management</h1>
          <p className="text-gray-600 mt-1">Manage your pricing structure ({totalElements} price lists)</p>
        </div>
        {!formVisible && (
          <button
            onClick={() => setFormVisible(true)}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-200 shadow-lg hover:shadow-xl"
          >
            <FaPlus className="mr-2" />
            Add New Price
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg animate-fade-in">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700 font-medium">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg animate-fade-in">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {formVisible ? (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingId ? "Edit Price List" : "Add New Price List"}
            </h2>
            <p className="text-gray-600 mt-1">
              {editingId ? "Update price information below" : "Fill in the details to create a new price list"}
            </p>
          </div>
          
          <form onSubmit={editingId ? handleEditPrice : handleAddPrice} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Category Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Vehicle Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="categoryId"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  required
                  disabled={submitting}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Days */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Number of Days <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="days"
                  placeholder="Enter number of days"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  value={formData.days}
                  onChange={(e) =>
                    setFormData({ ...formData, days: e.target.value })
                  }
                  required
                  min="1"
                  disabled={submitting}
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  placeholder="Enter price amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  required
                  min="0"
                  step="0.01"
                  disabled={submitting}
                />
              </div>

              {/* Deposit */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Deposit Amount
                </label>
                <input
                  type="number"
                  name="deposit"
                  placeholder="Enter deposit amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  value={formData.deposit}
                  onChange={(e) =>
                    setFormData({ ...formData, deposit: e.target.value })
                  }
                  min="0"
                  step="0.01"
                  disabled={submitting}
                />
              </div>

              {/* Active Status */}
              <div className="space-y-2 lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="isActive"
                      value="true"
                      checked={formData.isActive === true}
                      onChange={() => setFormData({ ...formData, isActive: true })}
                      className="form-radio h-4 w-4 text-indigo-600"
                      disabled={submitting}
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="isActive"
                      value="false"
                      checked={formData.isActive === false}
                      onChange={() => setFormData({ ...formData, isActive: false })}
                      className="form-radio h-4 w-4 text-indigo-600"
                      disabled={submitting}
                    />
                    <span className="ml-2 text-sm text-gray-700">Inactive</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200"
                onClick={resetForm}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  editingId ? "Update Price" : "Create Price"
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Search and Filters */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <h3 className="text-lg font-semibold text-gray-900">
                All Price Lists ({totalElements} total)
              </h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search price lists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-80"
                />
              </div>
            </div>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deposit
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr key="loading-row">
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                        <p className="text-gray-500">Loading price lists...</p>
                      </div>
                    </td>
                  </tr>
                ) : getCurrentPageData().length === 0 ? (
                  <tr key="empty-row">
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No price lists found</h3>
                        <p className="text-gray-500">
                          {searchQuery ? `No price lists match "${searchQuery}"` : "Get started by creating your first price list"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  getCurrentPageData().map((priceItem, index) => (
                    <tr 
                      key={`price-row-${priceItem.id}-${index}`} 
                      className="hover:bg-gray-50 transition duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {priceItem.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{getCategoryName(priceItem.categoryId)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{priceItem.days} days</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">₹{priceItem.price}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₹{priceItem.deposit || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(priceItem.id, priceItem.isActive)}
                          className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium transition duration-200 ${
                            priceItem.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                          title={`Click to ${priceItem.isActive ? 'deactivate' : 'activate'} price list`}
                        >
                          {priceItem.isActive ? (
                            <>
                              <FaToggleOn className="mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <FaToggleOff className="mr-1" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition duration-200 text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                            onClick={() => handleEditPriceClick(priceItem)}
                            title="Edit price list"
                          >
                            <FaEdit className="mr-1" />
                            Edit
                          </button>
                          <button
                            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition duration-200 text-red-700 bg-red-100 hover:bg-red-200"
                            onClick={() => setConfirmDeleteId(priceItem.id)}
                            title="Delete price list"
                          >
                            <FaTrash className="mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && !searchQuery && data.length > 0 && totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    disabled={!hasPrevious}
                    onClick={handlePrevPage}
                  >
                    Previous
                  </button>
                  <button
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    disabled={!hasNext}
                    onClick={handleNextPage}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
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
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        disabled={!hasPrevious}
                        onClick={handlePrevPage}
                        title="Previous page"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {getPageNumbers().map((pageNumber) => (
                        <button
                          key={`page-btn-${pageNumber}`}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition duration-200 ${
                            currentPage === pageNumber
                              ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                          onClick={() => handlePageClick(pageNumber)}
                          title={`Go to page ${pageNumber + 1}`}
                        >
                          {pageNumber + 1}
                        </button>
                      ))}
                      
                      <button
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        disabled={!hasNext}
                        onClick={handleNextPage}
                        title="Next page"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {confirmDeleteId && (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                    <FaTrash className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Delete Price List</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete this price list? This will permanently remove the pricing information.
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200"
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
                    onClick={() => handleDeletePrice(confirmDeleteId)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PriceManagement;
