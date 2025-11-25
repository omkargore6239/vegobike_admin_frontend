    const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

    const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
    };

    /**
     * Validate coupon code with backend at /api/offers/apply
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    export const validateCoupon = async (data) => {
    const token = getAuthToken();

    const response = await fetch(`${BASE_URL}/api/offers/apply`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
        couponCode: data.couponCode,
        vehicleId: data.vehicleId,
        customerId: data.customerId,
        originalPrice: data.originalPrice,
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || 'Failed to validate coupon');
        error.status = response.status;
        error.data = errorData;
        throw error;
    }

    return response.json();
    };

    export const getCouponErrorMessage = (error) => {
    if (error.data?.message) return error.data.message;
    switch (error.status) {
        case 400: return 'Invalid coupon request. Please check your input.';
        case 404: return 'Coupon code not found. Please check and try again.';
        case 409: return 'This coupon has already been used or is no longer valid.';
        case 500: return 'Server error. Please try again later.';
        default: return error.message || 'Failed to apply coupon. Please try again.';
    }
    };
