import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  IconRefresh,
  IconUpload,
  IconDownload,
  IconCalendarEvent,
  IconUsers,
  IconWorld,
  IconPlanet,
  IconBuildingBank,
  IconDiamond,
  IconCrown,
  IconSearchOff,
  IconSearch,
  IconEdit,
  IconTrash,
  IconX,
  IconPlus,
  IconCheck,
  IconChevronDown
} from '@tabler/icons-react';
import { Chart } from 'chart.js/auto';
import UploadModal from "./UploadModal";
import DeleteConfirm from "./DeleteConfirm";
import UpdateProductList from "./UpdateProductList";
import UpdateFeeClass from "./UpdateFeeClass";
import UpdateMonthlyData from "./UpdateMonthlyData";
import AddAllDashboardData from "./AddAllDashboardData";
import AmcPanel from "./AmcPanel";
import BenchmarkPanel from "./BenchmarkPanel";

// --- Investor Meta ---
const IM = [
  { k: "Indian Resident", cls: "bg-gray-50 border-gray-200 text-gray-600", lbl: "Indian Res." },
  { k: "US NRI", cls: "bg-indigo-50 border-indigo-200 text-indigo-600", lbl: "US NRI" },
  { k: "Canadian NRI", cls: "bg-red-50 border-red-200 text-red-600", lbl: "CA NRI" },
  { k: "UK NRI", cls: "bg-blue-50 border-blue-200 text-blue-600", lbl: "UK NRI" },
  { k: "Singapore NRI", cls: "bg-teal-50 border-teal-200 text-teal-600", lbl: "SG NRI" },
  { k: "UAE NRI", cls: "bg-emerald-50 border-emerald-200 text-emerald-600", lbl: "UAE NRI" },
  { k: "Foreign Investor", cls: "bg-orange-50 border-orange-200 text-orange-600", lbl: "Foreign" },
  { k: "Institution", cls: "bg-cyan-50 border-cyan-200 text-cyan-600", lbl: "Institution" },
  { k: "HNI", cls: "bg-amber-50 border-amber-200 text-amber-600", lbl: "HNI" },
  { k: "UHNI", cls: "bg-purple-50 border-purple-200 text-purple-600", lbl: "UHNI / FO" },
];
const ICM = Object.fromEntries(IM.map(x => [x.k, x]));

