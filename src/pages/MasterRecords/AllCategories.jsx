import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaPlus, FaSearch, FaImage } from "react-icons/fa";
import { categoryAPI, BASE_URL } from "../../api/apiConfig"; // Import BASE_URL from apiConfig

const AllCategories = () => {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [formData, setFormData] = useState({ 
    categoryName: "", 
    image: null 
  });
  const [loading, setLoading] = useState(true);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ✅ Updated: Use BASE_URL from apiConfig instead of hardcoded fallback
  // No need to redeclare BASE_URL since it's imported from apiConfig

  // Static Categories
  const staticCategories = ["Bike", "Scooter"];

  // Fixed Image URL construction
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If already a full URL, use it directly
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Since backend returns paths like "/uploads/categories/filename.jpeg"
    // Just append to BASE_URL
    return `${BASE_URL}${imagePath}`;
  };

  // Simple Image Component
  const CategoryImage = ({ category }) => {
    const [imageError, setImageError] = useState(false);

    const handleImageError = () => {
      setImageError(true);
    };

    const handleImageLoad = () => {
      setImageError(false);
    };

    const imageUrl = getImageUrl(category.image);

    if (!imageUrl || imageError) {
      return (
        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
          <FaImage className="text-lg" />
        </div>
      );
    }

    return (
      <img
        src={imageUrl}
        alt={category.categoryName}
        className="w-12 h-12 object-cover rounded"
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
    );
  };

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Fetch categories data
  useEffect(() => {
    fetchCategories();
  }, [currentPage, itemsPerPage]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await categoryAPI.getAll({
        page: currentPage,
        size: itemsPerPage,
      });
      
      if (response.data && response.data.success) {
        setData(response.data.data || []);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
          setTotalElements(response.data.pagination.totalElements);
        }
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching category data:", error);
      setError("Failed to load categories. Please try again.");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid image file (JPG, JPEG, PNG, GIF)');
        e.target.value = '';
        return;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size should not exceed 10MB');
        e.target.value = '';
        return;
      }
      
      setFormData({ ...formData, image: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setError("");
    }
  };

  // Add Category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      let categoryName = formData.categoryName;
      
      // Handle custom category name
      if (formData.categoryName === "Other") {
        const customInput = document.querySelector('input[placeholder="Enter custom category"]');
        if (customInput && customInput.value.trim()) {
          categoryName = customInput.value.trim();
        } else {
          setError("Please enter a custom category name");
          return;
        }
      }

      if (!categoryName || categoryName.trim() === "") {
        setError("Category name is required");
        return;
      }

      const response = await categoryAPI.create(
        { categoryName: categoryName.trim() },
        formData.image
      );
      
      if (response.data && response.data.success) {
        setSuccess("Category created successfully!");
        await fetchCategories();
        resetForm();
        setCurrentPage(0);
      } else {
        setError(response.data?.message || "Failed to create category");
      }
    } catch (error) {
      console.error("Error adding category:", error);
      setError(error.response?.data?.message || "Error adding category");
    }
  };

  // Edit Category
  const handleSaveEditCategory = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      let categoryName = formData.categoryName;
      
      // Handle custom category name
      if (formData.categoryName === "Other") {
        const customInput = document.querySelector('input[placeholder="Enter custom category"]');
        if (customInput && customInput.value.trim()) {
          categoryName = customInput.value.trim();
        } else {
          setError("Please enter a custom category name");
          return;
        }
      }

      if (!categoryName || categoryName.trim() === "") {
        setError("Category name is required");
        return;
      }

      const response = await categoryAPI.update(
        editingId,
        { categoryName: categoryName.trim() },
        formData.image
      );
      
      if (response.data && response.data.success) {
        setSuccess("Category updated successfully!");
        await fetchCategories();
        resetForm();
      } else {
        setError(response.data?.message || "Failed to update category");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      setError(error.response?.data?.message || "Error updating category");
    }
  };

  const handleEditCategory = (category) => {
    setEditingId(category.id);
    setFormData({ 
      categoryName: category.categoryName,
      image: null 
    });
    
    // Set current image as preview
    if (category.image) {
      setImagePreview(getImageUrl(category.image));
    } else {
      setImagePreview(null);
    }
    
    setFormVisible(true);
    setError("");
    setSuccess("");
  };

  // Toggle Status
  const handleToggleStatus = async (id) => {
    try {
      const response = await categoryAPI.toggleStatus(id);
      if (response.data && response.data.success) {
        setSuccess("Category status updated successfully!");
        await fetchCategories();
      } else {
        setError("Failed to update status");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      setError("Error updating status");
    }
  };

  // Delete Category
  const confirmDeleteCategory = async (id) => {
    try {
      const response = await categoryAPI.delete(id);
      if (response.data && response.data.success) {
        setSuccess("Category deleted successfully!");
        await fetchCategories();
        setConfirmDeleteId(null);
      } else {
        setError("Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      setError(error.response?.data?.message || "Error deleting category");
      setConfirmDeleteId(null);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ categoryName: "", image: null });
    setImagePreview(null);
    setFormVisible(false);
    setError("");
    setSuccess("");
    
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Filter data based on search query
  const filteredData = data.filter(
    (item) =>
      item.categoryName && 
      item.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <div className="flex justify-between items-center mt-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-800">All Categories</h1>
        {!formVisible && (
          <button
            onClick={() => setFormVisible(true)}
            className="flex items-center px-4 py-2 bg-indigo-900 text-white rounded hover:bg-indigo-600 transition duration-200"
          >
            <FaPlus className="mr-2" />
            Add Category
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md border-l-4 border-green-500">
          <div className="flex">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            {success}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md border-l-4 border-red-500">
          <div className="flex">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Form Section */}
      {formVisible ? (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? "Edit Category" : "Add New Category"}
          </h2>
          <form onSubmit={editingId ? handleSaveEditCategory : handleAddCategory}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-medium block mb-2">Category Name *</label>
                <select
                  className="border border-gray-300 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.categoryName}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryName: e.target.value })
                  }
                  required
                >
                  <option value="">-- Select Category --</option>
                  {staticCategories.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="Other">Other</option>
                </select>

                {/* Custom category input */}
                {formData.categoryName === "Other" && (
                  <input
                    type="text"
                    placeholder="Enter custom category"
                    className="border border-gray-300 p-3 rounded w-full mt-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                )}
              </div>

              <div>
                <label className="font-medium block mb-2">Category Image</label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleImageChange}
                  className="border border-gray-300 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Accepted formats: JPG, JPEG, PNG, GIF. Max size: 10MB
                </p>
                
                {imagePreview && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">
                      {editingId ? "Current/New Image:" : "Preview:"}
                    </p>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 mr-3 text-white bg-indigo-900 rounded hover:bg-indigo-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {editingId ? "Save Changes" : "Add Category"}
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition duration-200"
                onClick={resetForm}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white p-6 shadow-md rounded-lg">
          {/* Search Bar */}
          <div className="flex justify-between items-center mb-6">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by category name..."
                className="border border-gray-300 rounded pl-10 pr-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="text-sm text-gray-600">
              Total Categories: {totalElements}
            </div>
          </div>

          {/* Category Table */}
          <div className="relative overflow-x-auto shadow-md rounded-lg">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-200">
                <tr>
                  <th scope="col" className="px-6 py-3">ID</th>
                  <th scope="col" className="px-6 py-3">Image</th>
                  <th scope="col" className="px-6 py-3">Category Name</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Created Date</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-900"></div>
                        <span className="ml-2">Loading categories...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8">
                      <div className="text-gray-500">
                        {searchQuery ? "No categories found matching your search" : "No categories found"}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((category) => (
                    <tr
                      key={category.id}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-3">#{category.id}</td>
                      <td className="px-6 py-4">
                        <CategoryImage category={category} />
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{category.categoryName}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            category.isActive === 1
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {category.isActive === 1 ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {category.createdAt ? 
                          new Date(category.createdAt).toLocaleDateString() : 
                          'N/A'
                        }
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                            onClick={() => handleEditCategory(category)}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className={`p-2 rounded ${
                              category.isActive === 1
                                ? "text-yellow-600 hover:bg-yellow-100"
                                : "text-green-600 hover:bg-green-100"
                            }`}
                            onClick={() => handleToggleStatus(category.id)}
                            title="Toggle Status"
                          >
                            {category.isActive === 1 ? <FaToggleOn /> : <FaToggleOff />}
                          </button>
                          <button
                            className="p-2 text-red-600 hover:bg-red-100 rounded"
                            onClick={() => setConfirmDeleteId(category.id)}
                            title="Delete"
                          >
                            <FaTrash />
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
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-gray-500">
              Showing {currentPage * itemsPerPage + 1} to{" "}
              {Math.min((currentPage + 1) * itemsPerPage, totalElements)} of{" "}
              {totalElements} entries
            </p>
            <div className="flex space-x-2">
              <button
                className="px-4 py-2 text-sm text-white bg-indigo-900 rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`px-4 py-2 rounded ${
                    currentPage === index
                      ? "bg-indigo-900 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => setCurrentPage(index)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className={`px-4 py-2 rounded ${
                  currentPage >= totalPages - 1
                    ? "bg-gray-300 text-gray-500"
                    : "bg-indigo-900 text-white hover:bg-indigo-600"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
            <p className="mb-6">Are you sure you want to delete this category? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={() => confirmDeleteCategory(confirmDeleteId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllCategories;
