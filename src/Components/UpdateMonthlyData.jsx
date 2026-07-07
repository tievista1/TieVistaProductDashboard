import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { IconX } from '@tabler/icons-react';

const SECTIONS = [
  {
    title: 'Performance Returns',
    fields: [
      { name: 'report_month', label: 'Report Month', type: 'date' },
      { name: 'nav', label: 'NAV', type: 'number' },
      { name: 'aum_cr', label: 'AUM (Cr)', type: 'number' },
      { name: 'corpus_cr', label: 'Corpus (Cr)', type: 'number' },
      { name: 'investor_count', label: 'Investor Count', type: 'number' },
      { name: 'return_1m', label: '1M Return (%)', type: 'number' },
      { name: 'return_3m', label: '3M Return (%)', type: 'number' },
      { name: 'return_6m', label: '6M Return (%)', type: 'number' },
      { name: 'return_1y', label: '1Y Return (%)', type: 'number' },
      { name: 'return_2y', label: '2Y Return (%)', type: 'number' },
      { name: 'return_3y', label: '3Y Return (%)', type: 'number' },
      { name: 'return_5y', label: '5Y Return (%)', type: 'number' },
      { name: 'return_7y', label: '7Y Return (%)', type: 'number' },
      { name: 'return_10y', label: '10Y Return (%)', type: 'number' },
      { name: 'since_inception', label: 'Since Inception (%)', type: 'number' },
      { name: 'ytm', label: 'YTM (%)', type: 'number' },
      { name: 'mod_year', label: 'Modified Duration', type: 'number' },
      { name: 'benchmark_return_sinceinception', label: 'Benchmark SI Return (%)', type: 'number' },
      { name: 'benchmark_return_1m', label: 'Benchmark 1M Return (%)', type: 'number' },
      { name: 'benchmark_return_3m', label: 'Benchmark 3M Return (%)', type: 'number' },
      { name: 'benchmark_return_6m', label: 'Benchmark 6M Return (%)', type: 'number' },
      { name: 'benchmark_return_1y', label: 'Benchmark 1Y Return (%)', type: 'number' },
      { name: 'benchmark_return_2y', label: 'Benchmark 2Y Return (%)', type: 'number' },
      { name: 'benchmark_return_3y', label: 'Benchmark 3Y Return (%)', type: 'number' },
      { name: 'benchmark_return_4y', label: 'Benchmark 4Y Return (%)', type: 'number' },
      { name: 'benchmark_return_5y', label: 'Benchmark 5Y Return (%)', type: 'number' },
      { name: 'excess_return', label: 'Excess Return (%)', type: 'number' },
    ]
  },
  {
    title: 'Risk Metrics',
    fields: [
      { name: 'alpha_1y', label: 'Alpha 1Y', type: 'number' },
      { name: 'alpha_3y', label: 'Alpha 3Y', type: 'number' },
      { name: 'beta', label: 'Beta', type: 'number' },
      { name: 'pe_ratio', label: 'PE Ratio', type: 'number' },
      { name: 'pb_ratio', label: 'PB Ratio', type: 'number' },
      { name: 'sharpe_ratio', label: 'Sharpe Ratio', type: 'number' },
      { name: 'sortino_ratio', label: 'Sortino Ratio', type: 'number' },
      { name: 'information_ratio', label: 'Information Ratio', type: 'number' },
      { name: 'treynor_ratio', label: 'Treynor Ratio', type: 'number' },
      { name: 'std_dev', label: 'Std Deviation', type: 'number' },
      { name: 'downside_deviation', label: 'Downside Deviation', type: 'number' },
      { name: 'tracking_error', label: 'Tracking Error', type: 'number' },
      { name: 'up_capture', label: 'Up Capture', type: 'number' },
      { name: 'down_capture', label: 'Down Capture', type: 'number' },
      { name: 'max_drawdown', label: 'Max Drawdown', type: 'number' },
      { name: 'calmar_ratio', label: 'Calmar Ratio', type: 'number' },
      { name: 'var_95', label: 'VaR 95', type: 'number' },
      { name: 'positive_months', label: 'Positive Months', type: 'number' },
    ]
  },
  {
    title: 'Capital Allocation',
    fields: [
      { name: 'large_cap', label: 'Large Cap (%)', type: 'number' },
      { name: 'mid_cap', label: 'Mid Cap (%)', type: 'number' },
      { name: 'small_cap', label: 'Small Cap (%)', type: 'number' },
      { name: 'micro_cap', label: 'Micro Cap (%)', type: 'number' },
      { name: 'debt_cap', label: 'Debt / Cash (%)', type: 'number' },
      { name: 'other_cap', label: 'Other Cap (%)', type: 'number' },
      { name: 'international_equity', label: 'International Equity (%)', type: 'number' },
      { name: 'derivatives_allocation', label: 'Derivatives (%)', type: 'number' },
      { name: 'other_allocation', label: 'Other Allocation (%)', type: 'number' },
      { name: 'cash_percent', label: 'Cash (%)', type: 'number' },
      { name: 'allocation_total', label: 'Allocation Total (%)', type: 'number' },
    ]
  },
  {
    title: 'Top Holdings',
    fields: [
      { name: 'holdings_count', label: 'Holdings Count', type: 'number' },
      { name: 'holding_1', label: 'Holding 1', type: 'text' },
      { name: 'holding_1_percent', label: 'Holding 1 (%)', type: 'number' },
      { name: 'holding_2', label: 'Holding 2', type: 'text' },
      { name: 'holding_2_percent', label: 'Holding 2 (%)', type: 'number' },
      { name: 'holding_3', label: 'Holding 3', type: 'text' },
      { name: 'holding_3_percent', label: 'Holding 3 (%)', type: 'number' },
      { name: 'holding_4', label: 'Holding 4', type: 'text' },
      { name: 'holding_4_percent', label: 'Holding 4 (%)', type: 'number' },
      { name: 'holding_5', label: 'Holding 5', type: 'text' },
      { name: 'holding_5_percent', label: 'Holding 5 (%)', type: 'number' },
    ]
  },
  {
    title: 'Sector Allocation',
    fields: [
      { name: 'sector_1_name', label: 'Sector 1 Name', type: 'text' },
      { name: 'sector_1_percent', label: 'Sector 1 (%)', type: 'number' },
      { name: 'sector_2_name', label: 'Sector 2 Name', type: 'text' },
      { name: 'sector_2_percent', label: 'Sector 2 (%)', type: 'number' },
      { name: 'sector_3_name', label: 'Sector 3 Name', type: 'text' },
      { name: 'sector_3_percent', label: 'Sector 3 (%)', type: 'number' },
      { name: 'sector_4_name', label: 'Sector 4 Name', type: 'text' },
      { name: 'sector_4_percent', label: 'Sector 4 (%)', type: 'number' },
      { name: 'sector_5_name', label: 'Sector 5 Name', type: 'text' },
      { name: 'sector_5_percent', label: 'Sector 5 (%)', type: 'number' },
      { name: 'sector_6_name', label: 'Sector 6 Name', type: 'text' },
      { name: 'sector_6_percent', label: 'Sector 6 (%)', type: 'number' },
    ]
  },
  {
    title: 'Source & Validation',
    fields: [
      { name: 'source_file_name', label: 'Source File Name', type: 'text' },
      { name: 'source_page_no', label: 'Source Page No', type: 'number' },
      { name: 'extraction_confidence', label: 'Extraction Confidence', type: 'number' },
      { name: 'validated_yn', label: 'Validated (Y/N)', type: 'text' },
      { name: 'validation_notes', label: 'Validation Notes', type: 'text' },
      { name: 'data_source', label: 'Data Source', type: 'text' },
    ]
  }
];

