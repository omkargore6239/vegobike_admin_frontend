
import React, { useState } from "react";
import { FaArrowLeft, FaTimes } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8080";

const getAuthToken = () => {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("authToken") ||
        sessionStorage.getItem("jwt") ||
        sessionStorage.getItem("accessToken")
    );
};

const AddNewSellEntry = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: "", mobileNumber: "", alternativeMobileNumber: "", email: "", address: "", city: "", pincode: "",
        bikeCategory: "", bikeBrand: "", bikeModel: "", registrationNumber: "", bikeColor: "", manufactureYear: "",
        numberOfOwners: "", odometerReading: "", sellingPrice: "", bikeCondition: "",
        frontPhoto: null, backPhoto: null, leftPhoto: null, rightPhoto: null,
        customerSellingClosingPrice: 0, supervisorName: "", additionalNotes: "", listingStatus: "PENDING",
        isRepairRequired: false, isPuc: false, isInsurance: false, isDocument: false, pucFile: null, documentFile: null,
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previews, setPreviews] = useState({ frontPhoto: null, backPhoto: null, leftPhoto: null, rightPhoto: null });

    const validateField = (name, value) => {
        let error = "";
        switch (name) {
            case "name": if (!value.trim()) error = "Name is required"; else if (value.trim().length < 2) error = "Name must be at least 2 characters"; break;
            case "mobileNumber": if (!value.trim()) error = "Mobile number is required"; else if (!/^[6-9]\d{9}$/.test(value)) error = "Enter a valid 10-digit mobile number"; break;
            case "alternativeMobileNumber": if (value && !/^[6-9]\d{9}$/.test(value)) error = "Enter a valid 10-digit mobile number"; break;
            case "email": if (!value.trim()) error = "Email is required"; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Enter a valid email address"; break;
            case "address": if (!value.trim()) error = "Address is required"; else if (value.trim().length < 10) error = "Please provide a complete address"; break;
            case "city": if (!value.trim()) error = "City is required"; break;
            case "pincode": if (!value.trim()) error = "Pincode is required"; else if (!/^\d{6}$/.test(value)) error = "Pincode must be 6 digits"; break;
            case "bikeCategory": if (!value) error = "Please select a bike category"; break;
            case "bikeBrand": if (!value) error = "Please select a bike brand"; break;
            case "bikeModel": if (!value.trim()) error = "Bike model is required"; break;
            case "registrationNumber": if (!value.trim()) error = "Registration number is required"; else if (value.trim().length < 6) error = "Enter a valid registration number"; break;
            case "bikeColor": if (!value.trim()) error = "Bike color is required"; break;
            case "manufactureYear": if (!value) error = "Please select manufacture year"; break;
            case "numberOfOwners": if (!value) error = "Please select number of owners"; break;
            case "odometerReading": if (!value) error = "Odometer reading is required"; else if (parseInt(value) < 0) error = "Odometer reading must be positive"; break;
            case "sellingPrice": if (!value) error = "Selling price is required"; else if (parseInt(value) <= 0) error = "Selling price must be greater than 0"; break;
            case "bikeCondition": if (!value) error = "Please select bike condition"; break;
        }
        return error;
    };

    const handleFieldChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleFieldBlur = (e) => {
        const { name, value } = e.target;
        const error = validateField(name, value);
        if (error) setErrors((prev) => ({ ...prev, [name]: error }));
    };

    const handleImageChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/bmp"];
            const maxSize = 5 * 1024 * 1024;
            if (!allowedTypes.includes(file.type)) return alert("Please upload only JPEG, PNG, GIF, or BMP images");
            if (file.size > maxSize) return alert("Image size must be less than 5MB");
            setFormData((prev) => ({ ...prev, [name]: file }));
            const reader = new FileReader();
            reader.onloadend = () => setPreviews((prev) => ({ ...prev, [name]: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const removeImage = (name) => {
        setFormData((prev) => ({ ...prev, [name]: null }));
        setPreviews((prev) => ({ ...prev, [name]: null }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) setFormData((prev) => ({ ...prev, [name]: files[0] }));
    };

    const validateForm = () => {
        const newErrors = {};
        const requiredFields = ["name", "mobileNumber", "email", "address", "city", "pincode", "bikeCategory", "bikeBrand", "bikeModel", "registrationNumber", "bikeColor", "manufactureYear", "numberOfOwners", "odometerReading", "sellingPrice", "bikeCondition"];
        requiredFields.forEach((field) => {
            const error = validateField(field, formData[field]);
            if (error) newErrors[field] = error;
        });
        const hasImage = formData.frontPhoto || formData.backPhoto || formData.leftPhoto || formData.rightPhoto;
        if (!hasImage) { alert("Please upload at least one bike image"); return false; }
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) { alert(Object.values(newErrors)[0]); return false; }
        return true;
    };

    const submitForm = async () => {
        if (!validateForm()) return;
        try {
            setIsSubmitting(true);
            const formDataToSend = new FormData();
            const categoryId = parseInt(formData.bikeCategory) || 1;
            const brandId = parseInt(formData.bikeBrand) || 1;
            const modelId = parseInt(formData.bikeModel) || 1;
            const yearId = parseInt(formData.manufactureYear) || new Date().getFullYear();

            const requestDTO = {
                sellerDetail: {
                    name: formData.name.trim(),
                    contactNumber: formData.mobileNumber.trim(),
                    alternateContactNumber: formData.alternativeMobileNumber?.trim() || "",
                    email: formData.email.trim(),
                    address: formData.address.trim(),
                    city: formData.city.trim(),
                    pincode: formData.pincode.trim(),
                },
                bikeSale: {
                    categoryId, brandId, modelId, yearId,
                    color: formData.bikeColor.trim(),
                    registrationNumber: formData.registrationNumber.trim().toUpperCase(),
                    numberOfOwner: parseInt(formData.numberOfOwners) || 1,
                    kmsDriven: parseInt(formData.odometerReading) || 0,
                    price: parseFloat(formData.sellingPrice) || 0,
                    sellingPrice: parseFloat(formData.sellingPrice) || 0,
                    bikeCondition: formData.bikeCondition.trim(),
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    contactNumber: formData.mobileNumber.trim(),
                    alternateContactNumber: formData.alternativeMobileNumber?.trim() || "",
                    city: formData.city.trim(),
                    pincode: formData.pincode.trim(),
                    address: formData.address.trim(),
                    customerSellingClosingPrice: parseFloat(formData.customerSellingClosingPrice) || 0,
                    supervisorName: formData.supervisorName.trim(),
                    additionalNotes: formData.additionalNotes.trim(),
                    listingStatus: formData.listingStatus,
                    isRepairRequired: formData.isRepairRequired,
                    isPuc: formData.isPuc,
                    isInsurance: formData.isInsurance,
                    isDocument: formData.isDocument,
                    sellingClosingPrice: parseFloat(formData.sellingPrice) || 0,
                },
                bikeImages: {},
            };

            formDataToSend.append("requestDTO", new Blob([JSON.stringify(requestDTO)], { type: "application/json" }));
            if (formData.frontPhoto) formDataToSend.append("front_image", formData.frontPhoto, formData.frontPhoto.name);
            if (formData.backPhoto) formDataToSend.append("back_image", formData.backPhoto, formData.backPhoto.name);
            if (formData.leftPhoto) formDataToSend.append("left_image", formData.leftPhoto, formData.leftPhoto.name);
            if (formData.rightPhoto) formDataToSend.append("right_image", formData.rightPhoto, formData.rightPhoto.name);
            if (formData.pucFile) formDataToSend.append("pucimage", formData.pucFile);
            if (formData.documentFile) formDataToSend.append("documentimage", formData.documentFile);

            const token = getAuthToken();
            const headers = {};
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const response = await fetch(`${BASE_URL}/api/bike-sales/sell`, {
                method: "POST",
                headers: headers,
                body: formDataToSend,
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Failed to create bike entry: ${response.status} ${errorData}`);
            }

            const result = await response.json();
            if (result.success) {
                alert(`🎉 ${result.message || "Bike entry created successfully!"}`);
                onSave(result.data);
            } else {
                alert(result.message || "Submission completed with warnings");
            }
        } catch (error) {
            console.error("❌ Submission error:", error);
            if (error.response) {
                const { status, data } = error.response;
                let errorMessage = "An error occurred while submitting your listing";
                if (data?.message) errorMessage = data.message;
                if (status === 500) {
                    if (errorMessage.toLowerCase().includes("image")) alert("Image validation failed. Please check your images and try again.");
                    else if (errorMessage.toLowerCase().includes("brand")) alert("Please select a valid bike brand");
                    else if (errorMessage.toLowerCase().includes("category")) alert("Please select a valid bike category");
                    else alert(errorMessage);
                } else if (status === 400) alert("Invalid form data. Please check all fields.");
                else alert(errorMessage);
            } else if (error.request) alert("Network error. Please check your internet connection.");
            else alert(`Failed to create bike entry: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const Field = ({ label, name, type = "text", placeholder, required, maxLength, icon, rows, options, colSpan = "" }) => (
        <div className={colSpan}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {options ? (
                <select name={name} value={formData[name]} onChange={handleFieldChange} onBlur={handleFieldBlur} required={required}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white ${errors[name] ? "border-red-500 bg-red-50" : "border-gray-300"}`}>
                    {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            ) : rows ? (
                <textarea name={name} value={formData[name]} onChange={handleFieldChange} onBlur={handleFieldBlur} rows={rows} placeholder={placeholder}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none ${errors[name] ? "border-red-500 bg-red-50" : "border-gray-300"}`} />
            ) : (
                <div className="relative">
                    {icon && <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">{icon}</span>}
                    <input type={type} name={name} value={formData[name]} onChange={handleFieldChange} onBlur={handleFieldBlur} placeholder={placeholder} maxLength={maxLength} required={required}
                        className={`w-full ${icon ? "pl-12 pr-4" : "px-4"} py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors[name] ? "border-red-500 bg-red-50" : "border-gray-300"}`} />
                </div>
            )}
            {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name]}</p>}
        </div>
    );

    const ImageBox = ({ name, label, icon }) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            {!previews[name] ? (
                <label htmlFor={name} className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <span className="text-4xl mb-2">{icon}</span>
                        <p className="text-sm text-gray-500"><span className="font-semibold">Click to upload</span></p>
                        <p className="text-xs text-gray-400">PNG, JPG, GIF or BMP (Max 5MB)</p>
                    </div>
                    <input id={name} name={name} type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
            ) : (
                <div className="relative h-48 rounded-lg overflow-hidden border-2 border-green-400 group">
                    <img src={previews[name]} alt={label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={() => removeImage(name)} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center gap-2">
                            <FaTimes /> Remove
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-gray-50 w-full min-h-screen overflow-y-auto">
            {/* Header */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} disabled={isSubmitting} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <FaArrowLeft size={20} />
                        </button>
                        <h1 className="text-2xl font-semibold text-gray-900">Add New Sell Entry</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                {/* Owner Details */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b">Owner Details</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Field label="Full Name" name="name" placeholder="Enter full name" required colSpan="lg:col-span-2" />
                        <Field label="Mobile Number" name="mobileNumber" placeholder="10-digit mobile number" maxLength="10" icon="+91" required />
                        <Field label="Alternative Mobile" name="alternativeMobileNumber" placeholder="Alternate number" maxLength="10" icon="+91" />
                        <Field label="Email Address" name="email" type="email" placeholder="your.email@example.com" required colSpan="lg:col-span-2" />
                        <Field label="Full Address" name="address" placeholder="House/Flat No., Street, Locality, Area" rows={3} required colSpan="lg:col-span-2" />
                        <Field label="City" name="city" placeholder="Enter city" required />
                        <Field label="Pincode" name="pincode" placeholder="6-digit pincode" maxLength="6" required />
                    </div>
                </div>

                {/* Bike Details */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b">Bike Details</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Field label="Bike Category" name="bikeCategory" required options={[
                            { value: "", label: "Select Category" },
                            { value: "1", label: "🏁 Sports" },
                            { value: "2", label: "🛣️ Cruiser" },
                            { value: "3", label: "🚦 Commuter" },
                            { value: "4", label: "🏔️ Adventure" },
                            { value: "5", label: "🛴 Scooter" },
                        ]} />
                        <Field label="Bike Brand" name="bikeBrand" required options={[
                            { value: "", label: "Select Brand" },
                            { value: "1", label: "Honda" },
                            { value: "2", label: "Yamaha" },
                            { value: "3", label: "Royal Enfield" },
                            { value: "4", label: "Bajaj" },
                            { value: "5", label: "TVS" },
                            { value: "6", label: "Hero" },
                            { value: "7", label: "KTM" },
                            { value: "8", label: "Suzuki" },
                            { value: "9", label: "Kawasaki" },
                        ]} />
                        <Field label="Bike Model" name="bikeModel" placeholder="e.g., Activa 6G" required />
                        <Field label="Registration Number" name="registrationNumber" placeholder="e.g., DL01AB1234" required />
                        <Field label="Bike Color" name="bikeColor" placeholder="e.g., Black, Red" required />
                        <Field label="Manufacture Year" name="manufactureYear" required options={[
                            { value: "", label: "Select Year" },
                            ...Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i).map((year) => ({ value: year.toString(), label: year.toString() })),
                        ]} />
                        <Field label="Number of Owners" name="numberOfOwners" required options={[
                            { value: "", label: "Select" },
                            { value: "1", label: "1st Owner" },
                            { value: "2", label: "2nd Owner" },
                            { value: "3", label: "3rd Owner" },
                            { value: "4", label: "4+ Owners" },
                        ]} />
                        <Field label="Odometer Reading (km)" name="odometerReading" type="number" placeholder="e.g., 15000" required />
                        <Field label="Selling Price" name="sellingPrice" type="number" placeholder="e.g., 45000" icon="₹" required />
                        <Field label="Bike Condition" name="bikeCondition" required options={[
                            { value: "", label: "Select Condition" },
                            { value: "Excellent", label: "⭐ Excellent" },
                            { value: "Good", label: "✅ Good" },
                            { value: "Fair", label: "⚠️ Fair" },
                            { value: "Needs Work", label: "🔧 Needs Work" },
                        ]} />
                    </div>
                </div>

                {/* Admin Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b">Admin Section (Optional)</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Upload PUC</label>
                            <input type="file" name="pucFile" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Upload RC Document</label>
                            <input type="file" name="documentFile" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
                        </div>
                        <Field label="Customer Closing Amount (₹)" name="customerSellingClosingPrice" type="number" placeholder="Enter amount" />
                        <Field label="Supervisor Name" name="supervisorName" placeholder="Enter supervisor name" />
                        <Field label="Listing Status" name="listingStatus" options={[
                            { value: "PENDING", label: "PENDING" },
                            { value: "CALL_TO_OWNER", label: "CALL TO OWNER" },
                            { value: "LISTED", label: "LISTED" },
                            { value: "INSPECTION", label: "INSPECTION" },
                            { value: "REJECTED", label: "REJECTED" },
                            { value: "SOLD", label: "SOLD" },
                        ]} />
                        <Field label="Repair Required" name="isRepairRequired" options={[{ value: false, label: "No" }, { value: true, label: "Yes" }]} />
                        <Field label="Additional Notes" name="additionalNotes" placeholder="Enter notes..." rows={4} colSpan="lg:col-span-2" />
                        <div className="lg:col-span-2 flex flex-wrap gap-6">
                            <label className="flex items-center"><input type="checkbox" name="isPuc" checked={formData.isPuc} onChange={handleFieldChange} className="mr-2" /> PUC Certificate</label>
                            <label className="flex items-center"><input type="checkbox" name="isInsurance" checked={formData.isInsurance} onChange={handleFieldChange} className="mr-2" /> Valid Insurance</label>
                            <label className="flex items-center"><input type="checkbox" name="isDocument" checked={formData.isDocument} onChange={handleFieldChange} className="mr-2" /> RC Document</label>
                        </div>
                    </div>
                </div>

                {/* Bike Images */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b">Upload Bike Images</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <ImageBox name="frontPhoto" label="Front View" icon="🏍️" />
                        <ImageBox name="backPhoto" label="Back View" icon="🔙" />
                        <ImageBox name="leftPhoto" label="Left View" icon="⬅️" />
                        <ImageBox name="rightPhoto" label="Right View" icon="➡️" />
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-800">
                            <strong>Images Uploaded:</strong> {[formData.frontPhoto, formData.backPhoto, formData.leftPhoto, formData.rightPhoto].filter(Boolean).length}/4 (At least 1 required)
                        </p>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-between gap-4">
                    <button onClick={onClose} disabled={isSubmitting} className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50">
                        Cancel
                    </button>
                    <button onClick={submitForm} disabled={isSubmitting} className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                        {isSubmitting ? "Submitting..." : "Submit Listing"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddNewSellEntry;
