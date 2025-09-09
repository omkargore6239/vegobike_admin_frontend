// import React, { useState, useEffect } from "react";
// import { FaEdit } from "react-icons/fa";

// // Static data (mock until you connect API/DB)
// const staticSpareParts = [
//   {
//     id: 1,
//     partImage: "/spare.jpg",
//     partName: "Battery",
//     partDescription: "12V long-life battery",
//     spareType: "Common",
//     price: 1200,
//     isActive: true,
//   },
//   {
//     id: 2,
//     partImage: "/spare.jpg",
//     partName: "Brake Pads",
//     partDescription: "High performance brake pads",
//     spareType: "Specific",
//     price: 1500,
//     isActive: false,
//   },
// ];

// const SpareParts = () => {
//   const [spareParts, setSpareParts] = useState(staticSpareParts);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [formVisible, setFormVisible] = useState(false);
//   const [editingId, setEditingId] = useState(null);
//   const [confirmDeleteId, setConfirmDeleteId] = useState(null);

//   const [formData, setFormData] = useState({
//     partImage: "",
//     partName: "",
//     partDescription: "",
//     spareType: "",
//     price: "",
//     isActive: true,
//   });

//   const [itemsPerPage] = useState(10);

//   useEffect(() => {
//     window.scrollTo(0, 0);
//   }, []);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({
//       ...formData,
//       [name]: value,
//     });
//   };

//   const handleAddSparePart = (e) => {
//     e.preventDefault();
//     const newSparePart = {
//       id: spareParts.length + 1,
//       ...formData,
//     };
//     setSpareParts([...spareParts, newSparePart]);
//     resetForm();
//   };

//   const handleUpdateSparePart = (e) => {
//     e.preventDefault();
//     setSpareParts(
//       spareParts.map((sparePart) =>
//         sparePart.id === editingId ? { ...formData, id: editingId } : sparePart
//       )
//     );
//     resetForm();
//   };

//   const handleEditSparePart = (sparePart) => {
//     setEditingId(sparePart.id);
//     setFormData({
//       partImage: sparePart.partImage,
//       partName: sparePart.partName,
//       partDescription: sparePart.partDescription || "",
//       spareType: sparePart.spareType,
//       price: sparePart.price,
//       isActive: sparePart.isActive,
//     });
//     setFormVisible(true);
//   };

//   const handleDeleteSparePart = (id) => {
//     setSpareParts(spareParts.filter((sparePart) => sparePart.id !== id));
//     setConfirmDeleteId(null);
//   };

//   const resetForm = () => {
//     setEditingId(null);
//     setFormData({
//       partImage: "",
//       partName: "",
//       partDescription: "",
//       spareType: "",
//       price: "",
//       isActive: true,
//     });
//     setFormVisible(false);
//   };

//   const filteredData = spareParts.filter((item) =>
//     item.partName?.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);
//   const totalPages = Math.ceil(filteredData.length / itemsPerPage);

//   const startingSerialNumber = indexOfFirstItem + 1;

//   const toggleStatus = (id, currentStatus) => {
//     setSpareParts((prevData) =>
//       prevData.map((row) =>
//         row.id === id ? { ...row, isActive: !currentStatus } : row
//       )
//     );
//   };

