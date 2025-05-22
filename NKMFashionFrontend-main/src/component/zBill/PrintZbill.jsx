// PrintZbill.js
import React, { forwardRef } from 'react';
import { decryptData } from '../../component/utill/encryptionUtils';

const PrintZbill = forwardRef(({ companyDetails,zReadingData,registerData,currency,formatCurrency }, ref) => {

  return (
    <div ref={ref} className="p-2 pb-4 pt-2 bg-white text-gray-800 border border-gray-300 w-[80mm]">
      <div className="print-container">
        {/* Company Logo */}
        {companyDetails.logo && (
          <img 
            className="w-8 h-8 mx-auto" 
            src={companyDetails.logo} 
            alt="company logo" 
          />
        )}

        {/* Company Details */}
        <h1 className="text-lg font-bold pb-1 text-center">
          {companyDetails.name || 'Company Name'}
        </h1>
        <p className="text-center text-xs">
          {companyDetails.mobile || 'Phone: N/A'}
        </p>
        <p className="text-center text-xs">
          {companyDetails.email || 'Email: N/A'}
        </p>

        {/* Z Reading Data */}
        <p className="w-full mt-1">--------------------------------</p>
        <div className="mt-4 pt-2">
          <div className="flex justify-between text-sm">
            <span className='font-bold'>Date:</span>
            <span>{new Date(zReadingData?.createdAt).toLocaleDateString()}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className='font-bold'>Open Time:</span>
            <span>{registerData?.openTime?.split(', ')[1] || 'N/A'}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className='font-bold'>Close Time: </span>
            <span> {new Date(zReadingData?.createdAt).toLocaleTimeString()}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className='font-bold'>Cash Hand In:</span>
            <span>
              {currency} {formatCurrency(registerData?.cashHandIn || 0)}
            </span>
          </div>

          <p className="w-full mt-1">--------------------------------</p>
          {/* Transaction Breakdown */}
          <div className="mt-3">
            <h3 className="font-semibold text-sm">Transactions:</h3>
            <div className="flex justify-between text-sm">
              <span>Cash Payments:</span>
              <span>
                {currency} {formatCurrency(zReadingData?.cashPaymentAmount || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Card Payments:</span>
              <span>
                {currency} {formatCurrency(zReadingData?.cardPaymentAmount || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Bank Transfers:</span>
              <span>
                {currency} {formatCurrency(zReadingData?.bankTransferPaymentAmount || 0)}
              </span>
            </div>
          </div>

          <div className="mt-3">
            <h3 className="font-semibold text-sm">Discounts</h3>
            <div className="flex justify-between text-sm">
              <span>Total Discounts:</span>
              <span>
                {currency} {formatCurrency(zReadingData?.totalDiscountAmount || 0)}
              </span>
            </div>
          </div>

          <div className="mt-3">
            <h3 className="font-semibold text-sm">Cash Variance</h3>
            <div className="flex justify-between text-sm">
              <span>Cash Variance:</span>
              <span>
                {currency} {formatCurrency(zReadingData?.cashVariance || 0)}
              </span>
            </div>
          </div>

          {/* Total */}
          <p className="w-full mt-1">=========================</p>
          <div className="mt-3 pt-2">
            <div className="flex justify-between font-semibold">
              <span>Grand Total:</span>
              <span>
                {currency} {formatCurrency(
                  (registerData?.cashHandIn || 0) +
                  (zReadingData?.cashPaymentAmount || 0) +
                  (zReadingData?.cardPaymentAmount || 0) +
                  (zReadingData?.bankTransferPaymentAmount || 0)
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PrintZbill;