import { Challan } from '../types';

export const sampleChallans: Challan[] = [
  {
    id: 'CH001',
    image: 'https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg?auto=compress&cs=tinysrgb&w=800',
    timestamp: '2025-01-15 14:30',
    plateNumber: 'TS09AB1234',
    status: 'processing',
    sectorOfficer: {
      psName: 'Jubilee Hills PS',
      cadre: 'Inspector',
      name: 'Kumar Reddy'
    },
    capturedBy: {
      psName: 'Jubilee Hills PS',
      cadre: 'Head Constable',
      name: 'Lakshmi Devi'
    },
    jurisdiction: {
      psName: 'Jubilee Hills PS',
      pointName: 'Road No. 45'
    },
    offenceDateTime: {
      date: '24-06-2025',
      time: '15:20'
    },
    vehicleMatches: [
      { field: 'Make', rtaData: 'Maruti', aiDetected: 'Maruti', match: true },
      { field: 'Model', rtaData: 'Swift', aiDetected: 'Alto', match: false },
      { field: 'Color', rtaData: 'White', aiDetected: 'Silver', match: false }
    ],
    violations: ['Signal Jump', 'Speed Violation'],
    driverGender: 'Female',
    fakePlate: false,
    ownerAddress: '456 Park Avenue, Hyderabad, Telangana',
    rtaMatched: false
  },
  {
    id: 'CH002',
    image: 'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=800',
    timestamp: '2025-01-15 16:45',
    plateNumber: 'TS07CD5678',
    status: 'pending-review',
    sectorOfficer: {
      psName: 'Banjara Hills PS',
      cadre: 'Sub Inspector',
      name: 'Rajesh Kumar'
    },
    capturedBy: {
      psName: 'Banjara Hills PS',
      cadre: 'Constable',
      name: 'Priya Sharma'
    },
    jurisdiction: {
      psName: 'Banjara Hills PS',
      pointName: 'Road No. 12'
    },
    offenceDateTime: {
      date: '24-06-2025',
      time: '16:45'
    },
    vehicleMatches: [
      { field: 'Make', rtaData: 'Honda', aiDetected: 'Honda', match: true },
      { field: 'Model', rtaData: 'City', aiDetected: 'City', match: true },
      { field: 'Color', rtaData: 'Blue', aiDetected: 'Blue', match: true }
    ],
    violations: ['No Helmet'],
    driverGender: 'Male',
    fakePlate: false,
    ownerAddress: '123 Banjara Hills, Hyderabad, Telangana',
    rtaMatched: true
  },
  {
    id: 'CH007',
    image: 'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=800',
    timestamp: '2025-01-15 18:20',
    plateNumber: 'TS11MN4567',
    status: 'pending-review',
    sectorOfficer: {
      psName: 'Cyberabad PS',
      cadre: 'Inspector',
      name: 'Srinivas Rao'
    },
    capturedBy: {
      psName: 'Cyberabad PS',
      cadre: 'Head Constable',
      name: 'Anitha Reddy'
    },
    jurisdiction: {
      psName: 'Cyberabad PS',
      pointName: 'Cyber Towers Junction'
    },
    offenceDateTime: {
      date: '24-06-2025',
      time: '18:20'
    },
    vehicleMatches: [
      { field: 'Make', rtaData: 'Bajaj', aiDetected: 'Bajaj', match: true },
      { field: 'Model', rtaData: 'Pulsar', aiDetected: 'Pulsar', match: true },
      { field: 'Color', rtaData: 'Black', aiDetected: 'Black', match: true }
    ],
    violations: ['No Helmet', 'Mobile Phone Usage'],
    driverGender: 'Male',
    fakePlate: false,
    ownerAddress: '789 Cyberabad, Hyderabad, Telangana',
    rtaMatched: true
  },
  {
    id: 'CH003',
    image: 'https://images.pexels.com/photos/3156482/pexels-photo-3156482.jpeg?auto=compress&cs=tinysrgb&w=800',
    timestamp: '2025-01-15 11:20',
    status: 'rejected',
    rejectionReason: 'Number plate not visible',
    sectorOfficer: {
      psName: 'Madhapur PS',
      cadre: 'Inspector',
      name: 'Venkata Rao'
    },
    capturedBy: {
      psName: 'Madhapur PS',
      cadre: 'Head Constable',
      name: 'Sita Reddy'
    },
    jurisdiction: {
      psName: 'Madhapur PS',
      pointName: 'HITEC City Junction'
    },
    offenceDateTime: {
      date: '24-06-2025',
      time: '11:20'
    },
    vehicleMatches: [],
    violations: [],
    driverGender: 'Unknown',
    fakePlate: false,
    ownerAddress: '',
    rtaMatched: false
  },
  {
    id: 'CH004',
    image: 'https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg?auto=compress&cs=tinysrgb&w=800',
    timestamp: '2025-01-15 13:15',
    plateNumber: 'TS05EF9012',
    status: 'approved',
    sectorOfficer: {
      psName: 'Secunderabad PS',
      cadre: 'Sub Inspector',
      name: 'Arjun Singh'
    },
    capturedBy: {
      psName: 'Secunderabad PS',
      cadre: 'Constable',
      name: 'Ravi Kumar'
    },
    jurisdiction: {
      psName: 'Secunderabad PS',
      pointName: 'Paradise Circle'
    },
    offenceDateTime: {
      date: '24-06-2025',
      time: '13:15'
    },
    vehicleMatches: [
      { field: 'Make', rtaData: 'Bajaj', aiDetected: 'Bajaj', match: true },
      { field: 'Model', rtaData: 'Pulsar', aiDetected: 'Pulsar', match: true },
      { field: 'Color', rtaData: 'Black', aiDetected: 'Black', match: true }
    ],
    violations: ['Triple Riding'],
    driverGender: 'Male',
    fakePlate: false,
    ownerAddress: '789 Secunderabad, Hyderabad, Telangana',
    rtaMatched: true
  },
  {
    id: 'CH005',
    image: 'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=800',
    timestamp: '2025-01-15 09:30',
    plateNumber: 'TS12GH3456',
    status: 'rejected',
    rejectionReason: 'Blurred Image',
    sectorOfficer: {
      psName: 'Gachibowli PS',
      cadre: 'Inspector',
      name: 'Suresh Babu'
    },
    capturedBy: {
      psName: 'Gachibowli PS',
      cadre: 'Constable',
      name: 'Ramesh Kumar'
    },
    jurisdiction: {
      psName: 'Gachibowli PS',
      pointName: 'Financial District'
    },
    offenceDateTime: {
      date: '24-06-2025',
      time: '09:30'
    },
    vehicleMatches: [
      { field: 'Make', rtaData: 'TVS', aiDetected: 'TVS', match: true },
      { field: 'Model', rtaData: 'Jupiter', aiDetected: 'Jupiter', match: true },
      { field: 'Color', rtaData: 'Red', aiDetected: 'Red', match: true }
    ],
    violations: ['No Helmet', 'Mobile Phone Usage'],
    driverGender: 'Male',
    fakePlate: false,
    ownerAddress: '321 Gachibowli, Hyderabad, Telangana',
    rtaMatched: true
  },
  {
    id: 'CH006',
    image: 'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=800',
    timestamp: '2025-01-15 17:45',
    plateNumber: 'TS08JK7890',
    status: 'rejected',
    rejectionReason: 'Wrong Violation',
    sectorOfficer: {
      psName: 'Kukatpally PS',
      cadre: 'Sub Inspector',
      name: 'Madhavi Reddy'
    },
    capturedBy: {
      psName: 'Kukatpally PS',
      cadre: 'Head Constable',
      name: 'Vijay Kumar'
    },
    jurisdiction: {
      psName: 'Kukatpally PS',
      pointName: 'KPHB Junction'
    },
    offenceDateTime: {
      date: '24-06-2025',
      time: '17:45'
    },
    vehicleMatches: [
      { field: 'Make', rtaData: 'Hero', aiDetected: 'Hero', match: true },
      { field: 'Model', rtaData: 'Splendor', aiDetected: 'Splendor', match: true },
      { field: 'Color', rtaData: 'Blue', aiDetected: 'Blue', match: true }
    ],
    violations: ['Signal Jump'],
    driverGender: 'Female',
    fakePlate: false,
    ownerAddress: '654 Kukatpally, Hyderabad, Telangana',
    rtaMatched: true
  }
];