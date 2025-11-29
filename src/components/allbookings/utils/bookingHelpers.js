export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // DD/MM/YYYY format
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch {
    return '';
  }
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

export const getStatusColor = (status) => {
  const statusMap = {
    'Pending': 'from-yellow-500 to-amber-500',
    'Confirmed': 'from-blue-500 to-cyan-500',
    'Accepted': 'from-green-500 to-emerald-500',
    'Trip Started': 'from-purple-500 to-indigo-500',
    'On Going': 'from-teal-500 to-cyan-500',
    'End Trip': 'from-orange-500 to-red-500',
    'Completed': 'from-emerald-500 to-green-600',
    'Cancelled': 'from-red-500 to-rose-600',
    'Rejected': 'from-gray-500 to-slate-500',
  };
  return statusMap[status] || 'from-gray-500 to-slate-500';
};

export const getPaymentMethodIcon = (type) => {
  return type === 2 ? '💳 Online' : '💵 Cash';
};

export const getCustomerDisplay = (booking) => {
  return booking.customerName || 
         booking.userName || 
         `Customer #${booking.customerId || 'Unknown'}`;
};

export const getCustomerPhone = (booking) => {
  return booking.customerNumber || 
         booking.phoneNumber || 
         booking.customerPhone || 
         'N/A';
};

export const getVehicleNumber = (booking) => {
  return booking.bikeDetails?.registrationNumber || 
         booking.vehicleNumber || 
         booking.registrationNumber || 
         'N/A';
};

export const getVehicleDetails = (booking) => {
  if (booking.bikeDetails?.brand && booking.bikeDetails?.model) {
    return `${booking.bikeDetails.brand} ${booking.bikeDetails.model}`;
  }
  return `Vehicle ID: ${booking.vehicleId || 'N/A'}`;
};

export const toDateTimeLocal = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
};

export const getImageUrl = (imagePath, BASE_URL) => {
  if (!imagePath) return null;
  
  // ✅ If already full URL (http/https), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:image')) {
    return imagePath;
  }
  
  // ✅ Otherwise, build URL with BASE_URL
  const cleanPath = imagePath.replace(/^\/+/, '');
  return `${BASE_URL}/${cleanPath}`;
};

