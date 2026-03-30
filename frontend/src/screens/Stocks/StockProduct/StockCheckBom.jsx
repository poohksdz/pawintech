import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import Papa from "papaparse";
import * as XLSX from "xlsx-js-style";
import { useGetStockProductsQuery } from "../../../slices/stockProductApiSlice";
import {
  addToStockCart,
  resetStockCart,
} from "../../../slices/stockCartApiSlice";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCloudUploadAlt,
  FaBoxOpen,
  FaShoppingCart,
  FaUndo,
  FaCheckCircle,
  FaCheckDouble,
  FaBolt,
  FaMagic,
  FaDownload,
  FaInfoCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaFileExport,
  FaSearch,
  FaCopy,
} from "react-icons/fa";

const CopyableText = ({ text, className = "", children, iconRight = true }) => {
  const handleCopy = (e) => {
    e.stopPropagation();
    if (!text || text === "-") return;
    navigator.clipboard.writeText(text);
    toast.success(`Copied: ${text}`, {
      autoClose: 1000,
      hideProgressBar: true,
      position: "bottom-right",
    });
  };

  if (!text || text === "-") {
    return <div className={className}>{children || <span>{text}</span>}</div>;
  }

  return (
    <div
      onClick={handleCopy}
      className={`group cursor-pointer inline-flex items-start gap-1 ${className}`}
      title="Click to copy"
    >
      {!iconRight && (
        <FaCopy
          className="opacity-0 group-hover:opacity-100 text-indigo-400 shrink-0 transition-opacity mt-0.5"
          size={10}
        />
      )}
      {children || <span className="truncate">{text}</span>}
      {iconRight && (
        <FaCopy
          className="opacity-0 group-hover:opacity-100 text-indigo-400 shrink-0 transition-opacity mt-0.5"
          size={10}
        />
      )}
    </div>
  );
};

