const Brands = require('../../models/products/productBrands');
const path = require('path');
const fs = require('fs');

// Create a new product brand
const createProductBrands = async (req, res) => {
    const { brandName } = req.body;
    let logo = null;

    if (!brandName) {
        // Delete the uploaded image if validation fails
        if (req.file) {
            const filePath = path.resolve(req.file.path);
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) console.error("Failed to delete unused file:", err);
                });
            }
        }
        return res.status(400).json({ message: 'Brand name is required' });
    }

    try {
        // Check if the brand name already exists
        const existingBrand = await Brands.findOne({ brandName: { $regex: `^${brandName}$`, $options: "i" } });
        if (existingBrand) {
            // Delete the uploaded image if the brand already exists
            if (req.file) {
                const filePath = path.resolve(req.file.path);
                if (fs.existsSync(filePath)) {
                    fs.unlink(filePath, (err) => {
                        if (err) console.error("Failed to delete unused file:", err);
                    });
                }
            }
            return res.status(400).json({ message: 'This brand already exists' });
        }

        // Check if an image file is provided
        if (req.file) {
            logo = path.join('brand', req.file.filename); // Relative path to access image
        }

        // Create a new brand document
        const newBrand = new Brands({
            brandName,
            logo,
        });

        // Save the new brand to the database
        await newBrand.save();
        res.status(201).json({ status: "Success", brand: newBrand });

    } catch (err) {
        // Delete the uploaded image if an error occurs during creation
        if (req.file) {
            const filePath = path.resolve(req.file.path);
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (error) => {
                    if (error) console.error("Failed to delete unused file:", error);
                });
            }
        }
        res.status(500).json({ status: "Unsuccessful", error: err.message , message: 'Internal server error'  });
        console.error("Error adding brand:", err);
    }
};


