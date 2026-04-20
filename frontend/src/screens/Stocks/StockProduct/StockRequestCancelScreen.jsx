import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Button, Form, Col, Row, InputGroup } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import { useGetStockRequestCancelByUserQuery } from "../../../slices/stockRequestApiSlice";
import { useGetStockProductsQuery } from "../../../slices/stockProductApiSlice";
import { useGetStockCategoriesQuery } from "../../../slices/stockCategoryApiSlice";
import { useGetStockSubcategoriesQuery } from "../../../slices/stockSubcategoryApiSlice";
import { useGetStockFootprintsQuery } from "../../../slices/stockFootprintApiSlice";
import { useGetStockManufacturesQuery } from "../../../slices/stockManufactureApiSlice";
import { useGetStockSuppliersQuery } from "../../../slices/stockSupplierApiSlice";
import Loader from "../../../components/Loader";
import Message from "../../../components/Message";
import { useNavigate } from "react-router-dom";

const StockUserRequestCancelScreen = () => {
  const { userInfo } = useSelector((state) => state.auth);

  const { data, isLoading, error } = useGetStockRequestCancelByUserQuery(
    userInfo._id,
  );

  const { data: existingQty } = useGetStockProductsQuery();
  const { data: categoryData = [] } = useGetStockCategoriesQuery();
  const { data: subcategoryData = [] } = useGetStockSubcategoriesQuery();
  const { data: footprintData = [] } = useGetStockFootprintsQuery();
  const { data: manufactureData = [] } = useGetStockManufacturesQuery();
  const { data: supplierData = [] } = useGetStockSuppliersQuery();

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [formData, setFormData] = useState({
    category: "",
    subcategory: "",
    footprint: "",
    manufacturer: "",
    supplier: "",
  });

  const products = data?.requestcancels || [];

  // console.log(data)

  useEffect(() => {
    let filtered = [...products];

    if (formData.category)
      filtered = filtered.filter((p) => p.category === formData.category);
    if (formData.subcategory)
      filtered = filtered.filter((p) => p.subcategory === formData.subcategory);
    if (formData.footprint)
      filtered = filtered.filter((p) => p.footprint === formData.footprint);
    if (formData.manufacturer)
      filtered = filtered.filter(
        (p) => p.manufacture === formData.manufacturer,
      );
    if (formData.supplier)
      filtered = filtered.filter((p) => p.supplier === formData.supplier);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.electotronixPN?.toLowerCase().includes(query) ||
          item.manufacturePN?.toLowerCase().includes(query) ||
          item.value?.toLowerCase().includes(query),
      );
    }

    setFilteredProducts(filtered);
  }, [formData, searchQuery, products]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoading) return <Loader />;
  if (error)
    return (
      <Message variant="danger">{error?.data?.message || error.error}</Message>
    );

  const containerStyle = {
    height: "70vh",
    overflowX: "auto",
    overflowY: "auto",
    padding: "10px",
  };

  return (
    <>
      <Row className="align-items-center justify-content-between mb-3">
        <Col md="6">
          <h1 className="mb-0">My Canceled Requests</h1>
        </Col>
        <Col md="4" className="text-end">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="primary">
              <FaSearch />
            </Button>
          </InputGroup>
        </Col>
      </Row>

      {/* Filters */}
      <div className="row g-2 mb-3 mx-1">
        <div className="col">
          <select
            className="form-select"
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="">All Category</option>
            {categoryData.map((cat) => (
              <option key={cat.ID} value={cat.category}>
                {cat.category}
              </option>
            ))}
          </select>
        </div>
        <div className="col">
          <select
            className="form-select"
            name="subcategory"
            value={formData.subcategory}
            onChange={handleChange}
            style={{
              backgroundColor: formData.category ? "white" : "#e9ecef",
              pointerEvents: formData.category ? "auto" : "none",
            }}
          >
            <option value="">All Subcategory</option>
            {subcategoryData
              .filter((sub) => sub.category === formData.category)
              .map((sub) => (
                <option key={sub.ID} value={sub.subcategory}>
                  {sub.subcategory}
                </option>
              ))}
          </select>
        </div>
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

      {/* Table */}
      <div style={containerStyle}>
        <Table striped bordered hover className="table-sm center-table">
          <thead>
            <tr>
              <th>#</th>
              <th>FROM</th>
              <th>IMPORTANCEREASON</th>
              <th>CANCELREASON</th>
              <th>IMAGE</th>
              <th>REQUESTNO</th>
              <th>REQUESTDATE</th>
              <th>REQUESTTIME</th>
              <th>REQUESTQUANTITY</th>
              <th>EXISTINGQUANTITY</th>
              <th>PW(P/N)</th>
              <th>VALUE</th>
              <th>CATEGORY</th>
              <th>SUBCATEGORY</th>
              <th>FOOTPRINT</th>
              <th>POSITION</th>
              <th>WEIGHT</th>
              <th>PRICE</th>
              <th>MANUFACTURE</th>
              <th>MANUFACTUREPN</th>
              <th>SUPPLIER</th>
              <th>SUPPLIERPN</th>
              <th>MOQ</th>
              <th>SPQ</th>
              <th>LINK</th>
              <th>ALTERNATIVE</th>
              <th>DESCRIPTION</th>
              <th>PROCESS</th>
              <th>NOTE</th>
              <th>DETAILS</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p, index) => (
              <tr key={p.ID}>
                <td>{index + 1}</td>
                <td>{p.requestedUser}</td>
                <td>{p.important_message}</td>
                <td>{p.cancel_message}</td>
                <td>
                  {p.img ? (
                    <img
                      src={p.img}
                      alt="product"
                      width="50"
                      height="50"
                      style={{ objectFit: "contain" }}
                    />
                  ) : (
                    "No Image"
                  )}
                </td>
                <td>{p.requestno}</td>
                <td>{p.requestdate}</td>
                <td>{p.requesttime}</td>
                <td>{p.requestqty}</td>
                <td>
                  {existingQty?.products?.find(
                    (prod) => prod.electotronixPN === p.electotronixPN,
                  )?.quantity || 0}
                </td>
                <td>{p.electotronixPN}</td>
                <td>{p.value}</td>
                <td>{p.category}</td>
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
                <td>{p.link}</td>
                <td>{p.alternative}</td>
                <td>{p.description}</td>
                <td>{p.process}</td>
                <td>{p.note}</td>
                <td>
                  <Button
                    variant="info"
                    className="btn-sm text-white"
                    onClick={() => {}}
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

export default StockUserRequestCancelScreen;
