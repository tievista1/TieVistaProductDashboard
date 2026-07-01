import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IconX, IconEdit, IconTrash, IconPlus, IconCheck } from '@tabler/icons-react';

const AmcPanel = ({ isOpen, onClose }) => {
  const [amcs, setAmcs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingAmc, setEditingAmc] = useState(null);
  const [formData, setFormData] = useState({});

  const fetchAmcs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://product.tievista.com/api/amcs');
      setAmcs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAmcs();
      setEditingAmc(null);
    }
  }, [isOpen]);

  const handleEdit = (amc) => {
    setFormData(amc);
    setEditingAmc(amc);
  };

  const handleAdd = () => {
    setFormData({
      amc_name: '', type_name: '', sebi_reg_no: '', hq_city: '', 
      established_year: '', website: '', email: '', phone: '', description: ''
    });
    setEditingAmc({}); // Empty means new
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this AMC?")) return;
    try {
      await axios.delete(`https://product.tievista.com/api/amcs/${id}`);
      fetchAmcs();
    } catch (err) {
      console.error(err);
      alert("Failed to delete AMC: Might be assigned to product");
    }
  };

  const handleSave = async () => {
    try {
      if (formData.id) {
        // update
        await axios.put(`https://product.tievista.com/api/amcs/${formData.id}`, formData);
      } else {
        // create
        await axios.post('https://product.tievista.com/api/amcs', formData);
      }
      setEditingAmc(null);
      fetchAmcs();
    } catch (err) {
      console.error(err);
      alert("Failed to save AMC");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">AMC Management</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition">
            <IconX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F8F7F4]">
          {editingAmc ? (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{formData.id ? 'Edit AMC' : 'Add New AMC'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'amc_name', label: 'AMC Name *' },
                  { key: 'type_name', label: 'Type Name' },
                  { key: 'sebi_reg_no', label: 'SEBI Reg No' },
                  { key: 'hq_city', label: 'HQ City' },
                  { key: 'established_year', label: 'Established Year', type: 'number' },
                  { key: 'website', label: 'Website' },
                  { key: 'email', label: 'Email' },
                  { key: 'phone', label: 'Phone' }
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{field.label}</label>
                    <input 
                      type={field.type || 'text'}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-[#D4AF37]"
                      value={formData[field.key] || ''}
                      onChange={e => setFormData({...formData, [field.key]: e.target.value})}
                    />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                  <textarea 
                    className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-[#D4AF37]"
                    rows="3"
                    value={formData.description || ''}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button 
                  onClick={() => setEditingAmc(null)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-[#D4AF37] text-white hover:bg-[#b38617] transition flex items-center gap-2"
                >
                  <IconCheck size={16} /> Save AMC
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-end mb-4">
                <button 
                  onClick={handleAdd}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-[#D4AF37] text-white hover:bg-[#b38617] transition flex items-center gap-2 shadow-sm"
                >
                  <IconPlus size={16} /> Add New AMC
                </button>
              </div>
              
              {loading ? (
                <div className="text-center py-10 text-gray-500">Loading AMCs...</div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="p-3 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">Actions</th>
                          <th className="p-3 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">AMC Name</th>
                          <th className="p-3 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">Type</th>
                          <th className="p-3 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">SEBI Reg</th>
                          <th className="p-3 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">HQ City</th>
                          <th className="p-3 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">Est. Year</th>
                          <th className="p-3 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">Website</th>
                          <th className="p-3 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">Email</th>
                          <th className="p-3 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">Phone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {amcs.map(amc => (
                          <tr key={amc.id} className="hover:bg-gray-50 transition border-b border-gray-100 last:border-0">
                            <td className="p-3 flex gap-2">
                              <button onClick={() => handleEdit(amc)} className="text-[#C9981A] hover:text-[#b38617]" title="Edit"><IconEdit size={16}/></button>
                              <button onClick={() => handleDelete(amc.id)} className="text-red-500 hover:text-red-700" title="Delete"><IconTrash size={16}/></button>
                            </td>
                            <td className="p-3 font-medium text-gray-800">{amc.amc_name || '—'}</td>
                            <td className="p-3 text-gray-600">{amc.type_name || '—'}</td>
                            <td className="p-3 text-gray-600">{amc.sebi_reg_no || '—'}</td>
                            <td className="p-3 text-gray-600">{amc.hq_city || '—'}</td>
                            <td className="p-3 text-gray-600">{amc.established_year || '—'}</td>
                            <td className="p-3 text-blue-600 hover:underline">
                              {amc.website ? <a href={amc.website.startsWith('http') ? amc.website : `http://${amc.website}`} target="_blank" rel="noreferrer">{amc.website}</a> : '—'}
                            </td>
                            <td className="p-3 text-gray-600">{amc.email || '—'}</td>
                            <td className="p-3 text-gray-600">{amc.phone || '—'}</td>
                          </tr>
                        ))}
                        {amcs.length === 0 && (
                          <tr><td colSpan="9" className="p-6 text-center text-gray-500">No AMCs found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AmcPanel;