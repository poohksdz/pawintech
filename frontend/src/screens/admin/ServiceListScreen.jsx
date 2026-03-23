import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { FaEdit, FaTrash, FaPlus, FaTools, FaImage } from 'react-icons/fa';
import { toast } from 'react-toastify';

// Components
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import Paginate from '../../components/Paginate';
import ConfirmModle from '../../components/ConfirmModle';

// API Slices
import {
  useGetServicesQuery,
  useDeleteServiceMutation,
  useUpdateShowFrontServiceMutation
} from '../../slices/servicesApiSlice';

const ServiceListScreen = () => {
  const { pageNumber } = useParams();
  const { language } = useSelector((state) => state.language);

  // State
  const [showModal, setShowModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [selectedServices, setSelectedServices] = useState({});

  // API Calls
  const { data, isLoading, error, refetch } = useGetServicesQuery({ pageNumber });
  const [updateShowFrontService] = useUpdateShowFrontServiceMutation();
  const [deleteService, { isLoading: loadingDelete }] = useDeleteServiceMutation();

  // Translations
  const t = {
    en: {
      title: 'Services Management',
      subtitle: 'Manage and customize your service offerings',
      btnCreate: 'Create Service',
      lblShow: 'Show on Front',
      noData: 'No services found.',
      modalTitle: 'Confirm Delete',
      modalBody: 'Are you sure you want to delete this service?',
    },
    thai: {
      title: 'จัดการบริการ',
      subtitle: 'จัดการและปรับแต่งข้อมูลบริการของคุณ',
      btnCreate: 'สร้างบริการ',
      lblShow: 'แสดงหน้าแรก',
      noData: 'ไม่พบข้อมูลบริการ',
      modalTitle: 'ยืนยันการลบ',
      modalBody: 'คุณแน่ใจหรือไม่ที่จะลบบริการนี้?',
    }
  }[language || 'en'];

  // Handlers
  const deleteHandler = (id) => {
    setServiceToDelete(id);
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteService(serviceToDelete).unwrap();
      toast.success('Service deleted successfully!');
      setShowModal(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleCheckboxChange = async (serviceId) => {
    const currentState = selectedServices[serviceId] ? 1 : 0;
    const newState = currentState === 1 ? 0 : 1;

    const showFrontCount = Object.values(selectedServices).filter(v => v === 1).length;
    if (newState === 1 && showFrontCount >= 7) {
      toast.warning('Maximum 7 services can be displayed on front page.');
      return;
    }

    setSelectedServices(prev => ({ ...prev, [serviceId]: newState }));

    try {
      await updateShowFrontService({ serviceId, showFront: newState }).unwrap();
      toast.success('Display status updated');
    } catch (err) {
      setSelectedServices(prev => ({ ...prev, [serviceId]: currentState }));
      toast.error(err?.data?.message || 'Update failed');
    }
  };

  useEffect(() => {
    if (data && data.services) {
      const initialSelected = {};
      data.services.forEach(service => {
        initialSelected[service.ID] = service.showFront;
      });
      setSelectedServices(initialSelected);
    }
  }, [data]);

  useEffect(() => {
    refetch();
  }, [pageNumber, refetch]);

  return (
    <div className="bg-[#f8fafc] min-h-screen py-8 md:py-12 font-sans text-slate-800 selection:bg-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* --- Header Section --- */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl shrink-0 border border-indigo-100/50">
                <FaTools />
            </div>
            <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none mb-1.5">{t.title}</h2>
                <p className="text-sm md:text-base text-slate-500 font-medium m-0">{t.subtitle}</p>
            </div>
          </div>
          
          <Link 
            to="/admin/service/create" 
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md shadow-indigo-600/20 hover:-translate-y-0.5 hover:shadow-lg w-full md:w-auto"
          >
            <FaPlus /> {t.btnCreate}
          </Link>
        </div>

        {/* --- Content Area --- */}
        {loadingDelete && <Loader />}
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20"><Loader /></div>
        ) : error ? (
          <Message variant="danger">{error?.data?.message || error.error}</Message>
        ) : !data || data.services.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-dashed border-slate-300 py-20 flex flex-col items-center justify-center text-slate-500 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <FaTools className="text-4xl text-slate-300" />
            </div>
            <h5 className="text-lg font-bold text-slate-600">{t.noData}</h5>
          </div>
        ) : (
          <>
            {/* --- Grid Layout for Services --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {data.services.map((service) => (
                <div key={service.ID} className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300">
                  
                  {/* Image Area (16:9 Aspect Ratio) */}
                  <div className="relative w-full aspect-video bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
                    {service.imageOne ? (
                        <img 
                            src={service.imageOne} 
                            alt={service.headerTextOne} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                    ) : (
                        <FaImage className="text-4xl text-slate-300" />
                    )}
                    {/* Badge Overlay */}
                    {service.deploymentTypes && (
                        <span className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-slate-800 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
                            {service.deploymentTypes}
                        </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 md:p-6 flex flex-col flex-grow">
                    <h3 className="font-bold text-slate-900 text-lg mb-1 truncate" title={language === 'thai' ? service.headerThaiOne : service.headerTextOne}>
                        {language === 'thai' ? service.headerThaiOne : service.headerTextOne}
                    </h3>
                    <p className="text-slate-500 text-xs md:text-sm font-medium line-clamp-2 mb-4 flex-grow">
                        {service.deploymentTypes || 'No description available'}
                    </p>

                    {/* Footer Actions */}
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                        
                        {/* Custom Tailwind Toggle Switch */}
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleCheckboxChange(service.ID)}>
                            <button
                                type="button"
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${!!selectedServices[service.ID] ? 'bg-emerald-500' : 'bg-slate-200'}`}
                            >
                                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${!!selectedServices[service.ID] ? 'translate-x-2' : '-translate-x-2'}`} />
                            </button>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 select-none">
                                {t.lblShow}
                            </span>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5">
                            <Link 
                                to={`/admin/service/${service.ID}/edit`} 
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors"
                                title="Edit"
                            >
                                <FaEdit size={14}/>
                            </Link>
                            <button 
                                type="button"
                                onClick={() => deleteHandler(service.ID)}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors"
                                title="Delete"
                            >
                                <FaTrash size={12}/>
                            </button>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* --- Pagination --- */}
            <div className="mt-10 flex justify-center">
              <Paginate pages={data.pages} page={data.page} isAdmin={true} />
            </div>
          </>
        )}

        {/* Delete Modal */}
        {showModal && (
          <ConfirmModle
            show={showModal}
            title={t.modalTitle}
            body={t.modalBody}
            onConfirm={handleConfirmDelete}
            onCancel={() => setShowModal(false)}
          />
        )}

      </div>
    </div>
  );
};

export default ServiceListScreen;