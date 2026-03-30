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

import { useGetCustomPCBByOrderIDQuery } from "../../slices/custompcbApiSlice";

import {
  useCreateCustomcartMutation,
  useUploadCustomCartDiagramZipMutation,
  useUploadCustomCartMultipleImagesMutation,
} from "../../slices/custompcbCartApiSlice";
import { BASE_URL } from "../../constants";

const ReorderCustomPCBToCartScreen = () => {
  const { id: orderID } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  //  fetch old order
  const { data, isLoading, error } = useGetCustomPCBByOrderIDQuery(orderID, {
    skip: !orderID,
  });

  //  CART mutation (IMPORTANT)
  const [createCustomcart, { isLoading: creating }] =
    useCreateCustomcartMutation();

  const [uploadDiagramZip] = useUploadCustomCartDiagramZipMutation();
  const [uploadMultipleImages] = useUploadCustomCartMultipleImagesMutation();

  // ---------- FORM STATE ----------
  const [projectname, setProjectName] = useState("");
  const [pcbQty, setPcbQty] = useState(5);
  const [notes, setNotes] = useState("");
  const [diagramImages, setDiagramImages] = useState([]);
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

  // ---------- LOAD OLD DATA ----------
  useEffect(() => {
    if (data?.data?.length) {
      const order = data.data[0];

      setExistingZip(order.dirgram_zip || null);
      setProjectName(order.projectname || "");
      setPcbQty(order.pcb_qty || 5);
      setNotes(order.notes || "");

      const images = [];
      for (let i = 1; i <= 10; i++) {
        const key = `dirgram_image_${i}`;
        if (order[key]) {
          images.push({ url: getFullUrl(order[key]), raw: order[key] });
        }
      }
      setDiagramImages(images);
    }
  }, [data]);

  if (!orderID) return <p className="text-danger">Order ID missing</p>;
  if (isLoading) return <Loader />;
  if (error) return <p className="text-danger">Failed to load order</p>;
  if (!data?.data?.length) return <p>No order found</p>;

  // ---------- IMAGE HANDLERS ----------
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setDiagramImages((prev) => [...prev, ...previews]);
  };

  const removeImage = (index) => {
    setDiagramImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadDiagramImages = async () => {
    const form = new FormData();
    diagramImages.forEach((img) => {
      if (img.file) form.append("images", img.file);
    });

    if (form.has("images")) {
      const res = await uploadMultipleImages(form).unwrap();
      return res.images.map((img) => img.path);
    }
    return [];
  };

  const uploadDiagramZipHandler = async () => {
    if (!zipFile) return existingZip;
    const form = new FormData();
    form.append("diagramZip", zipFile);
    const res = await uploadDiagramZip(form).unwrap();
    return res.path;
  };

  // ---------- SUBMIT (INSERT TO CART) ----------
  const orderNowHandler = async (e) => {
    e.preventDefault();

    if (!userInfo) {
      navigate("/login");
      return;
    }

    try {
      const uploadedNewImages = await uploadDiagramImages();

      const existingImages = diagramImages
        .filter((img) => !img.file)
        .map((img) => img.raw || img.url);

      const allImages = [...existingImages, ...uploadedNewImages];
      const zipPath = await uploadDiagramZipHandler();

      await createCustomcart({
        user_id: userInfo._id,
        projectname,
        pcb_qty: pcbQty,
        notes,
        diagramImages: allImages,
        dirgram_zip: zipPath,
      }).unwrap();

      toast.success("Reorder added to cart successfully");
      navigate("/cart/custompcbcart");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add reorder to cart");
    }
  };

  return (
    <Container className="my-4">
      <Form onSubmit={orderNowHandler}>
        <h2 className="mb-4">
          Reorder Custom PCB
          <br />
          <small className="text-muted">From Order ID: {orderID}</small>
        </h2>

        <Row>
          <Col xl={10}>
            <Card className="p-3 mb-4">
              <Card.Title>Name</Card.Title>
              <Form.Control
                value={projectname}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </Card>

            <Card className="p-3 mb-4">
              <Card.Title>Diagram Images</Card.Title>
              <Form.Control
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
              />

              <div className="d-flex flex-wrap mt-3 gap-2">
                {diagramImages.map((img, idx) => (
                  <div key={idx} style={{ position: "relative" }}>
                    <Image
                      src={img.url}
                      thumbnail
                      style={{ width: 100, height: 100, objectFit: "cover" }}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      style={{ position: "absolute", top: 2, right: 2 }}
                      onClick={() => removeImage(idx)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-3 mb-4">
              <Card.Title>Diagram ZIP</Card.Title>
              {!zipFile && existingZip && (
                <div className="mb-2">
                  Existing ZIP:{" "}
                  <a
                    href={getFullUrl(existingZip)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {existingZip.split("/").pop()}
                  </a>
                </div>
              )}
              <Form.Control
                type="file"
                accept=".zip,.rar"
                onChange={(e) => setZipFile(e.target.files[0])}
              />
            </Card>

            <Card className="p-3 mb-4">
              <Card.Title>Notes</Card.Title>
              <Form.Control
                as="textarea"
                rows={6}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Card>
          </Col>

          <Col xl={2}>
            <Card className="p-4">
              <Card.Title>PCB Quantity</Card.Title>
              <Form.Control
                type="number"
                min="5"
                value={pcbQty}
                onChange={(e) => setPcbQty(Math.max(5, Number(e.target.value)))}
              />

              <Button type="submit" className="w-100 mt-3" disabled={creating}>
                {creating ? "Submitting..." : "ADD TO CART"}
              </Button>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default ReorderCustomPCBToCartScreen;
