const express = require('express');
const Expenses = require('../../models/expensesCategoryModel')

const createExpensesCategory = async (req, res) => {
    const { expensesName } = req.body;
    if (!expensesName) {
        return res.status(400).json({ message: 'Expenses name is required.', status: 'unsuccess' });
    }
    try {
        // Check if the currency name already exists
        const existingExpenses = await Expenses.findOne({ expensesName: { $regex: new RegExp(`^${expensesName}$`, 'i') } });
        if (existingExpenses) {
            return res.status(400).json({ message: 'Expenses name already exists.', status: 'unsuccess' });
        }
        const newExpenses = new Expenses({
            expensesName
        });
        await newExpenses.save();

        res.status(201).json({ message: 'Expenses created successfully', data: newExpenses });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Controller to get all currency data
const getAllExpensesCat = async (req, res) => {
    try {
        const expensesCatergory = await Expenses.find(); // Fetch all currency documents
        res.status(200).json({ data: expensesCatergory });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve expenses', error: error.message });
    }
};

//Delete curruncy
const deleteExpensesCatergory = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedExpenses = await Expenses.findByIdAndDelete(id);
        if (!deletedExpenses) {
            return res.status(404).json({ message: 'Expenses not found' });
        }
        res.status(200).json({ message: 'Expenses deleted successfully', data: deletedExpenses });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete Expenses', error: error.message });
    }
};

//Find currency by name
const findExpensesCatByName = async (req, res) => {
    const { expensesName } = req.query;
    try {
        const expenses = await Expenses.find({
            expensesName: { $regex: new RegExp(expensesName, 'i') }
        });

        if (expenses.length === 0) {
            return res.status(404).json({ message: 'No expenses found' });
        }

        res.status(200).json({ data: expenses });
    } catch (error) {
        res.status(500).json({ message: 'Failed to search expenses', error: error.message });
    }
};

//Get currncy by id
const findExpensesById = async (req, res) => {
    const { id } = req.query;
    try {
        const expenses = await Expenses.findById(id);

        if (!expenses) {
            return res.status(404).json({ message: 'expenses not found' });
        }

        res.status(200).json({ data: expenses });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve expenses', error: error.message });
    }
};

const updateExpensesCategory = async (req, res) => {
    const { id } = req.params; // Extract currency ID from the URL parameters
    const { editExpensesName } = req.body; // Extract updated data from the request body
    const expensesName = editExpensesName;

    if (!expensesName) {
        return res.status(400).json({ message: 'Expenses name is required.', status: 'unsuccess' });
    }
    try {

        // Check if another expenses category already exists with the new name (case-insensitive)
        const existingExpenses = await Expenses.findOne({ 
            expensesName: { $regex: new RegExp(`^${expensesName}$`, 'i') },
            _id: { $ne: id } // _id not equal to the current editing one
        });

        if (existingExpenses) {
            return res.status(400).json({ message: 'Expenses name already exists.', status: 'unsuccess' });
        }
        
        // Find the currency by ID and update it
        const updatedExpenses = await Expenses.findByIdAndUpdate(
            id,
            { expensesName }, // Updated fields
            { new: true, runValidators: true } // Options: return the updated document and run validation
        );

        // Check if the currency was found and updated
        if (!updatedExpenses) {
            return res.status(404).json({ message: 'Expenses not found' });
        }
        // Respond with the updated currency data
        res.status(200).json({ message: 'Expenses updated successfully', data: updatedExpenses });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

//new combined function
const getExpensesCategory = async (req, res) => {
    const { id, expensesName } = req.query;

    try {
        let expenses;

        if (id) {
            // Fetch by ID
            expenses = await Expenses.findById(id);
            if (!expenses) {
                return res.status(404).json({ message: 'Expense not found' });
            }
            expenses = [expenses]; // Convert to array for consistent response format
        } else if (expensesName) {
            // Fetch by name
            expenses = await Expenses.find({
                expensesName: { $regex: new RegExp(expensesName, 'i') }
            });
            if (expenses.length === 0) {
                return res.status(404).json({ message: 'No expenses found' });
            }
        } else {
            if (req.query.page) {
                const size = parseInt(req.query.page.size) || 10; // Default size is 10
                const number = parseInt(req.query.page.number) || 1; // Default page number is 1
                const offset = (number - 1) * size; // Calculate the offset for pagination

                expenses = await Expenses.find()
                    .skip(offset)
                    .limit(size)

                if (expenses.length === 0) {
                    return res.status(404).json({ message: 'No expenses found' });
                }

                const total = await Expenses.countDocuments();
            const totalPages = Math.ceil(total / size);


                return res.status(200).json({
                    data: expenses,
                    total,
                    totalPages,
                    currentPage: number,
                    pageSize: size
                });
            }

            // Fetch all expenses without pagination
            expenses = await Expenses.find();
            if (expenses.length === 0) {
                return res.status(404).json({ message: 'No expenses found' });
            }
        }

        res.status(200).json({ data: expenses });
    } catch (error) {
        console.error('Error retrieving expenses:', error);
        res.status(500).json({ message: 'Failed to retrieve expenses', error: error.message });
    }
};

const searchExpenseCategory = async (req, res) => {
    const { expensesName } = req.query;

    try {
        if (!expensesName) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Expenses name is required for searching expense categories.' 
            });
        }

        // Escape special regex characters in the expensesName to prevent regex injection
        const escapedExpensesName = expensesName.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, '\\$&');

        // Search for expense categories by expensesName
        const expenseCategories = await Expenses.find({
            expensesName: { $regex: new RegExp(`${escapedExpensesName}`, 'i') }, // Case-insensitive search
        }).limit(20); // Optional: Limit the number of results to 20

        if (!expenseCategories || expenseCategories.length === 0) {
            return res.status(404).json({ 
                status: 'unsuccess', 
                message: 'No expense categories found for the provided name.' 
            });
        }

        return res.status(200).json({ 
            status: 'success', 
            data: expenseCategories 
        });
    } catch (error) {
        console.error('Search expense categories error:', error);
        return res.status(500).json({ 
            status: 'error', 
            message: error.message 
        });
    }
};



module.exports = { createExpensesCategory, getAllExpensesCat, deleteExpensesCatergory, findExpensesCatByName, findExpensesById, updateExpensesCategory, getExpensesCategory, searchExpenseCategory };
