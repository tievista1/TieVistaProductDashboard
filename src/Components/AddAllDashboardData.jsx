import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { IconX, IconPlus, IconMinus } from '@tabler/icons-react';

const typeOptions = ["PMS", "SIF","MF", "AIF CAT I", "AIF CAT II", "AIF CAT III", "GIFTCITY PMS - INBOUND", "GIFTCITY PMS - OUTBOUND", "GIFTCITY AIF CAT I - INBOUND", "GIFTCITY AIF CAT II - INBOUND", "GIFTCITY AIF CAT III - INBOUND", "GIFTCITY AIF CAT I - OUTBOUND", "GIFTCITY AIF CAT II - OUTBOUND", "GIFTCITY AIF CAT III - OUTBOUND", "GIFTCITY MF INBOUND", "GIFTCITY MF OUTBOUND", "INTERNATIONAL ETF", "INTERNATIONAL FUNDS"];

const structureOptions = [
  "PMS – SEBI registered", "AIF Cat I – SEBI registered", "AIF Cat II – SEBI registered",
  "AIF Cat III – SEBI registered", "GIFT City – AIF (IFSCA regulated)",
  "GIFT City – MF (IFSCA regulated)", "GIFT City – PMS (IFSCA regulated)",
  "Open-ended MF – SEBI (AMFI)", "Close-ended MF – SEBI (AMFI)", "FoF (India) → Luxembourg",
  "FoF (India) → USA", "FoF (India) → Singapore", "FoF (India) → Mauritius",
  "FoF (India) → Cayman Islands", "FoF (India) → Ireland", "Offshore Fund – Cayman Islands",
  "Offshore Fund – Singapore", "Offshore Fund – Mauritius"
];

const strategyOptions = [
  "Large Cap Equity", "Flexi Cap", "Multi Cap", "Mid & Small Cap", "Multi Asset",
  "Credit Strategy", "Absolute Return", "Long-Short Equity"
];

const approachOptions = ["Growth", "Value", "GARP", "Blend", "Top-Down", "Bottom-Up", "Quant", "Multi-Factor"];
const capBiasOptions = ["Large Cap", "Mid Cap", "Small Cap", "Multi Cap", "N/A (Debt/Credit)"];
const currencyOptions = ["INR", "USD", "EUR", "GBP", "AED"];

// benchmarkOptions and amcOptions removed, fetched dynamically

const liquidityOptions = ["Open Ended", "Close End", "At Maturity"];
const revenueModelOptions = ["Trail Only", "Upfront + Trail", "Trail + Perf Share", "Upfront + Trail + Perf", "Fee Based"];

const ELIGIBILITY_OPTIONS = [
  { key: 'indian_resident', label: 'Indian Resident' },
  { key: 'us_nri', label: 'US NRI' },
  { key: 'canadian_nri', label: 'Canadian NRI' },
  { key: 'uk_nri', label: 'UK NRI' },
  { key: 'singapore_nri', label: 'Singapore NRI' },
  { key: 'uae_nri', label: 'UAE NRI' },
  { key: 'foreign_investor', label: 'Foreign Investor' },
  { key: 'institution', label: 'Institution' },
  { key: 'hni', label: 'HNI' },
  { key: 'uhni_family_office', label: 'UHNI' },
];

const MONTHLY_SECTIONS = [
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
  }
];

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

