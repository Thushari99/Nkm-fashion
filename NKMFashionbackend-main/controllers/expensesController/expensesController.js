const express = require('express');
const mongoose = require('mongoose');
const Expenses = require('../../models/expensesModel')
const generateReferenceId = require('../../utils/generateReferenceID');

const createExpenses = async (req, res) => {
        const session = await mongoose.startSession();
        session.startTransaction();
    const { warehouse, category, amount, date, title, details, refferenceId } = req.body;

     // Generate a reference ID for the sale
     const referenceId = await generateReferenceId('EXPENSE');

    // Collect missing fields
    const missingFields = [];
    if (!warehouse) missingFields.push('warehouse');
    if (!category) missingFields.push('category');
    if (!amount) missingFields.push('amount');
    if (!date) missingFields.push('date');
    if (!title) missingFields.push('title');
    // if (!refferenceId) missingFields.push('refferenceId');

    if (missingFields.length > 0) {
        return res.status(400).json({
            message: 'Validation Error: Missing required fields',
            missingFields,
            status: 'fail',
        });
    }

    try {
        // Check for duplicate expense
        const existingExpense = await Expenses.findOne({ category, title });
        if (existingExpense) {
            return res.status(409).json({
                message: 'Expense with the same category and title already exists',
                status: 'fail',
                data: existingExpense,
            });
        }

        // Create and save the expense
        const newExpenses = new Expenses({
            refferenceId: referenceId, 
            warehouse,
            category,
            amount,
            date,
            title,
            details,
        });
        await newExpenses.save();
        await session.commitTransaction();

        res.status(201).json({
            message: 'Expense created successfully',
            status: 'success',
            data: newExpenses,
        });
    } catch (error) {
        console.error('Error in createExpenses:', error);
        res.status(500).json({
            message: 'Internal Server Error: Unable to create expense',
            status: 'fail',
            error: error.message,
        });
    }
};
// Controller to get all currency data
const getAllExpenses = async (req, res) => {
    try {
        const expenses = await Expenses.find(); // Fetch all currency documents
        res.status(200).json({ data: expenses });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve expenses,Please try again', error: error.message });
    }
};

//Delete currency
const deleteCExpenses = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedExpenses = await Expenses.findByIdAndDelete(id);
        if (!deletedExpenses) {
            return res.status(404).json({ success: false, message: 'Expenses not found' });
        }

        res.status(200).json({ success: true, message: 'Expenses deleted successfully', data: deletedExpenses });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete Expenses, try again', error: error.message });
    }
};


//Find currency by name
const getExpensesByCategory = async (req, res) => {
    const { category } = req.query;
    try {
        const expenses = await Expenses.find({
            category: { $regex: new RegExp(category, 'i') }
        });
        if (expenses.length === 0) {
            return res.status(404).json({ message: 'No expenses found' });
        }
        res.status(200).json({ data: expenses });
    } catch (error) {
        res.status(500).json({ message: 'Failed to search expenses,Try again', error: error.message });
    }
};

//Get currncy by id
const findExpensesById = async (req, res) => {
    const { id } = req.params;
    try {
        const expenses = await Expenses.findById(id);
        if (!expenses) {
            return res.status(404).json({ message: 'expenses not found' });
        }
        res.status(200).json({ data: expenses });
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve expenses,Try again', error: error.message });
    }
};