// Find a brand based on search criteria
const findBrand = async (req, res) => {
    try {
        const { brandName } = req.body;
        
        // Use a regular expression that matches the beginning of the brandName (case-insensitive)
        const brand = await Brands.findOne({
            brandName: { $regex: new RegExp(`${brandName}`, 'i') } // Match brands starting with the entered text
        });

        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }
        
        const brandObj = brand.toObject();

        // If logo exists, construct the image URL
        if (brandObj.logo) {
            const imageUrl = `${req.protocol}://${req.get('host')}/uploads/brand/${path.basename(brandObj.logo)}`;
            brandObj.logo = imageUrl;  // Add logoUrl to the response object
        }

        res.json(brandObj);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// const searchBrands = async (req, res) => {
//     const { brandName } = req.query;

//     // Escape special regex characters
//     const escapedBrandName = brandName.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, '\\$&');

//     try {
//         const brand = await Brands.find({
//             brandName: { $regex: new RegExp(`${escapedBrandName}`, 'i') },
//         }).limit(20);  // Optional: Limit the number of results

//         if (brand.length === 0) {
//             return res.status(404).json({ status: 'unsuccess', message: 'No brands found.' });
//         }
//         return res.status(200).json({ status: 'success', brand });
//     } catch (error) {
//         return res.status(500).json({ status: 'error', message: error.message });
//     }
// };

const searchBrands = async (req, res) => {
    const { brandName } = req.query;

    try {
        if (!brandName) {
            return res.status(400).json({ status: 'error', message: 'Brand name is required for search.' });
        }

        // Escape special regex characters
        const escapedBrandName = brandName.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, '\\$&');

        // Search for matching brands
        const brands = await Brands.find({
            brandName: { $regex: new RegExp(`${escapedBrandName}`, 'i') },
        }).limit(20);

        if (brands.length === 0) {
            return res.status(404).json({ status: 'unsuccess', message: 'No brands found.' });
        }

        // Format the response to include the full image URL
        const formattedBrands = brands.map((brand) => {
            const brandObj = brand.toObject();
            let imageUrl = null;

            if (brandObj.logo) {
                imageUrl = `${req.protocol}://${req.get('host')}/uploads/brand/${path.basename(brandObj.logo)}`;
            }

            return {
                _id: brandObj._id,
                brandName: brandObj.brandName,
                logo: imageUrl,
            };
        });

        return res.status(200).json({ status: 'success', brand: formattedBrands });
    } catch (error) {
        console.error('Search brand error:', error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};



// Get a specific brand for update
const getBrandsForUpdate = async (req, res) => {
    const { id } = req.params;
    try {
        const brand = await Brands.findById(id);
        if (!brand) {
            return res.status(404).json({ status: "Not Found", message: "Brand not found" });
        }

        // Convert the logo data to a base64 data URL if it exists
        const brandObj = brand.toObject();
        if (brand.logo) {
            const imageUrl = `${req.protocol}://${req.get('host')}/uploads/brand/${path.basename(brandObj.logo)}`;
            brandObj.logo = imageUrl;  // Add logoUrl to the response object
        }

        res.json(brandObj); // Send the brand data to the frontend
    } catch (err) {
        res.status(400).json({ status: "Unsuccessful", error: err.message });
        console.error("Brand not fetched", err);
    }
}

// Update an existing product brand
const updateProductBrands = async (req, res) => {
    const { id } = req.params;
    const { brandName, removeLogo } = req.body;
    let updatedFields = {};

    try {
        // Fetch existing brand
        const existingBrand = await Brands.findById(id);
        if (!existingBrand) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({ status: "Not Found", message: "Brand not found" });
        }

        // Check duplicate brand name
        if (brandName) {
            const duplicateBrand = await Brands.findOne({
                brandName: { $regex: `^${brandName}$`, $options: 'i' },
                _id: { $ne: id }
            });

            if (duplicateBrand) {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(409).json({ status: "Conflict", message: "This brand name already exists" });
            }

            updatedFields.brandName = brandName;
        }

        // Handle logo update
        if (req.file) {
            const newImagePath = path.join('uploads', 'brand', req.file.filename);

            // Delete old image safely (Same logic as delete)
            if (existingBrand.logo) {
                const oldImagePath = path.resolve('uploads', 'brand', path.basename(existingBrand.logo));
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    
                } else {
                    console.log('Old image not found:', oldImagePath);
                }
            }

            updatedFields.logo = newImagePath;
        }

        if (removeLogo === 'true' && existingBrand.logo) {
            const oldImagePath = path.resolve('uploads', 'brand', path.basename(existingBrand.logo));
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            updatedFields.logo = '';
        }

        // Update brand
        const updatedBrand = await Brands.findByIdAndUpdate(id, updatedFields, { new: true });

        res.status(200).json({ status: "success", brand: updatedBrand });
    } catch (err) {
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(400).json({ status: "Unsuccessful", error: err.message, message: "Brand not updated" });
        console.error("Brand update error:", err);
    }
};


const deleteProductBrand = async (req, res) => {
    const { id } = req.params;
    try {
        // Fetch the brand to access its logo before deleting
        const brandToDelete = await Brands.findById(id);
        if (!brandToDelete) {
            return res.status(404).json({ status: "Not Found", message: "Brand not found" });
        }

        // Delete the brand from the database
        const deletedBrand = await Brands.findByIdAndDelete(id);
        if (!deletedBrand) {
            return res.status(404).json({ status: "Not Found", message: "Brand not deleted" });
        }

        // Delete the associated image file if it exists
        if (brandToDelete.logo) {
            const imagePath = path.resolve('uploads', 'brand', path.basename(brandToDelete.logo));
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath); // Remove the image file
            }
        }

        res.json({ status: "Success", message: "Brand and associated image deleted" });
    } catch (err) {
        res.status(400).json({ status: "Unsuccessful", error: err.message });
        console.error("Brand not deleted", err);
    }
};

