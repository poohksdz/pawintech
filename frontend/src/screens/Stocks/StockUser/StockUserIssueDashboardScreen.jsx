import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Col, Row, InputGroup, Tabs, Tab  } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import {   useGetStockIssueByUserQuery } from '../../../slices/stockIssueApiSlice';
import { useGetStockCategoriesQuery } from '../../../slices/stockCategoryApiSlice';
import { useGetStockSubcategoriesQuery } from '../../../slices/stockSubcategoryApiSlice';
import { useGetStockFootprintsQuery } from '../../../slices/stockFootprintApiSlice';
import { useGetStockManufacturesQuery } from '../../../slices/stockManufactureApiSlice';
import { useGetStockSuppliersQuery } from '../../../slices/stockSupplierApiSlice';
import Loader from '../../../components/Loader';
import Message from '../../../components/Message';
import { useNavigate } from 'react-router-dom';

const StockUserIssueDashboardScreen = () => {
  const navigate = useNavigate(); 
  const { data, isLoading, error } =   useGetStockIssueByUserQuery(); 
    const { data: categoryData = [] } = useGetStockCategoriesQuery();
    const { data: subcategoryData = [] } = useGetStockSubcategoriesQuery();
    const { data: footprintData = [] } = useGetStockFootprintsQuery();
    const { data: manufactureData = [] } = useGetStockManufacturesQuery();
    const { data: supplierData = [] } = useGetStockSuppliersQuery(); 
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
  
    const products = data?.issuegoods || [];

    // console.log(products)
 
  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    footprint: '',
    manufacturer: '', // was tab4 before
    supplier: '',     // was tab5 before
  });

