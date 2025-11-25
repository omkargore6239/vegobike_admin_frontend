/**
 * Calculate estimated price based on booking data and duration
 * Matches user-side calculation logic exactly
 */
export const calculateEstimatedPrice = (bookingData, duration, packagesData = null) => {
  // If package is explicitly selected, use package price
  if (bookingData.selectedPackage?.price) {
    return parseFloat(bookingData.selectedPackage.price);
  }

  // If packages data is provided, calculate based on best matching package
  if (packagesData && packagesData.length > 0) {
    return calculatePriceFromPackages(duration.hours, packagesData);
  }

  // Fallback: Calculate based on duration with default rates
  return calculateDefaultPrice(duration.hours);
};

/**
 * Smart calculation based on available packages
 * Matches the user-side logic shown in screenshots
 */
export const calculatePriceFromPackages = (totalHours, packages) => {
  // Sort packages by days (hourly first, then ascending)
  const sortedPackages = [...packages].sort((a, b) => {
    if (a.days === 0) return -1;
    if (b.days === 0) return 1;
    return a.days - b.days;
  });

  // Find specific packages
  const hourlyPackage = sortedPackages.find(pkg => pkg.days === 0);
  const dailyPackage = sortedPackages.find(pkg => pkg.days === 1);
  const weeklyPackage = sortedPackages.find(pkg => pkg.days === 7);
  const package15Days = sortedPackages.find(pkg => pkg.days === 15);
  const package30Days = sortedPackages.find(pkg => pkg.days === 30);

  // Extract rates
  const hourlyRate = hourlyPackage ? parseFloat(hourlyPackage.price) : 100;
  const dailyRate = dailyPackage ? parseFloat(dailyPackage.price) : 500;

  // Calculate total days and remaining hours
  const fullDays = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  let totalPrice = 0;

  // CASE 1: Less than 6 hours - Pure hourly charging
  if (totalHours < 6) {
    totalPrice = Math.ceil(totalHours * hourlyRate);
    return totalPrice;
  }

  // CASE 2: 6 to 24 hours - Charge as 1 full day
  if (totalHours >= 6 && totalHours < 24) {
    totalPrice = dailyRate;
    return totalPrice;
  }

  // CASE 3: More than 24 hours - Mixed calculation (days + remaining hours)
  if (totalHours >= 24) {
    // Check if there's an exact package match
    const exactPackage = sortedPackages.find(pkg => pkg.days === fullDays && pkg.days > 0);
    
    if (exactPackage && remainingHours === 0) {
      // Exact package match with no remaining hours
      return parseFloat(exactPackage.price);
    }

    // For 7 days or more, check weekly package
    if (fullDays >= 7 && weeklyPackage) {
      const weeks = Math.floor(fullDays / 7);
      const remainingDays = fullDays % 7;
      
      totalPrice = weeks * parseFloat(weeklyPackage.price);
      totalPrice += remainingDays * dailyRate;
      
      // Add remaining hours
      if (remainingHours > 0) {
        if (remainingHours >= 6) {
          totalPrice += dailyRate; // Charge as additional day
        } else {
          totalPrice += Math.ceil(remainingHours * hourlyRate);
        }
      }
      
      return totalPrice;
    }

    // For 15 days package
    if (fullDays >= 15 && package15Days) {
      const fifteenDayPeriods = Math.floor(fullDays / 15);
      const remainingDays = fullDays % 15;
      
      totalPrice = fifteenDayPeriods * parseFloat(package15Days.price);
      totalPrice += remainingDays * dailyRate;
      
      if (remainingHours > 0) {
        if (remainingHours >= 6) {
          totalPrice += dailyRate;
        } else {
          totalPrice += Math.ceil(remainingHours * hourlyRate);
        }
      }
      
      return totalPrice;
    }

    // For 30 days package
    if (fullDays >= 30 && package30Days) {
      const monthlyPeriods = Math.floor(fullDays / 30);
      const remainingDays = fullDays % 30;
      
      totalPrice = monthlyPeriods * parseFloat(package30Days.price);
      totalPrice += remainingDays * dailyRate;
      
      if (remainingHours > 0) {
        if (remainingHours >= 6) {
          totalPrice += dailyRate;
        } else {
          totalPrice += Math.ceil(remainingHours * hourlyRate);
        }
      }
      
      return totalPrice;
    }

    // Default: Calculate using daily rate + remaining hours
    totalPrice = fullDays * dailyRate;

    // Handle remaining hours
    if (remainingHours > 0) {
      if (remainingHours >= 6) {
        // 6+ hours count as full day
        totalPrice += dailyRate;
      } else {
        // Less than 6 hours - charge hourly
        totalPrice += Math.ceil(remainingHours * hourlyRate);
      }
    }

    return totalPrice;
  }

  // Final fallback
  return calculateDefaultPrice(totalHours);
};

