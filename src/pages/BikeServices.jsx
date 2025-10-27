import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";

// Base URL from environment variable
const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8080";

// ✅ Get JWT token
const getAuthToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken")
  );
};

// ✅ Authenticated fetch wrapper
const authenticatedFetch = async (url, options = {}) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    alert("Session expired. Please login again.");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response;
};

const BikeServices = () => {
  // ✅ State Management
  const [services, setServices] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [years, setYears] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [itemsPerPage] = useState(10);

  // ✅ Form Data
  const [formData, setFormData] = useState({
    serviceName: "",
    serviceDescription: "",
    serviceType: "",
    brandId: "",
    categoryId: "",
    modelId: "",
    yearId: "",
    price: "",
    status: "ACTIVE",
    serviceImage: null,
  });

  // ✅ Fetch all initial data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // ✅ Fetch services when page changes
  useEffect(() => {
    fetchServices();
  }, [currentPage]);

  // ✅ Fetch all dropdown data
  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchServiceTypes(),
        fetchBrands(),
        fetchCategories(),
        fetchYears(),
      ]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  // ✅ Fetch Service Types from backend
  const fetchServiceTypes = async () => {
    try {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/bike-services/service-types`
      );
      const result = await response.json();
      if (result.success) {
        setServiceTypes(result.data);
      }
    } catch (error) {
      console.error("Error fetching service types:", error);
      // Fallback to static data
      setServiceTypes([
        { name: "ADMIN_SERVICE", code: 1, label: "Admin Service" },
        { name: "GENERAL_SERVICE", code: 2, label: "General Service" },
        { name: "BIKE_REPAIRING", code: 3, label: "Bike Repairing" },
      ]);
    }
  };

  // ✅ Fetch Brands from backend
  const fetchBrands = async () => {
    try {
      const response = await authenticatedFetch(`${BASE_URL}/api/brands/active`);
      const result = await response.json();
      if (result.success) {
        setBrands(result.data);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  // ✅ Fetch Categories from backend
  const fetchCategories = async () => {
    try {
      const response = await authenticatedFetch(`${BASE_URL}/api/categories/active`);
      const result = await response.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // ✅ Fetch Models by Brand
  const fetchModelsByBrand = async (brandId) => {
    try {
      const response = await authenticatedFetch(
        `${BASE_URL}/api/models/by-brand/${brandId}`
      );
      const result = await response.json();
      if (result.success) {
        setModels(result.data);
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      setModels([]);
    }
  };

  // ✅ Fetch Years from backend
  const fetchYears = async () => {
    try {
      const response = await authenticatedFetch(`${BASE_URL}/api/years/active`);
      const result = await response.json();
      if (result.success) {
        setYears(result.data);
      }
    } catch (error) {
      console.error("Error fetching years:", error);
    }
  };

  // ✅ Fetch Bike Services with Pagination
  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(
        `${BASE_URL}/api/bike-services?page=${currentPage - 1}&size=${itemsPerPage}`
      );
      const result = await response.json();

      if (result.success) {
        setServices(result.data);
        setTotalPages(result.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      alert("Failed to fetch services: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle input changes
  const handleInputChange = (e) => {
    const { name, value, files, type } = e.target;

    if (type === "file") {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else if (name === "brandId") {
      setFormData((prev) => ({ ...prev, [name]: value, modelId: "" }));
      if (value) {
        fetchModelsByBrand(value);
      } else {
        setModels([]);
      }
    } else if (["price", "yearId", "serviceType"].includes(name)) {
      setFormData((prev) => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ✅ Add Service
  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const formDataToSend = new FormData();

      // Create bikeService JSON
      const bikeServiceJson = {
        serviceName: formData.serviceName,
        serviceDescription: formData.serviceDescription,
        serviceType: serviceTypes.find((t) => t.code === formData.serviceType)?.name || "",
        brandId: parseInt(formData.brandId),
        categoryId: parseInt(formData.categoryId),
        modelId: parseInt(formData.modelId),
        yearId: parseInt(formData.yearId),
        price: parseFloat(formData.price),
        status: formData.status,
      };

      formDataToSend.append("bikeService", JSON.stringify(bikeServiceJson));

      if (formData.serviceImage) {
        formDataToSend.append("image", formData.serviceImage);
      }

      const response = await authenticatedFetch(
        `${BASE_URL}/api/bike-services/create-with-image`,
        {
          method: "POST",
          body: formDataToSend,
        }
      );

      const result = await response.json();

      if (result.success) {
        alert("Service added successfully!");
        resetForm();
        setFormVisible(false);
        fetchServices();
      }
    } catch (error) {
      console.error("Error adding service:", error);
      alert("Failed to add service: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update Service
  const handleUpdateService = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const formDataToSend = new FormData();

      const bikeServiceJson = {
        serviceName: formData.serviceName,
        serviceDescription: formData.serviceDescription,
        serviceType: serviceTypes.find((t) => t.code === formData.serviceType)?.name || "",
        brandId: parseInt(formData.brandId),
        categoryId: parseInt(formData.categoryId),
        modelId: parseInt(formData.modelId),
        yearId: parseInt(formData.yearId),
        price: parseFloat(formData.price),
        status: formData.status,
      };

      formDataToSend.append("bikeService", JSON.stringify(bikeServiceJson));

      if (formData.serviceImage instanceof File) {
        formDataToSend.append("image", formData.serviceImage);
      }

      const response = await authenticatedFetch(
        `${BASE_URL}/api/bike-services/${editingId}/with-image`,
        {
          method: "PUT",
          body: formDataToSend,
        }
      );

      const result = await response.json();

      if (result.success) {
        alert("Service updated successfully!");
        resetForm();
        setFormVisible(false);
        fetchServices();
      }
    } catch (error) {
      console.error("Error updating service:", error);
      alert("Failed to update service: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Edit Service
  const handleEditService = async (service) => {
    setEditingId(service.id);

    // Find service type code from name
    const serviceTypeObj = serviceTypes.find((t) => t.name === service.serviceType);

    setFormData({
      serviceName: service.serviceName || "",
      serviceDescription: service.serviceDescription || "",
      serviceType: serviceTypeObj?.code || "",
      brandId: service.brandId || "",
      categoryId: service.categoryId || "",
      modelId: service.modelId || "",
      yearId: service.yearId || "",
      price: service.price || "",
      status: service.status || "ACTIVE",
      serviceImage: service.serviceImage || null,
    });

    if (service.brandId) {
      await fetchModelsByBrand(service.brandId);
    }

    setFormVisible(true);
    window.scrollTo(0, 0);
  };

  // ✅ Delete Service
  const handleDeleteService = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) {
      return;
    }

    try {
      setLoading(true);
      const response = await authenticatedFetch(
        `${BASE_URL}/api/bike-services/${id}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (result.success) {
        alert("Service deleted successfully!");
        fetchServices();
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Failed to delete service: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Reset Form
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      serviceName: "",
      serviceDescription: "",
      serviceType: "",
      brandId: "",
      categoryId: "",
      modelId: "",
      yearId: "",
      price: "",
      status: "ACTIVE",
      serviceImage: null,
    });
    setModels([]);
  };

  // ✅ Filter and pagination
  const filteredData = services.filter((item) => {
    if (!item.serviceName) return false;
    return item.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const startingSerialNumber = filteredData.length === 0 ? 0 : indexOfFirstItem + 1;

  const goToPage = (page) => {
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    setCurrentPage(page);
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <p className="text-lg font-semibold">Loading...</p>
          </div>
        </div>
      )}

      {formVisible ? (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-bold mb-4 md:text-xl">
            {editingId ? "Edit Bike Service" : "Add New Bike Service"}
          </h2>
          <form onSubmit={editingId ? handleUpdateService : handleAddService}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Service Type */}
              <div>
                <label className="block mb-2 font-medium">Service Type *</label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded"
                  required
                >
                  <option value="">Select Service Type</option>
                  {serviceTypes.map((type) => (
                    <option key={type.code} value={type.code}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block mb-2 font-medium">Category *</label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="block mb-2 font-medium">Brand *</label>
                <select
                  name="brandId"
                  value={formData.brandId}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded"
                  required
                >
                  <option value="">Select Brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.brandName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="block mb-2 font-medium">Model *</label>
                <select
                  name="modelId"
                  value={formData.modelId}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded"
                  required
                  disabled={!formData.brandId}
                >
                  <option value="">Select Model</option>
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.modelName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block mb-2 font-medium">Year *</label>
                <select
                  name="yearId"
                  value={formData.yearId}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded"
                  required
                >
                  <option value="">Select Year</option>
                  {years.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Name */}
              <div>
                <label className="block mb-2 font-medium">Service Name *</label>
                <input
                  type="text"
                  name="serviceName"
                  value={formData.serviceName}
                  onChange={handleInputChange}
                  placeholder="Enter service name"
                  className="w-full border border-gray-300 p-2 rounded"
                  required
                />
              </div>

              {/* Service Description */}
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium">Service Description *</label>
                <textarea
                  name="serviceDescription"
                  value={formData.serviceDescription}
                  onChange={handleInputChange}
                  placeholder="Enter service description"
                  className="w-full border border-gray-300 p-2 rounded"
                  rows="3"
                  required
                />
              </div>

              {/* Service Image */}
              <div>
                <label className="block mb-2 font-medium">Service Image</label>
                <input
                  type="file"
                  name="serviceImage"
                  onChange={handleInputChange}
                  accept="image/*"
                  className="w-full border border-gray-300 p-2 rounded"
                />
                {formData.serviceImage && typeof formData.serviceImage === "string" && (
                  <img
                    src={formData.serviceImage}
                    alt="preview"
                    className="mt-2 w-24 h-24 object-cover border"
                  />
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block mb-2 font-medium">Price *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block mb-2 font-medium">Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded"
                  required
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6 gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-white bg-indigo-900 rounded hover:bg-indigo-600 disabled:opacity-50"
              >
                {loading ? "Saving..." : editingId ? "Update" : "Add"}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setFormVisible(false);
                }}
                className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Table View
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h3 className="text-xl font-bold text-indigo-900">All Bike Services</h3>

            <div className="flex items-center gap-3 md:ml-auto">
              <input
                type="text"
                placeholder="Search By Service Name..."
                className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-64 text-sm"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <button
                onClick={() => {
                  setFormVisible(true);
                  resetForm();
                }}
                className="px-4 py-2 bg-indigo-900 text-white rounded hover:bg-indigo-600 flex items-center gap-2"
              >
                <FaPlus size={14} /> Add Service
              </button>
            </div>
          </div>

          <div className="relative overflow-x-auto shadow-md rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-indigo-900 text-white">
                <tr>
                  <th className="px-6 py-3">No.</th>
                  <th className="px-6 py-3">Image</th>
                  <th className="px-6 py-3">Service Name</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Brand</th>
                  <th className="px-6 py-3">Model</th>
                  <th className="px-6 py-3">Year</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-4">
                      No data found
                    </td>
                  </tr>
                ) : (
                  filteredData.map((service, index) => (
                    <tr
                      key={service.id}
                      className={`border-b hover:bg-indigo-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-4 font-medium">
                        {startingSerialNumber + index}
                      </td>
                      <td className="px-6 py-4">
                        <img
                          src={service.serviceImage || "/placeholder.jpg"}
                          alt={service.serviceName}
                          className="w-12 h-12 object-cover rounded"
                        />
                      </td>
                      <td className="px-6 py-4">{service.serviceName}</td>
                      <td className="px-6 py-4">
                        {serviceTypes.find((t) => t.name === service.serviceType)?.label ||
                          service.serviceType}
                      </td>
                      <td className="px-6 py-4">{service.brandId}</td>
                      <td className="px-6 py-4">{service.modelId}</td>
                      <td className="px-6 py-4">{service.yearId}</td>
                      <td className="px-6 py-4">₹{service.price}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded ${
                            service.status === "ACTIVE"
                              ? "bg-green-600 text-white"
                              : "bg-red-700 text-white"
                          }`}
                        >
                          {service.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            className="px-3 py-1.5 flex items-center text-white bg-indigo-800 hover:bg-indigo-600 rounded"
                            onClick={() => handleEditService(service)}
                          >
                            <FaEdit className="mr-1.5" size={14} /> Edit
                          </button>
                          <button
                            className="px-3 py-1.5 flex items-center text-white bg-red-600 hover:bg-red-700 rounded"
                            onClick={() => handleDeleteService(service.id)}
                          >
                            <FaTrash className="mr-1.5" size={14} /> Delete
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
            <p className="text-sm text-gray-600">
              Showing {filteredData.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
                className="px-3 py-1.5 text-sm bg-indigo-800 text-white rounded-md disabled:bg-gray-300"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1.5 text-sm rounded-md ${
                      currentPage === page
                        ? "bg-indigo-800 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                disabled={currentPage === totalPages}
                onClick={() => goToPage(currentPage + 1)}
                className="px-3 py-1.5 text-sm bg-indigo-800 text-white rounded-md disabled:bg-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BikeServices;
