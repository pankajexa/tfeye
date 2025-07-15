// Utility functions for validation
const validateRegistrationNumber = (regNumber) => {
  // Minimal validation - just ensure it's not empty and has reasonable content
  // Let TSeChallan API validate the actual format since registration formats vary widely
  const cleanRegNumber = regNumber.trim();
  return cleanRegNumber.length >= 3 && cleanRegNumber.length <= 20;
};

module.exports = {
  validateRegistrationNumber
}; 