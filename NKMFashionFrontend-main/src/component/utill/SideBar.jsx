import { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/sidebar.css';
import { HomeIcon, CubeIcon,ReceiptPercentIcon, GiftIcon, ShoppingBagIcon, TagIcon, CogIcon, DocumentChartBarIcon, ReceiptRefundIcon, ChartPieIcon, DocumentTextIcon, UserGroupIcon, UsersIcon, CubeTransparentIcon, FolderIcon, UserIcon, TruckIcon, BuildingStorefrontIcon, ArrowRightOnRectangleIcon, ShoppingCartIcon, CurrencyDollarIcon, AdjustmentsVerticalIcon, GlobeAltIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import ArrowIcon from '../../img/right-arrow (3).png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBarcode } from '@fortawesome/free-solid-svg-icons';
import { UserContext } from '../../context/UserContext';
// import Icon from '../../img/app (1).png'

const Sidebar = ({ items }) => {
  const { userData } = useContext(UserContext);
  const [isPeopleDropdownOpen, setPeopleDropdownOpen] = useState(false);
  const [peopleDropdownSearchOpen, setPeopleDropdownSearchOpen] = useState(false)
  const [isProductDropdownOpen, setProductDropdownOpen] = useState(false)
  const [productDropdownSearchOpen, setProductDropdownSearchOpen] = useState(false)
  const [isSaleDropdownOpen, setSaleDropdownOpen] = useState(false)
  const [saleDropdownSearchOpen, setSaleDropdownSearchOpen] = useState(false)
  const [isPurchaseDropdownOpen, setPurchaseDropdownOpen] = useState(false)
  const [purchaseDropdownSearchOpen, setPurchaseDropdownSearchOpen] = useState(false)
  const [isExpensesDropdownOpen, setExpensesDropdownOpen] = useState(false)
  const [expensesDropdownSearchOpen, setExpensesDropdownSearchOpen] = useState(false)
  const [isSettingsDropdownOpen, setSettingsDropdown] = useState(false)
  const [settingsDropdownSearchOpen, setSettingsDropdownSearchOpen] = useState(false)

  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const debounceTimeout = useRef(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [showLogoutModel, setShowLogoutModal] = useState(false);
  const [permissionData, setPermissionData] = useState({});

  useEffect(() => {
    if (userData) {
      const permissions = userData?.permissions || {};

      const hasAnyPermission = (permissionKey) => {
        const subPermissions = permissions[permissionKey] || {};
        return Object.values(subPermissions).some(Boolean);
      };

      setPermissionData({
        manageProducts: hasAnyPermission("manageProducts"),
        manageBaseUnits: hasAnyPermission("manageBaseUnits"),
        manageUnits: hasAnyPermission("manageUnits"),
        manageVariation: hasAnyPermission("manageVariation"),
        manageBrands: hasAnyPermission("manageBrands"),
        manageCategory: hasAnyPermission("manageCategory"),
        manageBarcodePrint: hasAnyPermission("manageBarcodePrint"),
        manageCustomers: hasAnyPermission("manageCustomers"),
        manageUsers: hasAnyPermission("manageUsers"),
        manageSuppliers: hasAnyPermission("manageSuppliers"),
        manageWarehouse: hasAnyPermission("manageWarehouse"),
        manageTransfer: hasAnyPermission("manageTransfer"),
        manageSales: hasAnyPermission("manageSales"),
        manageSaleReturns: hasAnyPermission("manageSaleReturns"),
        managePurchases: hasAnyPermission("managePurchases"),
        managePurchaseReturns: hasAnyPermission("managePurchaseReturns"),
        manageQuotations: hasAnyPermission("manageQuotations"),
        manageCurrency: hasAnyPermission("manageCurrency"),
        manageExpenses: hasAnyPermission("manageExpenses"),
        manageExpensesCategory: hasAnyPermission("manageExpensesCategory"),
        manageRolesAndPermissions: hasAnyPermission("manageRolesAndPermissions"),
        manageReports: hasAnyPermission("manageReports"),
        manageAdjustments: hasAnyPermission("manageAdjustments"),
        manageLanguage: hasAnyPermission("manageLanguage"),
        manageSettings: hasAnyPermission("manageSettings"),
        manageMailSettings: hasAnyPermission("manageMailSettings"),
        manageReceiptSettings: hasAnyPermission("manageReceiptSettings"),
        managePrefixesSettings: hasAnyPermission("managePrefixesSettings"),
        managePOS: hasAnyPermission("managePOS"),
        manageZbill: hasAnyPermission("manageZbill"),
      });
    }
  }, [userData]);


  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      handleSearchSidebar(value); // Filter sidebar items
    }, 200); // Slightly longer delay for better performance
  };


  const PeopletoggleDropdown = () => {
    const newState = !isPeopleDropdownOpen;
    setPeopleDropdownOpen(newState);
    sessionStorage.setItem('isPeopleDropdownOpen', newState);
  };

  const ProductToggleDropdown = () => {
    const newState = !isProductDropdownOpen;
    setProductDropdownOpen(newState);
    sessionStorage.setItem('isProductDropdownOpen', newState);
  };

  const SaletoggleDropdown = () => {
    const newState = !isSaleDropdownOpen;
    setSaleDropdownOpen(!isSaleDropdownOpen);
    sessionStorage.setItem('isSaleDropdownOpen', newState);
  }
  const PurchasetoggleDropdown = () => {
    const newState = !isPurchaseDropdownOpen;
    setPurchaseDropdownOpen(!isPurchaseDropdownOpen);
    sessionStorage.setItem('isPurchaseDropdownOpen', newState);
  }

  const ExpensestoggleDropdown = () => {
    const newState = !isExpensesDropdownOpen;
    setExpensesDropdownOpen(!isExpensesDropdownOpen);
    sessionStorage.setItem('isExpensesDropdownOpen', newState);
  }

  const SettingsDropdown = () => {
    const newState = !isSettingsDropdownOpen;
    setSettingsDropdown(!isSettingsDropdownOpen);
    sessionStorage.setItem('isSettingsDropdownOpen', newState);
  }

  const handleSearchSidebar = (query) => {
    const trimmedQuery = query.trim().toLowerCase();

    // Select all tabs (li elements with id)
    const allTabs = document.querySelectorAll('ul > li[id]');

  let peopleMatch = false;
  let productMatch = false;
  let saleMatch = false;
  let purchaseMatch = false;
  let expensesMatch = false;
  let settingsMatch = false;

    // Loop through all tabs and toggle their visibility based on the query
    allTabs.forEach((tab) => {
      const tabText = tab.textContent.toLowerCase(); // Use the text content for searching
      if (trimmedQuery === '' || tabText.includes(trimmedQuery)) {
        tab.style.display = ''; // Show tab
        if (tab.closest('#peopleDropdownMenu')) peopleMatch = true;
        if (tab.closest('#productDropdownMenu')) productMatch = true;
        if (tab.closest('#saleDropdownMenu')) saleMatch = true;
        if (tab.closest('#purchaseDropdownMenu')) purchaseMatch = true;
        if (tab.closest('#expensesDropdownMenu')) expensesMatch = true;
        if (tab.closest('#settings')) settingsMatch = true;
      } else {
        tab.style.display = 'none'; // Hide tab
      }
    });

    setPeopleDropdownSearchOpen(trimmedQuery !== '' && peopleMatch);
    setProductDropdownSearchOpen(trimmedQuery !== '' && productMatch);
    setSaleDropdownSearchOpen(trimmedQuery !== '' && saleMatch);
    setPurchaseDropdownSearchOpen(trimmedQuery !== '' && purchaseMatch);
    setExpensesDropdownSearchOpen(trimmedQuery !== '' && expensesMatch);
    setSettingsDropdownSearchOpen(trimmedQuery !== '' && settingsMatch);
  };

  // Toggle the sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close the sidebar if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    };

    // Attach event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClick = (index) => {
    setActiveIndex(index);
    sessionStorage.setItem('activeTab', index);
  };

  useEffect(() => {
    const savedActiveTab = sessionStorage.getItem('activeTab');
    if (savedActiveTab !== null) {
      setActiveIndex(parseInt(savedActiveTab, 10));
    }
  }, []);

  useEffect(() => {
    const savedActiveTab = sessionStorage.getItem('activeTab');
    if (savedActiveTab !== null) {
      setActiveIndex(parseInt(savedActiveTab, 10));
    }

    const savedProductDropdownState = sessionStorage.getItem('isProductDropdownOpen');
    if (savedProductDropdownState !== null) {
      setProductDropdownOpen(savedProductDropdownState === 'true');
    }

    const savedPeopleDropdownState = sessionStorage.getItem('isPeopleDropdownOpen');
    if (savedPeopleDropdownState !== null) {
      setPeopleDropdownOpen(savedPeopleDropdownState === 'true');
    }

    const savedSaleDropdownState = sessionStorage.getItem('isSaleDropdownOpen');
    if (savedSaleDropdownState !== null) {
      setSaleDropdownOpen(savedSaleDropdownState === 'true');
    }

    const savedPurchaseDropdownState = sessionStorage.getItem('isPurchaseDropdownOpen');
    if (savedPurchaseDropdownState !== null) {
      setPurchaseDropdownOpen(savedPurchaseDropdownState === 'true');
    }

    const savedExpensesDropdownState = sessionStorage.getItem('isExpensesDropdownOpen');
    if (savedExpensesDropdownState !== null) {
      setExpensesDropdownOpen(savedExpensesDropdownState === 'true');
    }

    const savedSettingsDropdownState = sessionStorage.getItem('isSettingsDropdownOpen');
    if (savedSettingsDropdownState !== null) {
      setSettingsDropdown(savedSettingsDropdownState === 'true');
    }
  }, []);

  const handleLogout = () => {
    const cashRegisterID = sessionStorage.getItem('cashRegisterID');
    const cashierUsername = sessionStorage.getItem('cashierUsername');

    if (cashRegisterID && cashierUsername) {
      setShowLogoutModal(true);
    } else {
      performLogout();
    }
  };

  const performLogout = () => {
    sessionStorage.clear();
    navigate('/');
  };

  const handleConfirm = () => {
    setShowLogoutModal(false);
    performLogout();
  };

  const handleCancel = () => {
    setShowLogoutModal(false);
  };

  return (
    <div className='p-0 '>
      <div className='overflow-y-auto scroll-container'>
        <button
          onClick={toggleSidebar}
          className="text-gray-500 bg-white absolute top-24 left-2 w-10 items-center text-center flex justify-center h-10 right-0 border border-white rounded-md z-50 sm:hidden"
          style={{ boxShadow: '0 10px 20px rgba(0, 0, 0, 0.4)' }}
        >
          {/* <img src={Icon} alt="app icon" className="w-[30px] h-[30px] m-4" /> */}
        </button>

      </div>
      <div
        ref={sidebarRef}
        className={`sidebar overflow-y-auto scroll-container w-full p-0  m-0 flex flex-col fixed left-0 top-0 h-full bg-white border-r transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0`}
      >
        <h2 className='mb-5 text-xl text-left text-[#333]"'>Menu</h2>
        <ul className='list-none p-0 pb-20 m-0'>
          <div className="flex items-center space-x-2 mb-5">
            <div className="w-full max-w-lg relative">
              <input
                type="text"
                placeholder="Search ..."
                value={searchTerm}
                onChange={handleInputChange}
                className="searchBox w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:border-transparent"
              />
              <button className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3a6 6 0 100 12A6 6 0 009 3zm0-1a7 7 0 110 14A7 7 0 019 2z"
                    clipRule="evenodd"
                  />
                  <path
                    fillRule="evenodd"
                    d="M12.9 12.9a1 1 0 011.41 0l3 3a1 1 0 01-1.41 1.41l-3-3a1 1 0 010-1.41z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Dashboard Item */}
          <li
            id="dashboard"
            className={`rounded-sm w-full flex p-0  m-0 items-center space-x-2 cursor-pointer 
              ${activeIndex === 1 ? 'bg-gray-100' : 'hover:bg-gray-100 w-full'}`}
            onClick={() => handleClick(1)}
          >
            <Link
              to="/dashboard"
              className="text-black p-0 m-0 w-full flex items-center space-x-2"
            >
              <HomeIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />
              Dashboard
            </Link>
          </li>


          {/* {filteredTabs.map((tab) => ( */}
          {permissionData.manageProducts === true && (
            <li id="products" className={`dropdown rounded-sm flex items-center w-full p-0 m-0 cursor-pointer`} >
              <button
                onClick={ProductToggleDropdown}
                className="dropdown-toggle text-gray hover:text-gray-700 flex items-center w-full"
              >
                <span className="flex items-center text-black w-full">
                  <ShoppingBagIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />
                  Products
                </span>
                <span className="ml-auto" style={{ transformOrigin: 'center' }}>
                  <img
                    src={ArrowIcon}
                    className={`h-3 w-3 transition-transform duration-500 transform text-gray-500 ${isProductDropdownOpen ? 'rotate-90' : ''
                      }`}
                    alt="arrow icon"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </li>
          )}

          <ul className={`w-full dropdown-menu p-0 m-0 ${isProductDropdownOpen || productDropdownSearchOpen ? 'open' : ''}` } id="productDropdownMenu">
            {permissionData.manageProducts === true && (
              <li id="products" className="rounded-sm w-full flex items-center space-x-2">
                <Link to="/viewProducts" className={`w-full text-black hover:text-[#2a9d34] flex items-center cursor-pointer space-x-2 p-2 ${activeIndex === 2 ? 'bg-gray-100' : 'hover:bg-gray-100'}`} onClick={() => handleClick(2)}>
                  <ShoppingBagIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />
                  Products
                </Link>
              </li>
            )}

            {permissionData.manageBaseUnits === true && (
              <li id="products" className="rounded-sm w-full flex items-center space-x-2">
                <Link to="/viewBaseUnit" className={`w-full text-black hover:text-[#2a9d34] flex items-center cursor-pointer space-x-2 p-2 ${activeIndex === 3 ? 'bg-gray-100' : 'hover:bg-gray-100'}`} onClick={() => handleClick(3)}>
                  <CubeIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />
                  Base units</Link>
              </li>
            )}

            {permissionData.manageUnits === true && (
              <li id="products" className="rounded-sm w-full flex items-center space-x-2">
                <Link to="/viewUnit" className={`w-full text-black hover:text-[#2a9d34] flex items-center cursor-pointer space-x-2 p-2  ${activeIndex === 4 ? 'bg-gray-100' : 'hover:bg-gray-100'}`} onClick={() => handleClick(4)}>
                  <CubeTransparentIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />Units</Link>
              </li>
            )}

            {permissionData.manageVariation === true && (
              <li id="products" className="rounded-sm flex items-center space-x-2 w-full">
                <Link to="/viewVariation" className={`w-full text-black hover:text-[#2a9d34] flex items-center cursor-pointer ${activeIndex === 5 ? 'bg-gray-100' : 'hover:bg-gray-100'}`} onClick={() => handleClick(5)}>
                  <AdjustmentsVerticalIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />Variation</Link>
              </li>
            )}

            {permissionData.manageBrands === true && (
              <li id="products" className="rounded-sm flex items-center space-x-2 w-full">
                <Link to="/viewBrands" className={`w-full text-black hover:text-[#2a9d34] flex items-center cursor-pointer ${activeIndex === 6 ? 'bg-gray-100' : 'hover:bg-gray-100'}`} onClick={() => handleClick(6)}>
                  <TagIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />Brands</Link>
              </li>
            )}

            {permissionData.manageCategory === true && (
              <li id="products" className="rounded-sm flex items-center space-x-2 w-full">
                <Link to="/viewCategory" className={`w-full text-black hover:text-[#2a9d34] flex items-center cursor-pointer ${activeIndex === 7 ? 'bg-gray-100' : 'hover:bg-gray-100'}`} onClick={() => handleClick(7)}>
                  <FolderIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />Category</Link>
              </li>
            )}

            {permissionData.manageBarcodePrint === true && (
              <li id="products" className="rounded-sm flex items-center space-x-2 w-full">
                <Link to="/barcodePrint" className={`w-full text-black hover:text-[#2a9d34] flex items-center cursor-pointer ${activeIndex === 8 ? 'bg-gray-100' : 'hover:bg-gray-100'}`} onClick={() => handleClick(8)}>
                  <FontAwesomeIcon icon={faBarcode} className="ml-[2px] h-5 w-5 text-gray-500 mr-4" />Barcode Print</Link>
              </li>
            )}
          </ul>

          {permissionData.manageCustomers === true && (
            <li id="users" className="dropdown w-full rounded-[2px]">
              <button
                onClick={PeopletoggleDropdown}
                className="dropdown-toggle text-gray hover:text-gray-700 w-full flex items-center p-2 space-x-2 cursor-pointer"
              >
                <span className="text-black hover:text-gray-700 flex items-center w-full">
                  <UserGroupIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />
                  People
                </span>
                <span className="ml-auto" style={{ transformOrigin: 'center' }}>
                  <img
                    src={ArrowIcon}
                    className={`h-3 w-3 transition-transform duration-500 transform text-gray-500 ${isPeopleDropdownOpen ? 'rotate-90' : ''}`}
                    alt="arrow icon"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </li>
          )}

          {/** Drop down links for people subcategories */}
          <ul className={`dropdown-menu ${ isPeopleDropdownOpen || peopleDropdownSearchOpen ? 'open' : ''} w-full`}  id="peopleDropdownMenu">
            {permissionData.manageCustomers === true && (
              <li id="users" className="flex items-center w-full cursor-pointer rounded-sm">
                <Link
                  to="/viewCustomers"
                  className={`w-full text-black hover:text-[#2a9d34] flex items-center cursor-pointer ${activeIndex === 17 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  onClick={() => handleClick(17)}
                >
                  <UsersIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" /> Customers
                </Link>
              </li>
            )}

            {permissionData.manageUsers === true && (
              <li id="users" className="flex items-center w-full cursor-pointer">
                <Link
                  to="/users"
                  className={`w-full text-black hover:text-[#2a9d34] flex items-center cursor-pointer ${activeIndex === 9 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  onClick={() => handleClick(9)}
                >
                  <UserIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />Users
                </Link>
              </li>
            )}

            {permissionData.manageSuppliers === true && (
              <li id="users" className="flex items-center w-full cursor-pointer rounded-sm">
                <Link
                  to="/viewSuplier"
                  className={`w-full text-black hover:text-[#2a9d34] flex items-center cursor-pointer ${activeIndex === 10 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  onClick={() => handleClick(10)}
                >
                  <TruckIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />Suppliers
                </Link>
              </li>
            )}
          </ul>

          {permissionData.manageWarehouse === true && (
            <li id='warehouse' className="flex items-center w-full p-0 m-0 rounded-sm">
              <Link
                to="/viewWarehouse"
                className={`w-full text-black hover:text-[#2a9d34] flex items-center space-x-2 cursor-pointer ${activeIndex === 11 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                onClick={() => handleClick(11)}
              >
                <BuildingStorefrontIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />
                Warehouse
              </Link>
            </li>
          )}

          {permissionData.manageTransfer === true && (
            <li id='transfer' className="flex items-center w-full p-0 m-0 rounded-sm">
              <Link
                to="/viewTransfer"
                className={`w-full text-black hover:text-[#2a9d34] flex items-center space-x-2 cursor-pointer ${activeIndex === 12 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                onClick={() => handleClick(12)}
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />
                Transfer
              </Link>
            </li>
          )}

          {/* SALE */}
          {permissionData.manageSales && (
            <li id='sale' className="dropdown flex items-center w-full p-0 m-0 cursor-pointer ">
              <button onClick={SaletoggleDropdown} className="dropdown-toggle text-gray hover:text-gray-700 w-full flex items-center justify-between">
                <span className="flex items-center text-black w-full">
                  <ShoppingCartIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />
                  Sale
                </span>
                <span className="ml-auto" style={{ transformOrigin: 'center' }}>
                  <img
                    src={ArrowIcon}
                    className={`h-3 w-3 transition-transform duration-500 transform text-gray-500 ${isSaleDropdownOpen ? 'rotate-90' : ''}`}
                    alt="arrow icon"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </li>
          )}

          {/* Dropdown links for sale subcategories */}
          <ul className={`rounded-sm w-full dropdown-menu p-0 m-0 ${ isSaleDropdownOpen || saleDropdownSearchOpen ? 'open' : ''}`} id="saleDropdownMenu">
            {permissionData.manageSales && (
              <li id='sale' className="flex items-center w-full p-0 m-0">
                <Link
                  to="/viewSale"
                  className={`w-full text-black hover:text-[#2a9d34] flex items-center cursor-pointer ${activeIndex === 13 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  onClick={() => handleClick(13)}
                >
                  <ShoppingCartIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />
                  Sale
                </Link>
              </li>
            )}

            {permissionData.manageSaleReturns && (
              <li id='sale' className="rounded-sm flex items-center w-full p-0 m-0">
                <Link
                  to="/viewSaleReturns"
                  className={`w-full text-black hover:text-[#2a9d34] flex items-center cursor-pointer ${activeIndex === 14 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  onClick={() => handleClick(14)}
                >
                  <ArrowRightOnRectangleIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />
                  Returns
                </Link>
              </li>
            )}

            {permissionData.managePurchaseReturns && (
              <li id='sale' className="rounded-sm flex items-center w-full p-0 m-0">
                <Link
                  to="/saleReturnsToSupplier"
                  className={`w-full text-black hover:text-[#2a9d34] flex items-center cursor-pointer ${activeIndex === 32 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  onClick={() => handleClick(32)}
                >
                  <ArrowRightOnRectangleIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />
                  Returns To Supplier
                </Link>
              </li>
            )}

          </ul>

          {/* PURCHASE */}
          {permissionData.managePurchases && (
            <li id='purchase' className="rounded-sm dropdown flex items-center w-full p-0 m-0 cursor-pointer">
              <button onClick={PurchasetoggleDropdown} className="dropdown-toggle text-gray hover:text-gray-700 w-full flex items-center justify-between">
                <span className="flex items-center text-black w-full">
                  <ShoppingCartIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />
                  Purchase
                </span>
                <span className="ml-auto" style={{ transformOrigin: 'center' }}>
                  <img
                    src={ArrowIcon}
                    className={`h-3 w-3 transition-transform duration-500 transform text-gray-500 ${isPurchaseDropdownOpen ? 'rotate-90' : ''}`}
                    alt="arrow icon"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </li>
          )}

          {/* Dropdown links for purchase subcategories */}
          <ul className={`rounded-sm w-full dropdown-menu p-0 m-0 ${isPurchaseDropdownOpen || purchaseDropdownSearchOpen ? 'open' : ''}`} id="purchaseDropdownMenu">
            {permissionData.managePurchases && (
              <li id='purchase' className="flex items-center w-full p-0 m-0">
                <Link
                  to="/viewPurchase"
                  className={`w-full text-black hover:text-[#2a9d34] flex items-center cursor-pointer ${activeIndex === 15 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  onClick={() => handleClick(15)}
                >
                  <ShoppingCartIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />
                  Purchase
                </Link>
              </li>
            )}
            {permissionData.managePurchaseReturns && (
              <li id='purchase' className="rounded-sm flex items-center w-full p-0 m-0">
                <Link
                  to="/viewPurchaseReturns"
                  className={`w-full text-black hover:text-[#2a9d34] flex items-center cursor-pointer ${activeIndex === 16 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  onClick={() => handleClick(16)}
                >
                  <ArrowRightOnRectangleIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />
                  Returns
                </Link>
              </li>
            )}
          </ul>

          {/* QUOTATION */}
          {permissionData.manageQuotations && (
            <li id='quotation' className="rounded-sm flex items-center space-x-2 w-full p-0 m-0 cursor-pointer">
              <Link
                to={'/viewQuotation'}
                className={`w-full text-black hover:text-[#2a9d34] flex items-center ${activeIndex === 18 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                onClick={() => handleClick(18)}
              >
                <DocumentTextIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />
                Quotation
              </Link>
            </li>
          )}

          {/* Currency */}
          {permissionData.manageCurrency && (
            <li id='currencies' className="rounded-sm flex items-center space-x-2 w-full p-0 m-0 cursor-pointer">
              <Link
                to="/viewCurrency"
                className={`w-full text-black hover:text-[#2a9d34] flex items-center ${activeIndex === 19 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                onClick={() => handleClick(19)}
              >
                <CurrencyDollarIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />
                Currencies
              </Link>
            </li>
          )}

          {/* EXPENSES */}
          {permissionData.manageExpenses && (
            <li id="expenses" className="rounded-sm flex items-center space-x-2 w-full p-0 m-0 cursor-pointer">
              <button
                onClick={ExpensestoggleDropdown}
                className="dropdown-toggle w-full flex items-center justify-between text-gray-500 hover:text-[#2a9d34]"
              >
                <span className="flex items-center space-x-2 text-gray-500">
                  <ReceiptRefundIcon
                    className="h-6 w-6 text-gray-500  mr-4 transition-colors duration-300"
                    aria-hidden="true"
                  />
                  Expenses
                </span>
                <span
                  className={`ml-auto transform transition-transform duration-300 ${isExpensesDropdownOpen ? 'rotate-90' : ''
                    }`}
                >
                  <img
                    src={ArrowIcon}
                    className="h-3 w-3 text-gray-500 transition-transform duration-500 hover:text-[#2a9d34]"
                    alt="arrow icon"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </li>
          )}


          {/* Drop down links for expense sub-categories */}
          <ul className={`rounded-sm dropdown-menu ${isExpensesDropdownOpen || expensesDropdownSearchOpen ? 'open' : ''}`} id="expensesDropdownMenu">
            {permissionData.manageExpenses && (
              <li id="expenses" className="flex items-center space-x-2 w-full p-0 m-0 cursor-pointer">
                <Link
                  to="/viewExpenses"
                  className={`w-full text-black hover:text-[#2a9d34] flex items-center ${activeIndex === 29 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  onClick={() => handleClick(29)}
                >
                  <ReceiptRefundIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />Expenses
                </Link>
              </li>
            )}

            {permissionData.manageExpensesCategory && (
              <li id="expenses" className="rounded-sm flex items-center space-x-2 w-full p-0 m-0 cursor-pointer">
                <Link
                  to="/viewExpensesCategory"
                  className={`w-full text-black hover:text-[#2a9d34] flex items-center ${activeIndex === 20 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  onClick={() => handleClick(20)}
                >
                  <ChartPieIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />Exp Category
                </Link>
              </li>
            )}
          </ul>

          {permissionData.manageRolesAndPermissions === true && (
            <li id='roles' className="rounded-sm flex items-center space-x-2 w-full p-0 m-0 cursor-pointer">
              <Link
                to="/viewRoleAndPermissions"
                className={`text-black hover:text-[#2a9d34] flex items-center w-full ${activeIndex === 21 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                onClick={() => handleClick(21)}
              >
                <ShieldCheckIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />Roles/Permissions
              </Link>
            </li>
          )}

          {permissionData.manageRolesAndPermissions === true && (
            <li id='offers' className="rounded-sm flex items-center space-x-2 w-full p-0 m-0 cursor-pointer">
              <Link
                to="/viewOffers"
                className={`text-black hover:text-[#2a9d34] flex items-center w-full ${activeIndex === 45 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                onClick={() => handleClick(45)}
              >
                <GiftIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />Special Offers
              </Link>
            </li>
          )}

          {permissionData.manageReports === true && (
            <li id='reports' className="rounded-sm flex items-center space-x-2 w-full p-0 m-0 cursor-pointer">
              <Link
                to="/viewReport"
                className={`text-black hover:text-[#2a9d34] flex items-center w-full ${activeIndex === 22 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                onClick={() => handleClick(22)}
              >
                <DocumentChartBarIcon className="h-5 w-5 text-gray-500 mr-4" aria-hidden="true" />Reports
              </Link>
            </li>
          )}

          {permissionData.manageAdjustments === true && (
            <li id='adjustment' className="rounded-sm flex items-center space-x-2 w-full p-0 m-0 cursor-pointer">
              <Link
                to="/viewAdjustment"
                className={`text-black hover:text-[#2a9d34] flex items-center w-full ${activeIndex === 23 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                onClick={() => handleClick(23)}
              >
                <AdjustmentsVerticalIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />Adjustment
              </Link>
            </li>
          )}

          {/* {permissionData.manageLanguage === true && (
            <li id='language' className="rounded-sm flex items-center space-x-2 w-full p-0 m-0 cursor-pointer">
              <Link
                to="/language"
                className={`text-black hover:text-[#2a9d34] flex items-center w-full ${activeIndex === 24 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                onClick={() => handleClick(24)}
              >
                <GlobeAltIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />Language
              </Link>
            </li>
          )} */}
          {/* ======================================================================================================================================== */}
          {permissionData.manageZbill === true && (
            <li id='adjustment' className="rounded-sm flex items-center space-x-2 w-full p-0 m-0 cursor-pointer">
              <Link
                to="/zBillRecords"
                className={`text-black hover:text-[#2a9d34] flex items-center w-full ${activeIndex === 60 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                onClick={() => handleClick(60)}
              >
                <ReceiptPercentIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />Z bill 
              </Link>
            </li>
          )}
          {/* Drop down links for expense sub-categories */}
          {permissionData.manageSettings && (
            <li id="settings" className="rounded-sm dropdown flex items-center space-x-2 w-full p-0 m-0 cursor-pointer">
              <button
                onClick={SettingsDropdown}
                className="dropdown-toggle text-gray hover:text-gray-700 flex items-center w-full justify-between"
              >
                <span className="text-black hover:text-gray-700 flex items-center space-x-2">
                  <CogIcon className="h-6 w-6 text-gray-500 mr-2" aria-hidden="true" />
                  <span>Settings</span>
                </span>
                <span className="ml-auto transform transition-transform duration-300">
                  <img
                    src={ArrowIcon}
                    className={`h-3 w-3 transition-transform duration-500 transform text-gray-500 ${isSettingsDropdownOpen ? 'rotate-90' : ''}`}
                    alt="arrow icon"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </li>
          )}

          {/* Settings Sub-menu */}
          <ul id="settings" className={`rounded-sm dropdown-menu ${isSettingsDropdownOpen || settingsDropdownSearchOpen ? 'open' : ''}`}>
            {permissionData.manageSettings && (
              <li className="flex items-center space-x-2">
                <Link
                  to="/settings"
                  className={`text-black hover:text-[#2a9d34] flex items-center cursor-pointer ${activeIndex === 25 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  onClick={() => handleClick(25)}
                >
                  <CogIcon
                    className="h-6 w-6 mr-4 text-gray-500 group-hover:text-[#2a9d34]" // Add `group-hover` to make it inherit hover styles
                    aria-hidden="true"
                  />
                  Settings
                </Link>
              </li>
            )}

            {permissionData.manageMailSettings && (
              <li id="settings" className="rounded-sm flex items-center space-x-2">
                <Link
                  to="/mailSettings"
                  className={`text-black hover:text-[#2a9d34] flex items-center cursor-pointer ${activeIndex === 26 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  onClick={() => handleClick(26)}
                >
                  <CogIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />Mail settings
                </Link>
              </li>
            )}

            {permissionData.manageReceiptSettings && (
              <li id="settings" className="rounded-sm flex items-center space-x-2">
                <Link
                  to="/receiptSettings"
                  className={`text-black hover:text-[#2a9d34] flex items-center cursor-pointer ${activeIndex === 27 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  onClick={() => handleClick(27)}
                >
                  <CogIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />Receipt settings
                </Link>
              </li>
            )}

            {permissionData.managePrefixesSettings && (
              <li id="settings" className="rounded-sm flex items-center space-x-2">
                <Link
                  to="/prefixSettings"
                  className={`text-black hover:text-[#2a9d34] flex items-center cursor-pointer ${activeIndex === 28 ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                  onClick={() => handleClick(28)}
                >
                  <CogIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />Prefixes settings
                </Link>
              </li>
            )}
          </ul>

          <p id='logout' className="rounded-sm flex items-center space-x-2 w-full p-0 ml-2 cursor-pointer">
            <span
              onClick={handleLogout}
              className={`text-black hover:text-[red] flex items-center w-full`}
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6 text-gray-500 mr-4" aria-hidden="true" />Logout
            </span>
          </p>
        </ul>
      </div>
      {showLogoutModel && (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white w-[400px] h-[260px] p-8 rounded-xl shadow-lg flex flex-col justify-between">
              <div className="text-center">
                  <h3 className="text-2xl text-gray-800 font-bold  mb-2">Confirm Logout</h3>
                  <p className="text-gray-800 text-base pt-6">Do you want to logout without closing the POS?</p>
              </div>

              <div className="flex justify-center space-x-4 mt-8">
                  <button
                      className="submit w-[100px] text-white px-4 py-2 rounded mr-2"
                      onClick={handleConfirm}
                  >
                      Confirm
                  </button>
                  <button
                      className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition"
                      onClick={handleCancel}
                  >
                      Cancel
                  </button>
              </div>
          </div>
      </div>
      )}
    </div>
  );
};

export default Sidebar;
