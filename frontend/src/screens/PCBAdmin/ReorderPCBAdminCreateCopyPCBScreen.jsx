import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Image,
  Card,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import Loader from "../../components/Loader";

import { useGetcopyPCBByOrderIdQuery } from "../../slices/copypcbApiSlice";

import {
  useCreatecopycartMutation,
  useUploadcopypcbZipMutation,
  useUploadMultipleCopyPCBImagesMutation,
} from "../../slices/copypcbCartApiSlice";
import { BASE_URL } from "../../constants";

const ReorderCopyPCBToCartScreen = () => {
  const { id: orderID } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const { data, isLoading, error } = useGetcopyPCBByOrderIdQuery(orderID, {
    skip: !orderID,
  });

  const [createcopycart, { isLoading: creating }] = useCreatecopycartMutation();

  const [uploadZip] = useUploadcopypcbZipMutation();
  const [uploadImages] = useUploadMultipleCopyPCBImagesMutation();

  const [projectname, setProjectname] = useState("");
  const [pcbQty, setPcbQty] = useState(5);
  const [notes, setNotes] = useState("");

  const [frontImages, setFrontImages] = useState([]);
  const [backImages, setBackImages] = useState([]);
  const [zipFile, setZipFile] = useState(null);
  const [existingZip, setExistingZip] = useState(null);

  const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
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

  //  LOAD OLD ORDER (SAME AS EDIT)
  useEffect(() => {
    if (data?.data?.length) {
      const order = data.data[0];

      setProjectname(order.projectname || "");
      setPcbQty(order.pcb_qty || 5);
      setNotes(order.notes || "");
      setExistingZip(order.copypcb_zip || null);

      const front = [];
      const back = [];

      for (let i = 1; i <= 10; i++) {
        if (order[`front_image_${i}`])
          front.push({
            url: getFullUrl(order[`front_image_${i}`]),
            raw: order[`front_image_${i}`],
          });
        if (order[`back_image_${i}`])
          back.push({
            url: getFullUrl(order[`back_image_${i}`]),
            raw: order[`back_image_${i}`],
          });
      }

      setFrontImages(front);
      setBackImages(back);
    }
  }, [data]);

  if (!orderID) return <p>Order ID missing</p>;
  if (isLoading) return <Loader />;
  if (error) return <p>Failed to load order</p>;

  const handleUpload = (e, type) => {
    const files = Array.from(e.target.files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    type === "front"
      ? setFrontImages((p) => [...p, ...files])
      : setBackImages((p) => [...p, ...files]);
  };

  const uploadImagesHandler = async (images) => {
    const form = new FormData();
    images.forEach((img) => img.file && form.append("images", img.file));
    if (!form.has("images")) return [];
    const res = await uploadImages(form).unwrap();
    return (res?.images || []).map((i) => (typeof i === "string" ? i : i.path));
  };

  const uploadZipHandler = async () => {
    if (!zipFile) return existingZip;
    const form = new FormData();
    form.append("copypcbZip", zipFile);
    const res = await uploadZip(form).unwrap();
    return res.path;
  };

  //  INSERT INTO CART
  const submitHandler = async (e) => {
    e.preventDefault();
    if (!userInfo) return navigate("/login");

    try {
      const newFront = await uploadImagesHandler(frontImages);
      const newBack = await uploadImagesHandler(backImages);

      const oldFront = frontImages
        .filter((i) => !i.file)
        .map((i) => i.raw || i.url);

      const oldBack = backImages
        .filter((i) => !i.file)
        .map((i) => i.raw || i.url);

      await createcopycart({
        user_id: userInfo._id,
        projectname,
        pcb_qty: pcbQty,
        notes,
        copypcbFrontImages: [...oldFront, ...newFront],
        copypcbBackImages: [...oldBack, ...newBack],
        copypcb_zip: await uploadZipHandler(),
      }).unwrap();

      toast.success("Reorder added to cart");
      navigate("/cart/copypcbcart");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to reorder");
    }
  };

  return (
    <Container>
      <Form onSubmit={submitHandler}>
        <h2>Reorder Copy PCB</h2>

        <Row>
          <Col md={8}>
            <Card className="p-3 mb-3">
              <Card.Title>Project Name</Card.Title>
              <Form.Control
                value={projectname}
                onChange={(e) => setProjectname(e.target.value)}
              />
            </Card>

            {["front", "back"].map((type) => (
              <Card className="p-3 mb-3" key={type}>
                <Card.Title>{type.toUpperCase()} Images</Card.Title>
                <Form.Control
                  type="file"
                  multiple
                  onChange={(e) => handleUpload(e, type)}
                />
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {(type === "front" ? frontImages : backImages).map(
                    (img, i) => (
                      <Image
                        key={i}
                        src={img.url}
                        thumbnail
                        style={{ width: 100 }}
                      />
                    ),
                  )}
                </div>
              </Card>
            ))}

            <Card className="p-3 mb-3">
              <Card.Title>ZIP</Card.Title>
              {existingZip && !zipFile && <div>Existing: {existingZip}</div>}
              <Form.Control
                type="file"
                onChange={(e) => setZipFile(e.target.files[0])}
              />
            </Card>

            <Card className="p-3 mb-3">
              <Card.Title>Notes</Card.Title>
              <Form.Control
                as="textarea"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Card>
          </Col>

          <Col md={4}>
            <Card className="p-3">
              <Card.Title>PCB Qty</Card.Title>
              <Form.Control
                type="number"
                min={1}
                value={pcbQty}
                onChange={(e) => setPcbQty(e.target.value)}
              />
              <Button type="submit" className="mt-3" disabled={creating}>
                {creating ? "Submitting..." : "ADD TO CART"}
              </Button>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default ReorderCopyPCBToCartScreen;
