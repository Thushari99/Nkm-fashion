import React from 'react';
import { FaAngleDoubleLeft, FaChevronLeft, FaChevronRight, FaAngleDoubleRight } from 'react-icons/fa';

const PaginationDropdown = ({ size, setSize, page, setPage, totalPages, handlePrevPage, handleNextPage }) => {
    return (
        <div className="flex justify-between items-center mt-4 bg-white shadow-md rounded-md p-4 space-x-4">
            {/* Base units Per Page Dropdown - Positioned on the left */}
            <div className="flex items-center space-x-2">
                <span className="text-gray-500 text-sm">Items per page</span>
                <select
                    value={size}
                    onChange={(e) => {
                        const newSize = Number(e.target.value);
                        setSize(newSize);
                        console.log("Selected size:", newSize);  // Log to check value
                    }}
                    className="border border-gray-300 text-gray-500 text-sm rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >   
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={30}>30</option>
                </select>
            </div>

            {/* Pagination Controls - Centered */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="px-3 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-200"
                >
                    <FaAngleDoubleLeft /> {/* Icon for |< */}
                </button>
                <button
                    onClick={handlePrevPage}
                    disabled={page === 1}
                    className="flex items-center px-3 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-200"
                >
                    <FaChevronLeft /> {/* Icon for < */}
                </button>
                <span className="text-gray-500 text-sm flex items-center">
                    Page <span className="font-bold mx-1">{page}</span> of <span className="font-bold mx-1">{totalPages}</span>
                </span>
                <button
                    onClick={handleNextPage}
                    disabled={page === totalPages}
                    className="flex items-center px-3 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-200"
                >
                    <FaChevronRight /> {/* Icon for > */}
                </button>
                <button
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="px-3 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-200"
                >
                    <FaAngleDoubleRight /> {/* Icon for >| */}
                </button>
            </div>
        </div>
    );
};

export default PaginationDropdown;