// --- Multi-Select Dropdown Component ---
const MultiSelectDropdown = ({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (val) => {
    if (selected.includes(val)) {
      onChange(selected.filter(v => v !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const displayText = selected.length === 0
    ? label
    : selected.length === 1
      ? selected[0]
      : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className={`w-full text-sm px-4 py-2.5 rounded-lg border bg-white focus:outline-none text-left flex items-center justify-between transition-colors ${selected.length > 0
          ? 'border-[#D4AF37] text-gray-900'
          : 'border-gray-200 text-gray-500'
          }`}
      >
        <span className="truncate pr-2 flex items-center gap-2">
          {displayText}
          {selected.length > 1 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#D4AF37] text-white text-[10px] font-bold">
              {selected.length}
            </span>
          )}
        </span>
        <IconChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {options.map(opt => {
            const val = typeof opt === 'string' ? opt : opt.value;
            const lbl = typeof opt === 'string' ? opt : opt.label;
            const isChecked = selected.includes(val);
            return (
              <label
                key={val}
                onClick={() => toggleOption(val)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors text-sm ${isChecked ? 'bg-amber-50/60' : ''
                  }`}
              >
                <span className={`flex items-center justify-center w-4 h-4 rounded border-2 flex-shrink-0 transition-colors ${isChecked
                  ? 'bg-[#D4AF37] border-[#D4AF37]'
                  : 'border-gray-300 bg-white'
                  }`}>
                  {isChecked && <IconCheck size={12} className="text-white" />}
                </span>
                <span className={`truncate ${isChecked ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>{lbl}</span>
              </label>
            );
          })}
          {selected.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2">
              <button
                type="button"
                onClick={() => { onChange([]); setIsOpen(false); }}
                className="text-xs text-[#D4AF37] hover:text-[#b8952e] font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ProductManager = () => {
  const [P, setP] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  //Upload pdf
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);

  // AMC Panel
  const [isAmcPanelOpen, setAmcPanelOpen] = useState(false);
  const [isBenchmarkPanelOpen, setBenchmarkPanelOpen] = useState(false);

  // Delete confirm
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Update modal
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [productToUpdate, setProductToUpdate] = useState(null);

  // Fee class update modal
  const [isFeeClassModalOpen, setFeeClassModalOpen] = useState(false);
  const [feeClassToUpdate, setFeeClassToUpdate] = useState(null);

  // Monthly data update modal
  const [isMonthlyDataModalOpen, setMonthlyDataModalOpen] = useState(false);
  const [monthlyDataToUpdate, setMonthlyDataToUpdate] = useState(null);

  // Drawer State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedMonthlyData, setSelectedMonthlyData] = useState([]);
  const [selectedFeeClasses, setSelectedFeeClasses] = useState([]);

  useEffect(() => {
    if (selectedProduct) {
      axios.get(`https://product.tievista.com/api/monthly-data/${selectedProduct.id}`)
        .then(res => {
          setSelectedMonthlyData(res.data);
        })
        .catch(err => console.error("Failed to fetch monthly data for product", err));
      axios.get(`https://product.tievista.com/api/fee-classes/${selectedProduct.id}`)
        .then(res => {
          setSelectedFeeClasses(res.data);
        })
        .catch(err => console.error("Failed to fetch fee classes for product", err));
    } else {
      setSelectedMonthlyData([]);
      setSelectedFeeClasses([]);
    }
  }, [selectedProduct]);

  // --- Filters State ---
  const [activeTab, setActiveTab] = useState('list');
  const [investorPills, setInvestorPills] = useState(['all']);

  // Inbound / Outbound flow filter
  const OUTBOUND_TYPES = ['GIFTCITY PMS - OUTBOUND', 'GIFTCITY AIF CAT I - OUTBOUND', 'GIFTCITY AIF CAT II - OUTBOUND', 'GIFTCITY AIF CAT III - OUTBOUND', 'GIFTCITY MF OUTBOUND', 'INTERNATIONAL ETF', 'INTERNATIONAL FUNDS'];
  const INBOUND_TYPES = ['PMS', 'SIF', 'MF', 'AIF CAT I', 'AIF CAT II', 'AIF CAT III', 'GIFTCITY PMS - INBOUND', 'GIFTCITY AIF CAT I - INBOUND', 'GIFTCITY AIF CAT II - INBOUND', 'GIFTCITY AIF CAT III - INBOUND', 'GIFTCITY MF INBOUND'];
  const [flowFilter, setFlowFilter] = useState('all'); // 'all' | 'inbound' | 'outbound'

  // Dropdowns (multi-select arrays)
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState([]);
  const [filterCategory, setFilterCategory] = useState([]);
  const [filterApproach, setFilterApproach] = useState([]);
  const [filterCapBias, setFilterCapBias] = useState([]);
  const [filterCurrency, setFilterCurrency] = useState([]);
  const [filterRevModel, setFilterRevModel] = useState([]);
  const [filterAMC, setFilterAMC] = useState([]);

  // Month/Year filter (from monthlydata.report_month)
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [monthOptions, setMonthOptions] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);

  // Sliders — all start from 0 (or range minimum)
  const [fSh, setFSh] = useState(0);
  const [fSd, setFSd] = useState(0);
  const [fUc, setFUc] = useState(0);
  const [fDc, setFDc] = useState(0);
  const [fAm, setFAm] = useState(0);
  const [fR3, setFR3] = useState(-50);
  const [fTr, setFTr] = useState(0);
  const [fMi, setFMi] = useState(0);

  // Slider max values (right end of slider)
  const [fShMax, setFShMax] = useState(5);
  const [fSdMax, setFSdMax] = useState(50);
  const [fUcMax, setFUcMax] = useState(200);
  const [fDcMax, setFDcMax] = useState(200);
  const [fAmMax, setFAmMax] = useState(50000);
  const [fR3Max, setFR3Max] = useState(100);
  const [fTrMax, setFTrMax] = useState(5);
  const [fMiMax, setFMiMax] = useState(500);

  // Compare
  const [compareIds, setCompareIds] = useState([]);
  const [compareSubTab, setCompareSubTab] = useState('product');

  // Sorting
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(1);

  const chartRef = useRef(null);

  // --- Derived Data ---
  const [amcOptions, setAmcOptions] = useState([]);

  // Build filter payload from current UI state
  const buildFilterPayload = useCallback(() => {
    const payload = {};

    // Text search
    if (search && search.trim()) payload.search = search.trim();

    // Multi-select dropdowns + inbound/outbound flow filter
    if (flowFilter === 'inbound') {
      payload.productTypes = filterType.length > 0
        ? filterType.filter(t => INBOUND_TYPES.includes(t))
        : INBOUND_TYPES;
    } else if (flowFilter === 'outbound') {
      payload.productTypes = filterType.length > 0
        ? filterType.filter(t => OUTBOUND_TYPES.includes(t))
        : OUTBOUND_TYPES;
    } else if (filterType.length > 0) {
      payload.productTypes = filterType;
    }
    if (filterCategory.length > 0) payload.strategies = filterCategory;
    if (filterApproach.length > 0) payload.approaches = filterApproach;
    if (filterCurrency.length > 0) payload.currencies = filterCurrency;
    if (filterRevModel.length > 0) payload.revenueModels = filterRevModel;
    if (filterAMC.length > 0) payload.amcs = filterAMC;

    // Investor eligibility
    if (!investorPills.includes('all') && investorPills.length > 0) {
      payload.investableBy = investorPills;
    }

    // Range sliders — only send non-default values
    if (fAm > 0) payload.aumMin = fAm;
    if (fAmMax < 50000) payload.aumMax = fAmMax;

    if (fMi > 0) payload.minInvestmentMax = fMi;

    if (fSh > 0) payload.sharpeMin = fSh;
    if (fShMax < 5) payload.sharpeMax = fShMax;

    if (fSd > 0) payload.stdDevMin = fSd;
    if (fSdMax < 50) payload.stdDevMax = fSdMax;

    if (fUc > 0) payload.upCaptureMin = fUc;
    if (fUcMax < 200) payload.upCaptureMax = fUcMax;

    if (fDc > 0) payload.downCaptureMin = fDc;
    if (fDcMax < 200) payload.downCaptureMax = fDcMax;

    if (fR3 > -50) payload.return3yMin = fR3;
    if (fR3Max < 100) payload.return3yMax = fR3Max;

    if (fTr > 0) payload.trailMin = fTr;
    if (fTrMax < 5) payload.trailMax = fTrMax;

    if (filterMonth) payload.filterMonth = parseInt(filterMonth);
    if (filterYear) payload.filterYear = parseInt(filterYear);

    // Sorting
    if (sortKey) {
      payload.sortKey = sortKey;
      payload.sortDir = sortDir;
    }

    return payload;
  }, [search, filterType, filterCategory, filterApproach, filterCurrency, filterRevModel, filterAMC, investorPills, fAm, fAmMax, fMi, fSh, fShMax, fSd, fSdMax, fUc, fUcMax, fDc, fDcMax, fR3, fR3Max, fTr, fTrMax, sortKey, sortDir, filterMonth, filterYear, flowFilter]);

  // Debounce ref for filter API calls
  const debounceRef = useRef(null);

  const fetchFilteredData = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const payload = buildFilterPayload();
      const res = await axios.post('https://product.tievista.com/api/filter-products', payload);
      setP(res.data);
    } catch (err) {
      console.error("Failed to fetch filtered data", err);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [buildFilterPayload]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Initial load — fetch all products (empty filter)
      const res = await axios.post('https://product.tievista.com/api/filter-products', {});
      setP(res.data);

      const mdRes = await axios.get('https://product.tievista.com/api/monthly-data');
      setMonthlyData(mdRes.data);

      const amcsRes = await axios.get('https://product.tievista.com/api/amcs');
      if (amcsRes.data && Array.isArray(amcsRes.data)) {
        const amcNames = Array.from(new Set(amcsRes.data.map(a => a.amc_name).filter(Boolean))).sort();
        setAmcOptions(amcNames);
      }

      // Fetch available months/years from monthlydata
      const reportMonthsRes = await axios.get('https://product.tievista.com/api/report-months');
      if (reportMonthsRes.data) {
        setMonthOptions(reportMonthsRes.data.months || []);
        setYearOptions(reportMonthsRes.data.years || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Debounced filter fetch — triggers 400ms after any filter change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchFilteredData(false);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search, filterType, filterCategory, filterApproach, filterCurrency, filterRevModel, filterAMC, investorPills, fAm, fAmMax, fMi, fSh, fShMax, fSd, fSdMax, fUc, fUcMax, fDc, fDcMax, fR3, fR3Max, fTr, fTrMax, sortKey, sortDir, filterMonth, filterYear, flowFilter]);

  const handleReset = () => {
    setInvestorPills(['all']);
    setSearch('');
    setFilterType([]); setFilterCategory([]); setFilterApproach([]); setFilterCapBias([]);
    setFilterCurrency([]); setFilterRevModel([]); setFilterAMC([]);
    setFSh(0); setFShMax(5); setFSd(0); setFSdMax(50); setFUc(0); setFUcMax(200); setFDc(0); setFDcMax(200);
    setFAm(0); setFAmMax(50000); setFR3(-50); setFR3Max(100); setFTr(0); setFTrMax(5); setFMi(0); setFMiMax(500);
    setCompareIds([]);
    setCompareSubTab('product');
    setSortKey(null);
    setFilterMonth('');
    setFilterYear('');
    setFlowFilter('all');
    // Reset triggers the debounced useEffect which will call fetchFilteredData
  };

  const handlePillClick = (k) => {
    if (k === 'all') {
      setInvestorPills(['all']);
      return;
    }
    let newPills = investorPills.filter(p => p !== 'all');
    if (newPills.includes(k)) {
      newPills = newPills.filter(p => p !== k);
      if (newPills.length === 0) newPills = ['all'];
    } else {
      newPills.push(k);
    }
    setInvestorPills(newPills);
  };

  //UPLOAD
  const handlePdf = () => {
    setUploadModalOpen(true);
  };

  const handleUploadSuccess = (data) => {
    console.log("Upload Success:", data);
    alert(`Successfully processed! Batch ID: ${data.batchId}`);
    fetchDashboardData();
  };

  const handleDeleteProduct = (productId, productName) => {
    setProductToDelete({ id: productId, name: productName });
    setDeleteConfirmOpen(true);
  };

  const handleEditProduct = (product) => {
    setProductToUpdate(product);
    setUpdateModalOpen(true);
  };

  const handleEditFeeClass = (feeClass) => {
    setFeeClassToUpdate(feeClass);
    setFeeClassModalOpen(true);
  };

  const handleEditMonthlyData = (md) => {
    setMonthlyDataToUpdate(md);
    setMonthlyDataModalOpen(true);
  };

  const handleFeeClassUpdateSuccess = () => {
    fetchDashboardData();
    // Refresh the side panel fee classes
    if (selectedProduct) {
      axios.get(`https://product.tievista.com/api/fee-classes/${selectedProduct.id}`)
        .then(res => setSelectedFeeClasses(res.data))
        .catch(err => console.error("Failed to refresh fee classes", err));
    }
  };

  const handleMonthlyDataUpdateSuccess = () => {
    fetchDashboardData();
    // Refresh the side panel monthly data
    if (selectedProduct) {
      axios.get(`https://product.tievista.com/api/monthly-data/${selectedProduct.id}`)
        .then(res => setSelectedMonthlyData(res.data))
        .catch(err => console.error("Failed to refresh monthly data", err));
    }
  };

  const executeDelete = async () => {
    if (!productToDelete) return;
    try {
      await axios.delete(`https://product.tievista.com/api/product/${productToDelete.id}`);
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
      fetchDashboardData();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete product. ' + (err.response?.data?.error || err.message));
    }
  };

  // Server-side filtered data — P is already filtered by the API
  const filteredProducts = useMemo(() => P, [P]);

  // Monthly data lookup by product_id (most recent entry)
  const monthlyDataByProduct = useMemo(() => {
    const map = {};
    for (const md of monthlyData) {
      if (!map[md.product_id]) {
        map[md.product_id] = md;
      }
    }
    return map;
  }, [monthlyData]);

  // Products selected for comparison
  const compareProducts = useMemo(() => {
    return P.filter(p => compareIds.includes(p.id));
  }, [P, compareIds]);

  // Handle Sort
  const doSort = (k) => {
    if (sortKey === k) {
      setSortDir(d => d * -1);
    } else {
      setSortKey(k);
      setSortDir(1);
    }
  };

  // Stats computation
  const stats = useMemo(() => {
    const valid = filteredProducts;
    if (!valid.length) return { cnt: 0, sh: '—', r3: '—', dc: '—', au: '—', tr: '—', ex: '—' };

    let sumSh = 0, nSh = 0;
    let sumR3 = 0, nR3 = 0;
    let sumDc = 0, nDc = 0;
    let sumAu = 0;
    let sumTr = 0, nTr = 0;
    let sumEx = 0, nEx = 0;

    valid.forEach(p => {
      if (p.sharpe) { sumSh += parseFloat(p.sharpe); nSh++; }
      if (p.ret3) { sumR3 += parseFloat(p.ret3); nR3++; }
      if (p.downCap) { sumDc += parseFloat(p.downCap); nDc++; }
      if (p.aum) { sumAu += parseFloat(p.aum); }
      if (p.trail) { sumTr += parseFloat(p.trail); nTr++; }
      if (p.expRatio) { sumEx += parseFloat(p.expRatio); nEx++; }
    });

    return {
      cnt: valid.length,
      sh: nSh ? (sumSh / nSh).toFixed(2) : '—',
      r3: nR3 ? (sumR3 / nR3).toFixed(1) + '%' : '—',
      dc: nDc ? (sumDc / nDc).toFixed(0) + '%' : '—',
      au: sumAu ? '₹' + sumAu.toLocaleString() + 'Cr' : '—',
      tr: nTr ? (sumTr / nTr).toFixed(2) + '%' : '—',
      ex: nEx ? (sumEx / nEx).toFixed(2) + '%' : '—',
    };
  }, [filteredProducts]);

  // Initialize Risk Chart
  useEffect(() => {
    if (activeTab === 'risk') {
      const ctx = document.getElementById('rc');
      if (chartRef.current) chartRef.current.destroy();

      const dataPoints = filteredProducts.filter(p => p.stddev && p.sharpe).map(p => ({
        x: parseFloat(p.stddev),
        y: parseFloat(p.sharpe),
        r: Math.max(4, Math.min(25, (parseFloat(p.aum) || 100) / 200)),
        name: p.name,
        type: p.type || '—'
      }));

      // Group by type for coloring
      const dsMap = {};
      const colors = {
        "PMS": "rgba(201, 152, 26, 0.7)",
        "AIF Cat II": "rgba(124, 58, 237, 0.7)",
        "AIF Cat III": "rgba(26, 86, 219, 0.7)",
        "GIFT City – AIF": "rgba(14, 122, 69, 0.7)",
        "International FoF": "rgba(184, 92, 0, 0.7)",
        "Mutual Fund": "rgba(185, 28, 28, 0.7)"
      };

      dataPoints.forEach(pt => {
        if (!dsMap[pt.type]) dsMap[pt.type] = [];
        dsMap[pt.type].push(pt);
      });

      const datasets = Object.keys(dsMap).map(type => ({
        label: type,
        data: dsMap[type],
        backgroundColor: colors[type] || "rgba(150,150,150,0.7)"
      }));

      chartRef.current = new Chart(ctx, {
        type: 'bubble',
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.raw.name} | StdDev: ${ctx.raw.x}% | Sharpe: ${ctx.raw.y}`
              }
            }
          },
          scales: {
            x: { title: { display: true, text: 'Std Deviation (Risk %)' } },
            y: { title: { display: true, text: 'Sharpe Ratio (Return/Risk)' } }
          }
        }
      });
    }
  }, [activeTab, filteredProducts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F7F4]">
        <div className="animate-spin w-8 h-8 border-4 border-[#C9981A] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white text-[#1A1A1A] font-sans p-4 md:p-6 pb-20">
      <div className="max-w-[1500px] mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center border-b border-[#E0DDD6]">
          {/* Logo */}

          <img src="/TieVistaLogo.png" alt="" className="w-30 h-30" />

          <div className="flex-grow text-center flex flex-col items-center">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-black mb-2">Investment Product Dashboard</h1>
            <div className="text-gray-500 text-sm tracking-wide font-medium flex items-center gap-3">
              <span>PMS</span> <span className="text-gray-300">•</span>
              <span>AIF</span> <span className="text-gray-300">•</span>
              <span>Gift City</span> <span className="text-gray-300">•</span>
              <span>International</span> <span className="text-gray-300">•</span>
              <span>Mutual Funds</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-shrink-0 w-32 justify-end">
            <button className="p-2 rounded-lg border border-[#C8C4BC] bg-white hover:bg-[#F2F1ED] transition shadow-sm text-gray-700" onClick={handleReset} title="Reset Filters">
              <IconRefresh size={18} />
            </button>
            <button onClick={handlePdf} className="p-2 rounded-lg border border-[#D4AF37] text-[#D4AF37] hover:bg-yellow-50 transition shadow-sm" title="Upload PDF">
              <IconUpload size={18} />
            </button>
            <button onClick={() => setAddModalOpen(true)} className="p-2 rounded-lg bg-white text-[#D4AF37] hover:text-[#D4AF37] hover:bg-yellow-50 border border-[#D4AF37] transition shadow-sm" title="Add Product">
              <IconPlus size={18} />
            </button>

            <UploadModal isOpen={isUploadModalOpen} onClose={() => setUploadModalOpen(false)} onSuccess={handleUploadSuccess} />
            <DeleteConfirm isOpen={deleteConfirmOpen} onClose={() => { setDeleteConfirmOpen(false); setProductToDelete(null); }} onConfirm={executeDelete} productName={productToDelete?.name} />
            <UpdateProductList isOpen={isUpdateModalOpen} onClose={() => { setUpdateModalOpen(false); setProductToUpdate(null); }} product={productToUpdate} onUpdateSuccess={fetchDashboardData} />
            <UpdateFeeClass isOpen={isFeeClassModalOpen} onClose={() => { setFeeClassModalOpen(false); setFeeClassToUpdate(null); }} feeClassData={feeClassToUpdate} onUpdateSuccess={handleFeeClassUpdateSuccess} />
            <UpdateMonthlyData isOpen={isMonthlyDataModalOpen} onClose={() => { setMonthlyDataModalOpen(false); setMonthlyDataToUpdate(null); }} monthlyData={monthlyDataToUpdate} onUpdateSuccess={handleMonthlyDataUpdateSuccess} />
            <AddAllDashboardData isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} onSuccess={fetchDashboardData} />
            <AmcPanel isOpen={isAmcPanelOpen} onClose={() => { setAmcPanelOpen(false); fetchDashboardData(); }} />
            <BenchmarkPanel isOpen={isBenchmarkPanelOpen} onClose={() => { setBenchmarkPanelOpen(false); fetchDashboardData(); }} />
          </div>
        </div>

        {/* DATA AS OF */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-4">
          <div className="flex flex-col">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Month</div>
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm w-48 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-gray-700 font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%234B5563%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center]">
              <option value="">All Months</option>
              {monthOptions.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Year</div>
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm w-48 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-gray-700 font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%234B5563%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center]">
              <option value="">All Years</option>
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex bg-[#F5F5F5] border border-gray-200 rounded-lg p-1 shadow-inner h-[38px]">
            <button
              onClick={() => setFlowFilter(flowFilter === 'inbound' ? 'all' : 'inbound')}
              className={`px-6 py-1 text-sm font-medium rounded-md transition-all ${
                flowFilter === 'inbound'
                  ? 'bg-white text-gray-700 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >Inbound</button>
            <button
              onClick={() => setFlowFilter(flowFilter === 'outbound' ? 'all' : 'outbound')}
              className={`px-6 py-1 text-sm font-medium rounded-md transition-all ${
                flowFilter === 'outbound'
                  ? 'text-black shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={flowFilter === 'outbound' ? { background: 'linear-gradient(to right, #F0C45C, #D4AF37)' } : {}}
            >Outbound</button>
          </div>
          <button onClick={() => setAmcPanelOpen(true)} className="flex items-center px-4 py-2 rounded-lg bg-white text-[#D4AF37] hover:text-[#D4AF37] hover:bg-yellow-50 border border-[#D4AF37] transition shadow-sm">
            <span className="text-sm">View AMCs</span>
          </button>
          <button onClick={() => setBenchmarkPanelOpen(true)} className="flex items-center px-4 py-2 rounded-lg bg-white text-[#D4AF37] hover:text-[#D4AF37] hover:bg-yellow-50 border border-[#D4AF37] transition shadow-sm">
            <span className="text-sm">View Benchmark</span>
          </button>
        </div>

        {/* FILTERS SECTION */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 p-8 mb-8">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <IconSearch size={16} className="text-gray-400" />
              </div>
              <input type="text" className="w-full text-sm pl-9 pr-3 py-2.5 rounded-lg border-2 border-[#3B82F6] outline-none" placeholder="Search Fund Name, Manager, Strategy" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <MultiSelectDropdown
              label="Investable By"
              options={IM.map(i => ({ value: i.k, label: i.lbl }))}
              selected={investorPills.includes('all') ? [] : investorPills}
              onChange={(vals) => setInvestorPills(vals.length === 0 ? ['all'] : vals)}
            />
            <MultiSelectDropdown
              label="Product Types"
              options={['PMS', "SIF",'MF', 'AIF CAT I', 'AIF CAT II', 'AIF CAT III', 'GIFTCITY PMS - INBOUND', 'GIFTCITY PMS - OUTBOUND', 'GIFTCITY AIF CAT I - INBOUND', 'GIFTCITY AIF CAT II - INBOUND', 'GIFTCITY AIF CAT III - INBOUND', 'GIFTCITY AIF CAT I - OUTBOUND', 'GIFTCITY AIF CAT II - OUTBOUND', 'GIFTCITY AIF CAT III - OUTBOUND', 'GIFTCITY MF INBOUND', 'GIFTCITY MF OUTBOUND', 'INTERNATIONAL ETF', 'INTERNATIONAL FUNDS' ]}
              selected={filterType}
              onChange={setFilterType}
            />
            <MultiSelectDropdown
              label="All Strategies"
              options={['Large Cap Equity', 'Flexi Cap', 'Multi Cap', 'Mid & Small Cap', 'Multi Asset', 'Credit Strategy', 'Absolute Return', 'Long-Short Equity', 'Global Equity', 'International Debt', 'Thematic / Sectoral']}
              selected={filterCategory}
              onChange={setFilterCategory}
            />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <MultiSelectDropdown
              label="All Approaches"
              options={['Value', 'Growth', 'GARP', 'Blend', 'Top-Down', 'Bottom-Up', 'Quant', 'Multi-Factor']}
              selected={filterApproach}
              onChange={setFilterApproach}
            />
            <MultiSelectDropdown
              label="Currency"
              options={['INR', 'USD', 'EUR', 'GBP', 'AED']}
              selected={filterCurrency}
              onChange={setFilterCurrency}
            />
            <MultiSelectDropdown
              label="Revenue Models"
              options={['Trail Only', 'Upfront Only', 'Upfront + Trail', 'Trail + Perf Share', 'Upfront + Trail + Perf']}
              selected={filterRevModel}
              onChange={setFilterRevModel}
            />
            <MultiSelectDropdown
              label="All AMCs"
              options={amcOptions}
              selected={filterAMC}
              onChange={setFilterAMC}
            />
          </div>

          <hr className="border-gray-200 mb-8" />

          {/* Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-12 gap-y-10">
            {/* AUM */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">AUM (Cr)</div>
                <div className="text-sm font-bold text-black">{fAm === 0 ? '0' : `₹${fAm.toLocaleString()}`}</div>
              </div>
              <input className="w-full appearance-none h-1 bg-gray-200 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-[#D4AF37] [&::-webkit-slider-thumb]:rounded-full cursor-pointer" style={{ background: `linear-gradient(to right, #D4AF37 ${(fAm / 50000) * 100}%, #E5E7EB ${(fAm / 50000) * 100}%)` }} type="range" min="0" max="50000" step="100" value={fAm} onChange={e => setFAm(parseFloat(e.target.value))} />
            </div>
            {/* MIN INVESTMENT */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">MIN INVESTMENT</div>
                <div className="text-sm font-bold text-black">{fMi === 0 ? 'Any' : `₹${fMi}L`}</div>
              </div>
              <input className="w-full appearance-none h-1 bg-gray-200 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-[#D4AF37] [&::-webkit-slider-thumb]:rounded-full cursor-pointer" style={{ background: `linear-gradient(to right, #D4AF37 ${(fMi / 500) * 100}%, #E5E7EB ${(fMi / 500) * 100}%)` }} type="range" min="0" max="500" step="10" value={fMi} onChange={e => setFMi(parseFloat(e.target.value))} />
            </div>
            {/* SHARPE RATIO */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">SHARPE RATIO</div>
                <div className="text-sm font-bold text-black">{fSh.toFixed(1)}</div>
              </div>
              <input className="w-full appearance-none h-1 bg-gray-200 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-[#D4AF37] [&::-webkit-slider-thumb]:rounded-full cursor-pointer" style={{ background: `linear-gradient(to right, #D4AF37 ${(fSh / 5) * 100}%, #E5E7EB ${(fSh / 5) * 100}%)` }} type="range" min="0" max="5" step="0.1" value={fSh} onChange={e => setFSh(parseFloat(e.target.value))} />
            </div>
            {/* STD DEV */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">STD DEV</div>
                <div className="text-sm font-bold text-black">{fSd}%</div>
              </div>
              <input className="w-full appearance-none h-1 bg-gray-200 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-[#D4AF37] [&::-webkit-slider-thumb]:rounded-full cursor-pointer" style={{ background: `linear-gradient(to right, #D4AF37 ${(fSd / 50) * 100}%, #E5E7EB ${(fSd / 50) * 100}%)` }} type="range" min="0" max="50" step="1" value={fSd} onChange={e => setFSd(parseFloat(e.target.value))} />
            </div>
            {/* UP CAPTURE */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">UP CAPTURE</div>
                <div className="text-sm font-bold text-black">{fUc}</div>
              </div>
              <input className="w-full appearance-none h-1 bg-gray-200 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-[#D4AF37] [&::-webkit-slider-thumb]:rounded-full cursor-pointer" style={{ background: `linear-gradient(to right, #D4AF37 ${(fUc / 200) * 100}%, #E5E7EB ${(fUc / 200) * 100}%)` }} type="range" min="0" max="200" step="5" value={fUc} onChange={e => setFUc(parseFloat(e.target.value))} />
            </div>
            {/* DOWN CAPTURE */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">DOWN CAPTURE</div>
                <div className="text-sm font-bold text-black">{fDc}</div>
              </div>
              <input className="w-full appearance-none h-1 bg-gray-200 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-[#D4AF37] [&::-webkit-slider-thumb]:rounded-full cursor-pointer" style={{ background: `linear-gradient(to right, #D4AF37 ${(fDc / 200) * 100}%, #E5E7EB ${(fDc / 200) * 100}%)` }} type="range" min="0" max="200" step="5" value={fDc} onChange={e => setFDc(parseFloat(e.target.value))} />
            </div>
            {/* 3Y RETURN — supports negative to positive (-50% to +100%) */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">3Y RETURN</div>
                <div className="text-sm font-bold text-black">
                  <span className={fR3 < 0 ? 'text-red-500' : fR3 > 0 ? 'text-green-600' : 'text-black'}>{fR3 > 0 ? '+' : ''}{fR3}%</span>
                </div>
              </div>
              <div className="relative">
                <div className="absolute top-[-2px] text-[9px] text-gray-400 font-medium" style={{ left: `${((0 - (-50)) / (100 - (-50))) * 100}%`, transform: 'translateX(-50%)' }}>0</div>
                <input className="w-full appearance-none h-1 bg-gray-200 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-[#D4AF37] [&::-webkit-slider-thumb]:rounded-full cursor-pointer" style={{ background: `linear-gradient(to right, #E5E7EB ${((0 - (-50)) / (100 - (-50))) * 100}%, #D4AF37 ${((0 - (-50)) / (100 - (-50))) * 100}%, #D4AF37 ${((fR3 - (-50)) / (100 - (-50))) * 100}%, #E5E7EB ${((fR3 - (-50)) / (100 - (-50))) * 100}%)` }} type="range" min="-50" max="100" step="1" value={fR3} onChange={e => setFR3(parseFloat(e.target.value))} />
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                <span>-50%</span>
                <span>+100%</span>
              </div>
            </div>
            {/* TRAIL % */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">TRAIL %</div>
                <div className="text-sm font-bold text-black">{fTr.toFixed(2)}%</div>
              </div>
              <input className="w-full appearance-none h-1 bg-gray-200 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-[#D4AF37] [&::-webkit-slider-thumb]:rounded-full cursor-pointer" style={{ background: `linear-gradient(to right, #D4AF37 ${(fTr / 5) * 100}%, #E5E7EB ${(fTr / 5) * 100}%)` }} type="range" min="0" max="5" step="0.05" value={fTr} onChange={e => setFTr(parseFloat(e.target.value))} />
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-10">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-[#D4AF37] p-4 flex flex-col items-center justify-center">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 text-center">Total Products</div>
            <div className="text-2xl font-semibold text-gray-800">{stats.cnt}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-[#D4AF37] p-4 flex flex-col items-center justify-center">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 text-center">Avg Sharpe</div>
            <div className="text-2xl font-semibold text-gray-800">{stats.sh}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-[#D4AF37] p-4 flex flex-col items-center justify-center">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 text-center">Avg 3Y Return</div>
            <div className="text-2xl font-semibold text-gray-800">{stats.r3}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-[#D4AF37] p-4 flex flex-col items-center justify-center">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 text-center">Avg Down Capture</div>
            <div className="text-2xl font-semibold text-gray-800">{stats.dc}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-[#D4AF37] p-4 flex flex-col items-center justify-center">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 text-center">Total AUM</div>
            <div className="text-2xl font-semibold text-gray-800">{stats.au}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-[#D4AF37] p-4 flex flex-col items-center justify-center">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 text-center">Avg Trail</div>
            <div className="text-2xl font-semibold text-gray-800">{stats.tr}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-[#D4AF37] p-4 flex flex-col items-center justify-center">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 text-center">Avg Expense</div>
            <div className="text-2xl font-semibold text-gray-800">{stats.ex}</div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-4 mb-4 border-b border-[#E0DDD6]">
          {[
            { id: 'list', label: 'Product list' },
            { id: 'fee', label: 'Fee & Revenue' },
            { id: 'compare', label: 'Compare' },
            { id: 'risk', label: 'Risk matrix' },
            { id: 'monthlydata', label: 'Monthly Data' }
          ].map(t => (
            <div
              key={t.id}
              className={`px-4 py-2.5 text-sm font-medium cursor-pointer transition border-b-2 -mb-[1px] ${activeTab === t.id ? 'border-[#C9981A] text-[#1A1A1A]' : 'border-transparent text-[#6B6760] hover:text-[#1A1A1A]'}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </div>
          ))}
        </div>

        {/* TAB: LIST */}
        {activeTab === 'list' && (
          <div className="bg-white shadow-sm border border-black overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black">Edit</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black">Delete</th>
                  <th className="p-3 bg-white border-b border-black w-10"></th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black cursor-pointer hover:text-[#C9981A] text-center" onClick={() => doSort('product_id')}>Product ID ↕</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black cursor-pointer hover:text-[#C9981A] text-center" onClick={() => doSort('name')}>Product ↕</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black cursor-pointer hover:text-[#C9981A] text-center" onClick={() => doSort('type')}>Type ↕</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black text-center">Structure</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black cursor-pointer hover:text-[#C9981A] text-center" onClick={() => doSort('category')}>Strategy ↕</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black cursor-pointer hover:text-[#C9981A] text-center" onClick={() => doSort('amc')}>AMC ↕</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black cursor-pointer hover:text-[#C9981A] text-center" onClick={() => doSort('approach')}>Approach ↕</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black cursor-pointer hover:text-[#C9981A] text-center" onClick={() => doSort('capBias')}>capBias ↕</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black cursor-pointer hover:text-[#C9981A] text-center" onClick={() => doSort('currency')}>Currency ↕</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black cursor-pointer hover:text-[#C9981A] text-center" onClick={() => doSort('benchmark')}>Benchmark ↕</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black cursor-pointer hover:text-[#C9981A] text-center" onClick={() => doSort('inception')}>Inception ↕</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black text-center">Intl/GC Domicile</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black cursor-pointer hover:text-[#C9981A] text-center" onClick={() => doSort('manager')}>Manager ↕</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black cursor-pointer hover:text-[#C9981A] text-center" onClick={() => doSort('managerExp')}>Manager Exp ↕</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black cursor-pointer hover:text-[#C9981A] text-center" onClick={() => doSort('co_fund_manager')}>Co-fund Manager ↕</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black cursor-pointer hover:text-[#C9981A] text-center" onClick={() => doSort('min_investment_label')}>Min Investment ↕</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black cursor-pointer hover:text-[#C9981A] text-center" onClick={() => doSort('lock')}>Lock In period ↕</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black cursor-pointer hover:text-[#C9981A] text-center" onClick={() => doSort('liquidity')}>Liquidity ↕</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black cursor-pointer hover:text-[#C9981A] text-center" onClick={() => doSort('exit_load')}>exit_load ↕</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black cursor-pointer hover:text-[#C9981A] text-center" onClick={() => doSort('exit_load')}>Tax Implication ↕</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black text-center">Exp</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider cursor-pointer hover:text-[#b38617] text-[#C9981A] text-center" onClick={() => doSort('trail')}>Trail ↕</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black text-center">Rev model</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black text-center">Claw</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black text-center">TV Rev Split</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black text-center">Notes</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-medium uppercase tracking-wider text-black text-center">Investable by</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const r1 = parseFloat(p.ret1);
                  const r3 = parseFloat(p.ret3);
                  const r5 = parseFloat(p.ret5);
                  return (
                    <tr key={p.id} onClick={() => setSelectedProduct(p)} className={`cursor-pointer hover:bg-[#FAFAF8] transition ${compareIds.includes(p.id) ? 'bg-[#FDF8E7]' : ''}`}>
                      <td className="p-3 border-b border-black text-center">
                        <button className="text-[#C9981A] hover:text-[#b38617] transition" title="Edit" onClick={(e) => { e.stopPropagation(); handleEditProduct(p); }}>
                          <IconEdit size={16} />
                        </button>
                      </td>
                      <td className="p-3 border-b border-black text-center">
                        <button className="text-red-500 hover:text-red-700 transition" title="Delete" onClick={(e) => { e.stopPropagation(); handleDeleteProduct(p.id, p.name); }}>
                          <IconTrash size={16} />
                        </button>
                      </td>
                      <td className="p-3 border-b border-black text-center"><input type="checkbox" className="accent-[#C9981A] w-4 h-4 rounded cursor-pointer" checked={compareIds.includes(p.id)} onClick={(e) => e.stopPropagation()} onChange={(e) => {
                        if (e.target.checked && compareIds.length < 4) setCompareIds([...compareIds, p.id]);
                        else if (!e.target.checked) setCompareIds(compareIds.filter(id => id !== p.id));
                      }} /></td>
                      <td className="p-3 border-b border-black text-center">{p.id}</td>
                      <td className="p-3 border-b border-black font-semibold text-center">{p.name}</td>
                      <td className="p-3 border-b border-black">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${(p.type || '').includes('PMS') ? 'bg-[#FDF8E7] text-[#C9981A] text-center' :
                          (p.type || '').includes('AIF') && !p.gift ? 'bg-purple-50 text-purple-600 text-center' :
                            p.gift ? 'bg-emerald-50 text-emerald-600 text-center' :
                              p.intl ? 'bg-orange-50 text-orange-600 text-center' : 'bg-rose-50 text-rose-600 text-center'
                          }`}>
                          {p.type}
                        </span>
                      </td>
                      <td className="p-3 border-b border-black text-[#6B6760] text-[11px] max-w-[150px] truncate text-center" title={p.structure}>{p.structure}</td>
                      <td className="p-3 border-b border-black text-black text-center">{p.category}</td>
                      <td className="p-3 border-b border-black text-black max-w-[150px] truncate text-center" title={p.amc}>{p.amc}</td>
                      <td className="p-3 border-b border-black text-black text-center">{p.approach}</td>
                      <td className="p-3 border-b border-black text-black text-center">{p.capBias || '—'}</td>
                      <td className="p-3 border-b border-black text-black text-center">{p.currency || '—'}</td>
                      <td className="p-3 border-b border-black text-black text-center">{p.benchmark}</td>
                      <td className="p-3 border-b border-black text-black text-center">{p.inception}</td>
                      <td className="p-3 border-b border-black text-black text-center">{p.intl_domicile || p.gc_tax_treatment ? `${p.intl_domicile || ''} ${p.gc_denomination || ''}` : '—'}</td>
                      <td className="p-3 border-b border-black text-black text-center">{p.manager}</td>
                      <td className="p-3 border-b border-black text-black text-center">{p.managerExp}</td>
                      <td className="p-3 border-b border-black text-black text-center">{p.co_fund_manager}</td>
                      <td className="p-3 border-b border-black text-black text-center">{p.min_investment_label}</td>
                      <td className="p-3 border-b border-black text-black text-center">{p.lock || '—'}</td>
                      <td className="p-3 border-b border-black text-black text-center">{p.liquidity || '—'}</td>
                      <td className="p-3 border-b border-black text-black text-center">{p.exit_load || '—'}</td>
                      <td className="p-3 border-b border-black text-black text-center">{p.tax_implication || '—'}</td>
                      <td className="p-3 border-b border-black text-black text-center">{p.expRatio}</td>
                      <td className="p-3 border-b border-black text-left font-bold text-[#C9981A] bg-[#FAFAF8]">{p.trail ? p.trail + '%' : '—'}</td>
                      <td className="p-3 border-b border-black text-[11px] text-black text-center">{p.revModel}</td>
                      <td className="p-3 border-b border-black text-black text-center">{p.clawback || '—'}</td>
                      <td className="p-3 border-b border-black text-black text-center">{p.revSplit}</td>
                      <td className="p-3 border-b border-black text-[11px] text-black max-w-[200px] truncate text-center" title={p.notes}>{p.notes || '—'}</td>
                      <td className="p-3 border-b border-black text-center">
                        <div className="flex flex-wrap gap-1 w-[180px]">
                          {(p.elig || []).map(e => <span key={e} className={`inline-block px-2 py-0.5 rounded border text-[9px] font-medium uppercase tracking-wider ${ICM[e]?.cls || 'bg-gray-50 border-gray-200 text-gray-600'}`}>{ICM[e]?.lbl || e}</span>)}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div className="p-12 text-center text-[#6B6760] flex flex-col items-center">
                <IconSearchOff size={36} className="text-[#C8C4BC] mb-3" />
                <div className="text-lg font-light">No products match your filters</div>
                <div className="text-sm mt-1">Try broadening your search or resetting filters.</div>
              </div>
            )}
          </div>
        )}

        {/* TAB: FEE */}
        {activeTab === 'fee' && (
          <div className="bg-white shadow-sm border border-black overflow-x-auto p-1">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr>

                  <th className="p-3 bg-white border-b border-black text-[11px] font-bold uppercase tracking-wider text-black text-center">Product ID</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-bold uppercase tracking-wider text-black text-center">Product</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-bold uppercase tracking-wider text-black text-center">Type</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-bold uppercase tracking-wider text-black text-center">AMC</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-bold uppercase tracking-wider text-black text-center">Exp Ratio</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-bold uppercase tracking-wider text-black text-center">Trail</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-bold uppercase tracking-wider text-black text-center">Upfront</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-bold uppercase tracking-wider text-black text-center">Perf Fee</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-bold uppercase tracking-wider text-black text-center">Perf Share</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-bold uppercase tracking-wider text-black text-center">Rev model</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-bold uppercase tracking-wider text-black text-center">TV Rev Split</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-bold uppercase tracking-wider text-black text-center">Clawback</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-bold uppercase tracking-wider text-black text-center">Catchup</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-bold uppercase tracking-wider text-black text-center">HWM</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-bold uppercase tracking-wider text-black text-center">GST</th>
                  <th className="p-3 bg-white border-b border-black text-[11px] font-bold uppercase tracking-wider text-black text-center ">Fee classes</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-[#FAFAF8] transition">

                    <td className="p-3 border-b border-black text-black text-center">{p.id}</td>
                    <td className="p-3 border-b border-black font-semibold text-black text-center">{p.name}</td>
                    <td className="p-3 border-b border-black">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${(p.type || '').includes('PMS') ? 'bg-[#FDF8E7] text-[#C9981A] text-center' :
                        (p.type || '').includes('AIF') && !p.gift ? 'bg-purple-50 text-purple-600 text-center' :
                          p.gift ? 'bg-emerald-50 text-emerald-600 text-center' :
                            p.intl ? 'bg-orange-50 text-orange-600 text-center' : 'bg-rose-50 text-rose-600 text-center'
                        }`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="p-3 border-b border-black text-black text-center">{p.amc}</td>
                    <td className="p-3 border-b border-black text-center text-black">{p.expRatio ? p.expRatio + '%' : '—'}</td>
                    <td className="p-3 border-b border-black text-center font-bold text-black bg-[#FAFAF8]">{p.trail_comm_pct ? p.trail_comm_pct + '%' : '—'}</td>
                    <td className="p-3 border-b border-black text-center font-bold text-black bg-[#FAFAF8]">{p.upfront_comm_pct ? p.upfront_comm_pct + '%' : '—'}</td>
                    <td className="p-3 border-b border-black text-center font-bold text-black bg-[#FAFAF8]">{p.performance_fee_pct ? p.performance_fee_pct + '%' : '—'}</td>
                    <td className="p-3 border-b border-black text-center font-bold text-black bg-[#FAFAF8]">{p.perf_fee_share_pct ? p.perf_fee_share_pct + '%' : '—'}</td>
                    <td className="p-3 border-b border-black text-[11px] text-black">{p.revModel}</td>
                    <td className="p-3 border-b border-black text-center font-bold text-black bg-[#FAFAF8]">{p.tv_rev_split_pct ? p.tv_rev_split_pct + '%' : '—'}</td>
                    <td className="p-3 border-b border-black text-center text-black">{p.clawback || '—'}</td>
                    <td className="p-3 border-b border-black text-center text-black">{p.catchup_clause || '—'}</td>
                    <td className="p-3 border-b border-black text-[11px] text-black">{p.high_water_mark || '—'}</td>
                    <td className="p-3 border-b border-black text-[11px] text-black">{p.gst_applicable === 'Y' ? `${p.gst_percent || ''}%` : 'N'}</td>
                    <td className="p-3 border-b border-black text-center text-black font-medium">
                      {(() => {
                        if (!p.feeClasses || p.feeClasses.length === 0) return 0;
                        const fc = p.feeClasses[0];
                        let count = 0;
                        if (fc.cls && fc.cls !== '—') count++;
                        if (fc.cls2 && fc.cls2 !== '—') count++;
                        if (fc.cls3 && fc.cls3 !== '—') count++;
                        if (fc.cls4 && fc.cls4 !== '—') count++;
                        if (fc.cls5 && fc.cls5 !== '—') count++;
                        if (fc.cls6 && fc.cls6 !== '—') count++;
                        if (fc.cls7 && fc.cls7 !== '—') count++;
                        if (fc.cls8 && fc.cls8 !== '—') count++;
                        if (fc.cls9 && fc.cls9 !== '—') count++;
                        if (fc.cls10 && fc.cls10 !== '—') count++;
                        return count;
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: COMPARE */}
        {activeTab === 'compare' && (
          <div>
            {/* Sub-tabs: Product / Portfolio */}
            <div className="flex" style={{ borderBottom: '1px solid #E0DDD6' }}>
              {[
                { id: 'product', label: 'Product' },
                { id: 'portfolio', label: 'Portfolio' },
              ].map(t => (
                <div
                  key={t.id}
                  className={`px-4 py-2 text-sm cursor-pointer transition border-b-2 -mb-[1px] ${compareSubTab === t.id
                    ? 'border-[#C69F2C] text-black font-bold'
                    : 'border-transparent text-[#6B6760] font-medium hover:text-[#1A1A1A]'
                    }`}
                  onClick={() => setCompareSubTab(t.id)}
                >
                  {t.label}
                </div>
              ))}
            </div>

            <div className="mt-6">
              {compareProducts.length === 0 ? (
                <div className="py-16 px-6 rounded-2xl border-2 border-dashed border-[#E0DDD6] text-center text-[#6B6760] bg-[#FAFAF8]">
                  No products selected for comparison. Go to Product List and check the boxes next to the products you want to compare.
                </div>
              ) : (() => {
                const getMd = (productId) => monthlyDataByProduct[productId] || {};
                const fmtRet = (v) => {
                  if (v == null || v === '') return '—';
                  const n = parseFloat(v);
                  if (isNaN(n)) return '—';
                  return (n > 0 ? '+' : '') + n + '%';
                };
                const retClr = (v) => {
                  if (v == null || v === '') return '';
                  const n = parseFloat(v);
                  if (isNaN(n)) return '';
                  return n >= 0 ? 'text-green-700' : 'text-red-500';
                };

                const productRows = [
                  { label: 'Type', render: (p) => <span>{p.type || '—'}</span> },
                  { label: 'Strategy', render: (p) => <span>{p.category || '—'}</span> },
                  { label: 'AUM', render: (p) => <span>{p.aum ? Number(p.aum).toLocaleString() : '—'}</span> },
                  { label: '1M', render: (p) => { const v = getMd(p.id).return_1m; return <span className={retClr(v)}>{fmtRet(v)}</span>; } },
                  { label: '3M', render: (p) => { const v = getMd(p.id).return_3m; return <span className={retClr(v)}>{fmtRet(v)}</span>; } },
                  { label: '6M', render: (p) => { const v = getMd(p.id).return_6m; return <span className={retClr(v)}>{fmtRet(v)}</span>; } },
                  { label: '1Y Ret', render: (p) => <span className={retClr(p.ret1)}>{fmtRet(p.ret1)}</span> },
                  { label: '3Y Ret', render: (p) => <span className={retClr(p.ret3)}>{fmtRet(p.ret3)}</span> },
                  { label: '5Y Ret', render: (p) => <span className={retClr(p.ret5)}>{fmtRet(p.ret5)}</span> },
                ];

                const portfolioRows = [
                  { label: 'Portfolio PE', render: (p) => <span>{'—'}</span> },
                  { label: 'Large Cap%', render: (p) => { const md = getMd(p.id); return <span>{md.large_cap ? md.large_cap + '%' : '—'}</span>; } },
                  { label: 'Mid Cap%', render: (p) => { const md = getMd(p.id); return <span>{md.mid_cap ? md.mid_cap + '%' : '—'}</span>; } },
                  { label: 'Small Cap%', render: (p) => { const md = getMd(p.id); return <span>{md.small_cap ? md.small_cap + '%' : '—'}</span>; } },
                  { label: 'Cash%', render: (p) => { const md = getMd(p.id); return <span>{md.cash_percent ? md.cash_percent + '%' : '—'}</span>; } },
                  { label: 'Debt%', render: (p) => { const md = getMd(p.id); return <span>{md.debt_cap ? md.debt_cap + '%' : '—'}</span>; } },
                  {
                    label: 'Top 3\nHoldings', render: (p) => {
                      const md = getMd(p.id);
                      const items = [];
                      for (let i = 1; i <= 3; i++) {
                        const name = md[`holding_${i}`];
                        const pct = md[`holding_${i}_percent`];
                        if (name) items.push(<div key={i} className="text-xs leading-relaxed">{name} - {pct || 0}%</div>);
                      }
                      return items.length > 0 ? <div>{items}</div> : <span>—</span>;
                    }
                  },
                  {
                    label: 'Top 3\nSectors', render: (p) => {
                      const md = getMd(p.id);
                      const items = [];
                      for (let i = 1; i <= 3; i++) {
                        const name = md[`sector_${i}_name`];
                        const pct = md[`sector_${i}_percent`];
                        if (name) items.push(<div key={i} className="text-xs leading-relaxed">{name}-{pct || 0}%</div>);
                      }
                      return items.length > 0 ? <div>{items}</div> : <span>—</span>;
                    }
                  },
                  { label: 'Max DD', render: (p) => <span className={p.max_drawdown ? 'text-red-500' : ''}>{p.maxDD ? p.maxDD + '%' : '—'}</span> },
                  { label: 'Sharpe', render: (p) => <span>{p.sharpe || '—'}</span> },
                  { label: 'Sortino', render: (p) => <span>{p.sortino || '—'}</span> },
                  { label: 'Std Dev', render: (p) => <span>{p.stddev ? p.stddev + '%' : '—'}</span> },
                ];

                const rows = compareSubTab === 'product' ? productRows : portfolioRows;

                return (
                  <div className="border border-black overflow-x-auto bg-white">
                    {/* Header Row */}
                    <div className="flex">
                      <div className="w-[120px] min-w-[120px] border-r border-b border-black p-4 bg-white"></div>
                      {compareProducts.map((p, i) => (
                        <div key={p.id} className={`flex-1 min-w-[200px] border-b border-black p-4 text-center${i < compareProducts.length - 1 ? ' border-r' : ''}`} style={i < compareProducts.length - 1 ? { borderRightColor: 'black' } : {}}>
                          <div className="font-bold text-[#1A1A1A] text-sm leading-tight">{p.name}</div>
                          <div className="text-[11px] text-[#9E9A94] mt-1">{p.amc}</div>
                        </div>
                      ))}
                    </div>
                    {/* Data Rows */}
                    {rows.map((row, idx) => (
                      <div key={idx} className="flex">
                        <div className="w-[120px] min-w-[120px] border-r border-b border-black p-3 text-sm font-medium text-black flex items-center whitespace-pre-line">
                          {row.label}
                        </div>
                        {compareProducts.map((p, i) => (
                          <div key={p.id} className={`flex-1 min-w-[200px] border-b border-black p-3 text-sm text-center flex items-center justify-center${i < compareProducts.length - 1 ? ' border-r' : ''}`} style={i < compareProducts.length - 1 ? { borderRightColor: 'black' } : {}}>
                            {row.render(p)}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB: RISK */}
        {activeTab === 'risk' && (
          <div>
            <div className="flex items-center gap-6 mb-4 text-xs font-medium text-[#6B6760] bg-white p-3 rounded-lg border border-[#E0DDD6] shadow-sm">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-300"></div> X = Risk (Std Dev)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-300"></div> Y = Return (Sharpe)</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-[8px]"></div> Size = AUM</div>
            </div>
            <div className="relative w-full h-[500px] bg-white border border-[#E0DDD6] shadow-sm rounded-2xl p-6">
              <canvas id="rc" role="img" aria-label="Risk matrix bubble chart"></canvas>
            </div>
          </div>
        )}

        {/* TAB: MONTHLY DATA */}
        {activeTab === 'monthlydata' && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E0DDD6] overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94]">Edit</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94]">Delete</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94]">Product ID</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94]">Report Month</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">AUM (Cr)</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">1M %</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">3M %</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">6M %</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">1Y %</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">2Y %</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">3Y %</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Since Incep</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">YTM %</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Mod</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Bench Ret</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Sharpe</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Std Dev</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Up Capture</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Down Capture</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Beta</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Max Drawdown</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Calmar Ratio</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Positive Month</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Large Cap</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Mid Cap</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Small Cap</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Cash %</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Debt Cash</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Holdings count</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Holding 1</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Holding 1%</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Holding 2</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Holding 2%</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Holding 3</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Holding 3%</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Holding 4</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Holding 4%</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Holding 5</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Holding 5%</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Sector 1 Name</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Sector 1 %</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Sector 2 Name</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Sector 2 %</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Sector 3 Name</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Sector 3 %</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Sector 4 Name</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Sector 4 %</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Sector 5 Name</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Sector 5 %</th>
                  <th className="p-3 bg-[#FAFAF8] border-b border-[#E0DDD6] text-[11px] font-bold uppercase tracking-wider text-[#9E9A94] text-right">Source File Name</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((md, idx) => {
                  const r1 = parseFloat(md.return_1m);
                  const r3 = parseFloat(md.return_3m);
                  const r6 = parseFloat(md.return_6m);
                  const r1y = parseFloat(md.return_1y);

                  return (
                    <tr key={idx} className="hover:bg-[#FAFAF8] transition">
                      <td className="p-3 border-b border-[#E0DDD6]">
                        <button className="text-[#C9981A] hover:text-[#b38617] transition" title="Edit" onClick={() => handleEditMonthlyData(md)}>
                          <IconEdit size={16} />
                        </button>
                      </td>
                      <td className="p-3 border-b border-[#E0DDD6]">
                        <button className="text-red-500 hover:text-red-700 transition" title="Delete" onClick={() => handleDeleteProduct(md.product_id, md.product_id)}>
                          <IconTrash size={16} />
                        </button>
                      </td>
                      <td className="p-3 border-b border-[#E0DDD6] font-semibold text-gray-800">{md.product_id}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-gray-700">{md.report_month ? new Date(md.report_month).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.aum_cr || '—'}</td>                      <td className={`p-3 border-b border-[#E0DDD6] text-right font-medium ${r1 > 0 ? 'text-emerald-600' : r1 < 0 ? 'text-rose-600' : 'text-gray-500'}`}>{md.return_1m ? md.return_1m + '%' : '—'}</td>
                      <td className={`p-3 border-b border-[#E0DDD6] text-right font-medium ${r3 > 0 ? 'text-emerald-600' : r3 < 0 ? 'text-rose-600' : 'text-gray-500'}`}>{md.return_3m ? md.return_3m + '%' : '—'}</td>
                      <td className={`p-3 border-b border-[#E0DDD6] text-right font-medium ${r6 > 0 ? 'text-emerald-600' : r6 < 0 ? 'text-rose-600' : 'text-gray-500'}`}>{md.return_6m ? md.return_6m + '%' : '—'}</td>
                      <td className={`p-3 border-b border-[#E0DDD6] text-right font-medium ${r1y > 0 ? 'text-emerald-600' : r1y < 0 ? 'text-rose-600' : 'text-gray-500'}`}>{md.return_1y ? md.return_1y + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.return_2y ? md.return_2y + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.return_3y ? md.return_3y + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.since_inception ? md.since_inception + '%' : '—'} </td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.ytm ? md.ytm + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.mod_year ? md.mod_year : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.benchmark_return_sinceinception ? md.benchmark_return_sinceinception + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.benchmark_return_1m ? md.benchmark_return_1m + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.benchmark_return_3m ? md.benchmark_return_3m + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.benchmark_return_6m ? md.benchmark_return_6m + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.benchmark_return_1y ? md.benchmark_return_1y + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.benchmark_return_2y ? md.benchmark_return_2y + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.benchmark_return_3y ? md.benchmark_return_3y + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.benchmark_return_4y ? md.benchmark_return_4y + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.benchmark_return_5y ? md.benchmark_return_5y + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.sharpe_ratio || '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.std_dev || '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.up_capture || '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.down_capture || '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.beta || '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.max_drawdown || '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.calmar_ratio || '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.positive_months || '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.large_cap ? md.large_cap + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.mid_cap ? md.mid_cap + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.small_cap ? md.small_cap + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.cash_percent ? md.cash_percent + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.debt_cap ? md.debt_cap + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.holdings_count || '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.holding_1 || '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.holding_1_percent ? md.holding_1_percent + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.holding_2 || '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.holding_2_percent ? md.holding_2_percent + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.holding_3 || '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.holding_3_percent ? md.holding_3_percent + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.holding_4 || '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.holding_4_percent ? md.holding_4_percent + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.holding_5 || '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.holding_5_percent ? md.holding_5_percent + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.sector_1_name || '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.sector_1_percent ? md.sector_1_percent + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.sector_2_name || '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.sector_2_percent ? md.sector_2_percent + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.sector_3_name || '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.sector_3_percent ? md.sector_3_percent + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.sector_4_name || '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.sector_4_percent ? md.sector_4_percent + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.sector_5_name || '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.sector_5_percent ? md.sector_5_percent + '%' : '—'}</td>
                      <td className="p-3 border-b border-[#E0DDD6] text-right text-gray-700">{md.source_file_name || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Side Panel Overlay */}
      {selectedProduct && (
        <div
          className="fixed inset-0  bg-opacity-30 z-40 transition-opacity"
          onClick={() => setSelectedProduct(null)}
        />
      )}

      {/* Side Panel Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[1200px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${selectedProduct ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto`}>
        {selectedProduct && (
          <div className="p-8 pb-20 font-sans">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white transition z-10 bg-black/20 rounded-full p-1"
            >
              <IconX size={20} />
            </button>

            {/* HEADER */}
            <div className="bg-black text-white p-6 rounded-[20px] mb-8 relative">
              <div className="text-[9px] uppercase tracking-widest text-[#9E9A94] mb-1 font-bold">{selectedProduct.type}</div>
              <h2 className="text-[32px] font-serif font-bold mb-2 leading-tight text-white">{selectedProduct.name}</h2>
              <div className="text-sm text-[#9E9A94] flex gap-3 items-center">
                <span>{selectedProduct.category}</span>
                <span>{selectedProduct.approach}</span>
                <span>Inception: {selectedProduct.inception}</span>
              </div>
            </div>

            {/* TOP METRICS */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-3 text-center shadow-sm">
                <div className="text-[9px] uppercase font-bold tracking-wider text-gray-500 mb-1">AUM APR 2026</div>
                <div className="text-lg font-semibold text-black">₹{selectedMonthlyData[0]?.aum_cr ? Number(selectedMonthlyData[0].aum_cr).toLocaleString() : selectedProduct.aum?.toLocaleString()} Cr</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-3 text-center shadow-sm">
                <div className="text-[9px] uppercase font-bold tracking-wider text-gray-500 mb-1">BENCHMARK</div>
                <div className="text-lg font-semibold text-black truncate" title={selectedProduct.benchmark}>{selectedProduct.benchmark}</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-3 text-center shadow-sm">
                <div className="text-[9px] uppercase font-bold tracking-wider text-gray-500 mb-1">MIN INVEST</div>
                <div className="text-lg font-semibold text-black">{selectedProduct.min_investment_label}</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-3 text-center shadow-sm">
                <div className="text-[9px] uppercase font-bold tracking-wider text-gray-500 mb-1">CURRENCY</div>
                <div className="text-lg font-semibold text-black">{selectedProduct.currency}</div>
              </div>
            </div>

            {/* INVESTOR ELIGIBILITY */}
            <div className="mb-10">
              <h3 className="text-[13px] font-serif font-bold uppercase tracking-wider text-black mb-4">INVESTOR ELIGIBILITY</h3>
              <div className="flex flex-wrap gap-3">
                {(selectedProduct.elig && selectedProduct.elig.length > 0 ? selectedProduct.elig : ['Indian Resident', 'Institution', 'HNI']).map(e => {
                  let cls = "bg-gray-100 text-gray-600 border-gray-200";
                  if (e.includes("Indian Res") || e === 'Indian Resident') cls = "bg-[#B4B4FF] text-[#2525FF] border-[#9292FF]";
                  else if (e.includes("Institution")) cls = "bg-[#FFC0EB] text-[#FF2EBB] border-[#FF9FDF]";
                  else if (e.includes("HNI")) cls = "bg-[#FFA8A8] text-[#FF2525] border-[#FF8787]";
                  return <span key={e} className={`inline-block px-4 py-1.5 rounded-full border text-[11px] font-semibold ${cls}`}>{ICM[e]?.lbl || e}</span>
                })}
              </div>
            </div>

            {/* FEE CLASSES */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-[13px] font-serif font-bold uppercase tracking-wider text-black">FEE CLASSES</h3>
                <button className="text-[#C9981A] hover:text-[#b38617] transition" title="Edit" onClick={(e) => { e.stopPropagation(); if (selectedFeeClasses.length > 0) handleEditFeeClass(selectedFeeClasses[0]); }}>
                  <IconEdit size={16} />
                </button>
              </div>
              <div className="overflow-hidden">
                <table className="w-full text-[11px] font-medium">
                  <thead>
                    <tr>
                      <th className="pb-3 uppercase tracking-wider text-black font-bold border-b border-[#D4AF37] text-center">CLASS</th>
                      <th className="pb-3 uppercase tracking-wider text-black font-bold border-b border-[#D4AF37] text-center">Minimum Investment Label</th>
                      <th className="pb-3 uppercase tracking-wider text-black font-bold border-b border-[#D4AF37] text-center">Minimum Investment Amount</th>
                      <th className="pb-3 uppercase tracking-wider text-black font-bold border-b border-[#D4AF37] text-center">Maximum Investment Label</th>
                      <th className="pb-3 uppercase tracking-wider text-black font-bold border-b border-[#D4AF37] text-center">Maximum Investment Amount</th>
                      <th className="pb-3 uppercase tracking-wider text-black font-bold border-b border-[#D4AF37] text-center">Management Fee</th>
                      <th className="pb-3 uppercase tracking-wider text-black font-bold border-b border-[#D4AF37] text-center">Performance Fee</th>
                      <th className="pb-3 uppercase tracking-wider text-black font-bold border-b border-[#D4AF37] text-center">Hurdle Fee</th>
                      <th className="pb-3 uppercase tracking-wider text-black font-bold border-b border-[#D4AF37] text-center">High Water Mark</th>
                      <th className="pb-3 uppercase tracking-wider text-black font-bold border-b border-[#D4AF37] text-center">Crystallization Frequency</th>
                      <th className="pb-3 uppercase tracking-wider text-black font-bold border-b border-[#D4AF37] text-center">Lockin Period</th>
                      <th className="pb-3 uppercase tracking-wider text-black font-bold border-b border-[#D4AF37] text-center">Catch Up</th>
                      <th className="pb-3 uppercase tracking-wider text-black font-bold border-b border-[#D4AF37] text-center">Redemption Frequency</th>
                      <th className="pb-3 uppercase tracking-wider text-black font-bold border-b border-[#D4AF37] text-center">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFeeClasses.length > 0 ? selectedFeeClasses.map((fc, i) => (
                      <React.Fragment key={i}>
                        {fc.class_name && (
                          <tr className="border-b border-black last:border-0 ">
                            <td className="py-4 text-black uppercase text-center">{fc.class_name}</td>
                            <td className="py-4 text-black text-center">{fc.min_label || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.min_investment || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.max_label || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.max_investment || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.management_fee_percent ? `${fc.management_fee_percent}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.performance_fee_percent ? `${fc.performance_fee_percent}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.hurdle_percent ? `${fc.hurdle_percent}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.high_water_mark || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.crystallization_frequency || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.lockin_period || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.catch_up || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.redemption_frequency || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.notes || '—'}</td>
                          </tr>
                        )}
                        {fc.class_name2 && (
                          <tr className="border-b border-black last:border-0">
                            <td className="py-4 text-black uppercase text-center">{fc.class_name2}</td>
                            <td className="py-4 text-black text-center">{fc.min_label2 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.min_investment_amount2 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.max_label2 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.max_investment_amount2 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.management_fee_percent2 ? `${fc.management_fee_percent2}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.performance_fee_percent2 ? `${fc.performance_fee_percent2}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.hurdle_percent2 ? `${fc.hurdle_percent2}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.high_water_mark2 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.crystallization_frequency2 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.lockin_period2 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.catch_up2 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.redemption_frequency2 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.notes2 || '—'}</td>
                          </tr>
                        )}
                        {fc.class_name3 && (
                          <tr className="border-b border-black last:border-0">
                            <td className="py-4 text-black uppercase text-center">{fc.class_name3}</td>
                            <td className="py-4 text-black text-center">{fc.min_label3 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.min_investment_amount3 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.max_label3 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.max_investment_amount3 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.management_fee_percent3 ? `${fc.management_fee_percent3}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.performance_fee_percent3 ? `${fc.performance_fee_percent3}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.hurdle_percent3 ? `${fc.hurdle_percent3}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.high_water_mark3 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.crystallization_frequency3 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.lockin_period3 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.catch_up3 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.redemption_frequency3 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.notes3 || '—'}</td>
                          </tr>
                        )}
                        {fc.class_name4 && (
                          <tr className="border-b border-black last:border-0">
                            <td className="py-4 text-black uppercase">{fc.class_name4}</td>
                            <td className="py-4 text-black text-center">{fc.min_label4 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.min_investment_amount4 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.max_label4 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.max_investment_amount4 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.management_fee_percent4 ? `${fc.management_fee_percent4}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.performance_fee_percent4 ? `${fc.performance_fee_percent4}% ` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.hurdle_percent4 ? `${fc.hurdle_percent4}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.high_water_mark4 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.crystallization_frequency4 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.lockin_period4 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.catch_up4 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.redemption_frequency4 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.notes4 || '—'}</td>
                          </tr>
                        )}
                        {fc.class_name5 && (
                          <tr className="border-b border-black last:border-0">
                            <td className="py-4 text-black uppercase text-center">{fc.class_name5}</td>
                            <td className="py-4 text-black text-center">{fc.min_label5 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.min_investment_amount5 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.max_label5 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.max_investment_amount5 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.management_fee_percent5 ? `${fc.management_fee_percent5}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.performance_fee_percent5 ? `${fc.performance_fee_percent5}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.hurdle_percent5 ? `${fc.hurdle_percent5}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.high_water_mark5 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.crystallization_frequency5 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.lockin_period5 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.catch_up5 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.redemption_frequency5 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.notes5 || '—'}</td>
                          </tr>
                        )}
                        {fc.class_name6 && (
                          <tr className="border-b border-black last:border-0">
                            <td className="py-4 text-black uppercase text-center">{fc.class_name6}</td>
                            <td className="py-4 text-black text-center">{fc.min_label6 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.min_investment6 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.max_label6 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.max_investment6 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.management_fee_percent6 ? `${fc.management_fee_percent6}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.performance_fee_percent6 ? `${fc.performance_fee_percent6}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.hurdle_percent6 ? `${fc.hurdle_percent6}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.high_water_mark6 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.crystallization_frequency6 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.lockin_period6 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.catch_up6 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.redemption_frequency6 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.notes6 || '—'}</td>
                          </tr>
                        )}
                        {fc.class_name7 && (
                          <tr className="border-b border-black last:border-0">
                            <td className="py-4 text-black uppercase text-center">{fc.class_name7}</td>
                            <td className="py-4 text-black text-center">{fc.min_label7 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.min_investment7 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.max_label7 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.max_investment7 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.management_fee_percent7 ? `${fc.management_fee_percent7}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.performance_fee_percent7 ? `${fc.performance_fee_percent7}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.hurdle_percent7 ? `${fc.hurdle_percent7}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.high_water_mark7 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.crystallization_frequency7 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.lockin_period7 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.catch_up7 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.redemption_frequency7 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.notes7 || '—'}</td>
                          </tr>
                        )}
                        {fc.class_name8 && (
                          <tr className="border-b border-black last:border-0">
                            <td className="py-4 text-black uppercase text-center">{fc.class_name8}</td>
                            <td className="py-4 text-black text-center">{fc.min_label8 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.min_investment8 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.max_label8 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.max_investment8 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.management_fee_percent8 ? `${fc.management_fee_percent8}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.performance_fee_percent8 ? `${fc.performance_fee_percent8}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.hurdle_percent8 ? `${fc.hurdle_percent8}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.high_water_mark8 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.crystallization_frequency8 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.lockin_period8 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.catch_up8 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.redemption_frequency8 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.notes8 || '—'}</td>
                          </tr>
                        )}
                        {fc.class_name9 && (
                          <tr className="border-b border-black last:border-0">
                            <td className="py-4 text-black uppercase text-center">{fc.class_name9}</td>
                            <td className="py-4 text-black text-center">{fc.min_label9 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.min_investment9 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.max_label9 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.max_investment9 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.management_fee_percent9 ? `${fc.management_fee_percent9}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.performance_fee_percent9 ? `${fc.performance_fee_percent9}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.hurdle_percent9 ? `${fc.hurdle_percent9}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.high_water_mark9 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.crystallization_frequency9 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.lockin_period9 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.catch_up9 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.redemption_frequency9 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.notes9 || '—'}</td>
                          </tr>
                        )}
                        {fc.class_name10 && (
                          <tr className="border-b border-black last:border-0">
                            <td className="py-4 text-black uppercase text-center">{fc.class_name10}</td>
                            <td className="py-4 text-black text-center">{fc.min_label10 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.min_investment10 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.max_label10 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.max_investment10 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.management_fee_percent10 ? `${fc.management_fee_percent10}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.performance_fee_percent10 ? `${fc.performance_fee_percent10}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.hurdle_percent10 ? `${fc.hurdle_percent10}%` : '—'}</td>
                            <td className="py-4 text-black text-center">{fc.high_water_mark10 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.crystallization_frequency10 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.lockin_period10 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.catch_up10 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.redemption_frequency10 || '—'}</td>
                            <td className="py-4 text-black text-center">{fc.notes10 || '—'}</td>
                          </tr>
                        )}
                      </React.Fragment>
                    )) : (
                      <tr className="border-b border-gray-100">
                        <td colSpan="8" className="py-4 text-center text-gray-500">No fee classes configured</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            {/* MONTHLY PERFORMANCE */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-[13px] font-serif font-bold uppercase tracking-wider text-black">Monthly Performance</h3>
                <button className="text-[#C9981A] hover:text-[#b38617] transition" title="Edit" onClick={(e) => { e.stopPropagation(); if (selectedMonthlyData.length > 0) handleEditMonthlyData(selectedMonthlyData[0]); }}>
                  <IconEdit size={16} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">1Y</div>
                  <div className="text-xl font-bold text-green-600">{selectedMonthlyData[0]?.return_1y}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">2Y</div>
                  <div className="text-xl font-bold text-green-600">{selectedMonthlyData[0]?.return_2y}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">3Y</div>
                  <div className="text-xl font-bold text-green-600">{selectedMonthlyData[0]?.return_3y}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">5Y</div>
                  <div className="text-xl font-bold text-green-600">{selectedMonthlyData[0]?.return_5y}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">7Y</div>
                  <div className="text-xl font-bold text-green-600">{selectedMonthlyData[0]?.return_7y}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">10Y</div>
                  <div className="text-xl font-bold text-green-600">{selectedMonthlyData[0]?.return_10y}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">1M</div>
                  <div className="text-xl font-bold text-green-600">{selectedMonthlyData[0]?.return_1m}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">3M</div>
                  <div className="text-xl font-bold text-green-600">{selectedMonthlyData[0]?.return_3m}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">6M</div>
                  <div className="text-xl font-bold text-green-600">{selectedMonthlyData[0]?.return_6m}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">SINCE INCEP</div>
                  <div className="text-xl font-bold text-green-600">{selectedMonthlyData[0]?.since_inception}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">YTM</div>
                  <div className="text-xl font-bold text-green-600">{(selectedMonthlyData[0]?.ytm) || 0}%</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">Mod(Y)</div>
                  <div className="text-xl font-bold text-green-600">{(selectedMonthlyData[0]?.mod_year) || 0}</div>
                </div>
              </div>
            </div>

            {/* MONTHLY PERFORMANCE/BENCHMARK */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-[13px] font-serif font-bold uppercase tracking-wider text-black">Benchmark Performance</h3>
                <button className="text-[#C9981A] hover:text-[#b38617] transition" title="Edit" onClick={(e) => { e.stopPropagation(); if (selectedMonthlyData.length > 0) handleEditMonthlyData(selectedMonthlyData[0]); }}>
                  <IconEdit size={16} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">1M</div>
                  <div className="text-xl font-bold text-green-600">{selectedMonthlyData[0]?.benchmark_return_1m}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">3M</div>
                  <div className="text-xl font-bold text-green-600">{selectedMonthlyData[0]?.benchmark_return_3m}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">6M</div>
                  <div className="text-xl font-bold text-green-600">{selectedMonthlyData[0]?.benchmark_return_6m}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">1Y</div>
                  <div className="text-xl font-bold text-green-600">{selectedMonthlyData[0]?.benchmark_return_1y}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">2Y</div>
                  <div className="text-xl font-bold text-green-600">{selectedMonthlyData[0]?.benchmark_return_2y}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">3Y</div>
                  <div className="text-xl font-bold text-green-600">{selectedMonthlyData[0]?.benchmark_return_3y}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">4Y</div>
                  <div className="text-xl font-bold text-green-600">{selectedMonthlyData[0]?.benchmark_return_4y}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">5Y</div>
                  <div className="text-xl font-bold text-green-600">{selectedMonthlyData[0]?.benchmark_return_5y}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">Benchmark Sinceinception</div>
                  <div className="text-xl font-bold text-green-600">{selectedMonthlyData[0]?.benchmark_return_sinceinception}%</div>
                </div>
              </div>
            </div>

            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-[13px] font-serif font-bold uppercase tracking-wider text-black">CAPITAL ALLOCATION BREAKDOWN</h3>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">Large Cap</div>
                  <div className="text-xl font-bold text-green-600">{(selectedMonthlyData[0]?.large_cap) || 0}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">Mid Cap</div>
                  <div className="text-xl font-bold text-green-600">{(selectedMonthlyData[0]?.mid_cap) || 0}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">Small Cap</div>
                  <div className="text-xl font-bold text-green-600">{(selectedMonthlyData[0]?.small_cap) || 0}%</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">Debt Cap</div>
                  <div className="text-xl font-bold text-green-600">{(selectedMonthlyData[0]?.debt_cap) || 0}%</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">Other Cap</div>
                  <div className="text-xl font-bold text-green-600">{(selectedMonthlyData[0]?.other_cap) || 0}%</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">Cash</div>
                  <div className="text-xl font-bold text-green-600">{(selectedMonthlyData[0]?.cash_percent) || 0}%</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 border-t-[3px] border-t-[#D4AF37] p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-2">NAV</div>
                  <div className="text-xl font-bold text-green-600">{(selectedMonthlyData[0]?.nav) || 0}</div>
                </div>

              </div>
            </div>

            {/* RISK METRICS */}
            <div className="mb-10">
              <h3 className="text-[13px] font-serif font-bold uppercase tracking-wider text-black mb-4">RISK METRICS</h3>
              <div className="grid grid-cols-5 gap-3">
                <div className="bg-white rounded-lg border border-gray-200 p-3 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-1">SHARPE</div>
                  <div className="text-lg font-bold text-black">{(selectedMonthlyData[0]?.sharpe_ratio) > 0 ? '+' : ''}{selectedMonthlyData[0]?.sharpe_ratio}</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-3 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-1">SORTINO</div>
                  <div className="text-lg font-bold text-black">{(selectedMonthlyData[0]?.sortino_ratio) > 0 ? '+' : ''}{selectedMonthlyData[0]?.sortino_ratio}</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-3 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-1">ALPHA 1Y</div>
                  <div className="text-lg font-bold text-black">{(selectedMonthlyData[0]?.alpha_1y) > 0 ? '+' : ''}{selectedMonthlyData[0]?.alpha_1y}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-3 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-1">ALPHA 3Y</div>
                  <div className="text-lg font-bold text-black">{(selectedMonthlyData[0]?.alpha_3y) > 0 ? '+' : ''}{selectedMonthlyData[0]?.alpha_3y}%</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-3 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-1">BETA</div>
                  <div className="text-lg font-bold text-black">{(selectedMonthlyData[0]?.beta) > 0 ? '+' : ''}{selectedMonthlyData[0]?.beta}</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-3 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-1">PE RATIO</div>
                  <div className="text-lg font-bold text-black">{(selectedMonthlyData[0]?.pe_ratio) > 0 ? '+' : ''}{selectedMonthlyData[0]?.pe_ratio}</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-3 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-black mb-1">PB RATIO</div>
                  <div className="text-lg font-bold text-black">{(selectedMonthlyData[0]?.pb_ratio) > 0 ? '+' : ''}{selectedMonthlyData[0]?.pb_ratio}</div>
                </div>
              </div>
            </div>

            {/* CHARTS ROW */}
            <div className="grid grid-cols-2 gap-10">
              {/* SECTOR ALLOCATION */}
              <div>
                <h3 className="text-[13px] font-serif font-bold uppercase tracking-wider text-black mb-4 pb-2 border-b border-gray-800 text-center">SECTOR ALLOCATION</h3>
                <div className="flex flex-col gap-5 mt-6">
                  {/* Item 1 */}
                  <div className="relative">
                    <div className="flex justify-between text-[11px] text-black mb-1 font-medium">
                      <span>{selectedMonthlyData[0]?.sector_1_name || '—'}</span>
                      <span>{selectedMonthlyData[0]?.sector_1_percent ? `${selectedMonthlyData[0]?.sector_1_percent}%` : '—'}</span>
                    </div>
                    <div className="h-2 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${selectedMonthlyData[0]?.sector_1_percent || 0}%`, background: 'linear-gradient(to right, #F0C45C, #D4AF37)' }}></div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="flex justify-between text-[11px] text-black mb-1 font-medium">
                      <span>{selectedMonthlyData[0]?.sector_2_name || '—'}</span>
                      <span>{selectedMonthlyData[0]?.sector_2_percent ? `${selectedMonthlyData[0]?.sector_2_percent}%` : '—'}</span>
                    </div>
                    <div className="h-2 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${selectedMonthlyData[0]?.sector_2_percent || 0}%`, background: 'linear-gradient(to right, #F0C45C, #D4AF37)' }}></div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="flex justify-between text-[11px] text-black mb-1 font-medium">
                      <span>{selectedMonthlyData[0]?.sector_3_name || '—'}</span>
                      <span>{selectedMonthlyData[0]?.sector_3_percent ? `${selectedMonthlyData[0]?.sector_3_percent}%` : '—'}</span>
                    </div>
                    <div className="h-2 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${selectedMonthlyData[0]?.sector_3_percent || 0}%`, background: 'linear-gradient(to right, #F0C45C, #D4AF37)' }}></div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="flex justify-between text-[11px] text-black mb-1 font-medium">
                      <span>{selectedMonthlyData[0]?.sector_4_name || '—'}</span>
                      <span>{selectedMonthlyData[0]?.sector_4_percent ? `${selectedMonthlyData[0]?.sector_4_percent}%` : '—'}</span>
                    </div>
                    <div className="h-2 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${selectedMonthlyData[0]?.sector_4_percent || 0}%`, background: 'linear-gradient(to right, #F0C45C, #D4AF37)' }}></div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="flex justify-between text-[11px] text-black mb-1 font-medium">
                      <span>{selectedMonthlyData[0]?.sector_5_name || '—'}</span>
                      <span>{selectedMonthlyData[0]?.sector_5_percent ? `${selectedMonthlyData[0]?.sector_5_percent}%` : '—'}</span>
                    </div>
                    <div className="h-2 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${selectedMonthlyData[0]?.sector_5_percent || 0}%`, background: 'linear-gradient(to right, #F0C45C, #D4AF37)' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TOP HOLDINGS */}
              <div>
                <h3 className="text-[13px] font-serif font-bold uppercase tracking-wider text-black mb-4 pb-2 border-b border-gray-800 text-center">TOP HOLDINGS</h3>
                <div className="flex flex-col gap-4 mt-5">
                  <div className="flex items-center gap-3">
                    <div className="w-[80px] text-[10px] text-right font-medium text-black truncate leading-tight" title={selectedMonthlyData[0]?.holding_1 || ''}>{selectedMonthlyData[0]?.holding_1 || '—'}</div>
                    <div className="flex-grow h-4 bg-[#E5E7EB] overflow-hidden">
                      <div className="h-full" style={{ width: `${(selectedMonthlyData[0]?.holding_1_percent || 0) * 3}%`, background: 'linear-gradient(to right, #EAC872, #C9981A)' }}></div>
                    </div>
                    <div className="w-8 text-[9px] font-semibold text-black">{selectedMonthlyData[0]?.holding_1_percent ? `${selectedMonthlyData[0]?.holding_1_percent}%` : '—'}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-[80px] text-[10px] text-right font-medium text-black truncate leading-tight" title={selectedMonthlyData[0]?.holding_2 || ''}>{selectedMonthlyData[0]?.holding_2 || '—'}</div>
                    <div className="flex-grow h-4 bg-[#E5E7EB] overflow-hidden">
                      <div className="h-full" style={{ width: `${(selectedMonthlyData[0]?.holding_2_percent || 0) * 3}%`, background: 'linear-gradient(to right, #EAC872, #C9981A)' }}></div>
                    </div>
                    <div className="w-8 text-[9px] font-semibold text-black">{selectedMonthlyData[0]?.holding_2_percent ? `${selectedMonthlyData[0]?.holding_2_percent}%` : '—'}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-[80px] text-[10px] text-right font-medium text-black truncate leading-tight" title={selectedMonthlyData[0]?.holding_3 || ''}>{selectedMonthlyData[0]?.holding_3 || '—'}</div>
                    <div className="flex-grow h-4 bg-[#E5E7EB] overflow-hidden">
                      <div className="h-full" style={{ width: `${(selectedMonthlyData[0]?.holding_3_percent || 0) * 3}%`, background: 'linear-gradient(to right, #EAC872, #C9981A)' }}></div>
                    </div>
                    <div className="w-8 text-[9px] font-semibold text-black">{selectedMonthlyData[0]?.holding_3_percent ? `${selectedMonthlyData[0]?.holding_3_percent}%` : '—'}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-[80px] text-[10px] text-right font-medium text-black truncate leading-tight" title={selectedMonthlyData[0]?.holding_4 || ''}>{selectedMonthlyData[0]?.holding_4 || '—'}</div>
                    <div className="flex-grow h-4 bg-[#E5E7EB] overflow-hidden">
                      <div className="h-full" style={{ width: `${(selectedMonthlyData[0]?.holding_4_percent || 0) * 3}%`, background: 'linear-gradient(to right, #EAC872, #C9981A)' }}></div>
                    </div>
                    <div className="w-8 text-[9px] font-semibold text-black">{selectedMonthlyData[0]?.holding_4_percent ? `${selectedMonthlyData[0]?.holding_4_percent}%` : '—'}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-[80px] text-[10px] text-right font-medium text-black truncate leading-tight" title={selectedMonthlyData[0]?.holding_5 || ''}>{selectedMonthlyData[0]?.holding_5 || '—'}</div>
                    <div className="flex-grow h-4 bg-[#E5E7EB] overflow-hidden">
                      <div className="h-full" style={{ width: `${(selectedMonthlyData[0]?.holding_5_percent || 0) * 3}%`, background: 'linear-gradient(to right, #EAC872, #C9981A)' }}></div>
                    </div>
                    <div className="w-8 text-[9px] font-semibold text-black">{selectedMonthlyData[0]?.holding_5_percent ? `${selectedMonthlyData[0]?.holding_5_percent}%` : '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductManager;
