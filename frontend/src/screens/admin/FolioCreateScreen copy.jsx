import { useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
// import Message from '../../components/Message';
import Loader from "../../components/Loader";
import FormContainer from "../../components/FormContainer";
import { toast } from "react-toastify";

import {
  useCreateFolioMutation,
  useUploadFolioImageMutation,
} from "../../slices/folioSlice";

const FolioCreateScreen = () => {
  const [headerTextOne, setHeaderTextOne] = useState("");
  const [headerTextTwo, setHeaderTextTwo] = useState("");
  const [headerTextThree, setHeaderTextThree] = useState("");
  const [headerTextFour, setHeaderTextFour] = useState("");
  const [headerTextFive, setHeaderTextFive] = useState("");

  const [bodyTextOne, setBodyTextOne] = useState("");
  const [bodyTextTwo, setBodyTextTwo] = useState("");
  const [bodyTextThree, setBodyTextThree] = useState("");
  const [bodyTextFour, setBodyTextFour] = useState("");
  const [bodyTextFive, setBodyTextFive] = useState("");

  const [headerThaiOne, setHeaderThaiOne] = useState("");
  const [headerThaiTwo, setHeaderThaiTwo] = useState("");
  const [headerThaiThree, setHeaderThaiThree] = useState("");
  const [headerThaiFour, setHeaderThaiFour] = useState("");
  const [headerThaiFive, setHeaderThaiFive] = useState("");

  const [bodyTextThaiOne, setBodyTextThaiOne] = useState("");
  const [bodyTextThaiTwo, setBodyTextThaiTwo] = useState("");
  const [bodyTextThaiThree, setBodyTextThaiThree] = useState("");
  const [bodyTextThaiFour, setBodyTextThaiFour] = useState("");
  const [bodyTextThaiFive, setBodyTextThaiFive] = useState("");

  const [imageOne, setImageOne] = useState("");
  const [imageTwo, setImageTwo] = useState("");
  const [imageThree, setImageThree] = useState("");
  const [imageFour, setImageFour] = useState("");
  const [imageFive, setImageFive] = useState("");

  const [videoOneLink, setVideoOneLink] = useState("");
  const [videoTwoLink, setVideoTwoLink] = useState("");
  const [videoThreeLink, setVideoThreeLink] = useState("");
  const [videoFourLink, setVideoFourLink] = useState("");
  const [videoFiveLink, setVideoFiveLink] = useState("");

  // Create Folio mutation
  const [createFolio, { isLoading }] = useCreateFolioMutation();
  const [uploadFolioImage] = useUploadFolioImageMutation();

  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    // Basic validation before submission
    if (!headerTextOne) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      await createFolio({
        headerTextOne,
        headerTextTwo,
        headerTextThree,
        headerTextFour,
        headerTextFive,
        bodyTextOne,
        bodyTextTwo,
        bodyTextThree,
        bodyTextFour,
        bodyTextFive,
        headerThaiOne,
        headerThaiTwo,
        headerThaiThree,
        headerThaiFour,
        headerThaiFive,
        bodyTextThaiOne,
        bodyTextThaiTwo,
        bodyTextThaiThree,
        bodyTextThaiFour,
        bodyTextThaiFive,
        imageOne,
        imageTwo,
        imageThree,
        imageFour,
        imageFive,
        videoOneLink,
        videoTwoLink,
        videoThreeLink,
        videoFourLink,
        videoFiveLink,
      }).unwrap(); // Unwrap to catch any rejection in catch block
      toast.success("Folio created");
      navigate("/admin/foliolist");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  // Upload image one mutation
  const uploadImageOneHandler = async (e) => {
    // const formData = new FormData();
    // formData.append('image', e.target.files[0]);
    // try {
    //   const res = await uploadFolioImage(formData).unwrap();
    //   toast.success(res.message);
    //   setImage(res.image);
    // } catch (err) {
    //   toast.error(err?.data?.message || err.error);
    // }
  };

  // Upload image two mutation
  const uploadImageTwoHandler = async (e) => {
    // const formData = new FormData();
    // formData.append('image', e.target.files[0]);
    // try {
    //   const res = await uploadFolioImage(formData).unwrap();
    //   toast.success(res.message);
    //   setImage(res.image);
    // } catch (err) {
    //   toast.error(err?.data?.message || err.error);
    // }
  };

  // Upload image three mutation
  const uploadImageThreeHandler = async (e) => {
    // const formData = new FormData();
    // formData.append('image', e.target.files[0]);
    // try {
    //   const res = await uploadFolioImage(formData).unwrap();
    //   toast.success(res.message);
    //   setImage(res.image);
    // } catch (err) {
    //   toast.error(err?.data?.message || err.error);
    // }
  };

  // Upload image four mutation
  const uploadImageFourHandler = async (e) => {
    // const formData = new FormData();
    // formData.append('image', e.target.files[0]);
    // try {
    //   const res = await uploadFolioImage(formData).unwrap();
    //   toast.success(res.message);
    //   setImage(res.image);
    // } catch (err) {
    //   toast.error(err?.data?.message || err.error);
    // }
  };

  // Upload image five mutation
  const uploadImageFiveHandler = async (e) => {
    // const formData = new FormData();
    // formData.append('image', e.target.files[0]);
    // try {
    //   const res = await uploadFolioImage(formData).unwrap();
    //   toast.success(res.message);
    //   setImage(res.image);
    // } catch (err) {
    //   toast.error(err?.data?.message || err.error);
    // }
  };

  const { language } = useSelector((state) => state.language);

  // Define translation object
  const translations = {
    en: {
      goBackLbl: "Go Back",
      createLbl: "Create",
      headerTextOneLbl: "Header Text One",
      headerTextTwoLbl: "Header Text Two",
      headerTextThreeLbl: "Header Text Three",
      headerTextFourLbl: "Header Text Four",
      headerTextFiveLbl: "Header Text Five",
      bodyTextOneLbl: "Body Text One",
      bodyTextTwoLbl: "Body Text Two",
      bodyTextThreeLbl: "Body Text Three",
      bodyTextFourLbl: "Body Text Four",
      bodyTextFiveLbl: "Body Text Five",
      headerThaiOneLbl: "Header Thai One",
      headerThaiTwoLbl: "Header Thai Two",
      headerThaiThreeLbl: "Header Thai Three",
      headerThaiFourLbl: "Header Thai Four",
      headerThaiFiveLbl: "Header Thai Five",
      bodyTextThaiOneLbl: "Body Text Thai One",
      bodyTextThaiTwoLbl: "Body Text Thai Two",
      bodyTextThaiThreeLbl: "Body Text Thai Three",
      bodyTextThaiFourLbl: "Body Text Thai Four",
      bodyTextThaiFiveLbl: "Body Text Thai Five",
      imageOneLbl: "Image One",
      imageTwoLbl: "Image Two",
      imageThreeLbl: "Image Three",
      imageFourLbl: "Image Four",
      imageFiveLbl: "Image Five",
      videoOneLbl: "Video One",
      videoTwoLbl: "Video Two",
      videoThreeLbl: "Video Three",
      videoFourLbl: "Video Four",
      videoFiveLbl: "Video Five",
    },
    thai: {
      goBackLbl: "ย้อนกลับ",
      createLbl: "สร้าง",
      headerTextOneLbl: "หัวข้อหนึ่ง",
      headerTextTwoLbl: "หัวข้อสอง",
      headerTextThreeLbl: "หัวข้อสาม",
      headerTextFourLbl: "หัวข้อสี่",
      headerTextFiveLbl: "หัวข้อห้า",
      bodyTextOneLbl: "เนื้อหาหนึ่ง",
      bodyTextTwoLbl: "เนื้อหาสอง",
      bodyTextThreeLbl: "เนื้อหาสาม",
      bodyTextFourLbl: "เนื้อหาสี่",
      bodyTextFiveLbl: "เนื้อหาห้า",
      headerThaiOneLbl: "หัวข้อไทยหนึ่ง",
      headerThaiTwoLbl: "หัวข้อไทยสอง",
      headerThaiThreeLbl: "หัวข้อไทยสาม",
      headerThaiFourLbl: "หัวข้อไทยสี่",
      headerThaiFiveLbl: "หัวข้อไทยห้า",
      bodyTextThaiOneLbl: "เนื้อหาไทยหนึ่ง",
      bodyTextThaiTwoLbl: "เนื้อหาไทยสอง",
      bodyTextThaiThreeLbl: "เนื้อหาไทยสาม",
      bodyTextThaiFourLbl: "เนื้อหาไทยสี่",
      bodyTextThaiFiveLbl: "เนื้อหาไทยห้า",
      imageOneLbl: "รูปภาพหนึ่ง",
      imageTwoLbl: "รูปภาพสอง",
      imageThreeLbl: "รูปภาพสาม",
      imageFourLbl: "รูปภาพสี่",
      imageFiveLbl: "รูปภาพห้า",
      videoOneLbl: "วิดีโอหนึ่ง",
      videoTwoLbl: "วิดีโอสอง",
      videoThreeLbl: "วิดีโอสาม",
      videoFourLbl: "วิดีโอสี่",
      videoFiveLbl: "วิดีโอห้า",
    },
  };

  const t = translations[language] || translations.en;

  return (
    <>
      <Link to="/admin/foliolist" className="btn btn-light my-3">
        {t.goBackLbl}
      </Link>
      <FormContainer>
        <h1>{t.createFoliolbl}</h1>
        {isLoading ? ( // Combined loading states
          <Loader />
        ) : (
          <Form onSubmit={submitHandler}>
            <Form.Group controlId="headerTextOne" className="my-2">
              <Form.Label>{t.headerTextOneLbl}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t.headerTextOneLbl}
                value={headerTextOne}
                onChange={(e) => setHeaderTextOne(e.target.value)} // More readable
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="bodyTextOne" className="my-2">
              <Form.Label>{t.bodyTextOneLbl}</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder={t.bodyTextOneLbl}
                value={bodyTextOne}
                onChange={(e) => setBodyTextOne(e.target.value)} // More readable
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="headerThaiOne" className="my-2">
              <Form.Label>{t.headerThaiOneLbl}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t.headerThaiOneLbl}
                value={headerThaiOne}
                onChange={(e) => setHeaderThaiOne(e.target.value)} // More readable
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="bodyTextThaiOne" className="my-2">
              <Form.Label>{t.bodyTextThaiOneLbl}</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder={t.bodyTextThaiOneLbl}
                value={bodyTextThaiOne}
                onChange={(e) => setBodyTextThaiOne(e.target.value)} // More readable
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="imageOne" className="my-2">
              <Form.Label>{t.imageOneLbl}</Form.Label>
              <Form.Control
                label="Choose File"
                onChange={uploadImageOneHandler}
                type="file"
              ></Form.Control>
              {isLoading && <Loader />}
            </Form.Group>

            <Form.Group controlId="videoOneLink" className="my-2">
              <Form.Label>{t.videoOneLbl}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t.videoOneLbl}
                value={videoOneLink}
                onChange={(e) => setVideoOneLink(e.target.value)}
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="headerTextTwo" className="my-2">
              <Form.Label>{t.headerTextTwoLbl}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t.headerTextTwoLbl}
                value={headerTextTwo}
                onChange={(e) => setHeaderTextTwo(e.target.value)} // More readable
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="bodyTextTwo" className="my-2">
              <Form.Label>{t.bodyTextTwoLbl}</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder={t.bodyTextTwoLbl}
                value={bodyTextTwo}
                onChange={(e) => setBodyTextTwo(e.target.value)} // More readable
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="headerThaiTwo" className="my-2">
              <Form.Label>{t.headerThaiTwoLbl}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t.headerThaiTwoLbl}
                value={headerThaiTwo}
                onChange={(e) => setHeaderThaiTwo(e.target.value)} // More readable
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="bodyTextThaiTwo" className="my-2">
              <Form.Label>{t.bodyTextThaiTwoLbl}</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder={t.bodyTextThaiTwoLbl}
                value={bodyTextThaiTwo}
                onChange={(e) => setBodyTextThaiTwo(e.target.value)} // More readable
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="imageTwo" className="my-2">
              <Form.Label>{t.imageTwoLbl}</Form.Label>
              <Form.Control
                label="Choose File"
                onChange={uploadImageTwoHandler}
                type="file"
              ></Form.Control>
              {isLoading && <Loader />}
            </Form.Group>

            <Form.Group controlId="videoTwoLink" className="my-2">
              <Form.Label>{t.videoTwoLbl}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t.videoTwoLbl}
                value={videoTwoLink}
                onChange={(e) => setVideoTwoLink(e.target.value)}
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="headerTextThree" className="my-2">
              <Form.Label>{t.headerTextThreeLbl}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t.headerTextThreeLbl}
                value={headerTextThree}
                onChange={(e) => setHeaderTextThree(e.target.value)} // More readable
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="bodyTextThree" className="my-2">
              <Form.Label>{t.bodyTextThreeLbl}</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder={t.bodyTextThreeLbl}
                value={bodyTextThree}
                onChange={(e) => setBodyTextThree(e.target.value)} // More readable
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="headerThaiThree" className="my-2">
              <Form.Label>{t.headerThaiThreeLbl}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t.headerThaiThreeLbl}
                value={headerThaiThree}
                onChange={(e) => setHeaderThaiThree(e.target.value)} // More readable
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="bodyTextThaiThree" className="my-2">
              <Form.Label>{t.bodyTextThaiThreeLbl}</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder={t.bodyTextThaiThreeLbl}
                value={bodyTextThaiThree}
                onChange={(e) => setBodyTextThaiThree(e.target.value)} // More readable
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="imageThree" className="my-2">
              <Form.Label>{t.imageThreeLbl}</Form.Label>
              <Form.Control
                label="Choose File"
                onChange={uploadImageThreeHandler}
                type="file"
              ></Form.Control>
              {isLoading && <Loader />}
            </Form.Group>

            <Form.Group controlId="videoThreeLink" className="my-2">
              <Form.Label>{t.videoThreeLbl}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t.videoThreeLbl}
                value={videoThreeLink}
                onChange={(e) => setVideoThreeLink(e.target.value)}
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="headerTextFour" className="my-2">
              <Form.Label>{t.headerTextFourLbl}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t.headerTextFourLbl}
                value={headerTextFour}
                onChange={(e) => setHeaderTextFour(e.target.value)} // More readable
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="bodyTextFour" className="my-2">
              <Form.Label>{t.bodyTextFourLbl}</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder={t.bodyTextFourLbl}
                value={bodyTextFour}
                onChange={(e) => setBodyTextFour(e.target.value)} // More readable
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="headerThaiFour" className="my-2">
              <Form.Label>{t.headerThaiFourLbl}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t.headerThaiFourLbl}
                value={headerThaiFour}
                onChange={(e) => setHeaderThaiFour(e.target.value)} // More readable
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="bodyTextThaiFour" className="my-2">
              <Form.Label>{t.bodyTextThaiFourLbl}</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder={t.bodyTextThaiFourLbl}
                value={bodyTextThaiFour}
                onChange={(e) => setBodyTextThaiFour(e.target.value)} // More readable
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="imageFour" className="my-2">
              <Form.Label>{t.imageFourLbl}</Form.Label>
              <Form.Control
                label="Choose File"
                onChange={uploadImageFourHandler}
                type="file"
              ></Form.Control>
              {isLoading && <Loader />}
            </Form.Group>

            <Form.Group controlId="videoFourLink" className="my-2">
              <Form.Label>{t.videoFourLbl}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t.videoFourLbl}
                value={videoFourLink}
                onChange={(e) => setVideoFourLink(e.target.value)}
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="headerTextFive" className="my-2">
              <Form.Label>{t.headerTextFiveLbl}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t.headerTextFiveLbl}
                value={headerTextFive}
                onChange={(e) => setHeaderTextFive(e.target.value)} // More readable
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="bodyTextFive" className="my-2">
              <Form.Label>{t.bodyTextFiveLbl}</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder={t.bodyTextFiveLbl}
                value={bodyTextFive}
                onChange={(e) => setBodyTextFive(e.target.value)} // More readable
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="headerThaiFive" className="my-2">
              <Form.Label>{t.headerThaiFiveLbl}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t.headerThaiFiveLbl}
                value={headerThaiFive}
                onChange={(e) => setHeaderThaiFive(e.target.value)} // More readable
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="bodyTextThaiFive" className="my-2">
              <Form.Label>{t.bodyTextThaiFiveLbl}</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder={t.bodyTextThaiFiveLbl}
                value={bodyTextThaiFive}
                onChange={(e) => setBodyTextThaiFive(e.target.value)} // More readable
              ></Form.Control>
            </Form.Group>

            <Form.Group controlId="imageFive" className="my-2">
              <Form.Label>{t.imageFiveLbl}</Form.Label>
              <Form.Control
                label="Choose File"
                onChange={uploadImageFiveHandler}
                type="file"
              ></Form.Control>
              {isLoading && <Loader />}
            </Form.Group>

            <Form.Group controlId="videoFiveLink" className="my-2">
              <Form.Label>{t.videoFiveLbl}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t.videoFiveLbl}
                value={videoFiveLink}
                onChange={(e) => setVideoFiveLink(e.target.value)}
              ></Form.Control>
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              style={{ marginTop: "1rem" }}
            >
              {t.createLbl}
            </Button>
          </Form>
        )}
      </FormContainer>
    </>
  );
};

export default FolioCreateScreen;
