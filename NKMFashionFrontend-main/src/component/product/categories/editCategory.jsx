import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import CamIcon from "../../../img/icons8-camera-100.png";
import imageCompression from "browser-image-compression";
import { toast } from "react-toastify";

function EditCategoryBody() {
  const { id } = useParams();

  const [catData, setCatData] = useState({ category: "", logo: "" });
  const [removeLogo, setRemoveLogo] = useState(false);
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [progress, setProgress] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const fileInputRef = useRef(null);


  useEffect(() => {
    const fetchCategoryDetails = async () => {
      setProgress(true);
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/api/getCategoryForUpdate/${id}`
        );
        setCatData(response.data);

        if (response.data.logo) {
          setLogoPreview(response.data.logo); // Set initial logo preview
        }
      } catch (error) {
        console.error("Error fetching category details:", error);
        setError("Failed to load category details.");
      } finally {
        setProgress(false);
      }
    };

    fetchCategoryDetails();
  }, [id]);

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setError("No file selected.");
      return;
    }

    // Check file type (strictly allow only JPG files)
    if (
      file.type !== "image/jpeg" ||
      !file.name.toLowerCase().endsWith(".jpg")
    ) {
      setError("Only JPG files are allowed. Please upload a valid JPG file.");
      alert("Only JPG files are allowed. Please upload a valid JPG file.");
      return;
    }

    // Check file size (max 4MB)
    const maxFileSizeMB = 4;
    if (file.size / 1024 / 1024 > maxFileSizeMB) {
      setError(
        `File size exceeds ${maxFileSizeMB} MB. Please upload a smaller file.`
      );
      alert(
        `File size exceeds ${maxFileSizeMB} MB. Please upload a smaller file.`
      );
      return;
    }

    // Compression options
    const options = {
      maxSizeMB: 0.02, // Target size (20KB in MB)
      maxWidthOrHeight: 800, // Reduce dimensions to help with compression
      useWebWorker: true, // Enable Web Worker for efficiency
    };

    try {
      // Convert file to data URL to validate dimensions
      const image = await imageCompression.getDataUrlFromFile(file);
      const img = new Image();
      img.src = image;

      // Check image aspect ratio (1:1 within 100px tolerance)
      await new Promise((resolve, reject) => {
        img.onload = () => {
          const width = img.width;
          const height = img.height;
          const tolerance = 100; // Allow 100px variance

          if (Math.abs(width - height) > tolerance) {
            setError(
              "Image must be approximately square (1:1 ratio within 100px tolerance). Please upload an appropriate image."
            );
            alert(
              "Image must be approximately square (1:1 ratio within 100px tolerance). Please upload an appropriate image."
            );
            reject();
          } else {
            resolve();
          }
        };
        img.onerror = () => {
          setError("Error loading image. Please try again.");
          reject();
        };
      });

      // Display the preview of the original image immediately
      const originalPreviewUrl = URL.createObjectURL(file);
      setLogoPreview(originalPreviewUrl);

      // Compress the image asynchronously
      const compressedBlob = await imageCompression(file, options);

      // Convert compressed Blob to File with .jpg extension
      const compressedFile = new File(
        [compressedBlob],
        file.name.replace(/\.[^/.]+$/, ".jpg"),
        {
          type: "image/jpeg",
        }
      );

      // Update state with the compressed image and its preview
      setLogo(compressedFile);
      setError("");
    } catch (error) {
      console.error("Compression Error:", error);
      setError("Error during image processing. Please try again.");
    }
  };

  const handleCategoryChange = (e) => {
    setCatData((prevData) => ({
      ...prevData,
      category: e.target.value,
    }));
  };

  const handleLogoRemove = () => {
    setLogoPreview(null);
    setLogo(null);
    setCatData((prev) => ({
      ...prev,
      logo: null,
    }));
    setRemoveLogo(true);

    // Clear file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProgress(true);
    setError("");
    setSuccess("");

    const formDataToUpdate = new FormData();
    formDataToUpdate.append("category", catData.category);
    if (logo) {
      formDataToUpdate.append("logo", logo); // Add the new logo if selected
    }

    // If logo is removed but no new file, tell backend to remove
    if (removeLogo && !logo) {
      formDataToUpdate.append('removeLogo', true);
    }

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_BASE_URL}/api/updateCategory/${id}`,
        formDataToUpdate,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.status === "Success") {
        toast.success(
          "Category updated successfully!",
          { autoClose: 2000 },
          { className: "custom-toast" }
        );
        navigate("/viewCategory");
      } else {
        toast.error(
          response.data.message || "Failed to update category",
          { autoClose: 2000 },
          { className: "custom-toast" }
        );
      }
    } catch (error) {
      console.error("Error updating category:", error);
      // Extract the error message from the response and display it
      const errorMessage =
        error.response && error.response.data && error.response.data.message
          ? error.response.data.message
          : "Failed to update category. Please try again later.";
      toast.error(
        errorMessage,
        { autoClose: 2000 },
        { className: "custom-toast" }
      );
    } finally {
      setProgress(false);
    }
  };

  return (
    <div className="background-white absolute top-[80px] left-[18%] w-[82%] h-[800px] p-5">
      {progress && (
        <Box
          sx={{
            width: "100%",
            position: "absolute",
            top: "0",
            left: "0",
            margin: "0",
            padding: "0",
          }}
        >
          <LinearProgress />
        </Box>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lightgray-300 m-0 p-0 text-2xl">Edit Category</h2>
        </div>
        <div>
          <Link
            className="px-4 py-1.5 border border-[#35AF87] text-[#35AF87] rounded-md transition-colors duration-300 hover:bg-[#35AF87] hover:text-white"
            to={"/viewCategory"}
          >
            Back
          </Link>
        </div>
      </div>
      <div className="bg-white mt-[20px] w-[630px] h-[600px] rounded-2xl px-8 shadow-md">
        <div className="flex min-h-full flex-1 flex-col px-2 py-12 lg:px-8">
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="mb-4">
              <label
                htmlFor="categoryName"
                className="mb-2 text-left block text-sm font-medium text-gray-700"
              >
                Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="categoryName"
                required
                value={catData.category}
                onChange={handleCategoryChange}
                className="block w-[500px] rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-400 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6"
              />
            </div>

            <div className="mb-4 relative">
              <div className="flex items-center justify-start gap-12">
                <label
                  htmlFor="logo"
                  className="block text-left text-sm font-medium text-gray-700"
                >
                  Logo
                </label>
                {/* Delete Button */}
                {(logoPreview || catData.logo) && (
                  <button
                    type="button"
                    onClick={handleLogoRemove}
                    className=" "
                  >
                    <i className="fas fa-trash  text-gray-400  text-md hover:text-gray-500 "></i>
                  </button>
                )}
              </div>

              <div className="mt-2 relative ">
                <input
                  id="logo"
                  name="logo"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("logo").click()}
                  className={` relative block w-[100px] h-[100px] rounded-md border-0 py-2.5 px-2.5 shadow-sm ring-1 ring-inset ring-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-400 focus:outline-none sm:text-sm sm:leading-6 ${
                    logoPreview
                      ? "bg-cover bg-center"
                      : "bg-gray-200 opacity-70 hover:bg-gray-300"
                  }`}
                  style={{
                    backgroundImage: logoPreview
                      ? `url(${logoPreview})`
                      : `url(${catData.logo})`,
                  }}
                >
                  {!logoPreview && !catData.logo && (
                    <img src={CamIcon} alt="cam" className="ml-5 w-10 h-10" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-start mt-10">
              <button
                type="submit"
                className="button-bg-color  button-bg-color:hover rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-60 text-center"
              >
                Update Category
              </button>
            </div>

            {/* Error and Response Messages */}
            <div className="mt-10">
              {error && (
                <p className="text-red-600 px-5 py-2 rounded-md bg-red-100 mt-5 text-center mx-auto max-w-sm">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-color px-5 py-2 rounded-md bg-green-100 mt-5 text-center  mx-auto max-w-sminline-block">
                  {success}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditCategoryBody;