const StockCheckBom = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const stockCartState = useSelector((state) => state.stockcart) || {
    cartItems: [],
  };
  const cartItems = stockCartState.cartItems || [];

  const [results, setResults] = useState([]);
  const [fileName, setFileName] = useState("");
  const [originalHeaders, setOriginalHeaders] = useState([]);
  const [globalFillQty, setGlobalFillQty] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [rowProjectQtys, setRowProjectQtys] = useState({});
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");

  const { data, isLoading } = useGetStockProductsQuery();
  const products = data?.products || [];

  // Reset cart on mount (disabled by default)
  // useEffect(() => { dispatch(resetStockCart()); }, [dispatch]);

  // ==================== FILE UPLOAD ====================
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const fields = res.meta.fields;
        setOriginalHeaders(fields);

        // ฟังก์ชันช่วยค้นหาชื่อคอลัมน์ที่แม่นยำขึ้น โดยเรียงลำดับความสำคัญของคำค้นหา
        const findHeader = (keywords) => {
          for (let kw of keywords) {
            const found = fields.find((f) => {
              if (!f) return false;
              const clean = f.toLowerCase().replace(/[^a-z0-9]/g, "");
              return clean.includes(kw);
            });
            if (found) return found;
          }
          return null;
        };

        // จับคู่คอลัมน์แบบรัดกุม รองรับทั้ง Example และไฟล์ 2026
        const headerMap = {
          qty: findHeader(["qty", "quantity", "bomqty"]),
          ele: findHeader(["1electotronixpn", "electotronixpn", "elepn"]),
          mpn: findHeader([
            "2manufacturepn",
            "manufacturepn",
            "mfrpn",
            "manufacture",
            "mfr",
          ]),
          designator: findHeader(["designator", "reference", "ref"]),
          description:
            findHeader(["description", "desc"]) || findHeader(["value"]), // หา Description ก่อน ถ้าไม่มีเอา Value
          footprint: findHeader(["footprint", "package"]),
        };

        const matches = res.data.map((row, index) => {
          const elePN = row[headerMap.ele]?.trim() || "";
          const mfgPN = row[headerMap.mpn]?.trim() || "";

          // ดึงตัวเลขออกมาจากช่อง Qty ป้องกันผู้ใช้ใส่ตัวหนังสือมาด้วย (เช่น "1pcs")
          const bomQtyStr =
            row[headerMap.qty]?.toString().replace(/[^0-9.]/g, "") || "1";
          const bomQty = Number(bomQtyStr);

          const designator = row[headerMap.designator]?.trim() || "-";
          const description = row[headerMap.description]?.trim() || "-";
          const footprint = row[headerMap.footprint]?.trim() || "-";

          // ระบบค้นหาใหม่: ค้นหาทั้งจากช่อง ELE และ ช่อง MPN สลับกันได้
          let matched = null;

          // 1. เช็คจากค่าในช่อง 1ELECTOTRONIXPN ก่อน (เช็คทั้งกับ ELE ในระบบ และ MPN ในระบบ)
          if (elePN && elePN !== "-") {
            matched = products.find(
              (p) =>
                p.electotronixPN?.toLowerCase() === elePN.toLowerCase() ||
                p.manufacturePN?.toLowerCase() === elePN.toLowerCase(),
            );
          }

          // 2. ถ้ายังไม่เจอ ให้ลองไปเช็คจากช่อง 2MANUFACTURE P/N
          if (!matched && mfgPN && mfgPN !== "-") {
            matched = products.find(
              (p) =>
                p.manufacturePN?.toLowerCase() === mfgPN.toLowerCase() ||
                p.electotronixPN?.toLowerCase() === mfgPN.toLowerCase(),
            );
          }

          return {
            ...row,
            tempId: index,
            bomQty: isNaN(bomQty) || bomQty === 0 ? 1 : bomQty,
            matches: matched ? [matched] : [null],
            displayELE: matched
              ? matched.electotronixPN
              : elePN || mfgPN || "N/A",
            designator,
            description: matched ? matched.description : description,
            footprint: matched ? matched.footprint : footprint,
          };
        });

        setResults(matches);
        setSelectedItems([]);
        setRowProjectQtys({});
        setActiveCategory("all");
        setSearchFilter("");
        toast.success(`อัปโหลดสำเร็จ: ${file.name} (${matches.length} รายการ)`);
      },
    });
  };

  // ==================== RESET ====================
  const handleReset = () => {
    if (window.confirm("ล้างข้อมูลทั้งหมด?")) {
      setResults([]);
      setFileName("");
      setSelectedItems([]);
      setRowProjectQtys({});
      dispatch(resetStockCart());
    }
  };

  // ==================== TEMPLATE DOWNLOAD ====================
  const executeDownload = () => {
    const csvContent =
      "1ELECTOTRONIXPN,2MANUFACTURE P/N,Qty\nE-RES-001,RC0603FR-0710KL,10";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "bom_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowDownloadModal(false);
  };

  // ==================== FILL QTY ====================
  const applyFillToSelected = () => {
    const fillVal = Number(globalFillQty);
    if (fillVal <= 0) return toast.warning("จำนวน Fill ต้องมากกว่า 0");
    if (selectedItems.length === 0)
      return toast.info("กรุณาเลือกรายการก่อนกด Fill");

    const newQtys = { ...rowProjectQtys };
    let filledCount = 0;

    selectedItems.forEach((tempId) => {
      const row = results.find((r) => r.tempId === tempId);
      if (row) {
        const p = row.matches[0];
        if (p) {
          newQtys[tempId] = fillVal;
          filledCount++;
        }
      }
    });

    setRowProjectQtys(newQtys);
    toast.success(`กรอกจำนวน ${fillVal} ชุด ให้ ${filledCount} รายการแล้ว`);
  };

  // ==================== ADD TO CART ====================
  const addSelectedToCart = () => {
    if (selectedItems.length === 0) return toast.info("กรุณาเลือกรายการ");

    let successCount = 0;
    let failZeroStock = 0;

    selectedItems.forEach((tempId) => {
      const row = results.find((r) => r.tempId === tempId);
      if (row) {
        const p = row.matches[0];
        const stockQty = p ? Number(p.quantity || 0) : 0;

        let reqQty = Number(rowProjectQtys[tempId] || 0);
        if (reqQty === 0 && globalFillQty > 0) {
          reqQty = Number(globalFillQty);
        }

        if (p && stockQty > 0) {
          if (reqQty > 0) {
            const totalReq = row.bomQty * reqQty;
            dispatch(
              addToStockCart({
                ...p,
                _id: String(p.ID),
                reqqty: totalReq,
              }),
            );
            successCount++;
          }
        } else {
          failZeroStock++;
        }
      }
    });

    if (successCount > 0) {
      toast.success(`เพิ่มเข้าตะกร้า ${successCount} รายการเรียบร้อย`);
      handleSelectAll(); // clear selection
    } else {
      if (failZeroStock > 0)
        toast.error(`สินค้า ${failZeroStock} รายการหมดสต็อก`);
      else toast.warning("ไม่พบรายการที่เพิ่มได้");
    }
  };

  // ==================== SELECTION ====================
  const handleSelectItem = (tempId) => {
    setSelectedItems((prev) =>
      prev.includes(tempId)
        ? prev.filter((id) => id !== tempId)
        : [...prev, tempId],
    );
  };

  const handleSelectAll = () => {
    const selectables = results
      .filter((r) => r.matches[0] && Number(r.matches[0].quantity) > 0)
      .map((r) => r.tempId);
    if (selectedItems.length === selectables.length) setSelectedItems([]);
    else setSelectedItems(selectables);
  };

  // ==================== CATEGORY CLASSIFICATION ====================
  const getItemCategory = (row) => {
    const p = row.matches[0];

    // 1. ถ้าไม่พบข้อมูลใน Database เลย -> 'missing' (ไม่มีในสต็อก)
    if (!p) return "missing";

    const stockQty = Number(p.quantity || 0);
    const projQty = rowProjectQtys[row.tempId] || globalFillQty || 0;
    const neededQty = row.bomQty * projQty;

    // 2. ถ้ามีใน Database แต่ของไม่พอ (รวมถึงกรณีที่สต็อกเป็น 0) -> 'shortage' (ของขาด)
    if (stockQty < neededQty) return "shortage";

    // 3. ถ้าของมีเพียงพอ -> 'ready' (พร้อมเบิก)
    return "ready";
  };

  // ==================== STATS & GROUPING ====================
  const categorizedResults = useMemo(() => {
    const groups = { ready: [], shortage: [], missing: [] };
    results.forEach((row) => {
      const cat = getItemCategory(row);
      groups[cat].push(row);
    });
    return groups;
  }, [results, rowProjectQtys, globalFillQty]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(
    () => ({
      total: results.length,
      ready: categorizedResults.ready.length,
      shortage: categorizedResults.shortage.length,
      missing: categorizedResults.missing.length,
    }),
    [results, categorizedResults],
  );

  const displayResults = useMemo(() => {
    let filtered =
      activeCategory === "all"
        ? results
        : categorizedResults[activeCategory] || [];
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      filtered = filtered.filter((r) =>
        r.displayELE?.toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [results, categorizedResults, activeCategory, searchFilter]);

  // ==================== EXCEL EXPORT ====================
  const exportExcel = (category) => {
    let dataToExport = [];
    let fileLabel = "";

    switch (category) {
      case "all":
        dataToExport = results;
        fileLabel = "ALL_ITEMS";
        break;
      case "ready":
        dataToExport = categorizedResults.ready;
        fileLabel = "READY";
        break;
      case "shortage":
        dataToExport = categorizedResults.shortage;
        fileLabel = "SHORTAGE";
        break;
      case "missing":
        dataToExport = categorizedResults.missing;
        fileLabel = "MISSING";
        break;
      default:
        dataToExport = results;
        fileLabel = "ALL";
    }

    if (dataToExport.length === 0) {
      toast.info("ไม่มีข้อมูลในหมวดหมู่นี้");
      return;
    }

    const rows = dataToExport.map((row) => {
      const p = row.matches[0];
      const stockQty = p ? Number(p.quantity || 0) : 0;
      const projQty = rowProjectQtys[row.tempId] || globalFillQty || 0;
      const neededQty = row.bomQty * projQty;
      const deficit = stockQty - neededQty;

      // 1. Start with original row data to preserve all original columns
      let exportRow = {};

      // Map original headers to ensure correct order and inclusion of all columns
      originalHeaders.forEach((header) => {
        exportRow[header] = row[header] || "";
      });

      // 2. Append stock check results
      const resultColumns = {
        "--- STOCK CHECK RESULTS ---": ">>>",
        "Match ElectotronixPN": p?.electotronixPN || "-",
        "Match Description": p?.description || "-",
        "Match Manufacturer": p?.manufacture || "-",
        Stock: stockQty,
        "Build Qty": projQty,
        "Total Needed": neededQty,
        "Deficit (+/-)": deficit,
        Status: !p ? "MISSING" : deficit < 0 ? "SHORTAGE" : "READY",
      };

      return { ...exportRow, ...resultColumns };
    });

    // Define column headers explicitly to prevent shifting
    const resultHeaderKeys = [
      "--- STOCK CHECK RESULTS ---",
      "Match ElectotronixPN",
      "Match Description",
      "Match Manufacturer",
      "Stock",
      "Build Qty",
      "Total Needed",
      "Deficit (+/-)",
      "Status",
    ];
    const allHeaders = [...originalHeaders, ...resultHeaderKeys];

    const ws = XLSX.utils.json_to_sheet(rows, { header: allHeaders });

    // Apply styles to each cell
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = { c: C, r: R };
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        if (!ws[cell_ref]) continue;

        // Default style
        ws[cell_ref].s = {
          font: { name: "Prompt", size: 10 },
          alignment: { vertical: "center" },
        };

        // Header styling
        if (R === 0) {
          ws[cell_ref].s.font.bold = true;
          ws[cell_ref].s.fill = { fgColor: { rgb: "E2E8F0" } }; // Slate-200
          ws[cell_ref].s.border = {
            bottom: { style: "thin", color: { rgb: "94A3B8" } },
          };
        } else {
          // Row styling based on Status
          const statusCellRef = XLSX.utils.encode_cell({ c: range.e.c, r: R });
          const status = ws[statusCellRef]?.v;

          let bgColor = null;
          if (status === "READY")
            bgColor = "DCFCE7"; // Emerald-100 (Green)
          else if (status === "SHORTAGE")
            bgColor = "FEF3C7"; // Amber-100 (Yellow)
          else if (status === "MISSING") bgColor = "FEE2E2"; // Rose-100 (Red)

          if (bgColor) {
            ws[cell_ref].s.fill = { fgColor: { rgb: bgColor } };
          }
        }

        // Hyperlink detection & styling
        const cellValue = ws[cell_ref].v;
        if (
          typeof cellValue === "string" &&
          (cellValue.startsWith("http://") || cellValue.startsWith("https://"))
        ) {
          ws[cell_ref].l = { target: cellValue, tooltip: "Click to open link" };
          ws[cell_ref].s.font.color = { rgb: "06B6D4" }; // Cyan-500
          ws[cell_ref].s.font.underline = true;
        }
      }
    }

    // Auto-fit column widths (excluding columns with hyperlinks)
    const colWidths = allHeaders.map((header, colIdx) => {
      // Check if this column has any hyperlinks
      let hasHyperlink = false;
      for (let R = 1; R <= range.e.r; ++R) {
        const cell_ref = XLSX.utils.encode_cell({ c: colIdx, r: R });
        if (ws[cell_ref]?.l) {
          hasHyperlink = true;
          break;
        }
      }

      if (hasHyperlink) return { wch: 25 }; // Fixed width for link columns

      // Find max length in this column
      let maxLen = header.toString().length;
      for (let R = 1; R <= range.e.r; ++R) {
        const cell_ref = XLSX.utils.encode_cell({ c: colIdx, r: R });
        const val = ws[cell_ref]?.v;
        if (val) {
          const len = val.toString().length;
          if (len > maxLen) maxLen = len;
        }
      }
      return { wch: Math.min(maxLen + 2, 50) }; // Add buffer, cap at 50
    });
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BOM Check");
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `BOM_CHECK_${fileLabel}_${dateStr}.xlsx`);
    toast.success(
      `ส่งออก Excel ${fileLabel} (${dataToExport.length} รายการ) สำเร็จ`,
    );
  };

  // ==================== CATEGORY TABS CONFIG ====================
  const categoryTabs = [
    {
      key: "all",
      label: "ทั้งหมด",
      icon: <FaBoxOpen />,
      count: stats.total,
      color: "text-indigo-600",
      bgBorder: "border-indigo-600",
      bgLight: "bg-indigo-50",
      outline: "ring-indigo-100",
    },
    {
      key: "ready",
      label: "พร้อมเบิก",
      icon: <FaCheckCircle />,
      count: stats.ready,
      color: "text-emerald-600",
      bgBorder: "border-emerald-600",
      bgLight: "bg-emerald-50",
      outline: "ring-emerald-100",
    },
    {
      key: "shortage",
      label: "ของขาด",
      icon: <FaExclamationTriangle />,
      count: stats.shortage,
      color: "text-amber-500",
      bgBorder: "border-amber-500",
      bgLight: "bg-amber-50",
      outline: "ring-amber-100",
    },
    {
      key: "missing",
      label: "ไม่มีในสต็อก",
      icon: <FaTimesCircle />,
      count: stats.missing,
      color: "text-rose-500",
      bgBorder: "border-rose-500",
      bgLight: "bg-rose-50",
      outline: "ring-rose-100",
    },
  ];

  // ==================== RENDERS ====================
  const renderStatusBadge = (row) => {
    const cat = getItemCategory(row);
    switch (cat) {
      case "ready":
        return (
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm">
            READY
          </span>
        );
      case "shortage":
        return (
          <span className="text-[11px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-sm">
            SHORTAGE
          </span>
        );
      case "missing":
        return (
          <span className="text-[11px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-sm">
            MISSING
          </span>
        );
      default:
        return <span className="text-[11px] font-bold text-slate-400">—</span>;
    }
  };

  return (
    <div className="font-['Prompt'] text-slate-900 antialiased selection:bg-indigo-100 min-h-screen bg-[#F1F5F9] pb-24">
      {/* Header / Sticky Top */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-300 shadow-md px-4 py-4 mb-8">
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tighter uppercase">
              <FaSearch className="text-indigo-600" /> BOM CHECKER
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {isLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin"></div>
              ) : (
                <div className="w-2 h-2 rounded-full bg-emerald-50 animate-pulse"></div>
              )}
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {fileName ? fileName : "Ready to analyze"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {results.length > 0 && (
              <>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-rose-500 bg-rose-50 hover:bg-rose-100 hover:text-rose-600 transition-all active:scale-95"
                >
                  <FaUndo /> ล้างทั้งหมด
                </button>
                <button
                  onClick={() =>
                    document.getElementById("fileInpReupload").click()
                  }
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 transition-all active:scale-95"
                >
                  <FaCloudUploadAlt /> อัปโหลดใหม่
                </button>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="fileInpReupload"
                />
              </>
            )}
            <button
              onClick={() => navigate("/componentcartlist")}
              className="relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white bg-slate-900 hover:bg-black shadow-lg shadow-slate-200 transition-all active:scale-95"
            >
              <FaShoppingCart /> ตะกร้า
              <AnimatePresence>
                {cartItems?.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm"
                  >
                    {cartItems.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full mx-auto pb-8">
        {/* UPOLAD STATE */}
        <AnimatePresence mode="wait">
          {results.length === 0 ? (
            <motion.div
              key="upload-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center border-2 border-dashed border-slate-300 rounded-[2.5rem] bg-white p-12 shadow-xl mx-4"
            >
              <div className="w-24 h-24 bg-indigo-50 text-indigo-500 flex items-center justify-center rounded-[2rem] mb-6 shadow-inner">
                <FaCloudUploadAlt size={48} />
              </div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">
                อัปโหลดไฟล์ BOM (.csv)
              </h3>
              <p className="text-slate-400 font-medium mb-8">
                ระบบจะเช็คสต็อกอัตโนมัติและจัดกลุ่มให้ตามหมวดหมู่
              </p>

              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="fileInp"
              />
              <button
                onClick={() => document.getElementById("fileInp").click()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-200 transition-all active:scale-95 mb-4"
              >
                เลือกไฟล์ CSV
              </button>
              <button
                onClick={() => setShowDownloadModal(true)}
                className="text-indigo-500 hover:text-indigo-700 text-xs font-bold uppercase tracking-widest flex items-center gap-2 underline decoration-indigo-200 underline-offset-4"
              >
                <FaInfoCircle /> วิธีเตรียมไฟล์ & ดาวน์โหลดเทมเพลต
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="results-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* CATEGORY TABS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 px-4 lg:px-6">
                {categoryTabs.map((tab) => {
                  const isActive = activeCategory === tab.key;
                  return (
                    <motion.div
                      key={tab.key}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveCategory(tab.key)}
                      className={`cursor-pointer rounded-[2rem] p-6 transition-all duration-300 relative overflow-hidden bg-white border border-slate-200
                                                ${isActive ? `${tab.bgBorder} shadow-xl ${tab.outline} outline-none ring-4 ring-offset-2 ring-offset-white` : "shadow-sm hover:border-indigo-200 hover:shadow-md"}
                                            `}
                    >
                      {isActive && (
                        <div
                          className={`absolute inset-0 ${tab.bgLight} opacity-50 z-0`}
                        ></div>
                      )}
                      <div className="relative z-10">
                        <div
                          className={`flex items-center justify-center gap-2 mb-2 ${isActive ? tab.color : "text-slate-400"}`}
                        >
                          {tab.icon}
                          <span className="text-xs font-black uppercase tracking-widest">
                            {tab.label}
                          </span>
                        </div>
                        <div className="text-center">
                          <h3
                            className={`text-4xl font-black tracking-tighter ${isActive ? tab.color : "text-slate-700"}`}
                          >
                            {tab.count}
                          </h3>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? tab.color : "text-slate-400"}`}
                          >
                            รายการ
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* TOOLBAR */}
              <div className="bg-white border-y border-slate-300 p-4 lg:p-6 mb-6 shadow-sm">
                <div className="flex flex-col xl:flex-row items-center justify-between gap-4 w-full">
                  {/* Action Group (Left) */}
                  <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    {/* Search */}
                    <div className="relative w-full md:w-64 shrink-0">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="text-slate-400" size={12} />
                      </div>
                      <input
                        type="text"
                        placeholder="ค้นหา ELE/PN..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="block w-full rounded-2xl border-0 py-2.5 pl-9 pr-9 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm font-bold bg-white shadow-inner transition-all duration-300"
                      />
                      <AnimatePresence>
                        {searchFilter && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => setSearchFilter("")}
                            className="absolute inset-y-0 right-3 flex items-center justify-center w-5 h-5 my-auto rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all focus:outline-none"
                          >
                            <FaTimesCircle size={10} />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Build Qty */}
                    <div className="flex items-center bg-white border border-slate-300 rounded-2xl px-4 py-2 shadow-sm shrink-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mr-3">
                        <FaMagic className="text-indigo-400" /> BUILD QTY
                      </span>
                      <div className="flex items-center">
                        <input
                          type="number"
                          min={1}
                          value={globalFillQty}
                          onChange={(e) =>
                            setGlobalFillQty(
                              Math.max(1, Number(e.target.value)),
                            )
                          }
                          className="w-16 text-center text-sm font-black text-slate-900 bg-white border border-slate-300 rounded-xl py-1.5 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                        />
                        <button
                          onClick={applyFillToSelected}
                          className="ml-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition-colors active:scale-95"
                        >
                          FILL
                        </button>
                      </div>
                    </div>

                    {/* Add to Cart */}
                    <button
                      disabled={selectedItems.length === 0}
                      onClick={addSelectedToCart}
                      className={`shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${selectedItems.length > 0 ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                    >
                      <FaCheckDouble /> เพิ่มเข้าตะกร้า ({selectedItems.length})
                    </button>
                  </div>

                  {/* Export Group (Right) */}
                  <div className="flex gap-2 w-full xl:w-auto justify-end overflow-x-auto pb-2 xl:pb-0 hide-scrollbar shrink-0">
                    <button
                      onClick={() => exportExcel("all")}
                      className="shrink-0 flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                      <FaFileExport /> ทั้งหมด
                    </button>
                    <button
                      onClick={() => exportExcel("ready")}
                      className="shrink-0 flex items-center gap-2 bg-emerald-50 border border-emerald-100 hover:border-emerald-200 hover:bg-emerald-100 text-emerald-600 px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                      <FaFileExport /> พร้อม
                    </button>
                    <button
                      onClick={() => exportExcel("shortage")}
                      className="shrink-0 flex items-center gap-2 bg-amber-50 border border-amber-100 hover:border-amber-200 hover:bg-amber-100 text-amber-600 px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                      <FaFileExport /> ขาด
                    </button>
                    <button
                      onClick={() => exportExcel("missing")}
                      className="shrink-0 flex items-center gap-2 bg-rose-50 border border-rose-100 hover:border-rose-200 hover:bg-rose-100 text-rose-600 px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                      <FaFileExport /> ไม่มี
                    </button>
                  </div>
                </div>
              </div>

              {/* MAIN DATA TABLE */}
              <div className="bg-white border-y border-slate-300 shadow-lg mx-0 xl:mx-4 xl:rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-300">
                        <th className="py-4 pl-4 pr-2 whitespace-nowrap w-12">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              onChange={handleSelectAll}
                              checked={
                                results.filter(
                                  (r) =>
                                    r.matches[0] &&
                                    Number(r.matches[0].quantity) > 0,
                                ).length > 0 &&
                                selectedItems.length ===
                                  results.filter(
                                    (r) =>
                                      r.matches[0] &&
                                      Number(r.matches[0].quantity) > 0,
                                  ).length
                              }
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </div>
                        </th>
                        <th className="py-2 px-2 whitespace-nowrap text-[11px] font-bold text-slate-500">
                          #
                        </th>
                        <th className="py-2 px-2 whitespace-nowrap text-[11px] font-bold text-slate-500">
                          STAT
                        </th>
                        <th className="py-2 px-2 text-[11px] font-bold text-indigo-600">
                          ELE/PN
                        </th>
                        <th className="py-2 px-2 text-[11px] font-bold text-slate-500">
                          DESIGNATOR
                        </th>
                        <th className="py-2 px-2 text-[11px] font-bold text-slate-500">
                          DESC. / VALUE
                        </th>
                        <th className="py-2 px-2 text-[11px] font-bold text-slate-500">
                          FOOTPRINT
                        </th>
                        <th className="py-2 px-2 whitespace-nowrap text-[11px] font-bold text-slate-500 text-center">
                          QTY/SET
                        </th>
                        <th className="py-2 px-2 whitespace-nowrap text-[11px] font-bold text-slate-500 text-center">
                          BUILD QTY
                        </th>
                        <th className="py-2 px-2 text-[11px] font-bold text-slate-500">
                          MATCH INFO
                        </th>
                        <th className="py-2 px-2 whitespace-nowrap text-[11px] font-bold text-slate-500 text-center">
                          STOCK
                        </th>
                        <th className="py-2 px-3 whitespace-nowrap text-[11px] font-bold text-indigo-500 text-center">
                          +/-
                        </th>
                        <th className="py-2 px-2 whitespace-nowrap text-[11px] font-bold text-slate-500 text-center">
                          ACTIONS
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <AnimatePresence mode="popLayout">
                        {displayResults.length === 0 ? (
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <td
                              colSpan={13}
                              className="py-16 text-center text-slate-400"
                            >
                              <FaBoxOpen
                                size={48}
                                className="mx-auto mb-4 opacity-20"
                              />
                              <div className="text-sm font-bold uppercase tracking-widest">
                                ไม่มีรายการในหมวดหมู่นี้
                              </div>
                            </td>
                          </motion.tr>
                        ) : (
                          displayResults.map((row, idx) => {
                            const p = row.matches[0];
                            const stockQty = p ? Number(p.quantity || 0) : 0;
                            const hasStock = p && stockQty > 0;
                            const projQty =
                              rowProjectQtys[row.tempId] || globalFillQty || 0;
                            const neededQty = row.bomQty * projQty;
                            const deficit = stockQty - neededQty;
                            const isSelected = selectedItems.includes(
                              row.tempId,
                            );
                            // eslint-disable-next-line no-unused-vars
                            const _cat = getItemCategory(row);

                            let rowBg =
                              "border-b border-slate-100 hover:bg-slate-50";
                            if (isSelected) rowBg += " bg-indigo-50/40";

                            return (
                              <motion.tr
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                key={row.tempId}
                                className={`transition-colors ${rowBg}`}
                              >
                                <td className="py-2 pl-4 pr-2 whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      disabled={!hasStock}
                                      onChange={() =>
                                        handleSelectItem(row.tempId)
                                      }
                                      className={`w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer ${!hasStock ? "opacity-30 cursor-not-allowed" : ""}`}
                                    />
                                  </div>
                                </td>
                                <td className="py-2 px-2 whitespace-nowrap text-xs text-slate-500 font-medium">
                                  {idx + 1}
                                </td>
                                <td className="py-2 px-2 whitespace-nowrap">
                                  {renderStatusBadge(row)}
                                </td>
                                <td className="py-2 px-2">
                                  <CopyableText text={row.displayELE}>
                                    <div className="text-sm font-bold text-indigo-600 break-words w-[100px] md:w-[160px] xl:w-[200px] leading-tight">
                                      {row.displayELE}
                                    </div>
                                  </CopyableText>
                                </td>
                                <td className="py-2 px-2">
                                  <CopyableText text={row.designator}>
                                    <div className="text-[11px] text-slate-600 break-words w-[60px] md:w-[100px] leading-tight line-clamp-3">
                                      {row.designator}
                                    </div>
                                  </CopyableText>
                                </td>
                                <td className="py-2 px-2">
                                  <CopyableText text={row.description}>
                                    <div className="text-[11px] text-slate-600 break-words w-[80px] xl:w-[140px] leading-tight line-clamp-3">
                                      {row.description}
                                    </div>
                                  </CopyableText>
                                </td>
                                <td className="py-2 px-2">
                                  <CopyableText text={row.footprint}>
                                    <div className="text-[11px] text-slate-600 break-words w-[60px] md:w-[80px] leading-tight">
                                      {row.footprint}
                                    </div>
                                  </CopyableText>
                                </td>
                                <td className="py-2 px-2 whitespace-nowrap text-center">
                                  <div className="text-sm font-bold text-slate-700">
                                    {row.bomQty}
                                  </div>
                                  {neededQty > 0 &&
                                    neededQty !== row.bomQty && (
                                      <div className="text-[10px] text-slate-400 font-medium">
                                        = {neededQty.toLocaleString()}
                                      </div>
                                    )}
                                </td>
                                <td className="py-2 px-2 whitespace-nowrap">
                                  <div className="flex items-center justify-center">
                                    <div className="relative group w-16">
                                      <input
                                        type="number"
                                        min={0}
                                        value={rowProjectQtys[row.tempId] ?? ""}
                                        placeholder={String(globalFillQty)}
                                        onChange={(e) =>
                                          setRowProjectQtys((prev) => ({
                                            ...prev,
                                            [row.tempId]: Math.max(
                                              0,
                                              Number(e.target.value),
                                            ),
                                          }))
                                        }
                                        className="w-full text-center text-sm font-bold text-slate-800 bg-white border border-slate-300 rounded md py-1 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all pr-4"
                                      />
                                      <button
                                        onClick={() =>
                                          setRowProjectQtys((prev) => ({
                                            ...prev,
                                            [row.tempId]: globalFillQty,
                                          }))
                                        }
                                        className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-500 transition-colors p-0.5"
                                        title="Fill global Qty"
                                      >
                                        <FaBolt size={8} />
                                      </button>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2 px-2">
                                  {p ? (
                                    <div className="flex items-center gap-2 max-w-[200px] md:max-w-[300px] xl:max-w-md">
                                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                        {p.img ? (
                                          <img
                                            src={`/componentImages${p.img}`}
                                            alt="p"
                                            className="w-full h-full object-contain"
                                          />
                                        ) : (
                                          <FaBoxOpen
                                            className="text-slate-300"
                                            size={16}
                                          />
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <CopyableText text={p.electotronixPN}>
                                          <div className="text-[11px] font-bold text-indigo-600 truncate">
                                            {p.electotronixPN}
                                          </div>
                                        </CopyableText>
                                        <CopyableText text={p.description}>
                                          <div className="text-[11px] text-slate-500 break-words leading-tight line-clamp-2">
                                            {p.description}
                                          </div>
                                        </CopyableText>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] font-bold text-rose-500">
                                      ไม่พบพาร์ท
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-2 whitespace-nowrap text-center text-sm font-bold text-slate-700">
                                  {p ? stockQty.toLocaleString() : "-"}
                                </td>
                                <td
                                  className={`py-2 px-3 whitespace-nowrap text-center font-bold text-base ${deficit < 0 ? "text-rose-600" : deficit > 0 ? "text-emerald-600" : "text-slate-500"}`}
                                >
                                  {p && neededQty > 0 ? (
                                    <span>
                                      {deficit > 0
                                        ? `+${deficit.toLocaleString()}`
                                        : deficit < 0
                                          ? deficit.toLocaleString()
                                          : "0"}
                                    </span>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                                <td className="py-2 px-2 whitespace-nowrap text-center">
                                  <button
                                    onClick={() =>
                                      setShowDetailModal({ row, p })
                                    }
                                    className="flex items-center justify-center gap-1 mx-auto bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-indigo-100"
                                  >
                                    <FaInfoCircle size={10} /> Detail
                                  </button>
                                </td>
                              </motion.tr>
                            );
                          })
                        )}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
                {/* Footer Summary */}
                {displayResults.length > 0 && (
                  <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 tracking-wide">
                      แสดง{" "}
                      <span className="text-slate-800 font-black">
                        {displayResults.length}
                      </span>{" "}
                      รายการ
                      {activeCategory !== "all" && (
                        <span className="text-slate-400">
                          {" "}
                          (จากทั้งหมด {stats.total})
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest border border-slate-200 bg-white px-4 py-2 rounded-full shadow-sm">
                      <span className="text-emerald-500">
                        พร้อม: {stats.ready}
                      </span>
                      <span className="text-slate-200">|</span>
                      <span className="text-amber-500">
                        ขาด: {stats.shortage}
                      </span>
                      <span className="text-slate-200">|</span>
                      <span className="text-rose-500">
                        ไม่มี: {stats.missing}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DETAIL MODAL - Using React Portal to enforce viewport centering ignoring parent transforms */}
      {typeof document !== "undefined" &&
        document.body &&
        createPortal(
          <AnimatePresence>
            {showDetailModal && (
              <div
                className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowDetailModal(null)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="relative bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden m-auto flex flex-col max-h-[85vh]"
                >
                  <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-[1rem] flex items-center justify-center shadow-inner">
                        <FaInfoCircle size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tighter">
                          Part Details
                        </h3>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                          <CopyableText
                            text={
                              showDetailModal.p?.electotronixPN ||
                              showDetailModal.row.displayELE
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDetailModal(null)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <FaTimesCircle size={24} />
                    </button>
                  </div>

                  <div className="p-8 overflow-y-auto hide-scrollbar bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                      {(() => {
                        const { p, row } = showDetailModal;

                        // Try to match the 11-03-2025 format from createdAt or date
                        let dateStr = "-";
                        if (p?.createdAt || p?.date) {
                          const d = new Date(p.createdAt || p.date);
                          dateStr = `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getFullYear()}`;
                        }

                        const details = [
                          {
                            label: "Electotronix PN",
                            value: p?.electotronixPN || row?.displayELE || "-",
                          },
                          { label: "Value", value: p?.value || "-" },
                          { label: "Category", value: p?.category || "-" },
                          {
                            label: "Subcategory",
                            value: p?.subcategory || "-",
                          },
                          {
                            label: "Footprint",
                            value: p?.footprint || row?.footprint || "-",
                          },
                          { label: "Position", value: row?.designator || "-" },
                          { label: "Quantity", value: p?.quantity ?? "-" },
                          { label: "Weight", value: p?.weight || "-" },
                          { label: "Price", value: p?.price || "-" },
                          {
                            label: "Manufacture",
                            value: p?.manufacture || "-",
                          },
                          {
                            label: "Manufacture PN",
                            value:
                              p?.manufacturePN ||
                              row["MANUFACTURE P/N"] ||
                              row["2MANUFACTURE P/N"] ||
                              "-",
                          },
                          { label: "Supplier", value: p?.supplier || "-" },
                          { label: "Supplier PN", value: p?.supplierPN || "-" },
                          { label: "MOQ", value: p?.moq || "-" },
                          { label: "SPQ", value: p?.spq || "-" },
                          {
                            label: "Link",
                            value: p?.link ? (
                              <a
                                href={p.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-500 hover:text-indigo-700 underline truncate block max-w-full"
                              >
                                {p.link}
                              </a>
                            ) : (
                              "-"
                            ),
                          },
                          { label: "Process", value: p?.process || "-" },
                          {
                            label: "Alternative",
                            value: p?.alternative || "-",
                          },
                          {
                            label: "Description",
                            value: p?.description || row?.description || "-",
                          },
                          { label: "Note", value: p?.note || "-" },
                          { label: "Date", value: dateStr },
                        ];

                        return details.map((item, idx) => {
                          const isCopyable =
                            item.value !== "-" &&
                            item.value !== "" &&
                            typeof item.value === "string";
                          const handleCopyModal = (e, text) => {
                            e.stopPropagation();
                            if (!text || text === "-") return;
                            navigator.clipboard.writeText(text);
                            toast.success(`Copied: ${text}`, {
                              autoClose: 1000,
                              hideProgressBar: true,
                              position: "bottom-right",
                            });
                          };
                          return (
                            <div
                              key={idx}
                              onClick={(e) =>
                                isCopyable
                                  ? handleCopyModal(e, item.value)
                                  : null
                              }
                              className={`flex flex-col border-b border-slate-100 pb-3 ${isCopyable ? "group cursor-pointer" : ""}`}
                              title={isCopyable ? "Click to copy" : ""}
                            >
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                                {item.label}
                                {isCopyable && (
                                  <FaCopy
                                    className="opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity"
                                    size={12}
                                  />
                                )}
                              </span>
                              <span className="text-sm font-bold text-slate-800 break-words">
                                {item.value !== "" ? item.value : "-"}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button
                      onClick={() => setShowDetailModal(null)}
                      className="px-8 py-3 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-200"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {/* DOWNLOAD TEMPLATE MODAL */}
      <AnimatePresence>
        {showDownloadModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDownloadModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[3rem] w-full max-w-2xl p-8 shadow-2xl overflow-hidden m-auto"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                  <FaInfoCircle size={32} />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 text-center mb-6 tracking-tighter">
                การเตรียมไฟล์ BOM CSV
              </h3>

              <div className="bg-slate-50 rounded-[2rem] p-6 mb-8 border border-slate-100">
                <h6 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">
                  คอลัมน์ที่จำเป็นเพื่อให้ระบบเช็คสต็อกได้ถูกต้อง:
                </h6>
                <div className="overflow-x-auto rounded-xl border border-slate-200 mb-6 bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600">
                      <tr>
                        <th className="py-3 px-4">1ELECTOTRONIXPN</th>
                        <th className="py-3 px-4">2MANUFACTURE P/N</th>
                        <th className="py-3 px-4">Qty</th>
                        <th className="py-3 px-4 text-emerald-600 bg-emerald-50">
                          Designator (Optional)
                        </th>
                        <th className="py-3 px-4 text-emerald-600 bg-emerald-50">
                          Description (Optional)
                        </th>
                        <th className="py-3 px-4 text-emerald-600 bg-emerald-50">
                          Footprint (Optional)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-bold text-slate-500">
                      <tr>
                        <td className="py-3 px-4 border-t border-slate-100">
                          รหัสพัสดุ (Electotronix)
                        </td>
                        <td className="py-3 px-4 border-t border-slate-100">
                          รหัสผู้ผลิต (MPN)
                        </td>
                        <td className="py-3 px-4 border-t border-slate-100">
                          จำนวนใช้ต่อบอร์ด 1 ชุด
                        </td>
                        <td className="py-3 px-4 border-t border-slate-100 text-emerald-600 bg-emerald-50/50">
                          ตำแหน่ง C1, R1, U1
                        </td>
                        <td className="py-3 px-4 border-t border-slate-100 text-emerald-600 bg-emerald-50/50">
                          ค่า/รายละเอียด เช่น 10k 1%
                        </td>
                        <td className="py-3 px-4 border-t border-slate-100 text-emerald-600 bg-emerald-50/50">
                          แพ็กเกจ เช่น 0603, 0805
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  หมายเหตุการใช้งาน:
                </h6>
                <ul className="space-y-2 text-xs font-bold text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 mt-0.5">•</span>{" "}
                    รายการที่ไม่มีในสต็อก จะแสดงในหมวด "ไม่มีในสต็อก"
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>{" "}
                    รายการที่มีในสต็อกแต่จำนวนไม่พอ จะแสดงส่วนต่างติดลบ (-)
                    ในหมวด "ของขาด"
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>{" "}
                    <strong>Qty:</strong> ใส่จำนวนที่ใช้จริงต่อบอร์ด 1 แผ่น
                    (ระบบจะคูณ BUILD QTY ให้เอง)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>{" "}
                    <strong>Export CSV:</strong>{" "}
                    สามารถส่งออกไฟล์ตามหมวดหมู่เพื่อส่งต่อได้ทันที
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="py-4 rounded-2xl bg-slate-100 text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all active:scale-95"
                >
                  ปิด
                </button>
                <button
                  onClick={executeDownload}
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  <FaDownload /> ดาวน์โหลดเทมเพลต
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
                /* Hide scrollbar for Chrome, Safari and Opera */
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                /* Hide scrollbar for IE, Edge and Firefox */
                .hide-scrollbar {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
            `}</style>
    </div>
  );
};

export default StockCheckBom;
