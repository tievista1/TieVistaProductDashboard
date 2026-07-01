import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { IconX } from '@tabler/icons-react';

const typeOptions = ["PMS","SIF", "MF", "AIF CAT I", "AIF CAT II", "AIF CAT III", "GIFTCITY PMS - INBOUND", "GIFTCITY PMS - OUTBOUND", "GIFTCITY AIF CAT I - INBOUND", "GIFTCITY AIF CAT II - INBOUND", "GIFTCITY AIF CAT III - INBOUND", "GIFTCITY AIF CAT I - OUTBOUND", "GIFTCITY AIF CAT II - OUTBOUND", "GIFTCITY AIF CAT III - OUTBOUND", "GIFTCITY MF INBOUND", "GIFTCITY MF OUTBOUND", "INTERNATIONAL ETF", "INTERNATIONAL FUNDS"];

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

const UpdateProductList = ({ isOpen, onClose, product, onUpdateSuccess }) => {
  const { register, handleSubmit, reset } = useForm();
  const [eligibility, setEligibility] = useState({});
  const [amcOptions, setAmcOptions] = useState([]);
  const [isAmcsLoading, setIsAmcsLoading] = useState(false);
  const [benchmarkOptions, setBenchmarkOptions] = useState([]);
  const [isBenchmarksLoading, setIsBenchmarksLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAmcsLoading(true);
      axios.get('https://product.tievista.com/api/amcs')
        .then(res => {
          if (res.data && Array.isArray(res.data)) {
            const amcNames = Array.from(new Set(res.data.map(a => a.amc_name).filter(Boolean))).sort();
            setAmcOptions(amcNames);
          }
        })
        .catch(err => console.error("Failed to fetch AMCs", err))
        .finally(() => setIsAmcsLoading(false));

      setIsBenchmarksLoading(true);
      axios.get('https://product.tievista.com/api/benchmarks')
        .then(res => {
          if (res.data && Array.isArray(res.data)) {
            const benchNames = Array.from(new Set(res.data.map(b => b.benchmark_name).filter(Boolean))).sort();
            setBenchmarkOptions(benchNames);
          }
        })
        .catch(err => console.error("Failed to fetch Benchmarks", err))
        .finally(() => setIsBenchmarksLoading(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (product && isOpen && !isAmcsLoading && !isBenchmarksLoading) {
      reset({
        product_name: product.name || '',
        product_type: product.type || '',
        structure_name: product.structure || '',
        strategy: product.category || '',
        approach: product.approach || '',
        cap_bias: product.capBias || '',
        currency: product.currency || '',
        benchmark_name: product.benchmark || '',
        amc_name: product.amc || '',
        inception_date: product.inception || '',
        fund_manager: product.manager || '',
        manager_exp_yrs: product.managerExp || '',
        co_fund_manager: product.co_fund_manager || '',
        min_investment_label: product.min_investment_label || '',
        lock_in_period: product.lock || 'NIL',
        liquidity: product.liquidity || '',
        exit_load: product.exitLoad === '—' ? '' : product.exitLoad,
        tax_implication: product.tax_implication || '—',
        trail_comm_pct: product.trail || '',
        upfront_comm_pct: product.upfront_comm_pct || '',
        expense_ratio_pct: product.expRatio || '',
        perf_fee_share_pct: product.perfShare || product.perf_fee_share_pct || '',
        revenue_model: product.revModel || product.revenue_model || '',
        clawback: product.clawback === 'Yes' ? 'Y' : 'N',
        tv_rev_split_pct: product.revSplit && product.revSplit !== '—' ? parseFloat(product.revSplit) : '',
        notes: product.notes === '—' ? '' : product.notes
      });

      // Pre-populate eligibility from product's elig array
      const eligMap = {};
      ELIGIBILITY_OPTIONS.forEach(opt => {
        eligMap[opt.key] = (product.elig || []).includes(opt.label) ? 'Y' : 'N';
      });
      setEligibility(eligMap);
    }
  }, [product, isOpen, reset]);

  if (!isOpen) return null;

  const toggleEligibility = (key) => {
    setEligibility(prev => ({
      ...prev,
      [key]: prev[key] === 'Y' ? 'N' : 'Y'
    }));
  };

  const onSubmit = async (data) => {
    try {
      // Coerce empty strings to 0 or null for numeric fields to avoid MySQL decimal errors
      const payload = { ...data, ...eligibility };
      const numericFields = ['manager_exp_yrs', 'trail_comm_pct', 'tv_rev_split_pct', 'upfront_comm_pct', 'expense_ratio_pct', 'perf_fee_share_pct'];
      numericFields.forEach(field => {
        if (payload[field] === '') {
          payload[field] = 0;
        }
      });

      await axios.put(`https://product.tievista.com/api/update/product/${product.id}`, payload);
      onUpdateSuccess();
      onClose();
    } catch (err) {
      console.error('Update product failed:', err);
      alert('Failed to update product. ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50 rounded-t-xl">
          <h2 className="text-lg font-semibold text-gray-800">Edit Product: {product?.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition">
            <IconX size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="updateProductForm" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Row 1 */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-600 uppercase mb-1">Product Name</label>
              <input type="text" {...register("product_name")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600" />
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
              <label className="text-xs font-bold text-gray-600 uppercase mb-1">Inception (e.g. AUG 2018)</label>
              <input type="text" {...register("inception_date")} placeholder="e.g. AUG 2018" className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600" />
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
              <label className="text-xs font-bold text-gray-600 uppercase mb-1">Min Investment</label>
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

            {/* Row 9 */}
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

            {/* Row 10 */}
            <div className="flex flex-col md:col-span-2 lg:col-span-3">
              <label className="text-xs font-bold text-gray-600 uppercase mb-1">Notes</label>
              <textarea {...register("notes")} className="p-2 border rounded border-gray-300 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600 min-h-[80px]" />
            </div>

          </form>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition">
            Cancel
          </button>
          <button type="submit" form="updateProductForm" className="px-4 py-2 text-sm font-medium text-white bg-[#C9981A] hover:bg-[#b38617] rounded transition">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateProductList;