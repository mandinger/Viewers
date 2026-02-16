import React, { useState } from 'react';
import { ReactElement } from 'react';
import { Button, ButtonEnums } from '@ohif/ui';
import classNames from 'classnames';

export type StudyFormData = {
  patientName: string;
  patientID: string;
  ownerName: string;
  description: string;
  studyDate: string;
  studyTime: string;
  institutionName: string;
  gender: string;
  referringPhysician: string;
  birthDate: string;
  modality: string;
  age?: {
    years: number;
    months: number;
    days: number;
  };
};

type StudyInfoFormProps = {
  onSubmit: (data: StudyFormData) => void;
  onCancel: () => void;
  fileCount?: number;
};

export const StudyInfoForm = ({ onSubmit, onCancel, fileCount = 1 }: StudyInfoFormProps): ReactElement => {
  const [formData, setFormData] = useState<StudyFormData>({
    patientName: '',
    patientID: '',
    ownerName: '',
    description: '',
    studyDate: new Date().toISOString().split('T')[0],
    studyTime: new Date().toTimeString().slice(0, 5),
    institutionName: '',
    gender: '',
    referringPhysician: '',
    birthDate: '',
    modality: 'OT',
    age: { years: 0, months: 0, days: 0 },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientName.trim()) {
      newErrors.patientName = 'Patient Name is required';
    }
    if (!formData.patientID.trim()) {
      newErrors.patientID = 'Patient ID is required';
    }
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Owner Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Form data being submitted:', formData);
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof StudyFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleAgeChange = (ageField: 'years' | 'months' | 'days', value: string) => {
    setFormData(prev => ({
      ...prev,
      age: {
        ...prev.age,
        [ageField]: parseInt(value) || 0,
      },
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-6">New Study ({fileCount} file{fileCount > 1 ? 's' : ''})</h2>
        
        <p className="text-blue-400 text-sm mb-6">
          ℹ️ You can still add more non-DICOM images to this study at this time.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Name and Patient ID */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-200 mb-2">
                Patient Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                className={classNames(
                  'w-full px-3 py-2 bg-gray-700 text-white rounded border',
                  errors.patientName ? 'border-red-500' : 'border-gray-600'
                )}
              />
              {errors.patientName && (
                <p className="text-red-500 text-sm mt-1">{errors.patientName}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-200 mb-2">
                Patient ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.patientID}
                onChange={(e) => handleInputChange('patientID', e.target.value)}
                className={classNames(
                  'w-full px-3 py-2 bg-gray-700 text-white rounded border',
                  errors.patientID ? 'border-red-500' : 'border-gray-600'
                )}
              />
              {errors.patientID && (
                <p className="text-red-500 text-sm mt-1">{errors.patientID}</p>
              )}
            </div>
          </div>

          {/* Owner Name and Description */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-200 mb-2">
                Owner Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => handleInputChange('ownerName', e.target.value)}
                className={classNames(
                  'w-full px-3 py-2 bg-gray-700 text-white rounded border',
                  errors.ownerName ? 'border-red-500' : 'border-gray-600'
                )}
              />
              {errors.ownerName && (
                <p className="text-red-500 text-sm mt-1">{errors.ownerName}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-200 mb-2">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
              />
            </div>
          </div>

          {/* Study Date/Time and Institution Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-200 mb-2">
                Study Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.studyDate}
                onChange={(e) => handleInputChange('studyDate', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
              />
              <input
                type="time"
                value={formData.studyTime}
                onChange={(e) => handleInputChange('studyTime', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 mt-3"
              />
            </div>
            <div>
              <label className="block text-gray-200 mb-2">Institution Name</label>
              <input
                type="text"
                value={formData.institutionName}
                onChange={(e) => handleInputChange('institutionName', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
              />
            </div>
          </div>

          {/* Gender and Referring Physician */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-200 mb-2">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
              >
                <option value="">Select Gender</option>
                <option value="M">Male</option>
                <option value="MC">Male Castrated</option>
                <option value="F">Female</option>
                <option value="FS">Female Spayed</option>
                <option value="O">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-200 mb-2">Referring Physician</label>
              <input
                type="text"
                value={formData.referringPhysician}
                onChange={(e) => handleInputChange('referringPhysician', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
              />
            </div>
          </div>

          {/* Birth Date */}
          <div>
            <label className="block text-gray-200 mb-2">Birth Date</label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => handleInputChange('birthDate', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-gray-200 mb-2">Age</label>
            <div className="grid grid-cols-3 gap-4">
              {(['years', 'months', 'days'] as const).map(field => (
                <div key={field}>
                  <input
                    type="number"
                    min="0"
                    value={formData.age?.[field] || 0}
                    onChange={(e) => handleAgeChange(field, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-center"
                  />
                  <p className="text-gray-400 text-xs text-center mt-1 capitalize">{field}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-6 border-t border-gray-700">
            <Button
              type={ButtonEnums.type.secondary}
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type={ButtonEnums.type.primary}
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }}
            >
              Start Upload
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudyInfoForm;
