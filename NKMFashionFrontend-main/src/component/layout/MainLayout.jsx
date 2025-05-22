import React, { useContext, useState } from "react";
import { useLocation } from "react-router-dom";  // Import useLocation
import Header from "../utill/Header";
import ReportHeader from "../utill/ReportHeader";  // Import ReportHeader
import Sidebar from "../utill/SideBar";
import { UserContext } from "../../context/UserContext";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  const [SidebarToggle, setSidebarToggle] = useState(false);
  const { userData } = useContext(UserContext);
  const location = useLocation();  //current location object

  // Defining the routes where ReportHeader should be shown
  const reportRoutes = [
    '/viewReport',
    '/customerReport',
    '/viewCustomerRep/',
    '/suplierReport',
    '/viewSuplierRep/',
    '/viewStokeRep',
    '/quantityAlertRep',
    '/viewRegisterRep',
    '/clickedStokeRep/',
    '/profitAndLostReport'
  ];

  // Check if the current pathname matches any of the report routes
  const isReportPage = reportRoutes.some(route => location.pathname.startsWith(route));

  return (
    <div className="flex">
      <Sidebar userData={userData} SidebarToggle={SidebarToggle} />
      <div className={`${SidebarToggle ? "ml-64 sm:ml-0" : "" } content w-full transition-all duration-300`}>
        {/* Conditionally render Header or ReportHeader based on isReportPage */}
        {isReportPage ? (
          <ReportHeader userData={userData} />
        ) : (
          <Header
            userData={userData}
            SidebarToggle={SidebarToggle}
            setSidebarToggle={setSidebarToggle}
          />
        )}
        <main><Outlet /></main>
      </div>
    </div>
  );
};

export default MainLayout;