//   return (
//     <div className="bg-gray-100 min-h-screen">
//       {formVisible ? (
//         <div className="bg-white p-6 rounded-lg shadow-lg">
//           <h2 className="text-lg font-bold mb-4 md:text-xl">
//             {editingId ? "Edit Spare Part" : "Add New Spare Part"}
//           </h2>
//           <form onSubmit={editingId ? handleUpdateSparePart : handleAddSparePart}>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               <div>
//                 <label className="block mb-2 font-medium">Part Image</label>
//                 <input
//                   type="file"
//                   name="part_image"
//                   onChange={handleInputChange}
//                   className="w-full border border-gray-300 p-2 rounded"
//                 />
//                 {formData.part && (
//                   <img
//                     src={formData.part_image}
//                     alt="preview"
//                     className="mt-2 w-24 h-24 object-cover border"
//                   />
//                 )}
//               </div>
//               <div>
//                 <label className="block mb-2 font-medium">Part Name *</label>
//                 <input
//                   type="text"
//                   name="partName"
//                   placeholder="Enter Part Name"
//                   value={formData.partName}
//                   onChange={handleInputChange}
//                   className="w-full border border-gray-300 p-2 rounded"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block mb-2 font-medium">Description</label>
//                 <textarea
//                   type="text"
//                   name="partDescription"
//                   placeholder="Enter the description"
//                   value={formData.partDescription}
//                   onChange={handleInputChange}
//                   className="w-full border border-gray-300 p-2 rounded"
//                 />
//               </div>
//               <div>
//                 <label className="block mb-2 font-medium">Spare Type *</label>
//                 <select
//                   name="spareType"
//                   value={formData.spareType}
//                   onChange={handleInputChange}
//                   className="w-full border border-gray-300 p-2 rounded"
//                   required
//                 >
//                   <option value="">Select Type</option>
//                   <option value="Common">Common</option>
//                   <option value="Specific">Specific</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="block mb-2 font-medium">Price *</label>
//                 <input
//                   type="number"
//                   name="price"
//                   value={formData.price}
//                   onChange={handleInputChange}
//                   className="w-full border border-gray-300 p-2 rounded"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block mb-2 font-medium">Status *</label>
//                 <select
//                   name="isActive"
//                   className="w-full border border-gray-300 p-2 rounded"
//                   value={formData.isActive}
//                   onChange={(e) =>
//                     setFormData({ ...formData, isActive: e.target.value === "true" })
//                   }
//                   required
//                 >
//                   <option value={true}>Active</option>
//                   <option value={false}>Inactive</option>
//                 </select>
//               </div>
//             </div>
//             <div className="flex justify-end mt-4">
//               <button
//                 type="submit"
//                 className="px-4 py-2 mr-2 text-white bg-indigo-900 rounded hover:bg-indigo-600"
//               >
//                 {editingId ? "Save" : "Add"}
//               </button>
//               <button
//                 type="button"
//                 className="ml-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
//                 onClick={resetForm}
//               >
//                 Cancel
//               </button>
//             </div>
//           </form>
//         </div>
//       ) : (
//         <div className="bg-white p-6 rounded-lg shadow-lg">
//           <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
//             <h3 className="text-xl font-bold text-indigo-900">All Spare Parts</h3>
//             <div className="flex flex-col md:flex-row md:justify-between w-full md:w-auto gap-3">
//               <input
//                 type="text"
//                 placeholder="Search By Part Name..."
//                 className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64 text-sm"
//                 value={searchQuery}
//                 onChange={(e) => {
//                   setSearchQuery(e.target.value);
//                   setCurrentPage(1);
//                 }}
//               />
//               <button
//                 onClick={() => setFormVisible(true)}
//                 className="px-4 py-2 bg-indigo-900 text-white rounded hover:bg-indigo-600 md:ml-auto"
//               >
//                 + Add Spare Part
//               </button>
//             </div>
//           </div>
//           <div className="relative overflow-x-auto shadow-md rounded-lg">
//             <table className="w-full text-sm text-left">
//               <thead className="text-xs uppercase bg-indigo-900 text-white">
//                 <tr>
//                   <th className="px-6 py-3">No.</th>
//                   <th className="px-6 py-3">Image</th>
//                   <th className="px-6 py-3">Name</th>
//                   <th className="px-6 py-3">Description</th>
//                   <th className="px-6 py-3">Type</th>
//                   <th className="px-6 py-3">Price</th>
//                   <th className="px-6 py-3">Status</th>
//                   <th className="px-6 py-3">Action</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {currentData.length === 0 ? (
//                   <tr>
//                     <td colSpan="8" className="text-center py-4">
//                       No data found
//                     </td>
//                   </tr>
//                 ) : (
//                   currentData.map((sparePart, index) => (
//                     <tr
//                       key={sparePart.id}
//                       className={`border-b hover:bg-indigo-50 transition-colors ${
//                         index % 2 === 0 ? "bg-white" : "bg-gray-50"
//                       }`}
//                     >
//                       <td className="px-6 py-4 font-medium">
//                         {startingSerialNumber + index}
//                       </td>
//                       <td className="px-6 py-4">
//                         <img
//                           src={sparePart.partImage}
//                           alt={sparePart.partName}
//                           className="w-12 h-12 object-cover"
//                         />
//                       </td>
//                       <td className="px-6 py-4">{sparePart.partName}</td>
//                       <td className="px-6 py-4">{sparePart.partDescription}</td>
//                       <td className="px-6 py-4">{sparePart.spareType}</td>
//                       <td className="px-6 py-4">₹{sparePart.price}</td>
//                       <td className="px-6 py-4">
//                         <button
//                           className={`px-2 py-1 rounded ${
//                             sparePart.isActive
//                               ? "bg-green-600 hover:bg-green-500 text-white"
//                               : "bg-red-600 hover:bg-red-500 text-white"
//                           }`}
//                           onClick={() => toggleStatus(sparePart.id, sparePart.isActive)}
//                         >
//                           {sparePart.isActive ? "Active" : "Inactive"}
//                         </button>
//                       </td>
//                       <td className="px-6 py-4">
//                         <button
//                           className="px-3 py-1.5 flex items-center text-white bg-indigo-800 hover:bg-indigo-600 rounded"
//                           onClick={() => handleEditSparePart(sparePart)}
//                         >
//                           <FaEdit className="mr-1.5" size={14} />
//                           Edit
//                         </button>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//           {/* Pagination */}
//           <div className="flex justify-between items-center mt-6">
//             <p className="text-sm text-gray-600">
//               Showing {indexOfFirstItem + 1} to{" "}
//               {Math.min(indexOfLastItem, filteredData.length)} of{" "}
//               {filteredData.length} entries
//             </p>
//             <div className="flex space-x-1">
//               <button
//                 className="px-3 py-1.5 text-sm text-white bg-indigo-800 rounded-md disabled:bg-gray-300"
//                 disabled={currentPage === 1}
//                 onClick={() => setCurrentPage((prev) => prev - 1)}
//               >
//                 Previous
//               </button>
//               {Array.from({ length: totalPages }, (_, index) => (
//                 <button
//                   key={index}
//                   className={`px-3 py-1.5 rounded-md text-sm ${
//                     currentPage === index + 1
//                       ? "bg-indigo-800 text-white"
//                       : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//                   }`}
//                   onClick={() => setCurrentPage(index + 1)}
//                 >
//                   {index + 1}
//                 </button>
//               ))}
//               <button
//                 disabled={currentPage === totalPages}
//                 onClick={() => setCurrentPage((prev) => prev + 1)}
//                 className="px-3 py-1.5 text-sm rounded-md bg-indigo-800 text-white hover:bg-indigo-700 disabled:bg-gray-300"
//               >
//                 Next
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SpareParts;

