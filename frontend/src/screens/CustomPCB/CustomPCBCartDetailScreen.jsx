import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import { Row, Col, Image, Container } from "react-bootstrap";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  FaArrowLeft,
  FaDownload,
  FaSearchPlus,
  FaFileArchive,
  FaImages,
  FaInfoCircle,
  FaMicrochip,
  FaBox,
  FaQuoteRight,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaCreditCard,
} from "react-icons/fa";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import { useGetCustomcartByIdQuery } from "../../slices/custompcbCartApiSlice";
import { BASE_URL } from "../../constants";

const CustomPCBCartDetailScreen = () => {
  const { id } = useParams();
  const { data, isLoading, isError, error } = useGetCustomcartByIdQuery(id);
  const [zoomedImage, setZoomedImage] = useState(null);
  const { language } = useSelector((state) => state.language);

  const translations = {
    en: {
      title: "Quote Request Details",
      projectnameLbl: "Project Name",
      QtyLbl: "Quantity",
      NotesLbl: "Notes",
      ConfirmedReasonLbl: "Admin Response / Quote Details",
      DiagramZipLbl: "Technical Files (Zip)",
      TotalPriceLbl: "Estimated Price",
      StatusLbl: "Status",
      PhotoLbl: "Diagram Images",
      DownloadAllImg: "Download All Images",
      DownloadProject: "Download Full Project",
      NoFile: "No file attached",
    },
    thai: {
      title: "รายละเอียดคำขอใบเสนอราคา",
      projectnameLbl: "ชื่อโปรเจกต์",
      QtyLbl: "จำนวน",
      NotesLbl: "รายละเอียดเพิ่มเติม",
      ConfirmedReasonLbl: "การตอบกลับจากแอดมิน / รายละเอียดราคา",
      DiagramZipLbl: "ไฟล์เทคนิค (Zip)",
      TotalPriceLbl: "ราคาประเมิน",
      StatusLbl: "สถานะ",
      PhotoLbl: "รูปภาพประกอบ",
      DownloadAllImg: "ดาวน์โหลดรูปทั้งหมด",
      DownloadProject: "ดาวน์โหลดโปรเจกต์ทั้งหมด",
      NoFile: "ไม่มีไฟล์แนบ",
    },
  };

  const t = translations[language] || translations.en;

  if (isLoading) return <Loader />;
  if (isError)
    return (
      <Message variant="danger">
        {error?.data?.message || error.message || "Error loading data"}
      </Message>
    );

  const order = data?.data || data || {};

  const imageFields = [
    "dirgram_image_1",
    "dirgram_image_2",
    "dirgram_image_3",
    "dirgram_image_4",
    "dirgram_image_5",
    "dirgram_image_6",
    "dirgram_image_7",
    "dirgram_image_8",
    "dirgram_image_9",
    "dirgram_image_10",
  ];

  const getFullUrl = (pathInput) => {
    if (!pathInput) return null;
    let path =
      typeof pathInput === "object"
        ? pathInput.path || pathInput.url
        : pathInput;
    if (!path || typeof path !== "string") return null;

    if (path.startsWith("http")) return path;

    // Normalize path: replace backslashes and ensure single leading slash
    let normalizedPath = path.replace(/\\/g, "/");
    if (!normalizedPath.startsWith("/")) {
      normalizedPath = "/" + normalizedPath;
    }

    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:5000"
        : BASE_URL || "";
    return `${baseUrl}${normalizedPath}`;
  };

  const openZoom = (src) => setZoomedImage(src);
  const closeZoom = () => setZoomedImage(null);

  const downloadAllImages = async (e) => {
    e.preventDefault();
    const zip = new JSZip();
    const folder = zip.folder(order.projectname || "images");

    const fields = imageFields
      .map((key, i) => {
        const rawPath = order[key];
        if (!rawPath) return null;
        const pathStr =
          typeof rawPath === "object" ? rawPath.path || rawPath.url : rawPath;
        if (!pathStr || typeof pathStr !== "string") return null;
        return {
          file: rawPath,
          name: `diagram-${i + 1}${pathStr.substring(pathStr.lastIndexOf("."))}`,
        };
      })
      .filter(Boolean);

    if (!fields.length) {
      alert("No images found to download.");
      return;
    }

    for (const { file, name } of fields) {
      const url = getFullUrl(file);
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("File not found");
        const blob = await response.blob();
        folder.file(name, blob);
      } catch (err) {
        console.error(`Failed to fetch ${url}`, err);
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${order.projectname || "images"}-images.zip`);
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();

    if (order.dirgram_zip) {
      const zipUrl = getFullUrl(order.dirgram_zip);
      try {
        const response = await fetch(zipUrl);
        if (response.ok) {
          const blob = await response.blob();
          zip.file(`technical-files.zip`, blob);
        }
      } catch (err) {
        console.error("Failed to fetch Tech ZIP:", err);
      }
    }

    const imageFolder = zip.folder("images");
    const fields = imageFields
      .map((key, i) => {
        const rawPath = order[key];
        if (!rawPath) return null;
        const pathStr =
          typeof rawPath === "object" ? rawPath.path || rawPath.url : rawPath;
        if (!pathStr || typeof pathStr !== "string") return null;
        return {
          file: rawPath,
          name: `diagram-${i + 1}${pathStr.substring(pathStr.lastIndexOf("."))}`,
        };
      })
      .filter(Boolean);

    for (const { file, name } of fields) {
      const url = getFullUrl(file);
      try {
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          imageFolder.file(name, blob);
        }
      } catch (err) {
        console.error(`Failed to fetch ${url}`, err);
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${order.projectname || "project"}-full-package.zip`);
  };

  const StatusBadgeDetail = ({ status }) => {
    const configs = {
      pending: {
        bg: "bg-amber-50",
        text: "text-amber-600",
        border: "border-amber-100",
        icon: <FaClock size={12} />,
        label: language === "thai" ? "รอการตรวจสอบ" : "Pending Review",
      },
      accepted: {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        border: "border-emerald-100",
        icon: <FaCheckCircle size={12} />,
        label: language === "thai" ? "อนุมัติแล้ว" : "Approved",
      },
      rejected: {
        bg: "bg-rose-50",
        text: "text-rose-600",
        border: "border-rose-100",
        icon: <FaTimesCircle size={12} />,
        label: language === "thai" ? "ปฏิเสธ" : "Rejected",
      },
      paid: {
        bg: "bg-blue-50",
        text: "text-blue-600",
        border: "border-blue-100",
        icon: <FaCreditCard size={12} />,
        label: language === "thai" ? "ชำระเงินแล้ว" : "Paid",
      },
    };
    const config = configs[status] || configs.pending;
    return (
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest border ${config.bg} ${config.text} ${config.border}`}
      >
        {config.icon}
        {config.label}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-prompt">
      <Container className="py-6">
        {/* Header & Navigation */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to="/cart/custompcbcart"
              className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all"
            >
              <FaArrowLeft size={16} />
            </Link>
            <div>
              <nav className="flex mb-1" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <li>
                    <Link
                      to="/cart/custompcbcart"
                      className="hover:text-blue-500 transition-colors"
                    >
                      Cart
                    </Link>
                  </li>
                  <li>/</li>
                  <li className="text-slate-900 truncate max-w-[200px]">
                    {order.projectname}
                  </li>
                </ol>
              </nav>
              <h1 className="text-2xl font-bold text-slate-900 m-0">
                {t.title}
              </h1>
            </div>
          </div>
        </div>

        <Row className="g-6">
          <Col lg={8}>
            <div className="space-y-6">
              {/* Project Info Card */}
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-bottom border-slate-50 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                      <FaMicrochip size={20} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-0">
                        {order.projectname}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest m-0">
                        Project ID: {order._id || order.id}
                      </p>
                    </div>
                  </div>
                  <StatusBadgeDetail status={order.status} />
                </div>

                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                        <FaBox size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          {t.QtyLbl}
                        </p>
                        <p className="text-sm font-bold text-slate-700 m-0">
                          {order.pcb_qty} Unit(s)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0">
                        <FaQuoteRight size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          {t.TotalPriceLbl}
                        </p>
                        <p className="text-xl font-bold text-blue-600 m-0">
                          {order.confirmed_price
                            ? `฿${order.confirmed_price.toLocaleString()}`
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <FaInfoCircle /> {t.NotesLbl}
                    </p>
                    <p className="text-sm text-slate-600 m-0 leading-relaxed whitespace-pre-wrap">
                      {order.notes || "-"}
                    </p>
                  </div>

                  {order.confirmed_reason && (
                    <div className="mt-6 p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <FaQuoteRight /> {t.ConfirmedReasonLbl}
                      </p>
                      <p className="text-sm text-slate-700 m-0 leading-relaxed font-medium">
                        {order.confirmed_reason}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Images Grid */}
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center">
                      <FaImages size={18} />
                    </div>
                    <h5 className="text-lg font-bold text-slate-900 m-0">
                      {t.PhotoLbl}
                    </h5>
                  </div>
                  <button
                    onClick={downloadAllImages}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-50 text-slate-600 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all border-none"
                  >
                    <FaDownload /> {t.DownloadAllImg}
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imageFields.map(
                    (field, idx) =>
                      order[field] && (
                        <div
                          key={idx}
                          className="group relative aspect-square rounded-3xl overflow-hidden border border-slate-100 shadow-sm cursor-zoom-in"
                          onClick={() => openZoom(getFullUrl(order[field]))}
                        >
                          <Image
                            src={getFullUrl(order[field])}
                            className="w-full h-full object-fit-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://via.placeholder.com/150?text=No+Image";
                            }}
                          />
                          <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                            <div className="w-10 h-10 rounded-2xl bg-white/90 text-slate-900 shadow-lg flex items-center justify-center">
                              <FaSearchPlus size={14} />
                            </div>
                          </div>
                        </div>
                      ),
                  )}
                  {!imageFields.some((f) => order[f]) && (
                    <div className="col-span-full py-12 text-center text-slate-400">
                      <FaImages size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="text-sm font-medium">{t.NoFile}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Col>

          <Col lg={4}>
            <div className="sticky top-6 space-y-6">
              {/* Technical Files Card */}
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 text-center">
                <div className="w-16 h-16 rounded-[2rem] bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <FaFileArchive size={28} />
                </div>
                <h5 className="text-lg font-bold text-slate-900 mb-2">
                  Technical Documents
                </h5>
                <p className="text-xs text-slate-400 mb-8 px-4">
                  All project files required for manufacturing and assembly.
                </p>

                <div className="space-y-3">
                  {order.dirgram_zip ? (
                    <a
                      href={getFullUrl(order.dirgram_zip)}
                      className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all no-underline"
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaDownload /> Download ZIP
                    </a>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-widest italic">
                      {t.NoFile}
                    </div>
                  )}

                  <button
                    onClick={handleDownloadAll}
                    className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-white text-slate-900 border-2 border-slate-100 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <FaDownload /> {t.DownloadProject}
                  </button>
                </div>
              </div>

              {/* Quick Actions / Help Card */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2.5rem] shadow-xl shadow-blue-100 p-8 text-white relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <h5 className="text-lg font-bold mb-4">Questions?</h5>
                  <p className="text-white/80 text-xs leading-relaxed mb-6">
                    If you have any questions regarding this quote or need to
                    make changes, please contact our support team.
                  </p>
                  <button className="w-full py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all">
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Zoom Modal */}
      {zoomedImage && (
        <div
          onClick={closeZoom}
          className="fixed inset-0 z-[1050] bg-slate-950/95 backdrop-blur-sm flex justify-center items-center p-4 cursor-zoom-out animate-in fade-in duration-300"
        >
          <img
            src={zoomedImage}
            alt="Zoomed"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300"
          />
          <button
            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
            onClick={closeZoom}
          >
            <FaTimesCircle size={32} />
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomPCBCartDetailScreen;