const updateExpenses = async (req, res) => {
    const { id } = req.params;
    const { warehouse, category, amount, date, title, details } = req.body;

    // Collect missing fields
    const missingFields = [];
    if (!warehouse) missingFields.push('warehouse');
    if (!category) missingFields.push('category');
    if (!amount) missingFields.push('amount');
    if (!date) missingFields.push('date');
    if (!title) missingFields.push('title');

    if (missingFields.length > 0) {
        return res.status(400).json({
            message: 'Validation Error: Missing required fields',
            missingFields,
            status: 'fail',
        });
    }

    try {
        // Update expense
        const updatedExpenses = await Expenses.findByIdAndUpdate(
            id,
            { warehouse, category, amount, date, title, details }
        );

        if (!updatedExpenses) {
            return res.status(404).json({
                message: 'Expense not found',
                status: 'fail',
            });
        }

        res.status(200).json({
            message: 'Expense updated successfully',
            status: 'success',
            data: updatedExpenses,
        });
    } catch (error) {
        console.error('Error in updateExpenses:', error);
        res.status(500).json({
            message: 'Internal Server Error: Unable to update expense',
            status: 'fail',
            error: error.message,
        });
    }
};


const getExpenses = async (req, res) => {
    const { id, keyword } = req.query;

    try {
        let expenses;

        if (id) {
            // Fetch by ID
            expenses = await Expenses.findById(id);
            if (!expenses) {
                return res.status(404).json({ message: 'Expense not found' });
            }
            expenses = [expenses]; // Wrap in array for consistent format
        } else if (keyword) {
            // Fetch by keyword (matches category or referenceId)
            expenses = await Expenses.find({
                $or: [
                    { category: { $regex: new RegExp(keyword, 'i') } },
                    { refferenceId: { $regex: new RegExp(keyword, 'i') } }
                ]
            });
            if (expenses.length === 0) {
                return res.status(404).json({ message: 'No expenses found for the specified keyword' });
            }
        } else {
            if (req.query.page) {
                const size = parseInt(req.query.page.size) || 10; // Default size is 10
                const number = parseInt(req.query.page.number) || 1; // Default page number is 1
                const offset = (number - 1) * size; // Calculate the offset for pagination
                
                expenses = await Expenses.find()
                    .skip(offset)
                    .limit(size)
                    .sort({ createdAt: -1 })

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
        res.status(500).json({ message: 'Failed to retrieve expenses, try again', error: error.message });
    }
};

const searchExpense = async (req, res) => {
    const { keyword } = req.query; // Get keyword from query params

    try {
        if (!keyword) {
            return res.status(400).json({ 
                status: "error", 
                message: "Keyword is required for searching expenses." 
            });
        }

        // Escape special regex characters in the keyword to prevent regex injection
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Build query to search by category or referenceId
        const query = {
            $or: [
                { category: { $regex: new RegExp(`${escapedKeyword}`, 'i') } }, // Case-insensitive search for category
                { refferenceId: { $regex: new RegExp(`${escapedKeyword}`, 'i') } } // Case-insensitive search for referenceId
            ]
        };

        // Fetch expenses based on the query
        const expenses = await Expenses.find(query).sort({ createdAt: -1 }); // Sort by creation date (most recent first)

        if (!expenses || expenses.length === 0) {
            return res.status(404).json({ 
                status: "unsuccess", 
                message: "No expenses found for the provided keyword." 
            });
        }

        // Format the fetched expenses if additional processing is needed
        const formattedExpenses = expenses.map((expense) => {
            const expenseObj = expense.toObject();
            
            return {
                _id: expenseObj._id,
                category: expenseObj.category,
                refferenceId: expenseObj.refferenceId,
                amount: expenseObj.amount,
                date: expenseObj.date,
                title: expenseObj.title,
                warehouse: expenseObj.warehouse,
                description: expenseObj.description,
                details: expenseObj.details,
                createdAt: expenseObj.createdAt 
                    ? expenseObj.createdAt.toISOString().slice(0, 10) 
                    : null,
            };
        });

        return res.status(200).json({ 
            status: "success", 
            expenses: formattedExpenses 
        });
    } catch (error) {
        console.error("Search expenses error:", error);
        return res.status(500).json({ 
            status: "error", 
            message: error.message 
        });
    }
};



module.exports = { createExpenses, getAllExpenses, deleteCExpenses, getExpensesByCategory, findExpensesById, updateExpenses, getExpenses, searchExpense }