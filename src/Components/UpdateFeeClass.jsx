import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { IconX, IconPlus, IconMinus } from '@tabler/icons-react';

// Helper to build field definitions for a single class slot
const classFields = (suffix) => {
  const s = suffix ? suffix : '';
  const label = suffix ? ` ${suffix}` : '';
  return [
    { name: `class_name${s}`, label: `Class Name${label}`, type: 'text' },
    { name: `fee_type${s}`, label: `Fee Type${label}`, type: 'select', options: ['Standard', 'Hybrid', 'Performance Only'] },
    { name: `currency${s}`, label: `Currency${label}`, type: 'select', options: ['INR', 'USD', 'EUR', 'GBP', 'AED'] },
    { name: `min_investment${s}`, label: `Min Investment${label}`, type: 'number' },
    { name: `max_investment${s}`, label: `Max Investment${label}`, type: 'number' },
    { name: `min_label${s}`, label: `Min Label${label}`, type: 'text' },
    { name: `max_label${s}`, label: `Max Label${label}`, type: 'text' },
    { name: `management_fee_percent${s}`, label: `Mgmt Fee %${label}`, type: 'number' },
    { name: `performance_fee_percent${s}`, label: `Perf Fee %${label}`, type: 'number' },
    { name: `hurdle_percent${s}`, label: `Hurdle %${label}`, type: 'number' },
    { name: `hurdle_type${s}`, label: `Hurdle Type${label}`, type: 'select', options: ['Fixed', 'Floating', 'Absolute'] },
    { name: `high_water_mark${s}`, label: `High Water Mark${label}`, type: 'select', options: ['Yes', 'No'] },
    { name: `catch_up${s}`, label: `Catch Up${label}`, type: 'select', options: ['Yes', 'No'] },
    { name: `crystallization_frequency${s}`, label: `Crystallization Freq${label}`, type: 'select', options: ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'] },
    { name: `lockin_period${s}`, label: `Lock-in Period${label}`, type: 'text' },
    { name: `redemption_frequency${s}`, label: `Redemption Freq${label}`, type: 'select', options: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semi-Annual', 'Annual'] },
    { name: `notes${s}`, label: `Notes${label}`, type: 'text' },
  ];
};

// Suffixes for classes 1-10 (class 1 has no suffix, 2-10 have numeric suffix)
const CLASS_SUFFIXES = ['', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const UpdateFeeClass = ({ isOpen, onClose, feeClassData, onUpdateSuccess }) => {
  const { register, handleSubmit, reset, watch } = useForm();
  const [saving, setSaving] = useState(false);
  const [visibleClasses, setVisibleClasses] = useState(1);

  useEffect(() => {
    if (feeClassData && isOpen) {
      const defaults = {};
      let maxVisible = 1;

      CLASS_SUFFIXES.forEach((suffix, idx) => {
        const fields = classFields(suffix);
        fields.forEach(f => {
          defaults[f.name] = feeClassData[f.name] ?? '';
        });
        // Count how many classes have data
        if (idx > 0 && feeClassData[`class_name${suffix}`]) {
          maxVisible = idx + 1;
        }
      });

      // Always show active_yn
      defaults.active_yn = feeClassData.active_yn || 'Y';

      setVisibleClasses(Math.max(maxVisible, 1));
      reset(defaults);
    }
  }, [feeClassData, isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      const payload = { ...data };

      // Coerce empty strings to null
      CLASS_SUFFIXES.forEach(suffix => {
        const fields = classFields(suffix);
        fields.forEach(f => {
          const val = payload[f.name];
          if (f.type === 'number') {
            if (val === '' || val === undefined || val === null) {
              payload[f.name] = null;
            } else {
              const num = Number(val);
              payload[f.name] = isNaN(num) ? null : num;
            }
          } else if ((f.type === 'text' || f.type === 'select') && val === '') {
            payload[f.name] = null;
          }
        });
      });

      await axios.put(`https://product.tievista.com/api/update/fee-classes/${feeClassData.product_id}`, payload);
      onUpdateSuccess();
      onClose();
    } catch (err) {
      console.error('Update fee classes failed:', err);
      alert('Failed to update fee classes. ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const addClassSlot = () => {
    if (visibleClasses < 10) setVisibleClasses(visibleClasses + 1);
  };
  const removeClassSlot = () => {
    if (visibleClasses > 1) setVisibleClasses(visibleClasses - 1);
  };

  const renderField = (field) => {
    if (field.type === 'select') {
      return (
        <select
          {...register(field.name)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-[#C9981A] focus:outline-none focus:ring-1 focus:ring-[#C9981A]/30 transition appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%234B5563%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_8px_center]"
        >
          <option value="">—</option>
          {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }
    return (
      <input
        type={field.type}
        step={field.type === 'number' ? 'any' : undefined}
        {...register(field.name)}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-[#C9981A] focus:outline-none focus:ring-1 focus:ring-[#C9981A]/30 transition placeholder:text-gray-300"
        placeholder={field.label}
      />
    );
  };

  // Colors for class tabs
  const classColors = [
    'bg-[#C9981A]', 'bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500',
    'bg-orange-500', 'bg-teal-500', 'bg-indigo-500', 'bg-pink-500', 'bg-cyan-500'
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-t-2xl">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Edit Fee Classes</h2>
            <p className="text-xs text-gray-500 mt-0.5">ID: {feeClassData?.id} • Product: {feeClassData?.product_id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition p-1 rounded-full hover:bg-gray-100">
            <IconX size={20} />
          </button>
        </div>

        {/* Class Slot Controls */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-gray-50/50">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Fee Classes ({visibleClasses}/10)</span>
          <button type="button" onClick={addClassSlot} disabled={visibleClasses >= 10}
            className="p-1 rounded-md bg-[#C9981A] text-white hover:bg-[#b38617] transition disabled:opacity-40 disabled:cursor-not-allowed">
            <IconPlus size={14} />
          </button>
          <button type="button" onClick={removeClassSlot} disabled={visibleClasses <= 1}
            className="p-1 rounded-md bg-gray-300 text-gray-600 hover:bg-gray-400 transition disabled:opacity-40 disabled:cursor-not-allowed">
            <IconMinus size={14} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="updateFeeClassForm" onSubmit={handleSubmit(onSubmit)}>
            {CLASS_SUFFIXES.slice(0, visibleClasses).map((suffix, classIdx) => {
              const fields = classFields(suffix);
              const watchedName = watch(`class_name${suffix}`);
              const displayName = watchedName || `Class ${classIdx + 1}`;

              return (
                <div key={classIdx} className="mb-6 last:mb-0">
                  {/* Class Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-1.5 h-6 rounded-full ${classColors[classIdx]}`}></div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">{displayName}</h3>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-4 border-l-2 border-gray-100">
                    {fields.map(field => (
                      <div key={field.name} className="flex flex-col">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          {field.label.replace(/ \d+$/, '')}
                        </label>
                        {renderField(field)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Active/Inactive */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex flex-col w-48">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Active (Y/N)</label>
                <select
                  {...register('active_yn')}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-[#C9981A] focus:outline-none focus:ring-1 focus:ring-[#C9981A]/30 transition"
                >
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between rounded-b-2xl">
          <div className="text-[11px] text-gray-400">
            Showing {visibleClasses} class{visibleClasses > 1 ? 'es' : ''}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              Cancel
            </button>
            <button 
              type="submit" 
              form="updateFeeClassForm" 
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-[#C9981A] hover:bg-[#b38617] rounded-lg transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateFeeClass;