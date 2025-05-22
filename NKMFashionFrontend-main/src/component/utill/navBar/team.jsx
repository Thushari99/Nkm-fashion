import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import axios from "axios";
import LinearProgress from "@mui/material/LinearProgress"; // Import LinearProgress from MUI
import Box from "@mui/material/Box"; // Import Box from MUI

export default function Team() {
  const [users, setUsers] = useState([]);
  const [isTeamOpen, setIsTeamOpen] = useState(true); // Default to open
  const [loading, setLoading] = useState(false); // Loading state

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true); // Show loading bar
      try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/fetchUsers`);
        setUsers(response.data); // Set all fetched users
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false); // Hide loading bar
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="flex">
      {/* Loading Bar */}
      {loading && (
        <Box
          sx={{
            width: "100%",
            position: "fixed", // Ensure it stays at the top
            top: 0,
            left: 0,
            zIndex: 1000, // Ensure it's above other elements
          }}
        >
          <LinearProgress />
        </Box>
      )}

      {/* Main Content */}
      <div className="ml-64 flex-1">
        {/* Navbar */}
        <nav className="bg-white shadow">
          <div className="container mx-auto flex justify-between items-center py-4 px-6">
            <h1 className="text-xl font-bold">App Name</h1>
            <Link to="/team" className="text-gray-700 hover:text-blue-500">
              Team
            </Link>
          </div>
        </nav>

        {/* Team Section */}
        {isTeamOpen && !loading && (
          <div className="mt-6 mx-auto w-11/12 bg-[#eff3f7] p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Our Team</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="flex flex-col items-center p-4 bg-white shadow rounded-lg"
                >
                  <img
                    src={user.profileImage || "/default-avatar.png"}
                    alt="Profile"
                    className="w-24 h-24 rounded-full mb-3 border-2 border-gray-300"
                  />
                  <h3 className="text-lg font-semibold text-center text-gray-700">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{user.role}</p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
