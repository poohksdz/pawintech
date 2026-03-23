import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button } from 'react-bootstrap';
import { FaSearch, FaHistory, FaFilter, FaTimes, FaBoxOpen } from 'react-icons/fa';
import { useGetStockIssueByUserQuery } from '../../../slices/stockIssueApiSlice';
import { useGetStockCategoriesQuery } from '../../../slices/stockCategoryApiSlice';
import { useGetStockManufacturesQuery } from '../../../slices/stockManufactureApiSlice';
import Loader from '../../../components/Loader';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const StockUserIssueDashboardScreen = () => {
    const navigate = useNavigate(); 
    const { userInfo } = useSelector((state) => state.auth);
    const { data, isLoading } = useGetStockIssueByUserQuery(userInfo._id); 
    const { data: categoryData = [] } = useGetStockCategoriesQuery();
    const { data: manufactureData = [] } = useGetStockManufacturesQuery();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({ category: '', manufacturer: '' });
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showSidebar, setShowSidebar] = useState(false);
    
    // Fix: ใช้ useMemo เพื่อแก้ warning เรื่อง dependency
    const products = useMemo(() => data || [], [data]);
 
    useEffect(() => {
        let filtered = products;
        
        // Filter Logic
        if (formData.category) {
            filtered = filtered.filter(p => p.category === formData.category);
        }
        if (formData.manufacturer) {
            filtered = filtered.filter(p => p.manufacture === formData.manufacturer);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(p => 
                p.electotronixPN?.toLowerCase().includes(q) || 
                p.issueno?.toLowerCase().includes(q)
            );
        }
        setFilteredProducts(filtered);
    }, [formData, searchQuery, products]);

    if (isLoading) return <Loader />;

    return (
        <div className="pawin-dashboard-layout">
            {/* Sidebar Filter */}
            <div className={`pawin-sidebar ${showSidebar ? 'active' : ''}`}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0 fw-bold text-dark"><FaFilter className="me-2 text-warning"/> FILTERS</h5>
                    <Button variant="link" className="p-0 text-muted d-lg-none" onClick={() => setShowSidebar(false)}>
                        <FaTimes/>
                    </Button>
                </div>
                
                <div className="search-wrapper">
                    <FaSearch className="search-icon-pos"/>
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="Search Issue No..." 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)} 
                    />
                </div>

                <div className="filter-group">
                    <label className="filter-label">Category</label>
                    <select 
                        className="filter-select" 
                        value={formData.category} 
                        onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                        <option value="">All</option>
                        {categoryData.map(c => <option key={c.ID} value={c.category}>{c.category}</option>)}
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Manufacturer</label>
                    <select 
                        className="filter-select" 
                        value={formData.manufacturer} 
                        onChange={e => setFormData({...formData, manufacturer: e.target.value})}
                    >
                        <option value="">All</option>
                        {manufactureData.map(m => <option key={m.ID} value={m.namemanufacture}>{m.namemanufacture}</option>)}
                    </select>
                </div>

                <Button 
                    variant="outline-warning" 
                    size="sm" 
                    className="w-100 mt-3" 
                    onClick={() => {setFormData({category:'', manufacturer:''}); setSearchQuery('')}}
                >
                    Clear Filters
                </Button>
            </div>

            {/* Main Content */}
            <div className="pawin-content">
                <div className="content-header-bar">
                    <div className="page-title text-warning">
                        <FaHistory/> My Issued Components
                        <span className="status-badge badge-neutral ms-2 text-dark border">{filteredProducts.length} Records</span>
                    </div>
                    <Button variant="outline-secondary" className="d-lg-none" onClick={() => setShowSidebar(true)}>
                        <FaFilter/>
                    </Button>
                </div>

                <div className="table-card">
                    {/* ใช้ wrapper เพื่อให้ Scroll แนวนอนได้ เพราะ Column เยอะ */}
                    <div className="table-responsive-wrapper">
                        <Table className="clean-table" hover style={{minWidth: '1500px'}}>
                            <thead>
                                <tr>
                                    <th style={{width:'50px'}}>#</th>
                                    <th style={{width:'60px'}} className="text-center">Image</th>
                                    <th>Issue No</th>
                                    <th>Date</th>
                                    <th>Part Number</th>
                                    <th>Value</th>
                                    <th>Category</th>
                                    <th>Footprint</th>
                                    <th>Manufacturer</th>
                                    <th className="text-center">Req Qty</th>
                                    <th className="text-center">Issued</th>
                                    <th className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((p, i) => (
                                    <tr key={p.ID}>
                                        <td className="text-muted text-center">{i + 1}</td>
                                        <td className="text-center">
                                            {p.img ? <img src={`/componentImages${p.img}`} className="product-img" alt="img"/> : <div className="no-img-placeholder"><FaBoxOpen/></div>}
                                        </td>
                                        <td>
                                            <span 
                                                className="text-primary-link font-mono" 
                                                onClick={() => navigate(`/componentissuelist/${p.ID}`)}
                                            >
                                                {p.issueno}
                                            </span>
                                        </td>
                                        <td className="text-muted small">
                                            {p.issuedate} <br/> {p.issuetime}
                                        </td>
                                        <td>
                                            <span className="fw-bold text-dark">{p.electotronixPN || p.manufacturePN}</span>
                                        </td>
                                        <td>{p.value}</td>
                                        <td>{p.category}</td>
                                        <td>{p.footprint}</td>
                                        <td>{p.manufacture}</td>
                                        <td className="text-center">{p.requestqty}</td>
                                        <td className="text-center">
                                            <span className="status-badge badge-warning">-{p.issueqty}</span>
                                        </td>
                                        <td className="text-center">
                                            <Button 
                                                variant="info" 
                                                size="sm" 
                                                className="text-white px-3" 
                                                onClick={() => navigate(`/componentissuelist/${p.ID}`)}
                                            >
                                                Details
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <tr>
                                        <td colSpan="12" className="text-center py-5 text-muted">
                                            No issued records found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockUserIssueDashboardScreen;