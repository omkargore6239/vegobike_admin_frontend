// import React, { useState } from "react";

// const AddBikeForm = () => {
//   const [bikeData, setBikeData] = useState({
//     brandId: "",
//     modelId: "",
//     name: "",
//     categoryId: "",
//     registrationYearId: "",
//     registrationNumber: "",
//     chassisNumber: "",
//     engineNumber: "",
//     defaultAddress: "",
//     price: "",
//     dealerId: "",
//     storeId: "1",
//     isPuc: true,
//     isInsurance: true,
//     isDocuments: true,
//     pucImage: null,
//     insuranceImage: null,
//     documentImage: null,
//     isActive: true,
//   });

//   const handleChange = (e) => {
//     const { name, value, type, checked, files } = e.target;
//     if (type === "checkbox") {
//       setBikeData({ ...bikeData, [name]: checked });
//     } else if (type === "file") {
//       setBikeData({ ...bikeData, [name]: files[0] });
//     } else {
//       setBikeData({ ...bikeData, [name]: value });
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     console.log("New Bike Added:", bikeData);
//     alert("Bike added successfully!");
//   };

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold text-[#2B2B80] mb-6">
//         Add New Bike
//       </h1>

//       <form
//         onSubmit={handleSubmit}
//         className="bg-white shadow-md rounded-lg p-6 max-w-3xl mx-auto space-y-4"
//       >
//         {/* Brand */}
//         <div>
//           <label className="block text-gray-700 font-medium">Brand</label>
//           <select
//             name="brandId"
//             value={bikeData.brandId}
//             onChange={handleChange}
//             className="w-full border p-2 rounded"
//             required
//           >
//             <option value="">Select Brand</option>
//             <option value="1">Honda</option>
//             <option value="2">Yamaha</option>
//             <option value="3">Bajaj</option>
//           </select>
//         </div>

//         {/* Model */}
//         <div>
//           <label className="block text-gray-700 font-medium">Model</label>
//           <select
//             name="modelId"
//             value={bikeData.modelId}
//             onChange={handleChange}
//             className="w-full border p-2 rounded"
//             required
//           >
//             <option value="">Select Model</option>
//             <option value="1">Model A</option>
//             <option value="2">Model B</option>
//           </select>
//         </div>

//         {/* Bike Name */}
//         <div>
//           <label className="block text-gray-700 font-medium">Bike Name</label>
//           <input
//             type="text"
//             name="name"
//             placeholder="Enter Bike Name"
//             value={bikeData.name}
//             onChange={handleChange}
//             className="w-full border p-2 rounded"
//           />
//         </div>

//         {/* Category */}
//         <div>
//           <label className="block text-gray-700 font-medium">Category</label>
//           <select
//             name="categoryId"
//             value={bikeData.categoryId}
//             onChange={handleChange}
//             className="w-full border p-2 rounded"
//             required
//           >
//             <option value="">Select Category</option>
//             <option value="1">Scooter</option>
//             <option value="2">Sports</option>
//             <option value="3">Cruiser</option>
//           </select>
//         </div>

//         {/* Registration Year */}
//         <div>
//           <label className="block text-gray-700 font-medium">
//             Registration Year
//           </label>
//           <input
//             type="number"
//             name="registrationYearId"
//             placeholder="Enter Registration Year"
//             value={bikeData.registrationYearId}
//             onChange={handleChange}
//             className="w-full border p-2 rounded"
//             required
//           />
//         </div>

//         {/* Registration Number */}
//         <div>
//           <label className="block text-gray-700 font-medium">
//             Vehicle Registration Number
//           </label>
//           <input
//             type="text"
//             name="registrationNumber"
//             placeholder="Enter Vehicle Registration Number"
//             value={bikeData.registrationNumber}
//             onChange={handleChange}
//             className="w-full border p-2 rounded"
//             required
//           />
//         </div>

//         {/* Chassis Number */}
//         <div>
//           <label className="block text-gray-700 font-medium">Chassis Number</label>
//           <input
//             type="text"
//             name="chassisNumber"
//             placeholder="Enter Chassis Number"
//             value={bikeData.chassisNumber}
//             onChange={handleChange}
//             className="w-full border p-2 rounded"
//             required
//           />
//         </div>

//         {/* Engine Number */}
//         <div>
//           <label className="block text-gray-700 font-medium">Engine Number</label>
//           <input
//             type="text"
//             name="engineNumber"
//             placeholder="Enter Engine Number"
//             value={bikeData.engineNumber}
//             onChange={handleChange}
//             className="w-full border p-2 rounded"
//             required
//           />
//         </div>

//         {/* Default Address */}
//         <div>
//           <label className="block text-gray-700 font-medium">Default Address</label>
//           <textarea
//             name="defaultAddress"
//             placeholder="Enter Address"
//             value={bikeData.defaultAddress}
//             onChange={handleChange}
//             className="w-full border p-2 rounded"
//           />
//         </div>

//         {/* Price */}
//         <div>
//           <label className="block text-gray-700 font-medium">Price</label>
//           <input
//             type="number"
//             name="price"
//             placeholder="Enter Price"
//             value={bikeData.price}
//             onChange={handleChange}
//             className="w-full border p-2 rounded"
//           />
//         </div>

//         {/* Dealer */}
//         <div>
//           <label className="block text-gray-700 font-medium">Dealer</label>
//           <select
//             name="dealerId"
//             value={bikeData.dealerId}
//             onChange={handleChange}
//             className="w-full border p-2 rounded"
//             required
//           >
//             <option value="">Select Dealer</option>
//             <option value="1">Dealer A</option>
//             <option value="2">Dealer B</option>
//           </select>
//         </div>

//         {/* Store */}
//         <div>
//           <label className="block text-gray-700 font-medium">Store</label>
//           <select
//             name="storeId"
//             value={bikeData.storeId}
//             onChange={handleChange}
//             className="w-full border p-2 rounded"
//           >
//             <option value="1">Main Store</option>
//             <option value="2">Secondary Store</option>
//           </select>
//         </div>

//         {/* PUC, Insurance, Documents */}
//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//           <div>
//             <label className="flex items-center">
//               <input
//                 type="checkbox"
//                 name="isPuc"
//                 checked={bikeData.isPuc}
//                 onChange={handleChange}
//                 className="mr-2"
//               />
//               PUC Available
//             </label>
//             <input
//               type="file"
//               name="pucImage"
//               onChange={handleChange}
//               className="mt-2 w-full"
//             />
//           </div>
//           <div>
//             <label className="flex items-center">
//               <input
//                 type="checkbox"
//                 name="isInsurance"
//                 checked={bikeData.isInsurance}
//                 onChange={handleChange}
//                 className="mr-2"
//               />
//               Insurance Available
//             </label>
//             <input
//               type="file"
//               name="insuranceImage"
//               onChange={handleChange}
//               className="mt-2 w-full"
//             />
//           </div>
//           <div>
//             <label className="flex items-center">
//               <input
//                 type="checkbox"
//                 name="isDocuments"
//                 checked={bikeData.isDocuments}
//                 onChange={handleChange}
//                 className="mr-2"
//               />
//               Documents Available
//             </label>
//             <input
//               type="file"
//               name="documentImage"
//               onChange={handleChange}
//               className="mt-2 w-full"
//             />
//           </div>
//         </div>

//         {/* Active Checkbox */}
//         <div>
//           <label className="flex items-center">
//             <input
//               type="checkbox"
//               name="isActive"
//               checked={bikeData.isActive}
//               onChange={handleChange}
//               className="mr-2"
//             />
//             Active
//           </label>
//         </div>

//         {/* Submit Button */}
//         <button
//           type="submit"
//           className="bg-[#2B2B80] text-white px-4 py-2 rounded hover:bg-[#1f1f60]"
//         >
//           Save Bike
//         </button>
//       </form>
//     </div>
//   );
// };

// export default AddBikeForm;

import React, { useState } from "react";

const AddBikeForm = () => {
  const [bikeData, setBikeData] = useState({
    brandId: "",
    categoryId: "",
    modelId: "",
    registrationNumber: "",
    registrationYear: "",
    chassisNumber: "",
    engineNumber: "",
    storeId: "",
    isPuc: false,
    isInsurance: false,
    isDocuments: false,
    pucImage: null,
    insuranceImage: null,
    documentImage: null,
    vehicleImages: null,
  });

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setBikeData({ ...bikeData, [name]: checked });
    } else if (type === "file") {
      setBikeData({ ...bikeData, [name]: files[0] });
    } else {
      setBikeData({ ...bikeData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Bike Data Submitted:", bikeData);
    alert("Bike Added Successfully!");
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-[#2B2B80] mb-6">
          Add New Bike
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Brand */}
          <div>
            <label className="block text-gray-700 mb-1">Brand Name *</label>
            <select
              name="brandId"
              value={bikeData.brandId}
              onChange={handleChange}
              className="w-full border rounded p-2"
              required
            >
              <option value="">Select Brand</option>
              <option value="1">Honda</option>
              <option value="2">Yamaha</option>
              <option value="3">Bajaj</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-gray-700 mb-1">Category Name *</label>
            <select
              name="categoryId"
              value={bikeData.categoryId}
              onChange={handleChange}
              className="w-full border rounded p-2"
              required
            >
              <option value="">Select Category</option>
              <option value="1">Scooter</option>
              <option value="2">Sports</option>
              <option value="3">Cruiser</option>
            </select>
          </div>

          {/* Model */}
          <div>
            <label className="block text-gray-700 mb-1">Model Name *</label>
            <select
              name="modelId"
              value={bikeData.modelId}
              onChange={handleChange}
              className="w-full border rounded p-2"
              required
            >
              <option value="">Select Model</option>
              <option value="1">Model A</option>
              <option value="2">Model B</option>
            </select>
          </div>

          {/* Registration Number */}
          <div>
            <label className="block text-gray-700 mb-1">
              Vehicle Registration Number *
            </label>
            <input
              type="text"
              name="registrationNumber"
              value={bikeData.registrationNumber}
              onChange={handleChange}
              placeholder="Enter Vehicle Registration Number"
              className="w-full border rounded p-2"
              required
            />
          </div>

          {/* Registration Year */}
          <div>
            <label className="block text-gray-700 mb-1">Registration Year *</label>
            <select
              name="registrationYear"
              value={bikeData.registrationYear}
              onChange={handleChange}
              className="w-full border rounded p-2"
              required
            >
              <option value="">Select Registration Year</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>

          {/* Chassis Number */}
          <div>
            <label className="block text-gray-700 mb-1">Vehicle Chassis Number</label>
            <input
              type="text"
              name="chassisNumber"
              value={bikeData.chassisNumber}
              onChange={handleChange}
              placeholder="Enter Vehicle Chassis Number"
              className="w-full border rounded p-2"
            />
          </div>

          {/* Engine Number */}
          <div>
            <label className="block text-gray-700 mb-1">Vehicle Engine Number</label>
            <input
              type="text"
              name="engineNumber"
              value={bikeData.engineNumber}
              onChange={handleChange}
              placeholder="Enter Vehicle Engine Number"
              className="w-full border rounded p-2"
            />
          </div>

          {/* Store Name */}
          <div>
            <label className="block text-gray-700 mb-1">Store Name *</label>
            <select
              name="storeId"
              value={bikeData.storeId}
              onChange={handleChange}
              className="w-full border rounded p-2"
              required
            >
              <option value="">Select Store</option>
              <option value="1">Main Store</option>
              <option value="2">Branch Store</option>
            </select>
          </div>
        </form>

        {/* Divider */}
        <hr className="my-6" />

        {/* PUC / Insurance / Documents */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isPuc"
                checked={bikeData.isPuc}
                onChange={handleChange}
              />
              <span className="font-medium">PUC Available</span>
            </label>
            <input
              type="file"
              name="pucImage"
              onChange={handleChange}
              className="mt-2 w-full"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isInsurance"
                checked={bikeData.isInsurance}
                onChange={handleChange}
              />
              <span className="font-medium">Insurance Available</span>
            </label>
            <input
              type="file"
              name="insuranceImage"
              onChange={handleChange}
              className="mt-2 w-full"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isDocuments"
                checked={bikeData.isDocuments}
                onChange={handleChange}
              />
              <span className="font-medium">Documents Available</span>
            </label>
            <input
              type="file"
              name="documentImage"
              onChange={handleChange}
              className="mt-2 w-full"
            />
          </div>
        </div>

        {/* Vehicle Images */}
        <div className="mt-6">
          <label className="block text-gray-700 font-medium">Upload Vehicle Images *</label>
          <input
            type="file"
            name="vehicleImages"
            onChange={handleChange}
            multiple
            className="mt-2 w-full"
          />
        </div>

        {/* Submit */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            className="bg-[#2B2B80] text-white px-6 py-2 rounded-lg hover:bg-[#1f1f60]"
          >
            Save Bike
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBikeForm;