/**
 * Fallback calculation with default rates
 */
export const calculateDefaultPrice = (hours) => {
  const fullDays = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  let totalPrice = 0;

  if (hours < 6) {
    // Pure hourly rate
    return Math.ceil(hours * 100);
  } else if (hours < 24) {
    // Less than 24 hours but more than 6: charge as 1 day
    return 500;
  } else {
    // Multiple days
    totalPrice = fullDays * 500;
    
    if (remainingHours > 0) {
      if (remainingHours >= 6) {
        totalPrice += 500; // Additional day
      } else {
        totalPrice += Math.ceil(remainingHours * 100); // Hourly
      }
    }
    
    return totalPrice;
  }
};

/**
 * Calculate duration from start and end dates
 */
export const calculateDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end - start;
  const hours = diffMs / (1000 * 60 * 60);
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return { 
    hours: Math.round(hours * 100) / 100, // Round to 2 decimals
    days, 
    remainingHours: Math.round(remainingHours * 100) / 100 
  };
};

/**
 * Calculate GST (5% on rental amount only, NOT on deposit)
 */
export const calculateGST = (rentalAmount, gstPercentage = 5) => {
  return Math.round((rentalAmount * gstPercentage) / 100);
};

/**
 * Calculate total amount with GST
 */
export const calculateTotalWithGST = (rentalAmount, gstPercentage = 5) => {
  const gst = calculateGST(rentalAmount, gstPercentage);
  return rentalAmount + gst;
};

/**
 * Calculate final payable amount (Rental + GST + Deposit)
 */
export const calculateTotalPayable = (rentalAmount, depositAmount, gstPercentage = 5) => {
  const rentalWithGST = calculateTotalWithGST(rentalAmount, gstPercentage);
  return rentalWithGST + depositAmount;
};

/**
 * Format date as DD/MM/YYYY HH:MM
 */
export const formatDateDisplay = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Get recommended package based on duration
 */
export const getRecommendedPackage = (hours, packages) => {
  if (!packages || packages.length === 0) return null;

  const sortedPackages = [...packages].sort((a, b) => {
    if (a.days === 0) return -1;
    if (b.days === 0) return 1;
    return a.days - b.days;
  });

  const days = Math.ceil(hours / 24);

  // Less than 6 hours: Recommend hourly
  if (hours < 6) {
    return sortedPackages.find(pkg => pkg.days === 0);
  }

  // 6-24 hours: Recommend daily
  if (hours < 24) {
    return sortedPackages.find(pkg => pkg.days === 1);
  }

  // Find exact match or closest package
  const exactMatch = sortedPackages.find(pkg => pkg.days === days);
  if (exactMatch) return exactMatch;

  // Find closest package (prefer larger package for better value)
  let closest = sortedPackages.find(pkg => pkg.days >= days);
  if (!closest) {
    closest = sortedPackages[sortedPackages.length - 1];
  }

  return closest;
};

/**
 * Format package label for display
 */
export const getPackageLabel = (pkg) => {
  if (!pkg) return "";
  if (pkg.days === 0) return "Hourly";
  if (pkg.days === 1) return "Daily";
  if (pkg.days === 7) return "Weekly";
  if (pkg.days === 15) return "15 Days";
  if (pkg.days === 30) return "Monthly";
  return `${pkg.days} Days`;
};

/**
 * Get detailed pricing breakdown for display
 */
export const getPricingBreakdown = (totalHours, packagesData) => {
  const fullDays = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  const hourlyPackage = packagesData.find(pkg => pkg.days === 0);
  const dailyPackage = packagesData.find(pkg => pkg.days === 1);

  const hourlyRate = hourlyPackage ? parseFloat(hourlyPackage.price) : 100;
  const dailyRate = dailyPackage ? parseFloat(dailyPackage.price) : 500;

  let breakdown = [];

  if (totalHours < 6) {
    breakdown.push({
      description: `${totalHours.toFixed(1)} hours × ₹${hourlyRate}/hour`,
      amount: Math.ceil(totalHours * hourlyRate)
    });
  } else if (totalHours < 24) {
    breakdown.push({
      description: "1 Day (6-24 hours)",
      amount: dailyRate
    });
  } else {
    if (fullDays > 0) {
      breakdown.push({
        description: `${fullDays} day${fullDays > 1 ? 's' : ''} × ₹${dailyRate}/day`,
        amount: fullDays * dailyRate
      });
    }

    if (remainingHours > 0) {
      if (remainingHours >= 6) {
        breakdown.push({
          description: `${remainingHours.toFixed(1)} hours (charged as 1 day)`,
          amount: dailyRate
        });
      } else {
        breakdown.push({
          description: `${remainingHours.toFixed(1)} hours × ₹${hourlyRate}/hour`,
          amount: Math.ceil(remainingHours * hourlyRate)
        });
      }
    }
  }

  return breakdown;
};
