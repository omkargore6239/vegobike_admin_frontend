import React, { useState, useEffect } from "react";
import { FaEdit } from "react-icons/fa";

// Static demo data (mimicking DB fields)
const staticBikeServices = [
  { id: 1, service_image: "/image.jpg", service_name: "Test Service", service_type: 2, brand_id: 1, model_id: 1, year_id: 2021, price: 399.0, status: 1, service_description: "Basic general service" },
  { id: 2, service_image: "/image.jpg", service_name: "Oil Change", service_type: 2, brand_id: 1, model_id: 1, year_id: 2013, price: 500.0, status: 1, service_description: "Engine oil replacement" },
  { id: 3, service_image: "/image.jpg", service_name: "Air Filter", service_type: 2, brand_id: 1, model_id: 1, year_id: 2022, price: 1000.0, status: 1, service_description: "Air filter replacement" },
];

const BikeServices = () => {
  const [services, setServices] = useState(staticBikeServices);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // formData aligned with DB fields
  const [formData, setFormData] = useState({
    service_image: "",
    service_name: "",
    service_description: "",
    service_type: "", // 1 = Admin, 2 = General, 3 = Repairing
    brand_id: "",
    model_id: "",
    year_id: "",
    price: "",
    status: 1, // 1 = Active, 0 = Inactive
  });

  const [itemsPerPage] = useState(10);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleInputChange = (e) => {
    const { name, value, files, type } = e.target;
    if (type === "file") {
      const file = files && files[0];
      const url = file ? URL.createObjectURL(file) : "";
      setFormData((prev) => ({ ...prev, [name]: url }));
    } else {
      if (["price", "year_id", "service_type", "status"].includes(name)) {
        setFormData((prev) => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    }
  };

  const handleAddService = (e) => {
    e.preventDefault();
    const newService = {
      id: services.length + 1,
      ...formData,
    };
    setServices((prev) => [...prev, newService]);
    resetForm();
    setFormVisible(false);
    setCurrentPage(Math.ceil((services.length + 1) / itemsPerPage));
  };

  const handleUpdateService = (e) => {
    e.preventDefault();
    setServices((prev) =>
      prev.map((service) => (service.id === editingId ? { ...formData, id: editingId } : service))
    );
    resetForm();
    setFormVisible(false);
  };

  const handleEditService = (service) => {
    setEditingId(service.id);
    setFormData({
      service_image: service.service_image || "",
      service_name: service.service_name || "",
      service_description: service.service_description || "",
      service_type: service.service_type || "",
      brand_id: service.brand_id || "",
      model_id: service.model_id || "",
      year_id: service.year_id || "",
      price: service.price || "",
      status: service.status ?? 1,
    });
    setFormVisible(true);
    window.scrollTo(0, 0);
  };

  const handleDeleteService = (id) => {
    setServices((prev) => prev.filter((service) => service.id !== id));
    setConfirmDeleteId(null);
    const remaining = services.length - 1;
    const maxPage = Math.max(1, Math.ceil(remaining / itemsPerPage));
    if (currentPage > maxPage) setCurrentPage(maxPage);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      service_image: "",
      service_name: "",
      service_description: "",
      service_type: "",
      brand_id: "",
      model_id: "",
      year_id: "",
      price: "",
      status: 1,
    });
  };

  const filteredData = services.filter((item) => {
    if (!item.service_name) return false;
    return item.service_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startingSerialNumber = filteredData.length === 0 ? 0 : indexOfFirstItem + 1;

  const toggleStatus = (id, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    setServices((prevData) =>
      prevData.map((row) => (row.id === id ? { ...row, status: newStatus } : row))
    );
  };

  const goToPage = (page) => {
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    setCurrentPage(page);
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      {formVisible ? (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-bold mb-4 md:text-xl">
            {editingId ? "Edit Bike Service" : "Add New Bike Service"}
          </h2>
          <form onSubmit={editingId ? handleUpdateService : handleAddService}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block mb-2 font-medium">Service Type *</label>
                <select
                  name="service_type"
                  value={formData.service_type}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded"
                  required
                >
                  <option value="">Select Service Type</option>
                  <option value={1}>Admin Services</option>
                  <option value={2}>General Services</option>
                  <option value={3}>Bike Repairing</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">Brand *</label>
                <select
                  name="brand_id"
                  value={formData.brand_id}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded"
                  required
                >
                  <option value="">Select Brand</option>
                  <option value={1}>HONDA</option>
                  <option value={2}>HERO</option>
                  <option value={3}>TVS</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">Model *</label>
                <select
                  name="model_id"
                  value={formData.model_id}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded"
                  required
                >
                  <option value="">Select Model</option>
                  <option value={1}>Shine 125</option>
                  <option value={2}>Unicorn</option>
                  <option value={3}>Hero Xtreme 125R</option>
                  <option value={4}>Jupiter</option>
                  <option value={5}>Splendor</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">Year *</label>
                <select
                  name="year_id"
                  value={formData.year_id}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded"
                  required
                >
                  <option value="">Select Year</option>
                  {[2011, 2012, 2013, 2015, 2019, 2020, 2021, 2022].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">Service Name *</label>
                <input
                  type="text"
                  name="service_name"
                  value={formData.service_name}
                  onChange={handleInputChange}
                  placeholder="Enter service name"
                  className="w-full border border-gray-300 p-2 rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Service Description *</label>
                <input
                  type="text"
                  name="service_description"
                  value={formData.service_description}
                  onChange={handleInputChange}
                  placeholder="Enter service description"
                  className="w-full border border-gray-300 p-2 rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Service Image</label>
                <input
                  type="file"
                  name="service_image"
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded"
                />
                {formData.service_image && (
                  <img
                    src={formData.service_image}
                    alt="preview"
                    className="mt-2 w-24 h-24 object-cover border"
                  />
                )}
              </div>

              <div>
                <label className="block mb-2 font-medium">Price *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded"
                  required
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button type="submit" className="px-4 py-2 mr-2 text-white bg-indigo-900 rounded hover:bg-indigo-600">
                {editingId ? "Save" : "Add"}
              </button>
              <button type="button" className="ml-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" onClick={() => { resetForm(); setFormVisible(false); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Table
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
              <button onClick={() => { setFormVisible(true); resetForm(); }} className="px-4 py-2 bg-indigo-900 text-white rounded hover:bg-indigo-600">
                + Add Bike Service
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
                {currentData.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-4">No data found</td>
                  </tr>
                ) : (
                  currentData.map((service, index) => (
                    <tr key={service.id} className={`border-b hover:bg-indigo-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <td className="px-6 py-4 font-medium">{startingSerialNumber + index}</td>
                      <td className="px-6 py-4">
                        <img src={service.service_image} alt={service.service_name} className="w-12 h-12 object-cover" />
                      </td>
                      <td className="px-6 py-4">{service.service_name}</td>
                      <td className="px-6 py-4">
                        {service.service_type === 1 ? "Admin" : service.service_type === 2 ? "General" : "Repairing"}
                      </td>
                      <td className="px-6 py-4">{service.brand_id}</td>
                      <td className="px-6 py-4">{service.model_id}</td>
                      <td className="px-6 py-4">{service.year_id}</td>
                      <td className="px-6 py-4">{service.price}</td>
                      <td className="px-6 py-4">
                        <button
                          className={`px-2 py-1 rounded ${service.status === 1 ? "bg-green-600 text-white" : "bg-red-700 text-white"}`}
                          onClick={() => toggleStatus(service.id, service.status)}
                        >
                          {service.status === 1 ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            className="px-3 py-1.5 flex items-center text-white bg-indigo-800 hover:bg-indigo-600 rounded"
                            onClick={() => handleEditService(service)}
                          >
                            <FaEdit className="mr-1.5" size={14} /> Edit
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
              Showing {filteredData.length === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)} className="px-3 py-1.5 text-sm bg-indigo-800 text-white rounded-md disabled:bg-gray-300">
                Previous
              </button>
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1.5 text-sm rounded-md ${currentPage === page ? "bg-indigo-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  >
                    {page}
                  </button>
                );
              })}
              <button disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)} className="px-3 py-1.5 text-sm bg-indigo-800 text-white rounded-md disabled:bg-gray-300">
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
