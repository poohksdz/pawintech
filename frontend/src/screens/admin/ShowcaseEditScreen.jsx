import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';
import Loader from '../../components/Loader';
import FormContainer from '../../components/FormContainer';
import { toast } from 'react-toastify';

import {
  useGetShowcaseDetailsQuery,
  useUpdateShowcaseMutation,
  useUploadShowcaseImageMutation,
} from '../../slices/showcasesApiSlice';

const ShowcaseEditScreen = () => {
  
  const { id: showcaseId } = useParams();

  const [name, setName] = useState('');
  // Removed unused 'category' state
  const [nameThai, setNameThai] = useState('');
  const [categoryThai, setCategoryThai] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedpresent, setSelectedPresent] = useState('');
  const [navigateLink, setNavigateLink] = useState('');
  const [image, setImage] = useState('');

  // Create Showcase mutation
  const [updateShowcase, { isLoading }] = useUpdateShowcaseMutation();
  const [uploadShowcaseImage, { isLoading: loadingUpload }] = useUploadShowcaseImageMutation();
  
  // Removed unused 'refetch' and 'error'
  const { data: showcase } = useGetShowcaseDetailsQuery(showcaseId);
  
  // Removed unused category query since the UI is commented out
  // const { data: categorys, error: categoryError } = useGetCategorysQuery({});

  const navigate = useNavigate();

  useEffect(() => {
    if (showcase) {
      setName(showcase.name);
      // setCategory(showcase.category); // Removed
      setNameThai(showcase.nameThai);
      setCategoryThai(showcase.categoryThai);
      setSelectedCategory(showcase.category); 
      setSelectedPresent(showcase.present);
      setNavigateLink(showcase.navigateLink);
      setImage(showcase.image);
    }
  }, [showcase]);
  
  const submitHandler = async (e) => {
    e.preventDefault();
    if (!name || !nameThai) {
      toast.error('Please fill in all required fields.');
      return;
    }
    
    try {
      await updateShowcase({
        showcaseId,
        name,
        category: selectedCategory,
        nameThai,
        categoryThai,
        image,
        present: selectedpresent,
        navigateLink
      }).unwrap(); 
      toast.success('Showcase Updated');
      navigate('/admin/showcaselist');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const uploadFileHandler = async (e) => {
    const formData = new FormData();
    formData.append('image', e.target.files[0]);
    try {
      const res = await uploadShowcaseImage(formData).unwrap();
      toast.success(res.message);
      setImage(res.image);
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const { language } = useSelector((state) => state.language);
  
  const translations = {
    en: {
      goBackLbl: 'Go Back',
      editShowcaseLbl: 'Edit Showcase',
      nameEnglishLbl: 'Name in English',
      enterNameEnglishLbl: 'Enter name in English',
      categoryLbl: 'Category in English',
      enterCategoryEnglishLbl: 'Enter category in English',
      nameThaiLbl: 'Name in Thai',
      enterNameThaiLbl: 'Enter name in Thai',
      categoryThaiLbl: 'Category in Thai',
      enterCategoryThaiLbl: 'Enter category in Thai',
      imageLbl: 'Image (1320x510)',
      enterImageURLLbl: 'Enter image URL',
      updateLbl: 'Update',
      presentLbl: 'Present',
      navigateLinkLbl: 'Navigate Link',
      enternavigateLinkLbl: 'Enter Navigate Link',
    },  
    thai: {
      goBackLbl: 'ย้อนกลับ',
      editShowcaseLbl: 'แก้ไขบริการ',
      nameEnglishLbl: 'ชื่อภาษาอังกฤษ',
      enterNameEnglishLbl: 'กรอกชื่อภาษาอังกฤษ',
      categoryLbl: 'รายละเอียดภาษาอังกฤษ',
      enterCategoryEnglishLbl: 'กรอกรายละเอียดภาษาอังกฤษ',
      nameThaiLbl: 'ชื่อภาษาไทย',
      enterNameThaiLbl: 'กรอกชื่อภาษาไทย',
      categoryThaiLbl: 'รายละเอียดภาษาไทย',
      enterCategoryThaiLbl: 'กรอกรายละเอียดภาษาไทย',
      imageLbl: 'รูปภาพ (1320x510)',
      enterImageURLLbl: 'กรอก URL รูปภาพ',
      updateLbl: 'อัปเดต',
      presentLbl: 'พรีเซนต์',
      navigateLinkLbl: 'ลิงก์นำทาง',  
      enternavigateLinkLbl: 'ป้อนลิงก์นำทาง',
    },  
  };
  
  const t = translations[language] || translations.en; 

  return (
    <>
      <Link to='/admin/showcaselist' className='btn btn-light my-3' style={{color: '#303d4a'}}>
        {t.goBackLbl}
      </Link>
      <FormContainer>
        <h1>{t.editShowcaseLbl}</h1>
        {isLoading || loadingUpload ? ( 
          <Loader />
        ) : (
          <Form onSubmit={submitHandler}>
            <Form.Group controlId='name'>
              <Form.Label>{t.nameEnglishLbl}</Form.Label>
              <Form.Control
                type='text'
                placeholder={t.enterNameEnglishLbl}
                value={name}
                onChange={(e) => setName(e.target.value)}
              ></Form.Control>
            </Form.Group>            
            
            <Form.Group controlId='nameThai' className='mt-3'>
              <Form.Label>{t.nameThaiLbl}</Form.Label>
              <Form.Control
                type='text'
                placeholder={t.enterNameThaiLbl}
                value={nameThai}
                onChange={(e) => setNameThai(e.target.value)} 
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId='image'  className='my-3'>
              <Form.Label>{t.imageLbl}</Form.Label>
              <Form.Control
                label='Choose File'
                onChange={uploadFileHandler}
                type='file'
              ></Form.Control>
              {loadingUpload && <Loader />}
            </Form.Group>

            <Form.Group controlId="present" className="mb-3">
              <Form.Label>{t.presentLbl}</Form.Label>
              <Form.Select
                value={selectedpresent}
                onChange={(e) => setSelectedPresent(e.target.value)}
              >
                <option value="">Null</option>
                <option value="presentOne">Present One พรีเซนต์หนึ่ง</option>
                <option value="presentTwo">Present Two พรีเซนต์สอง</option>
                <option value="presentThree">Present Three พรีเซนต์สาม</option>
                <option value="presentFour">Present Four พรีเซนต์สี่</option>
              </Form.Select>
            </Form.Group> 
             
             <Form.Group controlId='navigateLink' className='mb-3'>
               <Form.Label> https://pawin-tech.com/ * </Form.Label>
               <Form.Control
                 type='text'
                 placeholder={t.enternavigateLinkLbl}
                 value={navigateLink}
                 onChange={(e) => setNavigateLink(e.target.value)} 
               ></Form.Control>
             </Form.Group>

            <Button
              type='submit'
              variant='primary'
              style={{ marginTop: '1rem' }}
            >
              {t.updateLbl}
            </Button>
          </Form>
        )}
      </FormContainer>
    </>
  );
};

export default ShowcaseEditScreen;