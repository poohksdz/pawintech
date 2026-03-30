import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  useUpdateAboutimagesMutation,
  useUploadAboutimagesImageMutation,
} from "../slices/aboutImageApiSlice";
import Modal from "./ui/Modal";
import Button from "./ui/Button";

const ConfirmModleChange = ({ show, onHide, onConfirm, aboutImageId }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [uploadAboutimagesImage, { isLoading: isUploading }] =
    useUploadAboutimagesImageMutation();
  const [updateAboutimages, { isLoading: isUpdating }] =
    useUpdateAboutimagesMutation();

  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Please select an image before confirming");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("id", aboutImageId);
    formData.append("status", "active");

    try {
      const response = await uploadAboutimagesImage(formData).unwrap();

      try {
        await updateAboutimages({
          ID: aboutImageId,
          images: response.image,
        }).unwrap();
        toast.success("About Image Updated");
        navigate("/about");
      } catch (err) {
        toast.error(err?.data?.message || err.error);
        return; // Don't proceed if update fails
      }

      onConfirm(); // Close modal from parent
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image");
    }
  };

  return (
    <Modal isOpen={show} onClose={onHide} title="Confirm Update">
      <div className="p-6">
        <p className="text-slate-600 mb-4">
          Are you sure you want to update image with ID:{" "}
          <strong className="text-slate-900">{aboutImageId}</strong>?
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select New Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              transition-colors"
          />
        </div>

        {previewUrl && (
          <div className="text-center rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full max-h-48 object-contain"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 mt-8">
          <Button
            variant="secondary"
            onClick={onHide}
            disabled={isUploading || isUpdating}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdate}
            disabled={isUploading || isUpdating}
          >
            {isUploading || isUpdating ? "Updating..." : "Confirm Update"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModleChange;
