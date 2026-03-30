import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import { useGetcopycartByIdQuery } from "../../slices/copypcbCartApiSlice";
import { Container, Row, Col, Image } from "react-bootstrap";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import {
  FaDownload,
  FaFileArchive,
  FaImages,
  FaArrowLeft,
  FaMicrochip,
  FaBox,
  FaQuoteRight,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaSearchPlus,
  FaInfoCircle,
} from "react-icons/fa";
import { BASE_URL } from "../../constants";

const CopyPCBCartDetailScreen = () => {
  const { id } = useParams();
  const { data, isLoading, isError, error } = useGetcopycartByIdQuery(id);
  const { language } = useSelector((state) => state.language);

  const [zoomedImage, setZoomedImage] = useState(null);

  const t = {
    en: {
      title: "Copy PCB Details",
      ProjectNameLbl: "Project Name",
      quantityLbl: "Quantity",
      NoteLbl: "Additional Notes",
      CopyZip: "Technical Files",
      downloadLbl: "Download",
      photoLbl: "PCB Gallery",
      noneLbl: "No data provided",
      back: "Back to List",
      downloadAllImg: "Save Images",
      downloadAllProj: "Download Project",
      waitQuotation: "Wait for Quotation",
      tbd: "TBD",
    },
    thai: {
      title: "รายละเอียด Copy PCB",
      ProjectNameLbl: "ชื่อโปรเจกต์",
      quantityLbl: "จำนวน",
      NoteLbl: "หมายเหตุเพิ่มเติม",
      CopyZip: "ไฟล์เทคนิค",
      downloadLbl: "ดาวน์โหลด",
      photoLbl: "คลังรูปภาพ",
      noneLbl: "ไม่มีข้อมูล",
      back: "กลับไปหน้ารายการ",
      downloadAllImg: "บันทึกรูปภาพ",
      downloadAllProj: "ดาวน์โหลดทั้งหมด",
      waitQuotation: "รอประเมินราคา",
      tbd: "รอประเมิน",
    },
  }[language || "en"];

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <Loader />
      </div>
    );
  if (isError)
    return (
      <div className="min-h-screen p-8 bg-slate-50/50">
        <Message variant="danger">{error.message}</Message>
      </div>
    );

  const order = data.data;

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

  const downloadAllImages = async (e) => {
    e.preventDefault();
    if (!order) return;
    const zip = new JSZip();
    const folder = zip.folder(order.projectname || "images");
    const imagesToFetch = [];

    for (let i = 1; i <= 10; i++) {
      if (order[`front_image_${i}`])
        imagesToFetch.push({
          url: getFullUrl(order[`front_image_${i}`]),
          filename: `front-${i}.png`,
        });
      if (order[`back_image_${i}`])
        imagesToFetch.push({
          url: getFullUrl(order[`back_image_${i}`]),
          filename: `back-${i}.png`,
        });
    }

    if (imagesToFetch.length === 0) return toast.error("No images found.");

    try {
      await Promise.all(
        imagesToFetch.map(async ({ url, filename }) => {
          try {
            const response = await fetch(url);
            if (response.ok) {
              const blob = await response.blob();
              folder.file(filename, blob);
            } else {
              console.error(
                `Failed to fetch image: ${url} (Status: ${response.status})`,
              );
            }
          } catch (fetchErr) {
            console.error(`Error fetching ${url}:`, fetchErr);
          }
        }),
      );
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${order.projectname || "pcb-images"}.zip`);
    } catch (error) {
      console.error("ZIP Error:", error);
      toast.error("Download failed");
    }
  };

  const handleDownloadAll = async (e) => {
    e.preventDefault();
    if (!order) return;
    const zip = new JSZip();
    const folder = zip.folder(order.projectname || "project");

    try {
      if (order.copypcb_zip) {
        const zipUrl = getFullUrl(order.copypcb_zip);
        const resp = await fetch(zipUrl);
        if (resp.ok) {
          folder.file(
            order.copypcb_zip.split("/").pop() || "source.zip",
            await resp.blob(),
          );
        } else {
          console.error(`Failed to fetch main zip: ${zipUrl}`);
        }
      }
      for (let i = 1; i <= 10; i++) {
        const frontPath = order[`front_image_${i}`];
        if (frontPath) {
          const r = await fetch(getFullUrl(frontPath));
          if (r.ok) {
            const ext = frontPath.split(".").pop() || "png";
            folder.file(`front-${i}.${ext}`, await r.blob());
          }
        }
        const backPath = order[`back_image_${i}`];
        if (backPath) {
          const r = await fetch(getFullUrl(backPath));
          if (r.ok) {
            const ext = backPath.split(".").pop() || "png";
            folder.file(`back-${i}.${ext}`, await r.blob());
          }
        }
      }
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${order.projectname || "pcb-project"}-full.zip`);
    } catch (error) {
      console.error("Download Project Error:", error);
      toast.error("Download failed");
    }
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

  const imageGroups = {
    front: Array.from(
      { length: 10 },
      (_, i) => order[`front_image_${i + 1}`],
    ).filter(Boolean),
    back: Array.from(
      { length: 10 },
      (_, i) => order[`back_image_${i + 1}`],
    ).filter(Boolean),
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-prompt">
      <Container className="py-6">
        {/* Header & Breadcrumb */}
        <div className="mb-8 font-prompt">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to="/cart/copypcbcart"
              className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all"
            >
              <FaArrowLeft size={16} />
            </Link>
            <div>
              <nav className="flex mb-1" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <li>
                    <Link
                      to="/cart/copypcbcart"
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
              {/* Project Card */}
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                      <FaMicrochip size={20} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-0">
                        {order.projectname}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest m-0">
                        Project ID: #{order.id}
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
                          {t.quantityLbl}
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
                          Estimated Price
                        </p>
                        <p className="text-xl font-bold text-blue-600 m-0">
                          {order.confirmed_price && order.confirmed_price > 0
                            ? `฿${parseFloat(order.confirmed_price).toLocaleString()}`
                            : order.status === "accepted"
                              ? "฿0.00"
                              : t.waitQuotation}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <FaInfoCircle /> {t.NoteLbl}
                    </p>
                    <p className="text-sm text-slate-600 m-0 leading-relaxed whitespace-pre-wrap">
                      {order.notes || t.noneLbl}
                    </p>
                  </div>
                </div>
              </div>

              {/* Photos Gallery */}
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                      <FaImages size={18} />
                    </div>
                    <h5 className="text-lg font-bold text-slate-900 m-0">
                      {t.photoLbl}
                    </h5>
                  </div>
                  <button
                    onClick={downloadAllImages}
                    className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors border-none bg-transparent"
                  >
                    {t.downloadAllImg}
                  </button>
                </div>

                {imageGroups.front.length > 0 && (
                  <div className="mb-8">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">
                      Front Surface
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {imageGroups.front.map((img, idx) => (
                        <div
                          key={`front-${idx}`}
                          className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition-all hover:border-blue-200"
                        >
                          <Image
                            src={getFullUrl(img)}
                            className="w-full h-full object-contain p-2 bg-slate-50 transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                            <button
                              onClick={() => setZoomedImage(getFullUrl(img))}
                              className="w-8 h-8 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-lg border-none hover:bg-blue-600 hover:text-white transition-all"
                            >
                              <FaSearchPlus size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {imageGroups.back.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">
                      Back Surface
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {imageGroups.back.map((img, idx) => (
                        <div
                          key={`back-${idx}`}
                          className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition-all hover:border-blue-200"
                        >
                          <Image
                            src={getFullUrl(img)}
                            className="w-full h-full object-contain p-2 bg-slate-50 transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                            <button
                              onClick={() => setZoomedImage(getFullUrl(img))}
                              className="w-8 h-8 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-lg border-none hover:bg-blue-600 hover:text-white transition-all"
                            >
                              <FaSearchPlus size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {imageGroups.front.length === 0 &&
                  imageGroups.back.length === 0 && (
                    <div className="py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                      <FaImages
                        size={32}
                        className="mx-auto text-slate-200 mb-3"
                      />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest m-0">
                        {t.noneLbl}
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </Col>

          <Col lg={4}>
            <div className="sticky top-6 space-y-6">
              {/* Files Card */}
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 text-center">
                <div className="w-16 h-16 rounded-[2rem] bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <FaFileArchive size={28} />
                </div>
                <h5 className="text-lg font-bold text-slate-900 mb-2">
                  {t.CopyZip}
                </h5>
                <p className="text-xs text-slate-400 mb-8 px-4 leading-relaxed">
                  Technical project files required for manufacturing.
                </p>

                <div className="space-y-3">
                  {order.copypcb_zip ? (
                    <a
                      href={getFullUrl(order.copypcb_zip)}
                      className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-xl shadow-slate-200 hover:bg-blue-700 transition-all no-underline"
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaDownload /> {t.downloadLbl} ZIP
                    </a>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-widest italic flex items-center justify-center gap-2">
                      <FaTimesCircle size={10} /> No Files Attached
                    </div>
                  )}
                  <button
                    onClick={handleDownloadAll}
                    className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-white text-slate-900 border-2 border-slate-100 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <FaDownload /> {t.downloadAllProj}
                  </button>
                </div>
              </div>

              {/* Help Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] shadow-xl shadow-blue-100 p-8 text-white relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <h5 className="text-lg font-bold mb-4">Support Needed?</h5>
                  <p className="text-white/80 text-xs leading-relaxed mb-6">
                    If you have any questions regarding this order, please
                    contact the engineering team.
                  </p>
                  <button className="w-full py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all">
                    Contact Engineering
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
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-[1050] bg-slate-950/95 backdrop-blur-sm flex justify-center items-center p-4 cursor-zoom-out animate-in fade-in duration-300"
        >
          <img
            src={zoomedImage}
            alt="Zoomed"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300"
          />
          <button
            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
            onClick={() => setZoomedImage(null)}
          >
            <FaTimesCircle size={32} />
          </button>
        </div>
      )}
      <style>{` .font-prompt { font-family: 'Prompt', sans-serif !important; } `}</style>
    </div>
  );
};

export default CopyPCBCartDetailScreen;
