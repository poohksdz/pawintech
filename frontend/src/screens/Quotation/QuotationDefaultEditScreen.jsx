import React, { useState, useEffect } from "react";
import {
  useUpdateDefaultQuotationMutation,
  useUploadDefaultQuotationImageMutation,
  useGetDefaultQuotationDetailsQuery,
} from "../../slices/quotationDefaultApiSlice";
import { toast } from "react-toastify";
import { useNavigate, useParams, Link } from "react-router-dom";
import Loader from "../../components/Loader";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { FaArrowLeft, FaImage } from "react-icons/fa";

const QuotationDefaultEditScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data, isLoading: loadingData } =
    useGetDefaultQuotationDetailsQuery(id);
  const [updateDefaultQuotation, { isLoading: updating }] =
    useUpdateDefaultQuotationMutation();
  const [uploadImage] = useUploadDefaultQuotationImageMutation();

  // console.log(data)

  // Company info
  const [companyName, setCompanyName] = useState("");
  const [companyNameThai, setCompanyNameThai] = useState("");
  const [headOffice, setHeadOffice] = useState("");
  const [headOfficeThai, setHeadOfficeThai] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [taxId, setTaxId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [vat, setVat] = useState(7);
  const [branchName, setBranchName] = useState("Head Office");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [deposit, setDeposit] = useState("");

  // File + preview states
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [buyerApproves, setBuyerApproves] = useState(null);
  const [buyerApprovesPreview, setBuyerApprovesPreview] = useState(null);
  const [salesPerson, setSalesPerson] = useState(null);
  const [salesPersonPreview, setSalesPersonPreview] = useState(null);
  const [salesManager, setSalesManager] = useState(null);
  const [salesManagerPreview, setSalesManagerPreview] = useState(null);

  // Modal zoom
  const [modalShow, setModalShow] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  // Load existing data into state
  useEffect(() => {
    if (data && data.quotation) {
      const q = data.quotation;

      // Existing fields
      setCompanyName(q.company_name || "");
      setCompanyNameThai(q.company_name_thai || "");
      setHeadOffice(q.head_office || "");
      setHeadOfficeThai(q.head_office_thai || "");
      setTel(q.tel || "");
      setEmail(q.email || "");
      setTaxId(q.tax_id || "");
      setDiscount(q.discount || 0);
      setVat(q.vat || 7);
      setBranchName(q.branch_name || "Head Office");

      setLogoPreview(q.logo || null);
      setBuyerApprovesPreview(q.buyer_approves || null);
      setSalesPersonPreview(q.sales_person || null);
      setSalesManagerPreview(q.sales_manager || null);

      // New fields
      setBankAccountName(q.bank_account_name || "");
      setBankAccountNumber(q.bank_account_number || "");
      setDeposit(q.deposit || "");
    }
  }, [data]);

  // Handle file selection & preview
  const handleFileChange = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // Handle image modal
  const handlePreviewClick = (src) => {
    setModalImage(src);
    setModalShow(true);
  };

  // Upload image to backend
  const handleUploadImage = async (file, type) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    try {
      const res = await uploadImage(formData).unwrap();
      return res.url;
    } catch (err) {
      toast.error(`Failed to upload ${type} image`);
      return null;
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    const logoUrl = logo ? await handleUploadImage(logo, "logo") : logoPreview;
    const buyerUrl = buyerApproves
      ? await handleUploadImage(buyerApproves, "buyer")
      : buyerApprovesPreview;
    const salesPersonUrl = salesPerson
      ? await handleUploadImage(salesPerson, "salesPerson")
      : salesPersonPreview;
    const salesManagerUrl = salesManager
      ? await handleUploadImage(salesManager, "salesManager")
      : salesManagerPreview;

    try {
      await updateDefaultQuotation({
        id,
        company_name: companyName,
        company_name_thai: companyNameThai,
        head_office: headOffice,
        head_office_thai: headOfficeThai,
        tel,
        email,
        tax_id: taxId,
        discount,
        vat,
        branch_name: branchName,
        logo: logoUrl,
        buyer_approves: buyerUrl,
        sales_person: salesPersonUrl,
        sales_manager: salesManagerUrl,
        bank_account_name: bankAccountName,
        bank_account_number: bankAccountNumber,
        deposit: deposit,
      }).unwrap();

      toast.success("Default Quotation updated successfully");
      navigate("/admin/defaultquotations");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update Default Quotation");
    }
  };

  const Thumbnail = ({ src }) => (
    <div
      className="relative group mt-3 w-24 h-24 rounded-lg border border-slate-200 overflow-hidden cursor-pointer hover:border-blue-500 transition-colors shadow-sm"
      onClick={() => handlePreviewClick(src)}
    >
      <img src={src} alt="Preview" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <FaImage className="text-white text-xl" />
      </div>
    </div>
  );

  if (loadingData)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/admin/defaultquotations"
            className="p-2 bg-white text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shadow-sm border border-slate-200"
          >
            <FaArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Edit Default Quotation
            </h2>
            {updating && <Loader />}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
          {/* Images Section */}
          <div className="bg-white shadow-sm border border-slate-200 rounded-3xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 pb-2 border-b border-slate-100">
              Branding & Signatures
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Company Logo
                </label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => handleFileChange(e, setLogo, setLogoPreview)}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 transition-colors cursor-pointer"
                />
                {logoPreview && <Thumbnail src={logoPreview} />}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Buyer Approves
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(
                      e,
                      setBuyerApproves,
                      setBuyerApprovesPreview,
                    )
                  }
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 transition-colors cursor-pointer"
                />
                {buyerApprovesPreview && (
                  <Thumbnail src={buyerApprovesPreview} />
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Sales Person
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(e, setSalesPerson, setSalesPersonPreview)
                  }
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 transition-colors cursor-pointer"
                />
                {salesPersonPreview && <Thumbnail src={salesPersonPreview} />}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Sales Manager
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(e, setSalesManager, setSalesManagerPreview)
                  }
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 transition-colors cursor-pointer"
                />
                {salesManagerPreview && <Thumbnail src={salesManagerPreview} />}
              </div>
            </div>
          </div>

          {/* Company Details Section */}
          <div className="bg-white shadow-sm border border-slate-200 rounded-3xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 pb-2 border-b border-slate-100">
              Company Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Input
                label="Company Name (English)"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
              <Input
                label="Company Name (Thai)"
                value={companyNameThai}
                onChange={(e) => setCompanyNameThai(e.target.value)}
                required
              />
              <Input
                label="Head Office (English)"
                value={headOffice}
                onChange={(e) => setHeadOffice(e.target.value)}
                required
              />
              <Input
                label="Head Office (Thai)"
                value={headOfficeThai}
                onChange={(e) => setHeadOfficeThai(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Input
                label="Tel"
                value={tel}
                onChange={(e) => setTel(e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Tax ID"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
              />
            </div>
          </div>

          {/* Financial Details Section */}
          <div className="bg-white shadow-sm border border-slate-200 rounded-3xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 pb-2 border-b border-slate-100">
              Financial & Accounting Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Input
                label="Bank Account Name"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
              />
              <Input
                label="Bank Account Number"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
              />
              <div className="space-y-1">
                <label className="block text-sm font-bold text-slate-700">
                  Branch Name
                </label>
                <select
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                >
                  <option value="Head Office">Head Office</option>
                  <option value="Branch 1">Branch 1</option>
                  <option value="Branch 2">Branch 2</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Discount (%)"
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
              <Input
                label="VAT (%)"
                type="number"
                value={vat}
                onChange={(e) => setVat(e.target.value)}
              />
              <Input
                label="Deposit (%)"
                type="number"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="px-8 !rounded-xl shadow-lg shadow-blue-500/30 min-w-[200px]"
              disabled={updating}
            >
              {updating ? "Saving..." : "Save Default Quotation"}
            </Button>
          </div>
        </form>

        <Modal
          isOpen={modalShow}
          onClose={() => setModalShow(false)}
          title="Image Preview"
        >
          <div className="p-4 flex justify-center bg-slate-100 rounded-lg">
            {modalImage && (
              <img
                src={modalImage}
                alt="Preview Zoom"
                className="max-w-full max-h-[70vh] object-contain rounded-md shadow-sm"
              />
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default QuotationDefaultEditScreen;
