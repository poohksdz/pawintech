import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Table, Button, Row, Col, Image, Card } from "react-bootstrap";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { Link, useParams } from "react-router-dom";
import Message from "../../components/Message";
import Loader from "../../components/Loader";
import Paginate from "../../components/Paginate";
import ConfirmModle from "../../components/ConfirmModle";
import {
  useGetFoliosQuery,
  useDeleteFolioMutation,
  useUpdateShowFrontFolioMutation,
} from "../../slices/folioSlice";
import { toast } from "react-toastify";

const FolioListScreen = () => {
  const { pageNumber } = useParams();

  const [showModal, setShowModal] = useState(false);
  const [folioToDelete, setFolioToDelete] = useState(null);
  const [selectedFolios, setSelectedFolios] = useState({});

  const { data, isLoading, error, refetch } = useGetFoliosQuery({
    pageNumber,
  });
  const [updateShowFrontFolio] = useUpdateShowFrontFolioMutation();

  const [deleteFolio, { isLoading: loadingDelete }] = useDeleteFolioMutation();

  const deleteHandler = (id) => {
    setFolioToDelete(id);
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteFolio(folioToDelete);
      refetch();
      setShowModal(false);
      toast.success("Folio deleted successfully!");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleCancelDelete = () => {
    setShowModal(false);
  };

  const handleCheckboxChange = async (folioId) => {
    const newSelectedState = selectedFolios[folioId] ? 0 : 1;

    const showFrontCount = Object.values(selectedFolios).filter(
      (value) => value === 1,
    ).length;

    if (newSelectedState === 1 && showFrontCount >= 7) {
      toast.error("Select display is already 7 folios");
      return;
    }

    setSelectedFolios((prevSelected) => ({
      ...prevSelected,
      [folioId]: newSelectedState,
    }));

    try {
      await updateShowFrontFolio({ folioId, showFront: newSelectedState });
      toast.success("Folio display status updated!");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update folio status");
    }
  };

  useEffect(() => {
    refetch();
  }, [pageNumber, refetch]);

  //  แก้ไข: ดักจับโครงสร้างข้อมูล เผื่อว่า Backend ส่งมาเป็น Array หรือ Object
  const foliosArray = Array.isArray(data) ? data : data?.folios || [];
  const pages = data?.pages || 1;
  const page = data?.page || 1;

  useEffect(() => {
    if (data) {
      const initialSelectedFolios = {};
      foliosArray.forEach((folio) => {
        initialSelectedFolios[folio.ID] = folio.showFront;
      });
      setSelectedFolios(initialSelectedFolios);
    }
  }, [data, foliosArray]);

  const { language } = useSelector((state) => state.language);

  const translations = {
    en: {
      foliosLbl: "Folios",
      createFolioLbl: "Create Folio",
      imageLbl: "Image",
      nameLbl: "Name",
      deplomentType: "Types",
      EDITLbl: "EDIT",
      SHOWCASELbl: "SHOW",
    },
    thai: {
      foliosLbl: "ผลงาน",
      createFolioLbl: "สร้างผลงาน",
      imageLbl: "ภาพ",
      nameLbl: "ชื่อ",
      deplomentType: "ประเภท",
      EDITLbl: "แก้ไข",
      SHOWCASELbl: "แสดง",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black py-8 px-4 md:px-8 font-prompt transition-colors duration-500">
      <Row className="align-items-center mb-6">
        <Col>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.foliosLbl}</h1>
        </Col>
        <Col className="text-end">
          <Button className="bg-slate-900 dark:bg-white text-white dark:text-black border-0 px-4 py-2.5 rounded-lg shadow-sm hover:opacity-90 transition-all font-medium" as={Link} to={`/admin/folio/create`}>
            <FaPlus className="me-2" /> {t.createFolioLbl}
          </Button>
        </Col>
      </Row>

      {loadingDelete && <Loader />}
      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">
          {error?.data?.message || error.error}
        </Message>
      ) : (
        <>
          <div className="bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden transition-colors duration-500">
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold border-b border-slate-100 dark:border-zinc-800">
                <tr>
                  <th className="py-4 px-6 w-20 text-center">#</th>
                  <th className="py-4 px-6 w-32">{t.imageLbl}</th>
                  <th className="py-4 px-6">{t.nameLbl}</th>
                  <th className="py-4 px-6 text-center">{t.EDITLbl}</th>
                  <th className="py-4 px-6 text-center">{t.SHOWCASELbl}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-sm text-slate-700 dark:text-slate-300">
                {/*  เปลี่ยนมาใช้ foliosArray แทน data.folios ที่ทำให้แอปพัง */}
                {foliosArray.map((folio, index) => {
                  const name =
                    language === "thai"
                      ? folio.headerThaiOne
                      : folio.headerTextOne;
                  return (
                    <tr key={folio.ID}>
                      <td className="py-4 px-6 text-center text-slate-400 font-mono text-xs">
                        {index + 1}
                      </td>
                      <td className="py-4 px-6">
                        <div className="w-20 h-20 bg-white dark:bg-black border border-slate-100 dark:border-zinc-800 rounded-lg flex items-center justify-center overflow-hidden shadow-sm p-1">
                          <Image
                            src={
                              typeof folio.imageOne === "string"
                                ? folio.imageOne
                                : folio.imageOne?.image ||
                                folio.imageOne?.path ||
                                folio.imageOne?.url ||
                                "/images/sample.jpg"
                            }
                            alt={name}
                            className="w-full h-full object-cover"
                            fluid
                          />
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {name || "Untitled Folio"}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/admin/folio/${folio.ID}/edit`}
                            className="w-9 h-9 flex items-center justify-center bg-indigo-50 dark:bg-zinc-800 border border-indigo-200 dark:border-zinc-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white rounded-lg transition-all shadow-sm"
                            title={t.EDITLbl}
                          >
                            <FaEdit size={14} />
                          </Link>
                          <button
                            onClick={() => deleteHandler(folio.ID)}
                            className="w-9 h-9 flex items-center justify-center bg-rose-50 dark:bg-zinc-800 border border-rose-200 dark:border-zinc-700 text-rose-600 dark:text-rose-400 hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white rounded-lg transition-all shadow-sm"
                            title="Delete"
                          >
                            <FaTrash size={13} />
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-zinc-950 cursor-pointer"
                          checked={!!selectedFolios[folio.ID]}
                          onChange={() => handleCheckboxChange(folio.ID)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <div className="flex justify-center mt-6">
              <div className="bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 px-5 py-2 rounded-xl shadow-sm">
                <Paginate pages={pages} page={page} isAdmin={true} />
              </div>
            </div>
          </div>
        </>
      )}

      {showModal && (
        <ConfirmModle
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
};

export default FolioListScreen;
