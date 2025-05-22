const Category = require('../../models/products/productCatergories');
const path = require('path');
const fs = require('fs');

const createCategory = async (req, res) => {
    const { category} = req.body;
    let logo = null;

    if (!category) {
        return res.status(400).json({ message: 'Category name is required' });
    } 

    try {
        // Check if an image file is provided
        if (req.file) {
            logo = path.join('logo', req.file.filename); // Relative path to access image
        }

        // Check if the Category name already exists
        const existingCategory = await Category.findOne({
            category: { $regex: `^${category}$`, $options: 'i' }
        });
        if (existingCategory) {
            if (logo) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(409).json({ message: 'This category already exists' });
        }

        // Create a new Category document
        const newCategory = new Category({
            category,
            logo
        });

        // Save the new category to the database
        await newCategory.save();
        res.status(201).json({ status: "Success", category: newCategory });

    } catch (err) {
        // Delete the uploaded file if any unexpected error occurs
        if (logo) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ status: "Unsuccessful", error: "Internal Server Error", message: err.message });
        console.error("Category not added", err);
    }
};

//Find special category to update
const getCategoryForUpdate = async (req, res) => {
    const { id } = req.params;
    try {
        // Find the category by its ID
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ status: "Not Found", message: "Category not found" });
        }

        // Check if the logo exists and construct the image URL
        if (category.logo) {
            const imageUrl = `${req.protocol}://${req.get('host')}/uploads/category/${path.basename(category.logo)}`;
            category.logo = imageUrl;
        }

        res.json(category);
    } catch (err) {
        res.status(400).json({ status: "Unsuccessful", error: err.message });
        console.error("Category not fetched", err);
    }
};


// Find a category based on search criteria
const findCategory = async (req, res) => {
    try {
        const { category } = req.body;
        const foundCategory = await Category.findOne({
            category: { $regex: new RegExp(`${category}`, 'i') }
        });
        if (!foundCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }
        const categoryObj = foundCategory.toObject();

        // If logo exists, construct the image URL
        if (categoryObj.logo) {
            const imageUrl = `${req.protocol}://${req.get('host')}/uploads/category/${path.basename(categoryObj.logo)}`;
            categoryObj.logo = imageUrl;  // Add logoUrl to the response object
        }
        res.json(categoryObj);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const searchCategories = async (req, res) => {
    const { category } = req.query;

    // Escape special regex characters
    const escapedcategory = category.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, '\\$&');

    try {
        const foundCategory = await Category.find({
            category: { $regex: new RegExp(`${escapedcategory}`, 'i') },
        }).limit(20);  // Optional: Limit the number of results

        if (foundCategory.length === 0) {
            return res.status(404).json({ status: 'unsuccess', message: 'No categories found.' });
        }

        // Handle logo image (similar to product and brand)
        const defaultLogo = `${req.protocol}://${req.get('host')}/uploads/category/default.jpg`;

        const formattedCategory = foundCategory.map((category) => {
            const categoryObj = category.toObject();

            let logoUrl = categoryObj.logo
                ? `${req.protocol}://${req.get('host')}/uploads/category/${path.basename(categoryObj.logo)}`
                : defaultLogo;

            return {
                _id: categoryObj._id,
                category: categoryObj.category,
                description: categoryObj.description,
                code: categoryObj.code,
                logo: logoUrl,  // Use logo instead of image
            };
        });

        return res.status(200).json({ status: 'success', foundCategory: formattedCategory });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { category, removeLogo} = req.body;

    try {
        // Fetch the existing category to get the current image path
        const existingCategory = await Category.findById(id);
        if (!existingCategory) {
            return res.status(404).json({ status: "Not Found", message: "Category not found" });
        }


        // Check if the updated category name already exists
        const duplicateCategory = await Category.findOne({
            category: { $regex: `^${category}$`, $options: 'i' }
        });
        if (duplicateCategory && duplicateCategory._id.toString() !== id) {
            // If a different category with the same name exists
            if (req.file) {
                // Delete the uploaded file since it won't be used
                fs.unlinkSync(req.file.path);
            }
            return res.status(409).json({ status: "Conflict", message: "This category name already exists" });
        }

        let updatedFields = { category };

        // Check if there's a new file upload
        if (req.file) {
            const newImagePath = path.join('uploads', 'category', req.file.filename);

            // Remove the old image if it exists
            if (existingCategory.logo) {
                const oldImagePath = path.resolve('uploads', 'category', path.basename(existingCategory.logo));
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            // Update the logo path
            updatedFields.logo = newImagePath;
        }


        // ✅ Handle removeLogo flag
        else if (removeLogo === "true") {
            if (existingCategory.logo) {
                const oldImagePath = path.resolve('uploads', 'category', path.basename(existingCategory.logo));
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updatedFields.logo = null;
        }

        // Update the category
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            updatedFields,
            { new: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ status: "Not Found", message: "Category not updated" });
        }

        res.json({ status: "Success", category: updatedCategory });
    } catch (err) {
        // Delete the uploaded file if any unexpected error occurs
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        res.status(400).json({ status: "Unsuccessful", error: err.message });
        console.error("Category not updated", err);
    }
};



const deleteCategory = async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch the category to retrieve the logo path
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ status: "Not Found", message: "Category not found" });
        }

        // Attempt to delete the category
        const deletedCategory = await Category.findByIdAndDelete(id);
        if (!deletedCategory) {
            return res.status(500).json({ status: "Unsuccessful", message: "Failed to delete category" });
        }

        // Delete the associated image if it exists
        if (category.logo) {
            const imagePath = path.resolve('uploads', 'category', path.basename(category.logo));
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath); // Remove the image file
            }
        }

        res.json({ status: "Success", message: "Category deleted" });
    } catch (err) {
        res.status(500).json({ status: "Unsuccessful", error: err.message });
        console.error("Category not deleted", err);
    }
};