const UpdateMonthlyData = ({ isOpen, onClose, monthlyData, onUpdateSuccess }) => {
  const { register, handleSubmit, reset } = useForm();
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    if (monthlyData && isOpen) {
      const defaults = {};
      SECTIONS.forEach(section => {
        section.fields.forEach(f => {
          let val = monthlyData[f.name];
          if (f.name === 'report_month' && val) {
            // Convert ISO date to YYYY-MM-DD for input[type=date]
            val = new Date(val).toISOString().split('T')[0];
          }
          defaults[f.name] = val ?? '';
        });
      });
      reset(defaults);
    }
  }, [monthlyData, isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      // Coerce empty strings to null for numeric fields
      const payload = { ...data };
      SECTIONS.forEach(section => {
        section.fields.forEach(f => {
          const val = payload[f.name];
          if (f.type === 'number') {
            if (val === '' || val === undefined || val === null) {
              payload[f.name] = null;
            } else {
              const num = Number(val);
              payload[f.name] = isNaN(num) ? null : num;
            }
          } else if (f.type === 'text' && val === '') {
            payload[f.name] = null;
          }
        });
      });

      await axios.put(`https://product.tievista.com/api/update/monthly-data/${monthlyData.product_id}`, payload);
      onUpdateSuccess();
      onClose();
    } catch (err) {
      console.error('Update monthly data failed:', err);
      alert('Failed to update monthly data. ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-t-2xl">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Edit Monthly Data</h2>
            <p className="text-xs text-gray-500 mt-0.5">ID: {monthlyData?.id} • Product: {monthlyData?.product_id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition p-1 rounded-full hover:bg-gray-100">
            <IconX size={20} />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-1 px-6 py-3 border-b border-gray-100 bg-gray-50/50 overflow-x-auto">
          {SECTIONS.map((section, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveSection(idx)}
              className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider rounded-lg whitespace-nowrap transition ${
                activeSection === idx 
                  ? 'bg-[#C9981A] text-white shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="updateMonthlyDataForm" onSubmit={handleSubmit(onSubmit)}>
            {SECTIONS.map((section, sIdx) => (
              <div key={sIdx} className={activeSection === sIdx ? 'block' : 'hidden'}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1 h-5 bg-[#C9981A] rounded-full"></div>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">{section.title}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.fields.map(field => (
                    <div key={field.name} className="flex flex-col">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{field.label}</label>
                      <input
                        type={field.type}
                        step={field.type === 'number' ? 'any' : undefined}
                        {...register(field.name)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-[#C9981A] focus:outline-none focus:ring-1 focus:ring-[#C9981A]/30 transition placeholder:text-gray-300"
                        placeholder={field.label}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between rounded-b-2xl">
          <div className="text-[11px] text-gray-400">
            {activeSection + 1} / {SECTIONS.length} sections
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              Cancel
            </button>
            <button 
              type="submit" 
              form="updateMonthlyDataForm" 
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

export default UpdateMonthlyData;