const CLASS_SUFFIXES = ['', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const AddAllDashboardData = ({ isOpen, onClose, onSuccess }) => {
  const { register, handleSubmit, reset, watch } = useForm();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('product'); // 'product', 'monthly', 'fee'
  const [activeMonthlySection, setActiveMonthlySection] = useState(0);
  const [visibleClasses, setVisibleClasses] = useState(1);
  const [amcOptions, setAmcOptions] = useState([]);
  const [benchmarkOptions, setBenchmarkOptions] = useState([]);
  const [eligibility, setEligibility] = useState({});

  useEffect(() => {
    if (isOpen) {
      axios.get('https://product.tievista.com/api/amcs')
        .then(res => {
          if (res.data && Array.isArray(res.data)) {
            const amcNames = Array.from(new Set(res.data.map(a => a.amc_name).filter(Boolean))).sort();
            setAmcOptions(amcNames);
          }
        })
        .catch(err => console.error("Failed to fetch AMCs", err));

      axios.get('https://product.tievista.com/api/benchmarks')
        .then(res => {
          if (res.data && Array.isArray(res.data)) {
            const benchNames = Array.from(new Set(res.data.map(b => b.benchmark_name).filter(Boolean))).sort();
            setBenchmarkOptions(benchNames);
          }
        })
        .catch(err => console.error("Failed to fetch Benchmarks", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      // Group data into product, monthlyData, and feeClasses
      const productData = {};
      const monthlyData = {};
      const feeClassData = {};

      // 1. Extract Product Data
      const productFields = ['product_name', 'product_type', 'structure_name', 'strategy', 'approach', 'cap_bias', 'currency', 'benchmark_name', 'amc_name', 'inception_date', 'fund_manager', 'manager_exp_yrs', 'co_fund_manager', 'min_investment_label', 'lock_in_period', 'liquidity', 'exit_load', 'trail_comm_pct', 'upfront_comm_pct', 'expense_ratio_pct', 'perf_fee_share_pct', 'revenue_model', 'clawback', 'tv_rev_split_pct', 'notes'];
      productFields.forEach(f => {
        productData[f] = data[f] || null;
      });

      // Add eligibility fields to product data
      ELIGIBILITY_OPTIONS.forEach(opt => {
        productData[opt.key] = eligibility[opt.key] || 'N';
      });

      // 2. Extract Monthly Data
      MONTHLY_SECTIONS.forEach(section => {
        section.fields.forEach(f => {
          monthlyData[f.name] = data[f.name] || null;
        });
      });

      // 3. Extract Fee Classes
      CLASS_SUFFIXES.forEach(suffix => {
        const fields = classFields(suffix);
        fields.forEach(f => {
          feeClassData[f.name] = data[f.name] || null;
        });
      });

      const payload = {
        product: productData,
        monthlyData: monthlyData,
        feeClasses: feeClassData
      };

      await axios.post('https://product.tievista.com/api/add-product', payload);
      onSuccess();
      onClose();
      reset();
    } catch (err) {
      console.error('Add product failed:', err);
      alert('Failed to add product. ' + (err.response?.data?.error || err.message));
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

  const toggleEligibility = (key) => {
    setEligibility(prev => ({
      ...prev,
      [key]: prev[key] === 'Y' ? 'N' : 'Y'
    }));
  };

  const renderField = (field) => {
    if (field.type === 'select') {
      return (
        <select
          {...register(field.name)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-[#C9981A] focus:outline-none focus:ring-1 focus:ring-[#C9981A]/30 transition"
        >
          <option value="">—</option>
          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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

  const classColors = [
    'bg-[#C9981A]', 'bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500',
    'bg-orange-500', 'bg-teal-500', 'bg-indigo-500', 'bg-pink-500', 'bg-cyan-500'
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50 rounded-t-xl">
          <h2 className="text-lg font-semibold text-gray-800">Add New Product</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition">
            <IconX size={20} />
          </button>
        </div>

        {/* Main Tabs */}
        <div className="flex border-b border-gray-200 bg-white">
          {['product', 'monthly', 'fee'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wider transition ${
                activeTab === tab
                  ? 'border-b-2 border-[#C9981A] text-[#C9981A]'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab === 'product' ? '1. Product Details' : tab === 'monthly' ? '2. Monthly Data' : '3. Fee Classes'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <form id="addProductForm" onSubmit={handleSubmit(onSubmit)}>
            
            {/* PRODUCT TAB */}
            {activeTab === 'product' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Row 1 */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Product Name *</label>
                  <input type="text" {...register("product_name", { required: true })} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Type</label>
                  <select {...register("product_type")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600">
                    <option value="">Select Type</option>
                    {typeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Structure</label>
                  <select {...register("structure_name")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600">
                    <option value="">Select Structure</option>
                    {structureOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Row 2 */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Strategy</label>
                  <select {...register("strategy")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600">
                    <option value="">Select Strategy</option>
                    {strategyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Approach</label>
                  <select {...register("approach")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600">
                    <option value="">Select Approach</option>
                    {approachOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Cap Bias</label>
                  <select {...register("cap_bias")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600">
                    <option value="">Select Cap Bias</option>
                    {capBiasOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Row 3 */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Currency</label>
                  <select {...register("currency")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600">
                    <option value="">Select Currency</option>
                    {currencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Benchmark</label>
                  <select {...register("benchmark_name")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600">
                    <option value="">Select Benchmark</option>
                    {benchmarkOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">AMC</label>
                  <select {...register("amc_name")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600">
                    <option value="">Select AMC</option>
                    {amcOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Row 4 */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Inception (YYYY-MM-DD)</label>
                  <input type="date" {...register("inception_date")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Manager</label>
                  <input type="text" {...register("fund_manager")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Manager Exp (Yrs)</label>
                  <input type="number" step="0.1" {...register("manager_exp_yrs")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600" />
                </div>

                {/* Row 5 */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Co-Fund Manager</label>
                  <input type="text" {...register("co_fund_manager")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Min Investment Label</label>
                  <input type="text" {...register("min_investment_label")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Lock In Period</label>
                  <input type="text" {...register("lock_in_period")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600" />
                </div>

                {/* Row 6 */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Liquidity</label>
                  <select {...register("liquidity")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600">
                    <option value="">Select Liquidity</option>
                    {liquidityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Exit Load</label>
                  <input type="text" {...register("exit_load")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Trail (%)</label>
                  <input type="number" step="0.01" {...register("trail_comm_pct")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600" />
                </div>

                {/* Row 7 */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Upfront (%)</label>
                  <input type="number" step="0.01" {...register("upfront_comm_pct")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Rev Model</label>
                  <select {...register("revenue_model")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600">
                    <option value="">Select Rev Model</option>
                    {revenueModelOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Clawback</label>
                  <select {...register("clawback")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600">
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>

                {/* Row 8 */}
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">TV Rev Split (%)</label>
                  <input type="number" step="0.01" {...register("tv_rev_split_pct")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Exp Ratio (%)</label>
                  <input type="number" step="0.01" {...register("expense_ratio_pct")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Perf Share (%)</label>
                  <input type="number" step="0.01" {...register("perf_fee_share_pct")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600" />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Tax Implication</label>
                  <input type="text" {...register("tax_implication")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600" />
                </div>

                {/* Investor Eligibility Tags */}
                <div className="flex flex-col md:col-span-2 lg:col-span-3">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-2">Investor Eligibility</label>
                  <div className="flex flex-wrap gap-2">
                    {ELIGIBILITY_OPTIONS.map(opt => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => toggleEligibility(opt.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all cursor-pointer ${
                          eligibility[opt.key] === 'Y'
                            ? 'bg-[#C9981A] border-[#C9981A] text-white shadow-sm'
                            : 'bg-white border-gray-300 text-gray-500 hover:border-[#C9981A] hover:text-[#C9981A]'
                        }`}
                      >
                        {eligibility[opt.key] === 'Y' && <span className="mr-1">✓</span>}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="flex flex-col md:col-span-2 lg:col-span-3">
                  <label className="text-xs font-bold text-gray-600 uppercase mb-1">Notes</label>
                  <textarea {...register("notes")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600 min-h-[80px]" />
                </div>
              </div>
            )}

            {/* MONTHLY TAB */}
            {activeTab === 'monthly' && (
              <div>
                <div className="flex gap-1 mb-4 overflow-x-auto border-b pb-2">
                  {MONTHLY_SECTIONS.map((section, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveMonthlySection(idx)}
                      className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider rounded-lg whitespace-nowrap transition ${
                        activeMonthlySection === idx 
                          ? 'bg-[#C9981A] text-white shadow-sm' 
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </div>
                {MONTHLY_SECTIONS.map((section, sIdx) => (
                  <div key={sIdx} className={activeMonthlySection === sIdx ? 'block' : 'hidden'}>
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
              </div>
            )}

            {/* FEE CLASSES TAB */}
            {activeTab === 'fee' && (
              <div>
                <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
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

                {CLASS_SUFFIXES.slice(0, visibleClasses).map((suffix, classIdx) => {
                  const fields = classFields(suffix);
                  const watchedName = watch(`class_name${suffix}`);
                  const displayName = watchedName || `Class ${classIdx + 1}`;

                  return (
                    <div key={classIdx} className="mb-6 last:mb-0">
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
              </div>
            )}
          </form>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition">
            Cancel
          </button>
          <button type="submit" form="addProductForm" className="px-4 py-2 text-sm font-medium text-white bg-[#C9981A] hover:bg-[#b38617] rounded transition" disabled={saving}>
            {saving ? 'Adding...' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddAllDashboardData;