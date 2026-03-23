import { useSelector } from 'react-redux';
import { useState } from 'react'; 
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';
import Loader from '../../components/Loader';
import FormContainer from '../../components/FormContainer';
import { toast } from 'react-toastify';

import {
  useCreateShowcaseMutation,
  useUploadShowcaseImageMutation,
} from '../../slices/showcasesApiSlice';

const ShowcaseCreateScreen = () => {
  const [name, setName] = useState('');
  // Removed unused category state
  const [nameThai, setNameThai] = useState('');
  
  // Since the UI for category is commented out, we set these as constant empty strings
  // to satisfy the submitHandler without triggering "unused setter" warnings.
  const selectedCategory = '';
  const categoryThai = '';
  
  const [selectedpresent, setSelectedPresent] = useState('');
  const [navigateLink, setNavigateLink] = useState('');
  const [image, setImage] = useState('');

  // Create Showcase mutation
  const [createShowcase, { isLoading }] = useCreateShowcaseMutation();
  const [uploadShowcaseImage, { isLoading: loadingUpload }] = useUploadShowcaseImageMutation();
  
  // Removed unused category query

  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    // Basic validation before submission
    if (!name ) {
      toast.error('Please fill in all required fields.');
      return;
    }
    
    try {
      await createShowcase({
        name,
        category: selectedCategory,
        nameThai,
        categoryThai,
        image,
        present: selectedpresent,
        navigateLink
      }).unwrap(); 
      toast.success('Showcase created');
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
  
     // Define translation object
  const translations = {
    en: {
      goBackLbl: 'Go Back',
      createShowcaseLbl: 'Create Showcase',
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
      createLbl: 'Create',
      presentLbl: 'Present',
      navigateLinkLbl: 'Navigate Link',
      enternavigateLinkLbl: 'Enter Navigate Link',
    },  
    thai: {
      goBackLbl: 'ย้อนกลับ',
      createShowcaseLbl: 'สร้างโชว์เคส',
      nameEnglishLbl: 'ชื่อภาษาอังกฤษ',
      enterNameEnglishLbl: 'กรอกชื่อภาษาอังกฤษ',
      categoryLbl: 'หมวดหมู่ภาษาอังกฤษ',
      enterCategoryEnglishLbl: 'กรอกหมวดหมู่ภาษาอังกฤษ',
      nameThaiLbl: 'ชื่อภาษาไทย',
      enterNameThaiLbl: 'กรอกชื่อภาษาไทย',
      categoryThaiLbl: 'หมวดหมู่ภาษาไทย',
      enterCategoryThaiLbl: 'กรอกหมวดหมู่ภาษาไทย',
      imageLbl: 'รูปภาพ (1320x510)',
      enterImageURLLbl: 'กรอก URL รูปภาพ',
      createLbl: 'สร้าง',
      presentLbl: 'พรีเซนต์',
      navigateLinkLbl: 'ลิงก์นำทาง',  
      enternavigateLinkLbl: 'ป้อนลิงก์นำทาง',
    },
  };
  
  const t = translations[language] || translations.en; 


  return (
    <>
      <Link to='/admin/showcaselist' className='btn btn-light my-3'>
        {t.goBackLbl}
      </Link>
      <FormContainer>
        <h1>{t.createShowcaseLbl}</h1>
        {isLoading || loadingUpload ? ( // Combined loading states
          <Loader />
        ) : (
          <Form onSubmit={submitHandler}>
            <Form.Group controlId='name'>
              <Form.Label>{t.nameEnglishLbl}</Form.Label>
              <Form.Control
                type='text'
                placeholder={t.enterNameEnglishLbl}
                value={name}
                onChange={(e) => setName(e.target.value)} // More readable
              ></Form.Control>
            </Form.Group>
             
            <Form.Group controlId='nameThai' className='mt-3'>
              <Form.Label>{t.nameThaiLbl}</Form.Label>
              <Form.Control
                type='text'
                placeholder={t.enterNameThaiLbl}
                value={nameThai}
                onChange={(e) => setNameThai(e.target.value)} // More readable
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
                 onChange={(e) => setNavigateLink(e.target.value)} // More readable
               ></Form.Control>
             </Form.Group>

            <Button
              type='submit'
              variant='primary'
              style={{ marginTop: '1rem' }}
            >
              {t.createLbl}
            </Button>
          </Form> 
        )}
      </FormContainer>
    </>
  );
};

export default ShowcaseCreateScreen;