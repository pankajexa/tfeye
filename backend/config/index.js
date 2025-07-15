require('dotenv').config();

// TSeChallan API Configuration
const TSECHALLAN_CONFIG = {
  baseUrl: 'https://echallan.tspolice.gov.in/TSeChallanRST',
  vendorCode: process.env.TSECHALLAN_VENDOR_CODE,
  vendorKey: process.env.TSECHALLAN_VENDOR_KEY,
  timeout: 15000
};

// Sample RTA data (you can replace this with actual CSV loading)
const SAMPLE_RTA_DATA = [
  {
    "Registration Number": "TS21J5859",
    "Make": "HERO",
    "Model": "SPLENDOR PLUS",
    "Colour": "BLACK",
    "Owner": "RAJESH KUMAR"
  },
  {
    "Registration Number": "TS07EA1234",
    "Make": "MARUTI SUZUKI",
    "Model": "ALTO",
    "Colour": "WHITE",
    "Owner": "PRIYA SHARMA"
  },
  {
    "Registration Number": "TS08FA5678",
    "Make": "HYUNDAI",
    "Model": "I10",
    "Colour": "RED",
    "Owner": "AMIT SINGH"
  }
];

// Multer configuration for file uploads
const MULTER_CONFIG = {
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
};

module.exports = {
  TSECHALLAN_CONFIG,
  SAMPLE_RTA_DATA,
  MULTER_CONFIG
}; 