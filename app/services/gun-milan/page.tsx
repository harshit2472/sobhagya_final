"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Heart, Star, ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface BoyData {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  state: string;
}

interface GirlData {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  state: string;
}

interface GunDetail {
  name: string;
  description: string;
  score: number;
}

interface GunMilanResult {
  totalScore: number;
  compatibilityLevel: string;
  compatibilityDescription: string;
  gunDetails: GunDetail[];
  recommendations: string[];
  remedies: string[];
  birthCharts?: {
    boy: {
      nakshatra: any;
      rashi: any;
      ascendant: any;
    };
    girl: {
      nakshatra: any;
      rashi: any;
      ascendant: any;
    };
  };
}

const states = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export default function MatchmakingPage() {
  const [currentStep, setCurrentStep] = useState<'form' | 'results'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [boyData, setBoyData] = useState<BoyData>({
    name: '',
    dateOfBirth: '',
    timeOfBirth: '',
    state: ''
  });
  const [girlData, setGirlData] = useState<GirlData>({
    name: '',
    dateOfBirth: '',
    timeOfBirth: '',
    state: ''
  });
  const [gunMilanResult, setGunMilanResult] = useState<GunMilanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showBoyStateDropdown, setShowBoyStateDropdown] = useState(false);
  const [showGirlStateDropdown, setShowGirlStateDropdown] = useState(false);
  const [boyStateSearch, setBoyStateSearch] = useState('');
  const [girlStateSearch, setGirlStateSearch] = useState('');

  // Function to format date from yyyy-mm-dd to dd-mm-yyyy
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  const handleBoyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBoyData(prev => ({ ...prev, [name]: value }));
  };

  const handleGirlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGirlData(prev => ({ ...prev, [name]: value }));
  };

  const handleBoyStateSelect = (state: string) => {
    setBoyData(prev => ({ ...prev, state }));
    setShowBoyStateDropdown(false);
    setBoyStateSearch('');
  };

  const handleGirlStateSelect = (state: string) => {
    setGirlData(prev => ({ ...prev, state }));
    setShowGirlStateDropdown(false);
    setGirlStateSearch('');
  };

  const calculateGunMilan = async () => {
    if (!boyData.name || !boyData.dateOfBirth || !boyData.timeOfBirth || !boyData.state ||
        !girlData.name || !girlData.dateOfBirth || !girlData.timeOfBirth || !girlData.state) {
      setErrorMessage('✨ Please fill in all required fields to calculate your compatibility');
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    setIsCalculating(true);
    
    try {
      // Call the proper API for accurate astronomical calculations
      const response = await fetch('/api/matchmaking/gun-milan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boyData,
          girlData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate Gun Milan');
      }

      const result = await response.json();
      
      // Debug: Log the API response to see what's being returned
      console.log('API Response:', result);
      console.log('Birth Charts:', result.birthCharts);
      
      // Transform API result to match our interface
      const gunMilanResult: GunMilanResult = {
        totalScore: result.totalScore,
        compatibilityLevel: result.compatibilityLevel,
        compatibilityDescription: result.compatibilityDescription,
        gunDetails: result.gunDetails.map((gun: any) => ({
          name: gun.name,
          description: gun.description,
          score: gun.score
        })),
        recommendations: result.recommendations,
        remedies: result.remedies,
        birthCharts: result.birthCharts // Include the birth charts data
      };
      
      setGunMilanResult(gunMilanResult);
      setCurrentStep('results');
      
      // Debug: Log the final result to see what's being set
      console.log('Final GunMilanResult:', gunMilanResult);
      console.log('Birth Charts in Final Result:', gunMilanResult.birthCharts);
    } catch (error) {
      console.error('Error calculating Gun Milan:', error);
      setErrorMessage('💫 Failed to calculate Gun Milan. Please try again.');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsCalculating(false);
    }
  };

  const downloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Gun Milan Report - ${boyData.name} & ${girlData.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #2d3748; 
              background: #ffffff;
              font-size: 14px;
            }
            
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 40px 30px; 
              background: white;
            }
            
            .header { 
              text-align: center; 
              border-bottom: 2px solid #2d3748; 
              padding: 40px 20px 30px;
              margin-bottom: 40px; 
              background: #ffffff;
            }
            
            .title { 
              font-size: 28px; 
              font-weight: 700; 
              color: #2d3748; 
              margin-bottom: 8px; 
              letter-spacing: -0.025em;
            }
            
            .subtitle { 
              font-size: 16px; 
              color: #4a5568; 
              font-weight: 500;
              margin-bottom: 15px;
            }
            
            .report-info {
              font-size: 12px;
              color: #718096;
              background: #f7fafc;
              padding: 8px 16px;
              border-radius: 4px;
              display: inline-block;
              border: 1px solid #e2e8f0;
            }
            
            .section { 
              margin-bottom: 40px; 
              background: white;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
            }
            
            .section-title { 
              font-size: 18px; 
              font-weight: 600;
              color: #2d3748; 
              background: #f7fafc;
              padding: 16px 20px; 
              margin: 0;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .section-content {
              padding: 20px;
            }
            
            .score-box { 
              background: #2d3748; 
              color: white; 
              padding: 30px; 
              border-radius: 8px; 
              text-align: center; 
              margin: 25px 0; 
            }
            
            .total-score { 
              font-size: 42px; 
              font-weight: 700; 
              margin-bottom: 10px;
            }
            
            .compatibility-level { 
              font-size: 20px; 
              font-weight: 600;
              margin: 15px 0; 
            }
            
            .compatibility-description {
              font-size: 14px;
              opacity: 0.9;
              line-height: 1.5;
              max-width: 600px;
              margin: 0 auto;
            }
            
            .grid-2 { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 20px; 
            }
            
            .personal-info { 
              background: #f7fafc; 
              padding: 20px; 
              border-radius: 6px; 
              border: 1px solid #e2e8f0;
            }
            
            .personal-info h3 {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 16px;
              text-align: center;
              padding-bottom: 8px;
              border-bottom: 1px solid #e2e8f0;
              color: #2d3748;
            }
            
            .info-row { 
              display: flex; 
              justify-content: space-between; 
              align-items: center;
              margin: 10px 0; 
              padding: 6px 0;
              border-bottom: 1px solid #edf2f7;
            }
            
            .info-row:last-child {
              border-bottom: none;
            }
            
            .info-label { 
              color: #718096; 
              font-weight: 500;
              font-size: 13px;
            }
            
            .info-value { 
              font-weight: 600; 
              color: #2d3748; 
              font-size: 13px;
            }
            
            .gun-item { 
              border-bottom: 1px solid #e2e8f0; 
              padding: 16px 0; 
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            
            .gun-item:last-child {
              border-bottom: none;
            }
            
            .gun-details {
              flex: 1;
              margin-right: 20px;
            }
            
            .gun-name { 
              font-weight: 600; 
              color: #2d3748; 
              font-size: 14px;
              margin-bottom: 4px;
            }
            
            .gun-description { 
              color: #718096; 
              font-size: 13px;
              line-height: 1.4;
            }
            
            .gun-score { 
              font-size: 18px; 
              color: #2d3748; 
              font-weight: 700;
              background: #f7fafc;
              padding: 6px 12px;
              border-radius: 4px;
              min-width: 50px;
              text-align: center;
              border: 1px solid #e2e8f0;
            }
            
            .recommendation-item, .remedy-item { 
              margin: 10px 0; 
              padding-left: 20px; 
              position: relative; 
              line-height: 1.5;
              font-size: 13px;
              color: #4a5568;
            }
            
            .recommendation-item:before, .remedy-item:before { 
              content: "•"; 
              color: #2d3748; 
              font-weight: bold; 
              position: absolute; 
              left: 0; 
              font-size: 16px;
            }
            
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              color: #718096;
              font-size: 11px;
            }
            
            .footer p {
              margin: 6px 0;
            }
            
            @media print { 
              body { margin: 0; } 
              .header { page-break-after: avoid; }
              .section { page-break-inside: avoid; }
              .container { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="title">Gun Milan Compatibility Report</div>
              <div class="subtitle">Vedic Astrology Analysis</div>
              <div class="report-info">
                Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}
              </div>
            </div>

            <div class="score-box">
              <div class="total-score">${gunMilanResult?.totalScore || 0}/36</div>
              <div class="compatibility-level">${gunMilanResult?.compatibilityLevel || 'Loading...'}</div>
              <div class="compatibility-description">${gunMilanResult?.compatibilityDescription || 'Loading...'}</div>
            </div>

            <div class="section">
              <div class="section-title">Personal Information</div>
              <div class="section-content">
                <div class="grid-2">
                  <div class="personal-info">
                    <h3>${boyData.name}'s Details</h3>
                    <div class="info-row"><span class="info-label">Birth Date:</span><span class="info-value">${formatDate(boyData.dateOfBirth)}</span></div>
                    <div class="info-row"><span class="info-label">Birth Time:</span><span class="info-value">${boyData.timeOfBirth}</span></div>
                    <div class="info-row"><span class="info-label">State:</span><span class="info-value">${boyData.state}</span></div>
                  </div>
                  <div class="personal-info">
                    <h3>${girlData.name}'s Details</h3>
                    <div class="info-row"><span class="info-label">Birth Date:</span><span class="info-value">${formatDate(girlData.dateOfBirth)}</span></div>
                    <div class="info-row"><span class="info-label">Birth Time:</span><span class="info-value">${girlData.timeOfBirth}</span></div>
                    <div class="info-row"><span class="info-label">State:</span><span class="info-value">${girlData.state}</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Janma Chakra (Birth Charts)</div>
              <div class="section-content">
                <div class="grid-2">
                  <div class="personal-info">
                    <h3>${boyData.name}'s Janma Chakra</h3>
                    <div class="info-row"><span class="info-label">Nakshatra:</span><span class="info-value">${gunMilanResult?.birthCharts?.boy?.nakshatra?.name || 'Loading...'}</span></div>
                    <div class="info-row"><span class="info-label">Rashi:</span><span class="info-value">${gunMilanResult?.birthCharts?.boy?.rashi?.name || 'Loading...'}</span></div>
                    <div class="info-row"><span class="info-label">Ascendant:</span><span class="info-value">${gunMilanResult?.birthCharts?.boy?.ascendant?.name || 'Loading...'}</span></div>
                    <div class="info-row"><span class="info-label">Element:</span><span class="info-value">${gunMilanResult?.birthCharts?.boy?.rashi?.element || 'Loading...'}</span></div>
                  </div>
                  <div class="personal-info">
                    <h3>${girlData.name}'s Janma Chakra</h3>
                    <div class="info-row"><span class="info-label">Nakshatra:</span><span class="info-value">${gunMilanResult?.birthCharts?.girl?.nakshatra?.name || 'Loading...'}</span></div>
                    <div class="info-row"><span class="info-label">Rashi:</span><span class="info-value">${gunMilanResult?.birthCharts?.girl?.rashi?.name || 'Loading...'}</span></div>
                    <div class="info-row"><span class="info-label">Ascendant:</span><span class="info-value">${gunMilanResult?.birthCharts?.girl?.ascendant?.name || 'Loading...'}</span></div>
                    <div class="info-row"><span class="info-label">Element:</span><span class="info-value">${gunMilanResult?.birthCharts?.girl?.rashi?.element || 'Loading...'}</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Gun Milan Details (36-Point Analysis)</div>
              <div class="section-content">
                ${gunMilanResult?.gunDetails?.map(gun => `
                  <div class="gun-item">
                    <div class="gun-details">
                      <div class="gun-name">${gun.name}</div>
                      <div class="gun-description">${gun.description}</div>
                    </div>
                    <div class="gun-score">${gun.score}</div>
                  </div>
                `).join('') || 'Loading...'}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Recommendations & Remedies</div>
              <div class="section-content">
                <div class="grid-2">
                  <div>
                    <h3 style="margin-bottom: 20px; font-size: 16px; font-weight: 600;">Recommendations</h3>
                    ${gunMilanResult?.recommendations?.map(rec => `
                      <div class="recommendation-item">${rec}</div>
                    `).join('') || 'Loading...'}
                  </div>
                  <div>
                    <h3 style="margin-bottom: 20px; font-size: 16px; font-weight: 600;">Remedies</h3>
                    ${gunMilanResult?.remedies?.map(remedy => `
                      <div class="remedy-item">${remedy}</div>
                    `).join('') || 'Loading...'}
                  </div>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>This report is generated based on Vedic astrology principles and traditional Gun Milan calculations.</p>
              <p>© 2025 Sobhagya - Vedic Astrology Services</p>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const resetForm = () => {
    setBoyData({
      name: '',
      dateOfBirth: '',
      timeOfBirth: '',
      state: ''
    });
    setGirlData({
      name: '',
      dateOfBirth: '',
      timeOfBirth: '',
      state: ''
    });
    setCurrentStep('form');
    setGunMilanResult(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (currentStep === 'results' && gunMilanResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-pink-100">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button 
                onClick={resetForm}
                className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">New Calculation</span>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-500">Gun Milan Results</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="py-16 lg:py-24">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Gun Milan Results
                <span className="block text-pink-600">Compatibility Analysis</span>
              </h1>
              <p className="text-xl text-gray-600">
                Traditional Vedic Astrology 36-Point Compatibility Analysis
              </p>
            </motion.div>

            {/* Overall Score */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-gradient-to-br from-pink-50 via-white to-orange-50 rounded-2xl shadow-xl border border-pink-100 p-6 mb-6"
            >
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-full text-sm font-medium mb-4 shadow-lg">
                  <Heart className="w-4 h-4" />
                  Overall Compatibility Score
                </div>
                <div className="text-6xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent mb-3">
                  {gunMilanResult.totalScore}/36
                </div>
                <div className={`text-2xl font-bold mb-4 px-4 py-2 rounded-full inline-block ${
                  gunMilanResult.totalScore >= 32 ? 'bg-green-100 text-green-700 border-2 border-green-300' :
                  gunMilanResult.totalScore >= 28 ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' :
                  gunMilanResult.totalScore >= 24 ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300' :
                  gunMilanResult.totalScore >= 20 ? 'bg-orange-100 text-orange-700 border-2 border-orange-300' :
                  gunMilanResult.totalScore >= 16 ? 'bg-red-100 text-red-700 border-2 border-red-300' :
                  'bg-red-200 text-red-800 border-2 border-red-400'
                }`}>
                  {gunMilanResult.compatibilityLevel}
                </div>
                <div className="max-w-3xl mx-auto">
                  <p className="text-gray-700 text-base leading-relaxed">
                  {gunMilanResult.compatibilityDescription}
                </p>
                </div>
              </div>
            </motion.div>

            {/* Detailed Analysis */}
            <div className="w-full space-y-8">
              {/* Personal Information */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="bg-white rounded-2xl shadow-xl border border-pink-100 p-6 w-full"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <User className="w-6 h-6 text-pink-600" />
                  Personal Information
                </h3>
                <div className="grid lg:grid-cols-2 gap-12 w-full">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-4 text-center">Boy's Details</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-semibold">{boyData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Birth Date:</span>
                        <span className="font-semibold">{formatDate(boyData.dateOfBirth)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Birth Time:</span>
                        <span className="font-semibold">{boyData.timeOfBirth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">State:</span>
                        <span className="font-semibold">{boyData.state}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-4 text-center">Girl's Details</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-semibold">{girlData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Birth Date:</span>
                        <span className="font-semibold">{formatDate(girlData.dateOfBirth)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Birth Time:</span>
                        <span className="font-semibold">{girlData.timeOfBirth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">State:</span>
                        <span className="font-semibold">{girlData.state}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Janma Chakra (Birth Charts) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="bg-white rounded-2xl shadow-xl border border-pink-100 p-5 w-full"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm0 2c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 2c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4z" />
                  </svg>
                  Janma Chakra (Birth Charts)
                </h3>
                
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Boy's Janma Chakra */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-bold text-blue-600 text-center border-b-2 border-blue-200 pb-2">
                      {boyData.name}'s Janma Chakra
                    </h4>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl">
                      <div className="grid grid-cols-3 gap-1 text-center">
                        {/* Houses 1-3 */}
                        <div className="bg-white p-2 rounded-lg border border-blue-200">
                          <div className="text-xs text-blue-600 font-semibold">House 1</div>
                          <div className="text-sm font-bold text-gray-800">Ascendant</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-blue-200">
                          <div className="text-xs text-blue-600 font-semibold">House 2</div>
                          <div className="text-sm font-bold text-gray-800">Wealth</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-blue-200">
                          <div className="text-xs text-blue-600 font-semibold">House 3</div>
                          <div className="text-sm font-bold text-gray-800">Siblings</div>
                        </div>
                        
                        {/* Houses 4-6 */}
                        <div className="bg-white p-2 rounded-lg border border-blue-200">
                          <div className="text-xs text-blue-600 font-semibold">House 4</div>
                          <div className="text-sm font-bold text-gray-800">Home</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-blue-200">
                          <div className="text-xs text-blue-600 font-semibold">House 5</div>
                          <div className="text-sm font-bold text-gray-800">Children</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-blue-200">
                          <div className="text-xs text-blue-600 font-semibold">House 6</div>
                          <div className="text-sm font-bold text-gray-800">Health</div>
                        </div>
                        
                        {/* Houses 7-9 */}
                        <div className="bg-white p-2 rounded-lg border border-blue-200">
                          <div className="text-xs text-blue-600 font-semibold">House 7</div>
                          <div className="text-sm font-bold text-gray-800">Marriage</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-blue-200">
                          <div className="text-xs text-blue-600 font-semibold">House 8</div>
                          <div className="text-sm font-bold text-gray-800">Longevity</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-blue-200">
                          <div className="text-xs text-blue-600 font-semibold">House 9</div>
                          <div className="text-sm font-bold text-gray-800">Dharma</div>
                        </div>
                        
                        {/* Houses 10-12 */}
                        <div className="bg-white p-2 rounded-lg border border-blue-200">
                          <div className="text-xs text-blue-600 font-semibold">House 10</div>
                          <div className="text-sm font-bold text-gray-800">Career</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-blue-200">
                          <div className="text-xs text-blue-600 font-semibold">House 11</div>
                          <div className="text-sm font-bold text-gray-800">Gains</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-blue-200">
                          <div className="text-xs text-blue-600 font-semibold">House 12</div>
                          <div className="text-sm font-bold text-gray-800">Losses</div>
                        </div>
                      </div>
                      
                      {/* Planetary Positions */}
                      <div className="mt-4 space-y-2">
                        <h5 className="font-semibold text-blue-800 text-center">Key Planetary Positions</h5>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-blue-700">Nakshatra:</span>
                            <span className="font-medium">
                              {gunMilanResult.birthCharts?.boy?.nakshatra?.name ? (
                                gunMilanResult.birthCharts.boy.nakshatra.name
                              ) : (
                                <span className="text-orange-600 animate-pulse">Calculating...</span>
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">Rashi:</span>
                            <span className="font-medium">
                              {gunMilanResult.birthCharts?.boy?.rashi?.name ? (
                                gunMilanResult.birthCharts.boy.rashi.name
                              ) : (
                                <span className="text-orange-600 animate-pulse">Calculating...</span>
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">Ascendant:</span>
                            <span className="font-medium">
                              {gunMilanResult.birthCharts?.boy?.ascendant?.name ? (
                                gunMilanResult.birthCharts.boy.ascendant.name
                              ) : (
                                <span className="text-orange-600 animate-pulse">Calculating...</span>
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">Element:</span>
                            <span className="font-medium">
                              {gunMilanResult.birthCharts?.boy?.rashi?.element ? (
                                gunMilanResult.birthCharts.boy.rashi.element
                              ) : (
                                <span className="text-orange-600 animate-pulse">Calculating...</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Girl's Janma Chakra */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-bold text-pink-600 text-center border-b-2 border-pink-200 pb-2">
                      {girlData.name}'s Janma Chakra
                    </h4>
                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-3 rounded-xl">
                      <div className="grid grid-cols-3 gap-1 text-center">
                        {/* Houses 1-3 */}
                        <div className="bg-white p-2 rounded-lg border border-pink-200">
                          <div className="text-xs text-pink-600 font-semibold">House 1</div>
                          <div className="text-sm font-bold text-gray-800">Ascendant</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-pink-200">
                          <div className="text-xs text-pink-600 font-semibold">House 2</div>
                          <div className="text-sm font-bold text-gray-800">Wealth</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-pink-200">
                          <div className="text-xs text-pink-600 font-semibold">House 3</div>
                          <div className="text-sm font-bold text-gray-800">Siblings</div>
                        </div>
                        
                        {/* Houses 4-6 */}
                        <div className="bg-white p-2 rounded-lg border border-pink-200">
                          <div className="text-xs text-pink-600 font-semibold">House 4</div>
                          <div className="text-sm font-bold text-gray-800">Home</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-pink-200">
                          <div className="text-xs text-pink-600 font-semibold">House 5</div>
                          <div className="text-sm font-bold text-gray-800">Children</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-pink-200">
                          <div className="text-xs text-pink-600 font-semibold">House 6</div>
                          <div className="text-sm font-bold text-gray-800">Health</div>
                        </div>
                        
                        {/* Houses 7-9 */}
                        <div className="bg-white p-2 rounded-lg border border-pink-200">
                          <div className="text-xs text-pink-600 font-semibold">House 7</div>
                          <div className="text-sm font-bold text-gray-800">Marriage</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-pink-200">
                          <div className="text-xs text-pink-600 font-semibold">House 8</div>
                          <div className="text-sm font-bold text-gray-800">Longevity</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-pink-200">
                          <div className="text-xs text-pink-600 font-semibold">House 9</div>
                          <div className="text-sm font-bold text-gray-800">Dharma</div>
                        </div>
                        
                        {/* Houses 10-12 */}
                        <div className="bg-white p-2 rounded-lg border border-pink-200">
                          <div className="text-xs text-pink-600 font-semibold">House 10</div>
                          <div className="text-sm font-bold text-gray-800">Career</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-pink-200">
                          <div className="text-xs text-pink-600 font-semibold">House 11</div>
                          <div className="text-sm font-bold text-gray-800">Gains</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-pink-200">
                          <div className="text-xs text-pink-600 font-semibold">House 12</div>
                          <div className="text-sm font-bold text-gray-800">Losses</div>
                        </div>
                      </div>
                      
                      {/* Planetary Positions */}
                      <div className="mt-4 space-y-2">
                        <h5 className="font-semibold text-pink-800 text-center">Key Planetary Positions</h5>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-pink-700">Nakshatra:</span>
                            <span className="font-medium">
                              {gunMilanResult.birthCharts?.girl?.nakshatra?.name ? (
                                gunMilanResult.birthCharts.girl.nakshatra.name
                              ) : (
                                <span className="text-pink-600 animate-pulse">Calculating...</span>
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-pink-700">Rashi:</span>
                            <span className="font-medium">
                              {gunMilanResult.birthCharts?.girl?.rashi?.name ? (
                                gunMilanResult.birthCharts.girl.rashi.name
                              ) : (
                                <span className="text-pink-600 animate-pulse">Calculating...</span>
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-pink-700">Ascendant:</span>
                            <span className="font-medium">
                              {gunMilanResult.birthCharts?.girl?.ascendant?.name ? (
                                gunMilanResult.birthCharts.girl.ascendant.name
                              ) : (
                                <span className="text-pink-600 animate-pulse">Calculating...</span>
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-pink-700">Element:</span>
                            <span className="font-medium">
                              {gunMilanResult.birthCharts?.girl?.rashi?.element ? (
                                gunMilanResult.birthCharts.girl.rashi.element
                              ) : (
                                <span className="text-pink-600 animate-pulse">Calculating...</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Gun Details */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="bg-white rounded-2xl shadow-xl border border-pink-100 p-5"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-pink-600" />
                  Gun Milan Details (36-Point Analysis)
                </h3>
                <div className="grid lg:grid-cols-4 gap-6 w-full">
                  {gunMilanResult.gunDetails.map((gun, index) => (
                    <div key={index} className="bg-gradient-to-r from-pink-50 to-orange-50 p-4 rounded-xl border border-pink-200 hover:shadow-md transition-all duration-200">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-gray-900 text-sm">{gun.name}</span>
                        <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-pink-600">{gun.score}</span>
                          <span className="text-xs text-gray-500">/ {gun.name.includes('(') ? gun.name.match(/\((\d+)/)?.[1] || '0' : '0'}</span>
                      </div>
                      </div>
                      <p className="text-gray-700 text-xs leading-relaxed mb-3">{gun.description}</p>
                      <div className="pt-2 border-t border-pink-200">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-pink-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(gun.score / parseInt(gun.name.match(/\((\d+)/)?.[1] || '1')) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Recommendations & Remedies */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mt-6 grid lg:grid-cols-2 gap-6"
            >
              <div className="bg-white rounded-2xl shadow-xl border border-pink-100 p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Recommendations</h3>
                <ul className="space-y-1.5">
                  {gunMilanResult.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-2xl shadow-xl border border-pink-100 p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Remedies</h3>
                <ul className="space-y-1.5">
                  {gunMilanResult.remedies.map((remedy, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 text-sm">{remedy}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Download PDF Button */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              className="mt-6 text-center"
            >
              <button
                onClick={() => downloadPDF()}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-pink-600 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold text-base hover:from-pink-700 hover:to-orange-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Complete Report (PDF)
              </button>
              <p className="text-gray-600 mt-2 text-sm">
                Get your detailed Gun Milan analysis with Janma Chakra charts
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50">
      {/* Beautiful Error Notification */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-gradient-to-r from-pink-500 to-orange-500 text-white px-6 py-4 rounded-xl shadow-lg border border-pink-200 max-w-md mx-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5" />
              </div>
              <p className="font-medium">{errorMessage}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Form Section */}
      <div className="py-16 lg:py-24">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Gun Milan Calculator
              <span className="block text-pink-600">Vedic Compatibility Analysis</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Enter the birth details of both partners to calculate the traditional 
              36-point Gun Milan compatibility score based on Vedic astrology.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl border border-pink-100 p-8"
          >
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Boy's Details */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <User className="w-6 h-6 text-blue-600" />
                  Boy's Details
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={boyData.name}
                      onChange={handleBoyInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                      placeholder="✨ Enter the groom's full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={boyData.dateOfBirth}
                      onChange={handleBoyInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Time of Birth *
                    </label>
                    <input
                      type="time"
                      name="timeOfBirth"
                      value={boyData.timeOfBirth}
                      onChange={handleBoyInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>



                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      State *
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowBoyStateDropdown(!showBoyStateDropdown)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-left flex items-center justify-between"
                      >
                        <span className={boyData.state ? 'text-gray-900' : 'text-gray-500'}>
                          {boyData.state || 'Select State'}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showBoyStateDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showBoyStateDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                          <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                            <input
                              type="text"
                              placeholder="🔍 Search for your state..."
                              value={boyStateSearch}
                              onChange={(e) => setBoyStateSearch(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          {states
                            .filter(state => 
                              state.toLowerCase().includes(boyStateSearch.toLowerCase())
                            )
                            .map((state) => (
                              <button
                                key={state}
                                type="button"
                                onClick={() => handleBoyStateSelect(state)}
                                className="w-full px-4 py-3 text-left hover:bg-pink-50 transition-colors duration-200"
                              >
                                {state}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Girl's Details */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <User className="w-6 h-6 text-pink-600" />
                  Girl's Details
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={girlData.name}
                      onChange={handleGirlInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                      placeholder="💕 Enter the bride's full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={girlData.dateOfBirth}
                      onChange={handleGirlInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Time of Birth *
                    </label>
                    <input
                      type="time"
                      name="timeOfBirth"
                      value={girlData.timeOfBirth}
                      onChange={handleGirlInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>



                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      State *
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowGirlStateDropdown(!showGirlStateDropdown)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-left flex items-center justify-between"
                      >
                        <span className={girlData.state ? 'text-gray-900' : 'text-gray-500'}>
                          {girlData.state || 'Select State'}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showGirlStateDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showGirlStateDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                          <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                            <input
                              type="text"
                              placeholder="🔍 Search for your state..."
                              value={girlStateSearch}
                              onChange={(e) => setGirlStateSearch(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          {states
                            .filter(state => 
                              state.toLowerCase().includes(girlStateSearch.toLowerCase())
                            )
                            .map((state) => (
                              <button
                                key={state}
                                type="button"
                                onClick={() => handleGirlStateSelect(state)}
                                className="w-full px-4 py-3 text-left hover:bg-pink-50 transition-colors duration-200"
                              >
                                {state}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Calculate Button */}
            <div className="mt-8 text-center">
              <button
                onClick={calculateGunMilan}
                disabled={isCalculating}
                className={`inline-flex items-center justify-center px-8 py-4 rounded-2xl shadow-lg transition-all duration-300 font-bold ${
                  isCalculating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:shadow-xl hover:scale-105'
                }`}
              >
                {isCalculating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Calculating Gun Milan...
                  </>
                ) : (
                  <>
                    <Star className="w-5 h-5 mr-2" />
                    Calculate Gun Milan
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Information Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 bg-white rounded-2xl shadow-xl border border-pink-100 p-8"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Understanding Gun Milan
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { score: "36/36", label: "Excellent", color: "bg-green-500", description: "Perfect compatibility" },
                { score: "25-35", label: "Very Good", color: "bg-blue-500", description: "High compatibility" },
                { score: "18-24", label: "Good", color: "bg-yellow-500", description: "Moderate compatibility" },
                { score: "Below 18", label: "Needs Work", color: "bg-red-500", description: "Requires remedies" }
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className={`w-16 h-16 ${item.color} rounded-full flex items-center justify-center text-white text-lg font-bold mx-auto mb-3`}>
                    {item.score}
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">{item.label}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