// Fetch all product brands
const findAllProductBrands = async (req, res) => {
    try {

        // Safely handle pagination parameters
        const size = req.query?.page?.size ? parseInt(req.query.page.size) : null;
        const number = req.query?.page?.number ? parseInt(req.query.page.number) : null;

        // Handle sorting order (ascending or descending)
        const sort = req.query?.sort || ''; // Handle sorting if provided
        const sortOrder = {};
        if (sort.startsWith('-')) {
            sortOrder[sort.slice(1)] = -1; // Descending order
        } else if (sort) {
            sortOrder[sort] = 1; // Ascending order
        }

        let findBrands;
        if (size && number) {
            // Pagination logic: Fetch with limit and offset
            const offset = (number - 1) * size;
            findBrands = await Brands.find()
                .skip(offset) // Skip items based on offset
                .limit(size) // Limit the number of items per page
                .sort(sortOrder); // Apply sorting if specified
        } else {
            // Fetch all brands if no pagination query is provided
            findBrands = await Brands.find().sort(sortOrder);
        }

        // Map the brands to return the relevant data
        const brands = findBrands.map(findBrand => {
            const brandsObj = findBrand.toObject();
            let dataURL = null;

            // Safely handle the logo data
            if (findBrand.logo && findBrand.logo.data) {
                const base64Image = findBrand.logo.data.toString('base64'); // Convert buffer to base64 string
                const mimeType = findBrand.logo.contentType;
                dataURL = `data:${mimeType};base64,${base64Image}`;
            }

            return {
                _id: findBrand._id,
                brandName: findBrand.brandName,
                logo: dataURL
            };
        });

        // Calculate the total number of pages only if pagination is used
        const totalBrands = await Brands.countDocuments();
        const totalPages = size ? Math.ceil(totalBrands / size) : 1;

        // Send the response with pagination info
        res.json({
            brands,
            currentPage: number || 1,
            totalPages: size ? totalPages : null,
            totalBrands
        });
    } catch (err) {
        res.status(400).json({ status: "Unsuccessful", error: err.message });
        console.error("Brands not fetched", err);
    }
};






//Search brand by ID or name and fetch all brands combined function
const fetchBrands = async (req, res) => {
    try {
        const { id, brandName } = req.query;

        let brands;
        let totalBrands;

        // Pagination parameters from the query
        const size = parseInt(req.query.page?.size) || 10; // Default size is 10
        const number = parseInt(req.query.page?.number) || 1; // Default page number is 1
        const offset = (number - 1) * size; // Calculate the offset for pagination

        if (id) {
            // Fetch brand by ID
            brands = await Brands.findById(id);
            if (!brands) {
                return res.status(404).json({ message: 'Brand not found' });
            }
            brands = [brands]; // Wrap in an array for consistency
        } else if (brandName) {
            // Fetch brand by name
            brands = await Brands.find({
                brandName: { $regex: new RegExp(`^${brandName}$`, 'i') },
            });
            if (!brands.length) {
                return res.status(404).json({ message: 'Brand not found' });
            }
        } else {
            // Fetch all brands with pagination (if no `id` or `brandName` is provided)
            totalBrands = await Brands.countDocuments(); // Count total number of brands
            brands = await Brands.find()
                .skip(offset) // Skip the number of brands based on the page number
                .limit(size) // Limit the number of brands per page
        }

        // Process the brands (format the logo field)
        const processedBrands = brands.map(brand => {
            const brandObj = brand.toObject();
            let logo = null;
            if (brandObj.logo) {
                // Construct URL for logo
                logo = `${req.protocol}://${req.get('host')}/uploads/brand/${path.basename(brandObj.logo)}`;
            }
            return { ...brandObj, logo }; // Include the formatted logo URL in the response
        });

        // If pagination was applied, include pagination metadata in the response
        if (!id && !brandName) {
            const totalPages = Math.ceil(totalBrands / size);
            res.json({
                data: processedBrands,
                totalBrands,
                totalPages,
                currentPage: number,
                pageSize: size,
            });
        } else {
            // If no pagination, just send the brands
            res.json(processedBrands);
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createProductBrands, findAllProductBrands, updateProductBrands, deleteProductBrand, getBrandsForUpdate, findBrand, fetchBrands, searchBrands }