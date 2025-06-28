import React, { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { Challan } from '../types';

interface ModifyModalProps {
  challan: Challan;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedChallan: Challan) => void;
}

interface ViolationOption {
  code: string;
  name: string;
}

const ModifyModal: React.FC<ModifyModalProps> = ({ challan, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    sectorOfficer: { ...challan.sectorOfficer },
    capturedBy: { ...challan.capturedBy },
    jurisdiction: { ...challan.jurisdiction },
    offenceDateTime: { ...challan.offenceDateTime },
    violations: [...challan.violations],
    driverGender: challan.driverGender,
    fakePlate: challan.fakePlate,
    ownerAddress: challan.ownerAddress
  });

  const [selectedViolationCode, setSelectedViolationCode] = useState('');

  const violationOptions: ViolationOption[] = [
    { code: 'V001', name: 'Signal Jump' },
    { code: 'V002', name: 'Speed Violation' },
    { code: 'V003', name: 'No Helmet' },
    { code: 'V004', name: 'Triple Riding' },
    { code: 'V005', name: 'Wrong Side Driving' },
    { code: 'V006', name: 'Mobile Phone Usage' },
    { code: 'V007', name: 'Seat Belt Violation' },
    { code: 'V008', name: 'Drunk Driving' },
    { code: 'V009', name: 'No Parking' },
    { code: 'V010', name: 'Lane Violation' },
    { code: 'V011', name: 'Document Missing' },
    { code: 'V012', name: 'Overloading' },
    { code: 'V013', name: 'Rash Driving' },
    { code: 'V014', name: 'No Registration' },
    { code: 'V015', name: 'Pollution Violation' },
    { code: 'V016', name: 'Underage Driving' },
    { code: 'V017', name: 'No Insurance' },
    { code: 'V018', name: 'Tinted Glass' },
    { code: 'V019', name: 'Horn Violation' },
    { code: 'V020', name: 'Footpath Driving' }
  ];

  const handleInputChange = (section: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleDirectChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addViolation = () => {
    if (selectedViolationCode) {
      const selectedOption = violationOptions.find(v => v.code === selectedViolationCode);
      if (selectedOption && !formData.violations.includes(selectedOption.name)) {
        setFormData(prev => ({
          ...prev,
          violations: [...prev.violations, selectedOption.name]
        }));
      }
      setSelectedViolationCode('');
    }
  };

  const removeViolation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      violations: prev.violations.filter((_, i) => i !== index)
    }));
  };

  const getViolationCode = (violationName: string): string => {
    const violation = violationOptions.find(v => v.name === violationName);
    return violation ? violation.code : 'N/A';
  };

  const handleSave = () => {
    const updatedChallan: Challan = {
      ...challan,
      ...formData
    };
    onSave(updatedChallan);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Modify Challan {challan.id}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Vehicle Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Vehicle Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plate Number
                </label>
                <input
                  type="text"
                  value={challan.plateNumber || 'Not Available'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Plate number cannot be modified</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Driver Gender
                </label>
                <select
                  value={formData.driverGender}
                  onChange={(e) => handleDirectChange('driverGender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Address
              </label>
              <textarea
                value={formData.ownerAddress}
                onChange={(e) => handleDirectChange('ownerAddress', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="fakePlate"
                checked={formData.fakePlate}
                onChange={(e) => handleDirectChange('fakePlate', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="fakePlate" className="ml-2 block text-sm text-gray-900">
                Fake/No Plate
              </label>
            </div>
          </div>

          {/* Officer Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Sector Officer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PS Name
                </label>
                <input
                  type="text"
                  value={formData.sectorOfficer.psName}
                  onChange={(e) => handleInputChange('sectorOfficer', 'psName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cadre
                </label>
                <select
                  value={formData.sectorOfficer.cadre}
                  onChange={(e) => handleInputChange('sectorOfficer', 'cadre', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Inspector">Inspector</option>
                  <option value="Sub Inspector">Sub Inspector</option>
                  <option value="Head Constable">Head Constable</option>
                  <option value="Constable">Constable</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.sectorOfficer.name}
                  onChange={(e) => handleInputChange('sectorOfficer', 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Captured By Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Image Captured By</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cadre
                </label>
                <select
                  value={formData.capturedBy.cadre}
                  onChange={(e) => handleInputChange('capturedBy', 'cadre', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Inspector">Inspector</option>
                  <option value="Sub Inspector">Sub Inspector</option>
                  <option value="Head Constable">Head Constable</option>
                  <option value="Constable">Constable</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.capturedBy.name}
                  onChange={(e) => handleInputChange('capturedBy', 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Jurisdiction */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">PS Jurisdiction</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PS Name
                </label>
                <input
                  type="text"
                  value={formData.jurisdiction.psName}
                  onChange={(e) => handleInputChange('jurisdiction', 'psName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Point Name
                </label>
                <input
                  type="text"
                  value={formData.jurisdiction.pointName}
                  onChange={(e) => handleInputChange('jurisdiction', 'pointName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Offence Date & Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Offence Date & Time</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="text"
                  value={formData.offenceDateTime.date}
                  onChange={(e) => handleInputChange('offenceDateTime', 'date', e.target.value)}
                  placeholder="DD-MM-YYYY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="text"
                  value={formData.offenceDateTime.time}
                  onChange={(e) => handleInputChange('offenceDateTime', 'time', e.target.value)}
                  placeholder="HH:MM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Violations */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Violations</h3>
            
            {/* Current Violations */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Current Violations
              </label>
              <div className="space-y-2">
                {formData.violations.map((violation, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {getViolationCode(violation)}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{violation}</span>
                    </div>
                    <button
                      onClick={() => removeViolation(index)}
                      className="p-1 hover:bg-red-100 rounded-md transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                ))}
                {formData.violations.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No violations added</p>
                )}
              </div>
            </div>

            {/* Add New Violation */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Add Violation
              </label>
              <div className="flex space-x-3">
                <div className="flex-1">
                  <select
                    value={selectedViolationCode}
                    onChange={(e) => setSelectedViolationCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a violation...</option>
                    {violationOptions
                      .filter(option => !formData.violations.includes(option.name))
                      .map((violation) => (
                        <option key={violation.code} value={violation.code}>
                          {violation.code} - {violation.name}
                        </option>
                      ))}
                  </select>
                </div>
                <button
                  onClick={addViolation}
                  disabled={!selectedViolationCode}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Select violations from the dropdown. Each violation has a unique code for tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModifyModal;