import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Search, 
  AlertTriangle, 
  User, 
  MapPin, 
  Car, 
  ShieldAlert,
  Calendar,
  CreditCard,
  Hash,
  FileText,
  CheckCircle,
  Plus,
  Trash2
} from 'lucide-react';
import { Challan } from '../context/ChallanContext';
import { apiService } from '../services/api';

interface ModifyModalProps {
  challan: Challan;
  isOpen: boolean;
  onClose: () => void;
  onSave: (modifiedChallan: Challan) => void;
}

interface ViolationData {
  sNo: number;
  violationName: string;
  section: string;
  fine: number;
  penaltyPoints: number;
}

const ModifyModal: React.FC<ModifyModalProps> = ({ challan, isOpen, onClose, onSave }) => {
  const [modifiedData, setModifiedData] = useState({
    sectorOfficer: { ...challan.sectorOfficer },
    capturedBy: { ...challan.capturedBy },
    jurisdiction: { ...challan.jurisdiction },
    offenceDateTime: { ...challan.offenceDateTime },
    violations: [...challan.violations],
    plateNumber: challan.plateNumber || '',
    vehicleDetails: challan.vehicleDetails || {
      make: 'Unknown',
      model: 'Unknown', 
      color: 'Unknown',
      vehicleType: 'Unknown',
      confidence: { make: 0, model: 0, color: 0 }
    }
  });

  // Violations and dropdown data
  const [availableViolations, setAvailableViolations] = useState<ViolationData[]>([]);
  const [loadingViolations, setLoadingViolations] = useState(false);
  const [totalFine, setTotalFine] = useState(0);
  const [violationSearch, setViolationSearch] = useState('');
  const [sectionSearch, setSectionSearch] = useState('');
  
  // Dropdown options
  const [allSections, setAllSections] = useState<string[]>([]);
  const [allViolationNames, setAllViolationNames] = useState<string[]>([]);

  // Vehicle types and other constants
  const vehicleTypes = ['Car', 'Motorcycle', 'Auto Rickshaw', 'Bus', 'Truck', 'Lorry'];
  const cadreOptions = ['Inspector', 'Sub Inspector', 'Head Constable', 'Police Constable'];
  const colorOptions = ['White', 'Black', 'Red', 'Blue', 'Silver', 'Gray', 'Green', 'Yellow', 'Brown', 'Unknown'];
  const commonMakes = ['Honda', 'Bajaj', 'TVS', 'Hero', 'Yamaha', 'Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Toyota', 'Unknown'];

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAllViolationsData();
      loadDropdownOptions();
    }
  }, [isOpen, modifiedData.vehicleDetails.vehicleType]);

  const loadAllViolationsData = async () => {
    try {
      setLoadingViolations(true);
      const vehicleType = modifiedData.vehicleDetails.vehicleType || 'Car';
      const data = await apiService.getViolationsByVehicleType(vehicleType);
      
      if (data.success) {
        setAvailableViolations(data.data);
        await calculateFine();
      }
    } catch (error) {
      console.error('Failed to load violations:', error);
    } finally {
      setLoadingViolations(false);
    }
  };

  const loadDropdownOptions = async () => {
    try {
      const data = await apiService.getViolations();
      if (data.success) {
        const violations = data.data;
        
        // Extract unique sections and violation names
        const sections = [...new Set(violations.map((v: any) => v.section))].sort();
        const violationNames = violations.map((v: any) => v.violationName).sort();
        
        setAllSections(sections);
        setAllViolationNames(violationNames);
      }
    } catch (error) {
      console.error('Failed to load dropdown options:', error);
    }
  };

  const calculateFine = async () => {
    try {
      const data = await apiService.calculateFine(
        modifiedData.violations,
        modifiedData.vehicleDetails.vehicleType || 'Car'
      );
      
      if (data.success) {
        setTotalFine(data.data.totalFine);
      }
    } catch (error) {
      console.error('Failed to calculate fine:', error);
    }
  };

  const handleFieldChange = (section: string, field: string, value: any) => {
    if (section === 'direct') {
      setModifiedData(prev => ({
        ...prev,
        [field]: value
      }));
    } else {
      setModifiedData(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof typeof prev],
          [field]: value
        }
      }));
    }

    // Reload violations if vehicle type changes
    if (section === 'vehicleDetails' && field === 'vehicleType') {
      setTimeout(loadAllViolationsData, 100);
    }
  };

  const handleViolationAdd = (violationName: string) => {
    if (!modifiedData.violations.includes(violationName)) {
      setModifiedData(prev => ({
        ...prev,
        violations: [...prev.violations, violationName]
      }));
      setTimeout(calculateFine, 100);
    }
  };

  const handleViolationRemove = (index: number) => {
    setModifiedData(prev => ({
      ...prev,
      violations: prev.violations.filter((_, i) => i !== index)
    }));
    setTimeout(calculateFine, 100);
  };

  const handleSave = () => {
    const updatedChallan = {
      ...challan,
      ...modifiedData
    };
    onSave(updatedChallan);
    onClose();
  };

  // Filter functions for dropdowns
  const filteredViolations = availableViolations.filter(violation => 
    violation.violationName.toLowerCase().includes(violationSearch.toLowerCase()) ||
    violation.section.toLowerCase().includes(violationSearch.toLowerCase())
  );

  const filteredSections = allSections.filter(section =>
    section.toLowerCase().includes(sectionSearch.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-white" />
            <h2 className="text-xl font-bold text-white">Modify Challan Details</h2>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right text-white">
              <p className="text-sm opacity-90">Total Fine Amount</p>
              <p className="text-2xl font-bold">₹{totalFine.toLocaleString()}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Officer & Jurisdiction */}
            <div className="space-y-6">
              
              {/* Officer Details */}
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Officer Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">PS Name</label>
                    <input
                      type="text"
                      value={modifiedData.sectorOfficer.psName}
                      onChange={(e) => handleFieldChange('sectorOfficer', 'psName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter PS Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cadre</label>
                    <select
                      value={modifiedData.sectorOfficer.cadre}
                      onChange={(e) => handleFieldChange('sectorOfficer', 'cadre', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {cadreOptions.map(cadre => (
                        <option key={cadre} value={cadre}>{cadre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Officer Name</label>
                    <input
                      type="text"
                      value={modifiedData.sectorOfficer.name}
                      onChange={(e) => handleFieldChange('sectorOfficer', 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter Officer Name"
                    />
                  </div>
                </div>
              </div>

              {/* Jurisdiction */}
              <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Jurisdiction & Location
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">PS Name</label>
                    <input
                      type="text"
                      value={modifiedData.jurisdiction.psName}
                      onChange={(e) => handleFieldChange('jurisdiction', 'psName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter PS Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Point Name</label>
                    <input
                      type="text"
                      value={modifiedData.jurisdiction.pointName}
                      onChange={(e) => handleFieldChange('jurisdiction', 'pointName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter Point Name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <input
                        type="text"
                        value={modifiedData.offenceDateTime.date}
                        onChange={(e) => handleFieldChange('offenceDateTime', 'date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="DD/MM/YYYY"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                      <input
                        type="text"
                        value={modifiedData.offenceDateTime.time}
                        onChange={(e) => handleFieldChange('offenceDateTime', 'time', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="HH:MM"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Number Plate */}
              <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-200">
                <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
                  <Hash className="h-5 w-5 mr-2" />
                  Number Plate
                </h3>
                <input
                  type="text"
                  value={modifiedData.plateNumber}
                  onChange={(e) => handleFieldChange('direct', 'plateNumber', e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 text-lg font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Enter plate number"
                  style={{ letterSpacing: '2px' }}
                />
                <p className="text-sm text-gray-600 mt-2">Format: TS07EA1234</p>
              </div>
            </div>

            {/* Middle Column - Vehicle Details */}
            <div className="space-y-6">
              
              <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                  <Car className="h-5 w-5 mr-2" />
                  Vehicle Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                    <select
                      value={modifiedData.vehicleDetails.vehicleType as string}
                      onChange={(e) => handleFieldChange('vehicleDetails', 'vehicleType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      {vehicleTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                    <select
                      value={modifiedData.vehicleDetails.make as string}
                      onChange={(e) => handleFieldChange('vehicleDetails', 'make', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      {commonMakes.map(make => (
                        <option key={make} value={make}>{make}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                    <input
                      type="text"
                      value={modifiedData.vehicleDetails.model as string}
                      onChange={(e) => handleFieldChange('vehicleDetails', 'model', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter model"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                    <select
                      value={modifiedData.vehicleDetails.color as string}
                      onChange={(e) => handleFieldChange('vehicleDetails', 'color', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      {colorOptions.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section Codes */}
              <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
                <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Section Codes
                </h3>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search section codes..."
                      value={sectionSearch}
                      onChange={(e) => setSectionSearch(e.target.value)}
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                    {filteredSections.map((section, index) => (
                      <div 
                        key={index}
                        className="px-3 py-2 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-sm"
                        onClick={() => {
                          // You can implement section selection logic here
                          console.log('Selected section:', section);
                        }}
                      >
                        {section}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">
                    Showing {filteredSections.length} of {allSections.length} sections
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Violations */}
            <div className="space-y-6">
              
              <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                  <ShieldAlert className="h-5 w-5 mr-2" />
                  Traffic Violations
                </h3>

                {/* Current Violations */}
                {modifiedData.violations.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Selected Violations ({modifiedData.violations.length})
                      </h4>
                      <button
                        onClick={() => setModifiedData(prev => ({ ...prev, violations: [] }))}
                        className="text-red-600 hover:text-red-800 text-sm flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {modifiedData.violations.map((violation, index) => {
                        const violationData = availableViolations.find(v => v.violationName === violation);
                        return (
                          <div key={index} className="bg-red-100 p-3 rounded-lg border border-red-200 flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-red-900">{violation}</p>
                              {violationData && (
                                <div className="flex items-center space-x-3 text-xs text-red-700 mt-1">
                                  <span className="bg-red-200 px-2 py-1 rounded">{violationData.section}</span>
                                  <span className="font-semibold">₹{violationData.fine}</span>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleViolationRemove(index)}
                              className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-200 rounded-md transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add Violations */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Add Violations</h4>
                  
                  {/* Search Box */}
                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Search violations or section codes..."
                      value={violationSearch}
                      onChange={(e) => setViolationSearch(e.target.value)}
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>

                  {/* Violations List */}
                  {loadingViolations ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Loading violations...</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2 bg-white">
                      {filteredViolations.map((violation, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            modifiedData.violations.includes(violation.violationName)
                              ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
                              : 'bg-white border-gray-200 hover:bg-red-50 hover:border-red-300'
                          }`}
                          onClick={() => {
                            if (!modifiedData.violations.includes(violation.violationName)) {
                              handleViolationAdd(violation.violationName);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{violation.violationName}</p>
                              <div className="flex items-center space-x-3 text-xs text-gray-600 mt-1">
                                <span className="bg-gray-100 px-2 py-1 rounded">{violation.section}</span>
                                <span className="font-semibold text-green-600">₹{violation.fine}</span>
                                <span className="text-orange-600">Points: {violation.penaltyPoints}</span>
                              </div>
                            </div>
                            {modifiedData.violations.includes(violation.violationName) ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Plus className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      ))}
                      {filteredViolations.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                          <p>No violations found for "{violationSearch}"</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-600 mt-2">
                    Showing {filteredViolations.length} violations for {modifiedData.vehicleDetails.vehicleType}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Violations: {modifiedData.violations.length}</span>
            <span>Total Fine: ₹{totalFine.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModifyModal;