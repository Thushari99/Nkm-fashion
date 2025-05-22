import React, { useEffect, useState } from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import axios from 'axios';

// Format numbers with commas and two decimal places
const formatNumber = (value) => {
  return value?.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') || '0.00';
};

// Styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#F9FAFB',
    padding: 30,
    fontFamily: 'Helvetica',
    color: '#333',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: '#1A5B63',
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16796E',
  },
  contactDetails: {
    fontSize: 9,
    color: '#555',
    textAlign: 'center',
  },
  title: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 12,
    fontWeight: 'bold',
    color: '#1A5B63',
  },
  section: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#16796E',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  bold: {
    fontWeight: 'bold',
  },
  footer: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 12,
    color: '#888',
  },
});

const ProfitAndLossPDF = ({
  totalProfit = 0,
  totalLost = 0,
  tax = 0,
  totalDiscountAmount = 0,
  cashPaymentAmount = 0,
  cardPaymentAmount = 0,
  bankTransferPaymentAmount = 0,
  checkPaymentAmount = 0,
  currency = '$',
  totalSales = 0,
}) => {
  const [company, setCompany] = useState({});

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/getSettings`);
        setCompany(data);
      } catch (error) {
        console.error('Error fetching company details:', error);
      }
    };

    fetchCompanyDetails();
  }, []);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Company Details */}
        <View style={styles.headerContainer}>
          {company.logo && <Image src={company.logo} style={styles.logo} />}
          <Text style={styles.companyName}>{company.companyName || 'Company Name'}</Text>
          <Text style={styles.contactDetails}>{company.companyMobile || 'Phone'} | {company.email || 'Email'}</Text>
          <Text style={styles.contactDetails}>{company.address || 'Address'}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Profit and Loss Statement</Text>

        {/* Profit and Loss Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Summary</Text>
          <View style={styles.row}><Text style={styles.bold}>Profit:</Text> <Text>{currency} {formatNumber(totalProfit)}</Text></View>
          <View style={styles.row}><Text style={styles.bold}>Loss:</Text> <Text>{currency} {formatNumber(totalLost)}</Text></View>
          <View style={styles.row}><Text style={styles.bold}>Tax Amount:</Text> <Text>{currency} {formatNumber(tax)}</Text></View>
        </View>

        {/* Payment Overview */}
        {/* Payment Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.row}>
            <Text style={styles.bold}>Total Cash Payments:</Text>
            <Text>{currency} {formatNumber(cashPaymentAmount)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.bold}>Total Card Payments:</Text>
            <Text>{currency} {formatNumber(cardPaymentAmount)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.bold}>Total Bank Transfers:</Text>
            <Text>{currency} {formatNumber(bankTransferPaymentAmount)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.bold}>Total Check Payments:</Text>
            <Text>{currency} {formatNumber(checkPaymentAmount)}</Text>
          </View>
        </View>

        {/* Discounts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discount Overview</Text>
          <View style={styles.row}><Text style={styles.bold}>Discount Amount:</Text> <Text>{currency} {formatNumber(totalDiscountAmount)}</Text></View>
        </View>

        {/* Sales Information */}
        {/* Sales Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sales Summary</Text>
          <View style={styles.row}>
            <Text style={styles.bold}>Total Sales Amount:</Text>
            <Text>{currency} {formatNumber(totalSales)}</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Generated on {new Date().toLocaleDateString()}</Text>
      </Page>
    </Document>
  );
};

export default ProfitAndLossPDF;