useEffect(() => {
  let filtered = products;

  // Apply dropdown filters
  if (formData.category) {
    filtered = filtered.filter(p => p.category === formData.category);
  }
  if (formData.subcategory) {
    filtered = filtered.filter(p => p.subcategory === formData.subcategory);
  }
  if (formData.footprint) {
    filtered = filtered.filter(p => p.footprint === formData.footprint);
  }
  if (formData.manufacturer) {
  filtered = filtered.filter(p => p.manufacture === formData.manufacturer);
}
if (formData.supplier) {
    filtered = filtered.filter(p => p.supplier === formData.supplier);
  }

  // Apply search query filter
  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(item =>
      item.electotronixPN?.toLowerCase().includes(query) ||
      item.manufacturePN?.toLowerCase().includes(query) ||
      item.value?.toLowerCase().includes(query)
    );

    // Optional: sort filtered by startsWith match as before
    filtered = filtered.sort((a, b) => {
      const aMatch =
        (a.electotronixPN?.toLowerCase().startsWith(query) ? 1 : 0) +
        (a.manufacturePN?.toLowerCase().startsWith(query) ? 1 : 0) +
        (a.value?.toLowerCase().startsWith(query) ? 1 : 0);

      const bMatch =
        (b.electotronixPN?.toLowerCase().startsWith(query) ? 1 : 0) +
        (b.manufacturePN?.toLowerCase().startsWith(query) ? 1 : 0) +
        (b.value?.toLowerCase().startsWith(query) ? 1 : 0);

      return bMatch - aMatch;
    });
  }

  setFilteredProducts(filtered);
}, [formData, searchQuery, products]);
 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
    useEffect(() => {
      setFilteredProducts(products);
    }, [products]); 
  
  const handleSearch = () => {
    const query = searchQuery.toLowerCase();
  
    const result = products.filter((item) =>
      item.electotronixPN?.toLowerCase().includes(query) ||
      item.manufacturePN?.toLowerCase().includes(query) ||
      item.value?.toLowerCase().includes(query)
    );
  
    const sortedResult = result.sort((a, b) => {
      const aMatch =
        (a.electotronixPN?.toLowerCase().startsWith(query) ? 1 : 0) +
        (a.manufacturePN?.toLowerCase().startsWith(query) ? 1 : 0) +
        (a.value?.toLowerCase().startsWith(query) ? 1 : 0);
  
      const bMatch =
        (b.electotronixPN?.toLowerCase().startsWith(query) ? 1 : 0) +
        (b.manufacturePN?.toLowerCase().startsWith(query) ? 1 : 0) +
        (b.value?.toLowerCase().startsWith(query) ? 1 : 0);
  
      // higher startsWith match score first
      return bMatch - aMatch;
    });
  
    setFilteredProducts(sortedResult);
  };
 
  if (isLoading) return <Loader />;
  if (error) return <Message variant="danger">{error?.data?.message || error.error}</Message>;
 

  const containerStyle = {
    height: '70vh',
    overflowX: 'auto',   // enable horizontal scroll
    overflowY: 'auto',   // enable vertical scroll
    padding: '10px',
  };
 
  return (
    <>
    <Row className="align-items-center justify-content-between mb-3">
      <Col md="6">
        <div className="d-flex justify-content-between align-items-center"> 
          <h1 className="mb-0">Issued Components</h1>
        </div>
      </Col> 

      {/* Add Button on the right */}
      <Col md="4" className="text-end">
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button variant="primary" onClick={handleSearch}>
            <FaSearch />
          </Button>
        </InputGroup>
      </Col>
    </Row>

   <div className="row g-2 mb-3 mx-1" >
  {/* Tab 1 - Category */}
  <div className="col">
    <select
      className="form-select"
      name="category"
      value={formData.category}
      onChange={handleChange}
      required
    >
      <option value="">All Category</option>
      {categoryData.map((cat) => (
        <option key={cat.ID} value={cat.category}>
          {cat.category}
        </option>
      ))}
    </select>
  </div>

  {/* Tab 2 - Subcategory */}
  <div className="col">
    <select
      className="form-select"
      name="subcategory"
      value={formData.subcategory}
      onChange={handleChange}
      required
    >
      <option value="">All Subcategory</option>
      {subcategoryData.map((sub) => (
        <option key={sub.ID} value={sub.subcategory}>
          {sub.subcategory}
        </option>
      ))}
    </select>
  </div>

  {/* Tab 3 - Footprint */}
  <div className="col">
    <select
      className="form-select"
      name="footprint"
      value={formData.footprint}
      onChange={handleChange}
    >
      <option value="">All Footprint</option>
      {footprintData.map((fp) => (
        <option key={fp.ID} value={fp.namefootprint}>
          {fp.namefootprint}
        </option>
      ))} 
    </select>
  </div>

  {/* Tab 4 - Manufacturer */}
  <div className="col">
    <select
      className="form-select"
      name="manufacturer"
      value={formData.manufacturer}
      onChange={handleChange}
    >
      <option value="">All Manufacturer</option>
      {manufactureData.map((mfg) => (
        <option key={mfg.ID} value={mfg.namemanufacture}>
          {mfg.namemanufacture}
        </option>
      ))}
    </select>
  </div>

  {/* Tab 5 - Supplier */}
  <div className="col">
   <select
      className="form-select"
      name="supplier"
      value={formData.supplier}
      onChange={handleChange}
    >
      <option value="">All Supplier</option>
      {supplierData.map((sup) => (
        <option key={sup.ID} value={sup.namesupplier}>
          {sup.namesupplier}
        </option>
      ))}
    </select> 
  </div>
</div>


    <div style={containerStyle}>
      <Table
        striped
        bordered
        hover
        responsive={false}  // disable bootstrap’s responsive wrapper to prevent automatic overflow hiding
        className="table-sm center-table"
        // style={{ minWidth: '1200px' }} // optional: force min width so columns don’t shrink too much
      >
     <thead>
        <tr>
          <th className="py-2 mx-2">#</th>
          <th className="py-2 mx-2">IMAGE</th>
          <th className="py-2 mx-2">ISSUENO</th>
          <th className="py-2 mx-2">ISSUEDATE</th>
          <th className="py-2 mx-2">ISSUETIME</th>
          <th className="py-2 mx-2">ISSUEQUANTITY</th>
          <th className="py-2 mx-2">REQUESTNO</th>
          <th className="py-2 mx-2">REQUESTDATE</th>
          <th className="py-2 mx-2">REQUESTTIME</th>
          <th className="py-2 mx-2">REQUESTQUANTITY</th>
          <th className="py-2 mx-2">PW(P/N)</th>
          <th className="py-2 mx-2">VALUE</th>
          <th className="py-2 mx-2">CATEGORY</th>
          <th className="py-2 mx-2">SUBCATEGORY</th>
          <th className="py-2 mx-2">FOOTPRINT</th>
          <th className="py-2 mx-2">POSITION</th>
          <th className="py-2 mx-2">WEIGHT</th>
          <th className="py-2 mx-2">PRICE</th>
          <th className="py-2 mx-2">MANUFACTURE</th>
          <th className="py-2 mx-2">MANUFACTUREPN</th>
          <th className="py-2 mx-2">SUPPLIER</th>
          <th className="py-2 mx-2">SUPPLIERPN</th>
          <th className="py-2 mx-2">MOQ</th>
          <th className="py-2 mx-2">SPQ</th>
          <th className="py-2 mx-2">LINK</th>
          <th className="py-2 mx-2">ALTERNATIVE</th>
          <th className="py-2 mx-2">DESCRIPTION</th>
          <th className="py-2 mx-2">PROCESS</th>
          <th className="py-2 mx-2">NOTE</th> 
          <th className="py-2 mx-2">DETAILS</th> 
        </tr>
      </thead>
        <tbody>
          {filteredProducts.map((p, index) => (
            <tr key={p.ID}>
                <td>{index + 1}</td>
              <td>
                {p.img ? (
                  <img
                    src={`/componentImages${p.img}`}
                    alt="product"
                    width="50"
                    height="50"
                    style={{ objectFit: 'contain' }}
                  />
                ) : (
                  'No Image'
                )}
              </td>
              <td>{p.issueno}</td>
              <td>{p.issuedate}</td>
              <td>{p.issuetime}</td>
              <td>{p.issueqty}</td> 
              <td>{p.requestno}</td>
              <td>{p.requestdate}</td>
              <td>{p.requesttime}</td>
              <td>{p.requestqty}</td> 
              <td>{p.electotronixPN}</td>
              <td className="wrap-text">{p.value}</td>
              <td className="wrap-text">{p.category}</td>
              <td>{p.subcategory}</td>
              <td>{p.footprint}</td>
              <td>{p.position}</td>
              <td>{p.weight}</td> 
              <td>{p.unitprice}</td>
              <td>{p.manufacture}</td>
              <td>{p.manufacturePN}</td>
              <td>{p.supplier}</td>
              <td>{p.supplierPN}</td>
              <td>{p.moq}</td>
              <td>{p.spq}</td>
              <td className="wrap-text">{p.link}</td>
<td className="wrap-text">{p.alternative}</td>
<td className="wrap-text">{p.description}</td>
<td className="wrap-text">{p.process}</td>
<td className="wrap-text">{p.note}</td>
                <td>
                  <Button
                    variant="info"
                    className="btn-sm text-white"
                    onClick={() => navigate(`/componentissuelist/${p.ID}`)}
                  >
                    More
                  </Button>
                </td> 
            </tr>
          ))}
        </tbody>
      </Table>
    </div> 
    </>
  );
}; 
 
export default StockUserIssueDashboardScreen