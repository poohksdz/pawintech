import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Table, Button, Row, Col, Image, Card } from 'react-bootstrap';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import { Link, useParams } from 'react-router-dom';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import Paginate from '../../components/Paginate';
import ConfirmModle from '../../components/ConfirmModle';
import {
  useGetFoliosQuery,
  useDeleteFolioMutation,
  useUpdateShowFrontFolioMutation
} from '../../slices/folioSlice';
import { toast } from 'react-toastify';

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
      toast.success('Folio deleted successfully!');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleCancelDelete = () => {
    setShowModal(false);
  };

  const handleCheckboxChange = async (folioId) => {
    const newSelectedState = selectedFolios[folioId] ? 0 : 1;

    const showFrontCount = Object.values(selectedFolios).filter((value) => value === 1).length;

    if (newSelectedState === 1 && showFrontCount >= 7) {
      toast.error('Select display is already 7 folios');
      return;
    }

    setSelectedFolios((prevSelected) => ({
      ...prevSelected,
      [folioId]: newSelectedState,
    }));

    try {
      await updateShowFrontFolio({ folioId, showFront: newSelectedState });
      toast.success('Folio display status updated!');
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update folio status');
    }
  };

  useEffect(() => {
    refetch();
  }, [pageNumber, refetch]);

  // ✅ แก้ไข: ดักจับโครงสร้างข้อมูล เผื่อว่า Backend ส่งมาเป็น Array หรือ Object
  const foliosArray = Array.isArray(data) ? data : (data?.folios || []);
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
      foliosLbl: 'Folios',
      createFolioLbl: 'Create Folio',
      imageLbl: 'Image',
      nameLbl: 'Name',
      deplomentType: 'Types',
      EDITLbl: 'EDIT',
      SHOWCASELbl: 'SHOW'
    },
    thai: {
      foliosLbl: 'ผลงาน',
      createFolioLbl: 'สร้างผลงาน',
      imageLbl: 'ภาพ',
      nameLbl: 'ชื่อ',
      deplomentType: 'ประเภท',
      EDITLbl: 'แก้ไข',
      SHOWCASELbl: 'แสดง'
    },
  };

  const t = translations[language] || translations.en;

  return (
    <>
      <Row className='align-items-center'>
        <Col>
          <h1>{t.foliosLbl}</h1>
        </Col>
        <Col className='text-end'>
          <Button className='my-3' as={Link} to={`/admin/folio/create`} >
            <FaPlus /> {t.createFolioLbl}
          </Button>
        </Col>
      </Row>

      {loadingDelete && <Loader />}
      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error?.data?.message || error.error}</Message>
      ) : (
        <>
          <Table striped bordered hover responsive className='table-sm'>
            <thead style={{ fontSize: '25px', height: '70px', textAlign: 'center', verticalAlign: 'middle' }}>
              <tr>
                <th>#</th>
                <th>{t.imageLbl}</th>
                <th>{t.nameLbl}</th>
                <th>{t.EDITLbl}</th>
                <th>{t.SHOWCASELbl}</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '20px', textAlign: 'center' }}>
              {/* ✅ เปลี่ยนมาใช้ foliosArray แทน data.folios ที่ทำให้แอปพัง */}
              {foliosArray.map((folio, index) => {
                const name = language === 'thai' ? folio.headerThaiOne : folio.headerTextOne;
                return (
                  <tr key={folio.ID}>
                    <td style={{ width: '50px', height: '100px', verticalAlign: 'middle' }}>{index + 1}</td>
                    <td style={{ width: '150px', height: '100px', verticalAlign: 'middle' }}>
                      <Card>
                        <Image
                          src={
                            typeof folio.imageOne === 'string'
                              ? folio.imageOne
                              : (folio.imageOne?.image || folio.imageOne?.path || folio.imageOne?.url || '/images/sample.jpg')
                          }
                          alt={name}
                          style={{ objectFit: 'cover', width: '100%', height: '100px' }}
                          fluid
                        />
                      </Card>
                    </td>
                    <td style={{ textAlign: 'left', verticalAlign: 'middle' }}>
                      <div style={{ marginLeft: '30px' }}>
                        {name || 'Untitled Folio'}
                      </div>
                    </td>
                    <td style={{ width: '300px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <Button
                        as={Link}
                        to={`/admin/folio/${folio.ID}/edit`}
                        variant='info'
                        className='btn-md mx-3'
                      >
                        <FaEdit style={{ color: 'white' }} />
                      </Button>
                      <Button
                        variant='danger'
                        className='btn-md  mx-3'
                        onClick={() => deleteHandler(folio.ID)}
                      >
                        <FaTrash style={{ color: 'white' }} />
                      </Button>
                    </td>
                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <input
                        type="checkbox"
                        checked={!!selectedFolios[folio.ID]}
                        onChange={() => handleCheckboxChange(folio.ID)}
                        style={{ transform: 'scale(1.5)' }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          {/* ✅ เปลี่ยนมาใช้ตัวแปร pages และ page แทน เพื่อป้องกัน undefined */}
          <Paginate pages={pages} page={page} isAdmin={true} />
        </>
      )}

      {showModal && (
        <ConfirmModle
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </>
  );
};

export default FolioListScreen;