// Fetch all product brands
const findAllCategories = async (req, res) => {
    try {
        console.log('Received query parameters:', req.query);

        // Check if pagination query parameters are provided
        const size = req.query?.page?.size ? parseInt(req.query.page.size) : null;
        const number = req.query?.page?.number ? parseInt(req.query.page.number) : null;
        const sort = req.query.sort || ''; // Handle sorting if provided

        // Handle sorting order (ascending or descending)
        const sortOrder = {};
        if (sort.startsWith('-')) {
            sortOrder[sort.slice(1)] = -1; // Descending order
        } else if (sort) {
            sortOrder[sort] = 1; // Ascending order
        }

        let findCategory;
        if (size && number) {
            // Pagination logic: Fetch with limit and offset
            const offset = (number - 1) * size;
            findCategory = await Category.find()
                .skip(offset) // Skip items based on offset
                .limit(size) // Limit the number of items per page
                .sort(sortOrder); // Apply sorting if specified
        } else {
            // Fetch all categories if no pagination query is provided
            findCategory = await Category.find().sort(sortOrder);
        }

        // Process the category data
        const categories = findCategory.map(category => {
            const categoryObj = category.toObject();
            let dataURL = null;

            // Safely handle the logo data
            if (category.logo) {
                const imageUrl = `${req.protocol}://${req.get('host')}/uploads/category/${path.basename(categoryObj.logo)}`;
                categoryObj.logo = imageUrl;  // Add logoUrl to the response object without modifying the original logo field
            }


            return {
                _id: category._id,
                category: category.category,
                code: category.code,
                logo: dataURL // Return the valid logo or null
            };
        });

        // Calculate the total number of pages only if pagination is used
        const totalCategory = await Category.countDocuments();
        const totalPages = size ? Math.ceil(totalCategory / size) : 1;

        // Send the response
        res.json({
            categories,
            currentPage: number || 1,
            totalPages: size ? totalPages : null,
            totalCategory
        });
    } catch (err) {
        res.status(400).json({ status: "Unsuccessful", error: err.message });
        console.error("Category not fetched", err);
    }
};

const fetchCategories = async (req, res) => {
    try {
        const { id, categoryName } = req.query;

        let categories;
        let totalCategories;  // Used to hold the total count of categories for pagination

        // Pagination parameters
        const size = parseInt(req.query.page?.size) || 10;  // Default size is 10
        const number = parseInt(req.query.page?.number) || 1;  // Default page number is 1
        const offset = (number - 1) * size;  // Calculate the offset for pagination

        if (id) {
            // Fetch category by ID
            categories = await Category.findById(id);
            if (!categories) {
                return res.status(404).json({ message: 'Category not found' });
            }
            categories = [categories]; // Wrap in an array for consistency
        } else if (categoryName) {
            // Search for a category by name
            categories = await Category.find({
                category: { $regex: new RegExp(`^${categoryName}$`, 'i') },
            });
            if (!categories.length) {
                return res.status(404).json({ message: 'Category not found' });
            }
        } else {
            // Fetch all categories with pagination (if no `id` or `categoryName` is provided)
            totalCategories = await Category.countDocuments();  // Count total number of categories
            categories = await Category.find()
                .skip(offset)  // Skip the number of categories based on the page number
                .limit(size)   // Limit the number of categories per page
        }

        // Process the categories (format the logo field)
        const processedCategories = categories.map(category => {
            const categoryObj = category.toObject();
            // If logo exists, construct the image URL
            if (categoryObj.logo) {
                const imageUrl = `${req.protocol}://${req.get('host')}/uploads/category/${path.basename(categoryObj.logo)}`;
                categoryObj.logo = imageUrl;  // Add logoUrl to the response object without modifying the original logo field
            }
            return categoryObj;
        });

        // If pagination was applied, include pagination metadata in the response
        if (!id && !categoryName) {
            const totalPages = Math.ceil(totalCategories / size);  // Calculate total number of pages
            res.json({
                data: processedCategories,
                totalCategories,
                totalPages,
                currentPage: number,
                pageSize: size,
            });
        } else {
            // If no pagination, just send the categories
            res.json(processedCategories);
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


module.exports = { createCategory, findAllCategories, deleteCategory, updateCategory, findCategory, getCategoryForUpdate, fetchCategories, searchCategories }