import React, { useState, useEffect } from "react";
import { FaEdit } from "react-icons/fa";

// Static data (mock until you connect API/DB)
const staticSpareParts = [
  {
    id: 1,
    year_id: 2021,
    part_name: "Battery",
    part_image: "/battery.jpg",
    part_description: "12V long-life battery",
    price: 1200,
    status: 1, // 1 = Active, 0 = Inactive
    is_type: 1, // 1 = Common, 2 = Specific
  },
  {
    id: 2,
    year_id: 2020,
    part_name: "Brake Pads",
    part_image: "/brake-pads.jpg",
    part_description: "High performance brake pads",
    price: 1500,
    status: 0,
    is_type: 2,
  },
];

const SpareParts = () => {
  const [spareParts, setSpareParts] = useState(staticSpareParts);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    year_id: "",
    part_name: "",
    part_image: "",
    part_description: "",
    price: "",
    status: 1,
    is_type: 1,
  });

  const [itemsPerPage] = useState(10);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle input (for text, number, select)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === "status" || name === "is_type" || name === "year_id"
          ? Number(value)
          : value,
    });
  };

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, part_image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleAddSparePart = (e) => {
    e.preventDefault();
    const newSparePart = {
      id: spareParts.length + 1,
      ...formData,
    };
    setSpareParts([...spareParts, newSparePart]);
    resetForm();
  };

  const handleUpdateSparePart = (e) => {
    e.preventDefault();
    setSpareParts(
      spareParts.map((sparePart) =>
        sparePart.id === editingId ? { ...formData, id: editingId } : sparePart
      )
    );
    resetForm();
  };

  const handleEditSparePart = (sparePart) => {
    setEditingId(sparePart.id);
    setFormData(sparePart);
    setFormVisible(true);
  };

  const handleDeleteSparePart = (id) => {
    setSpareParts(spareParts.filter((sparePart) => sparePart.id !== id));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      year_id: "",
      part_name: "",
      part_image: "",
      part_description: "",
      price: "",
      status: 1,
      is_type: 1,
    });
    setFormVisible(false);
  };

  const filteredData = spareParts.filter((item) =>
    item.part_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const startingSerialNumber = indexOfFirstItem + 1;

  const toggleStatus = (id, currentStatus) => {
    setSpareParts((prevData) =>
      prevData.map((row) =>
        row.id === id ? { ...row, status: currentStatus === 1 ? 0 : 1 } : row
      )
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {formVisible ? (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-bold mb-4 md:text-xl">
            {editingId ? "Edit Spare Part" : "Add New Spare Part"}
          </h2>
          <form onSubmit={editingId ? handleUpdateSparePart : handleAddSparePart}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block mb-2 font-medium">Part Image</label>
                <input
                  type="file"
                  name="part_image"
                  onChange={handleImageChange}
                  className="w-full border border-gray-300 p-2 rounded"
                />
                {formData.part_image && (
                  <img
                    src={formData.part_image}
                    alt="preview"
                    className="mt-2 w-24 h-24 object-cover border"
                  />
                )}
              </div>
              <div>
                <label className="block mb-2 font-medium">Part Name *</label>
                <input
                  type="text"
                  name="part_name"
                  placeholder="Enter Part Name"
                  value={formData.part_name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">Description</label>
                <textarea
                  name="part_description"
                  placeholder="Enter the description"
                  value={formData.part_description}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">Spare Type *</label>
                <select
                  name="is_type"
                  value={formData.is_type}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded"
                  required
                >
                  <option value={1}>Common</option>
                  <option value={2}>Specific</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium">Year</label>
                <input
                  type="number"
                  name="year_id"
                  value={formData.year_id}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded"
                />
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
                  className="w-full border border-gray-300 p-2 rounded"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="px-4 py-2 mr-2 text-white bg-indigo-900 rounded hover:bg-indigo-600"
              >
                {editingId ? "Save" : "Add"}
              </button>
              <button
                type="button"
                className="ml-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
            <h3 className="text-xl font-bold text-indigo-900">All Spare Parts</h3>
            <div className="flex flex-col md:flex-row md:justify-between w-full md:w-auto gap-3">
              <input
                type="text"
                placeholder="Search By Part Name..."
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64 text-sm"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <button
                onClick={() => setFormVisible(true)}
                className="px-4 py-2 bg-indigo-900 text-white rounded hover:bg-indigo-600 md:ml-auto"
              >
                + Add Spare Part
              </button>
            </div>
          </div>
          <div className="relative overflow-x-auto shadow-md rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-indigo-900 text-white">
                <tr>
                  <th className="px-6 py-3">No.</th>
                  <th className="px-6 py-3">Image</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Year</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentData.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      No data found
                    </td>
                  </tr>
                ) : (
                  currentData.map((sparePart, index) => (
                    <tr
                      key={sparePart.id}
                      className={`border-b hover:bg-indigo-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-4 font-medium">
                        {startingSerialNumber + index}
                      </td>
                      <td className="px-6 py-4">
                        <img
                          src={sparePart.part_image}
                          alt={sparePart.part_name}
                          className="w-12 h-12 object-cover"
                        />
                      </td>
                      <td className="px-6 py-4">{sparePart.part_name}</td>
                      <td className="px-6 py-4">{sparePart.part_description}</td>
                      <td className="px-6 py-4">
                        {sparePart.is_type === 1 ? "Common" : "Specific"}
                      </td>
                      <td className="px-6 py-4">{sparePart.year_id}</td>
                      <td className="px-6 py-4">₹{sparePart.price}</td>
                      <td className="px-6 py-4">
                        <button
                          className={`px-2 py-1 rounded ${
                            sparePart.status === 1
                              ? "bg-green-600 hover:bg-green-500 text-white"
                              : "bg-red-600 hover:bg-red-500 text-white"
                          }`}
                          onClick={() => toggleStatus(sparePart.id, sparePart.status)}
                        >
                          {sparePart.status === 1 ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          className="px-3 py-1.5 flex items-center text-white bg-indigo-800 hover:bg-indigo-600 rounded"
                          onClick={() => handleEditSparePart(sparePart)}
                        >
                          <FaEdit className="mr-1.5" size={14} />
                          Edit
                        </button>
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
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, filteredData.length)} of{" "}
              {filteredData.length} entries
            </p>
            <div className="flex space-x-1">
              <button
                className="px-3 py-1.5 text-sm text-white bg-indigo-800 rounded-md disabled:bg-gray-300"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    currentPage === index + 1
                      ? "bg-indigo-800 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="px-3 py-1.5 text-sm rounded-md bg-indigo-800 text-white hover:bg-indigo-700 disabled:bg-gray-300"
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

export default SpareParts;
