'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Star } from 'lucide-react';
import Head from 'next/head';
import { Calendar, Clock, MapPin, User, Download, Share2, ChevronDown, AlertTriangle, CheckCircle, Zap, Shield, Globe } from 'lucide-react';
import KundliChart from '../components/KundliChart';

export default function FreeKundliPage() {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: '',
    country: 'India',
    state: ''
  });

  const countries = ['India'];
  const states = [
    'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 
    'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand',
    'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 
    'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'New Delhi', 'Noida', 'Odisha', 
    'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ].sort();

  const [isLoading, setIsLoading] = useState(false);
  const [kundliData, setKundliData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [language, setLanguage] = useState<'english' | 'hindi'>('english');
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowCountryDropdown(false);
        setShowStateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCountrySelect = (country: string) => {
    setFormData(prev => ({
      ...prev,
      country,
      placeOfBirth: prev.state ? `${prev.state}, ${country}` : ''
    }));
    setShowCountryDropdown(false);
  };

  const handleStateSelect = (state: string) => {
    setFormData(prev => ({
      ...prev,
      state,
      placeOfBirth: `${state}, ${prev.country}`
    }));
    setShowStateDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (birthDate > today) {
      setErrorMessage('🌟 Birth date cannot be in the future. Please enter a valid birth date.');
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    if (!formData.name || !formData.dateOfBirth || !formData.timeOfBirth || !formData.placeOfBirth) {
      setErrorMessage('✨ Please fill in all required fields to generate your Kundli');
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/kundli/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate Kundli');
      }

      const result = await response.json();
      
      if (result.success) {
        setKundliData(result.data);
        setTimeout(() => {
          const resultsSection = document.getElementById('kundli-results');
          if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        setErrorMessage('💫 Failed to generate Kundli. Please try again.');
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (error) {
      console.error('Error generating Kundli:', error);
      setErrorMessage('💫 Failed to generate Kundli. Please try again.');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPDF = async (kundliData: any, currentViewMode: 'simple' | 'detailed' = 'simple') => {
    try {
      let watermarkDataUrl = '/logo.png';
      try {
        const res = await fetch('/logo.png');
        const blob = await res.blob();
        watermarkDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.warn('Watermark logo fetch failed, falling back to URL', e);
      }

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Sobhagya Free Kundli - ${kundliData?.personalInfo?.name}</title>
              <style>
                @page { margin: 18mm 15mm; }
                html, body {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                body {
                  font-family: Arial, sans-serif;
                  margin: 20px;
                  position: relative;
                  min-height: 100vh;
                }
                /* Tiled diagonal text watermark — repeats on every printed page */
                .watermark-text {
                  position: fixed;
                  top: 0;
                  left: 0;
                  width: 100vw;
                  height: 100vh;
                  pointer-events: none;
                  z-index: 0;
                  opacity: 0.08;
                  /* Repeating diagonal "SOBHAGYA" text via SVG data URI so it
                     reliably renders in the browser's print preview. */
                  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='380' height='220'><text x='20' y='130' font-family='Arial, sans-serif' font-size='48' font-weight='900' fill='%23f97316' transform='rotate(-28 190 110)'>SOBHAGYA</text></svg>");
                  background-repeat: repeat;
                }
                .watermark {
                  position: fixed;
                  top: 0;
                  left: 0;
                  width: 100vw;
                  height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  pointer-events: none;
                  z-index: 0;
                  opacity: 0.12;
                }
                .watermark img {
                  width: 55%;
                  max-width: 420px;
                  height: auto;
                  object-fit: contain;
                }
                body > *:not(.watermark):not(.watermark-text) { position: relative; z-index: 1; }
                @media print {
                  .watermark-text, .watermark {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .watermark-text { opacity: 0.08 !important; }
                  .watermark { opacity: 0.12 !important; display: flex !important; }
                }
                .header { text-align: center; margin-bottom: 30px; }
                .personal-info { margin-bottom: 30px; }
                .chart-container { margin-bottom: 30px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; background: transparent; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; background: transparent; }
                th { background-color: rgba(242, 242, 242, 0.6); }
                .house-meanings { margin-top: 30px; }
                .twelfth-house { margin-top: 30px; background-color: #fff3cd; padding: 15px; border-radius: 5px; }
                .twelfth-house h3 { color: #856404; margin-top: 0; }
                .twelfth-house table { background-color: white; }
                .footer {
                  position: relative;
                  margin-top: 50px;
                  text-align: center;
                  background-color: white;
                  padding: 15px;
                  border-top: 2px solid #f3f4f6;
                  font-size: 12px;
                  color: #6b7280;
                }
                .footer p {
                  margin: 5px 0;
                }
                .footer strong {
                  color: #f97316;
                }
                @media print {
                  .footer {
                    position: relative;
                    margin-top: 50px;
                  }
                }
              </style>
            </head>
            <body>
              <!-- Repeating diagonal "SOBHAGYA" text watermark tiled across every page -->
              <div class="watermark-text" aria-hidden="true"></div>
              <!-- Sobhagya Logo Background Watermark (inlined as data URL for reliable print) -->
              <div class="watermark" aria-hidden="true">
                <img src="${watermarkDataUrl}" alt="Sobhagya" />
              </div>
              
              <div class="header">
                <h1>Sobhagya Free Kundli - ${kundliData?.personalInfo?.name}</h1>
                <p>${kundliData?.personalInfo?.dateOfBirth} at ${kundliData?.personalInfo?.timeOfBirth}</p>
                <p>${kundliData?.personalInfo?.placeOfBirth}</p>
                <p style="color: #f97316; font-weight: bold; margin-top: 10px;">
                  ${currentViewMode === 'detailed' ? 'Detailed Report (Includes Vimshottari Dasha, Antardasha Details & Yogini Dasha)' : 'Simple Report (Basic Analysis)'}
                </p>
              </div>
              
              <div class="personal-info">
                <h2>Personal Information</h2>
                <table>
                  <tr><th>Name</th><td>${kundliData?.personalInfo?.name}</td></tr>
                  <tr><th>Birth Date</th><td>${kundliData?.personalInfo?.dateOfBirth}</td></tr>
                  <tr><th>Birth Time</th><td>${kundliData?.personalInfo?.timeOfBirth}</td></tr>
                  <tr><th>Birth Place</th><td>${kundliData?.personalInfo?.placeOfBirth}</td></tr>
                </table>
              </div>
              
              <div class="chart-container">
                <h2>Planetary Positions</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Planet</th>
                      <th>Sign</th>
                      <th>Degree</th>
                      <th>House</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${kundliData?.planetaryPositions?.map((planet: any) => `
                      <tr>
                        <td>${planet.planet}</td>
                        <td>${planet.sign}</td>
                        <td>${planet.degree}</td>
                        <td>${planet.house}</td>
                        <td>${planet.isRetrograde ? 'R ' : ''}${planet.isCombust ? 'C ' : ''}${planet.status}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              
              ${kundliData?.vimshottariDasha && currentViewMode === 'detailed' ? `
              <div class="dasha-analysis" style="margin-top: 30px; background-color: #f0f9ff; padding: 15px; border-radius: 5px;">
                <h3 style="color: #1e40af; margin-top: 0;">Vimshottari Dasha</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                  <thead>
                    <tr style="background-color: #dbeafe;">
                      <th style="border: 1px solid #93c5fd; padding: 8px; text-align: left;">Planet</th>
                      <th style="border: 1px solid #93c5fd; padding: 8px; text-align: left;">Start Date</th>
                      <th style="border: 1px solid #93c5fd; padding: 8px; text-align: left;">End Date</th>
                      <th style="border: 1px solid #93c5fd; padding: 8px; text-align: left;">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${kundliData.vimshottariDasha.map((dasha: any) => `
                      <tr>
                        <td style="border: 1px solid #93c5fd; padding: 8px; font-weight: bold;">${dasha.planet}</td>
                        <td style="border: 1px solid #93c5fd; padding: 8px;">${dasha.startDate}</td>
                        <td style="border: 1px solid #93c5fd; padding: 8px;">${dasha.endDate}</td>
                        <td style="border: 1px solid #93c5fd; padding: 8px;">${dasha.duration} years</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                
                ${kundliData.vimshottariDasha.some((dasha: any) => dasha.antardashas && dasha.antardashas.length > 0) ? `
                <h4 style="color: #1e40af; margin: 20px 0 15px 0;">Antardasha Details</h4>
                ${kundliData.vimshottariDasha.map((dasha: any) => 
                  dasha.antardashas && dasha.antardashas.length > 0 ? `
                    <div style="margin-bottom: 20px;">
                      <h5 style="color: #1e40af; margin: 10px 0; font-size: 14px;">${dasha.planet} Mahadasha</h5>
                      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <thead>
                          <tr style="background-color: #e0e7ff;">
                            <th style="border: 1px solid #a5b4fc; padding: 6px; text-align: left; font-size: 12px;">Antardasha Planet</th>
                            <th style="border: 1px solid #a5b4fc; padding: 6px; text-align: left; font-size: 12px;">Start Date</th>
                            <th style="border: 1px solid #a5b4fc; padding: 6px; text-align: left; font-size: 12px;">End Date</th>
                            <th style="border: 1px solid #a5b4fc; padding: 6px; text-align: left; font-size: 12px;">Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${dasha.antardashas.map((antardasha: any) => `
                            <tr>
                              <td style="border: 1px solid #a5b4fc; padding: 6px; font-weight: bold; font-size: 12px;">${antardasha.planet}</td>
                              <td style="border: 1px solid #a5b4fc; padding: 6px; font-size: 12px;">${antardasha.startDate}</td>
                              <td style="border: 1px solid #a5b4fc; padding: 6px; font-size: 12px;">${antardasha.endDate}</td>
                              <td style="border: 1px solid #a5b4fc; padding: 6px; font-size: 12px;">${antardasha.years.toFixed(2)} years</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    </div>
                  ` : ''
                ).join('')}
                ` : ''}
              </div>
              ` : ''}
              
              ${kundliData?.yoginiDasha && currentViewMode === 'detailed' ? `
              <div class="yogini-dasha" style="margin-top: 30px; background-color: #f0fdf4; padding: 15px; border-radius: 5px;">
                <h3 style="color: #16a34a; margin-top: 0;">Yogini Dasha</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                  <thead>
                    <tr style="background-color: #dcfce7;">
                      <th style="border: 1px solid #86efac; padding: 8px; text-align: left;">Yogini</th>
                      <th style="border: 1px solid #86efac; padding: 8px; text-align: left;">Start Date</th>
                      <th style="border: 1px solid #86efac; padding: 8px; text-align: left;">End Date</th>
                      <th style="border: 1px solid #86efac; padding: 8px; text-align: left;">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${kundliData.yoginiDasha.map((yogini: any) => `
                      <tr>
                        <td style="border: 1px solid #86efac; padding: 8px; font-weight: bold;">${yogini.yogini}</td>
                        <td style="border: 1px solid #86efac; padding: 8px;">${yogini.startDate}</td>
                        <td style="border: 1px solid #86efac; padding: 8px;">${yogini.endDate}</td>
                        <td style="border: 1px solid #86efac; padding: 8px;">${yogini.years} years</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              ` : ''}
              
              ${kundliData?.sadesati ? `
              <div class="sadesati-analysis" style="margin-top: 30px; background-color: #fff7ed; padding: 15px; border-radius: 5px;">
                <h3 style="color: #ea580c; margin-top: 0;">Sadesati Analysis</h3>
                <p style="margin: 0 0 15px 0;"><strong>Status:</strong> ${kundliData.sadesati.description}</p>
                
                ${kundliData.sadesati.isActive && kundliData.sadesati.phases ? `
                  <h4 style="color: #ea580c; margin: 15px 0 10px 0;">Sadesati Phases:</h4>
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 10px;">
                    ${kundliData.sadesati.phases.map((phase: any) => `
                      <div style="background-color: white; padding: 10px; border-radius: 5px; border: 1px solid #fed7aa;">
                        <h5 style="color: #ea580c; margin: 0 0 5px 0; font-size: 14px;">${phase.name}</h5>
                        <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">${phase.duration}</p>
                        <p style="margin: 0; font-size: 12px;">${phase.description}</p>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
                
                ${kundliData.sadesati.remedies && kundliData.sadesati.remedies.length > 0 ? `
                  <h4 style="color: #ea580c; margin: 15px 0 10px 0;">Remedies:</h4>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    ${kundliData.sadesati.remedies.map((remedy: string) => `<li style="font-size: 14px;">${remedy}</li>`).join('')}
                  </ul>
                ` : ''}
                
                ${!kundliData.sadesati.isActive && kundliData.sadesati.nextSadesati ? `
                  <div style="background-color: #dbeafe; padding: 10px; border-radius: 5px; border: 1px solid #93c5fd; margin-top: 15px;">
                    <h4 style="color: #1e40af; margin: 0 0 5px 0;">Next Sadesati:</h4>
                    <p style="margin: 0 0 5px 0; font-size: 14px;">${kundliData.sadesati.nextSadesati.description}</p>
                    <p style="margin: 0; font-size: 12px; color: #666;">Start: ${kundliData.sadesati.nextSadesati.startDate}</p>
                  </div>
                ` : ''}
              </div>
              ` : ''}
              
              ${kundliData?.twelfthHouseEnemies ? `
              <div class="twelfth-house">
                <h3>12th House Enemies Analysis</h3>
                <p><strong>${kundliData.twelfthHouseEnemies.description}</strong></p>
                ${kundliData.twelfthHouseEnemies.planets.length > 0 ? `
                  <table>
                    <thead>
                      <tr>
                        <th>Planet</th>
                        <th>Degree</th>
                        <th>Sign</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${kundliData.twelfthHouseEnemies.planets.map((planet: any) => `
                        <tr>
                          <td>${planet.name}</td>
                          <td>${planet.degree}°</td>
                          <td>${planet.sign}</td>
                          <td>${planet.isRetrograde ? 'Retrograde ' : ''}${planet.isCombust ? 'Combust' : ''}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                  <p><strong>Analysis:</strong> ${kundliData.twelfthHouseEnemies.analysis}</p>
                  ${kundliData.twelfthHouseEnemies.remedies.length > 0 ? `
                    <p><strong>Remedies:</strong></p>
                    <ul>
                      ${kundliData.twelfthHouseEnemies.remedies.map((remedy: string) => `<li>${remedy}</li>`).join('')}
                    </ul>
                  ` : ''}
                ` : `
                  <p><strong>Analysis:</strong> ${kundliData.twelfthHouseEnemies.analysis}</p>
                `}
              </div>
              ` : ''}

              ${kundliData?.doshaAnalysis ? `
              <div class="dosha-analysis" style="margin-top: 30px; background-color: #fef2f2; padding: 15px; border-radius: 5px;">
                <h3 style="color: #dc2626; margin-top: 0;">Dosha Analysis</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                  ${kundliData.doshaAnalysis.mangalDosha.hasDosha ? `
                    <div style="background-color: #fecaca; padding: 10px; border-radius: 5px; border: 1px solid #f87171;">
                      <h4 style="color: #dc2626; margin: 0 0 10px 0;">Mangal Dosha</h4>
                      <p style="margin: 0 0 10px 0; font-size: 14px;">${kundliData.doshaAnalysis.mangalDosha.description}</p>
                      ${kundliData.doshaAnalysis.mangalDosha.remedies.length > 0 ? `
                        <p style="font-weight: bold; margin: 5px 0;">Remedies:</p>
                        <ul style="margin: 5px 0; padding-left: 20px;">
                          ${kundliData.doshaAnalysis.mangalDosha.remedies.map((remedy: string) => `<li style="font-size: 14px;">${remedy}</li>`).join('')}
                        </ul>
                      ` : ''}
                    </div>
                  ` : `
                    <div style="background-color: #dcfce7; padding: 10px; border-radius: 5px; border: 1px solid #4ade80;">
                      <h4 style="color: #16a34a; margin: 0 0 10px 0;">Mangal Dosha</h4>
                      <p style="margin: 0; font-size: 14px;">${kundliData.doshaAnalysis.mangalDosha.description}</p>
                    </div>
                  `}

                  ${kundliData.doshaAnalysis.kaalSarpDosha.hasDosha ? `
                    <div style="background-color: #fecaca; padding: 10px; border-radius: 5px; border: 1px solid #f87171;">
                      <h4 style="color: #dc2626; margin: 0 0 10px 0;">Kaal Sarp Dosha</h4>
                      <p style="margin: 0 0 10px 0; font-size: 14px;">${kundliData.doshaAnalysis.kaalSarpDosha.description}</p>
                      ${kundliData.doshaAnalysis.kaalSarpDosha.remedies.length > 0 ? `
                        <p style="font-weight: bold; margin: 5px 0;">Remedies:</p>
                        <ul style="margin: 5px 0; padding-left: 20px;">
                          ${kundliData.doshaAnalysis.kaalSarpDosha.remedies.map((remedy: string) => `<li style="font-size: 14px;">${remedy}</li>`).join('')}
                        </ul>
                      ` : ''}
                    </div>
                  ` : `
                    <div style="background-color: #dcfce7; padding: 10px; border-radius: 5px; border: 1px solid #4ade80;">
                      <h4 style="color: #16a34a; margin: 0 0 10px 0;">Kaal Sarp Dosha</h4>
                      <p style="margin: 0; font-size: 14px;">${kundliData.doshaAnalysis.kaalSarpDosha.description}</p>
                    </div>
                  `}

                  ${kundliData.doshaAnalysis.pitruDosha.hasDosha ? `
                    <div style="background-color: #fecaca; padding: 10px; border-radius: 5px; border: 1px solid #f87171;">
                      <h4 style="color: #dc2626; margin: 0 0 10px 0;">Pitru Dosha</h4>
                      <p style="margin: 0 0 10px 0; font-size: 14px;">${kundliData.doshaAnalysis.pitruDosha.description}</p>
                      ${kundliData.doshaAnalysis.pitruDosha.remedies.length > 0 ? `
                        <p style="font-weight: bold; margin: 5px 0;">Remedies:</p>
                        <ul style="margin: 5px 0; padding-left: 20px;">
                          ${kundliData.doshaAnalysis.pitruDosha.remedies.map((remedy: string) => `<li style="font-size: 14px;">${remedy}</li>`).join('')}
                        </ul>
                      ` : ''}
                    </div>
                  ` : `
                    <div style="background-color: #dcfce7; padding: 10px; border-radius: 5px; border: 1px solid #4ade80;">
                      <h4 style="color: #16a34a; margin: 0 0 10px 0;">Pitru Dosha</h4>
                      <p style="margin: 0; font-size: 14px;">${kundliData.doshaAnalysis.pitruDosha.description}</p>
                    </div>
                  `}

                  ${kundliData.doshaAnalysis.shaniDosha.hasDosha ? `
                    <div style="background-color: #fecaca; padding: 10px; border-radius: 5px; border: 1px solid #f87171;">
                      <h4 style="color: #dc2626; margin: 0 0 10px 0;">Shani Dosha</h4>
                      <p style="margin: 0 0 10px 0; font-size: 14px;">${kundliData.doshaAnalysis.shaniDosha.description}</p>
                      ${kundliData.doshaAnalysis.shaniDosha.remedies.length > 0 ? `
                        <p style="font-weight: bold; margin: 5px 0;">Remedies:</p>
                        <ul style="margin: 5px 0; padding-left: 20px;">
                          ${kundliData.doshaAnalysis.shaniDosha.remedies.map((remedy: string) => `<li style="font-size: 14px;">${remedy}</li>`).join('')}
                        </ul>
                      ` : ''}
                    </div>
                  ` : `
                    <div style="background-color: #dcfce7; padding: 10px; border-radius: 5px; border: 1px solid #4ade80;">
                      <h4 style="color: #16a34a; margin: 0 0 10px 0;">Shani Dosha</h4>
                      <p style="margin: 0; font-size: 14px;">${kundliData.doshaAnalysis.shaniDosha.description}</p>
                    </div>
                  `}
                </div>
              </div>
              ` : ''}

              ${kundliData?.vimshottariDasha && currentViewMode === 'detailed' ? `
              <div class="dasha-analysis" style="margin-top: 30px;">
                <h3>Vimshottari Dasha</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                  <thead>
                    <tr style="background-color: #f3e8ff;">
                      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Planet</th>
                      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Start Date</th>
                      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">End Date</th>
                      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${kundliData.vimshottariDasha.map((dasha: any) => `
                      <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">${dasha.planet}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${dasha.startDate}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${dasha.endDate}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${dasha.duration} years</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              ` : ''}

              ${kundliData?.houseAnalysis ? `
              <div class="house-analysis" style="margin-top: 30px;">
                <h3>House Analysis</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  ${kundliData.houseAnalysis.map((house: any) => `
                    <div style="background-color: #f9fafb; padding: 10px; border-radius: 5px; border: 1px solid #e5e7eb;">
                      <h4 style="margin: 0 0 10px 0; color: #374151;">${house.house}</h4>
                      <p style="margin: 0; font-size: 14px; color: #6b7280;">${house.analysis}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}

              ${kundliData?.personalizedRemedies ? `
              <div class="personalized-remedies" style="margin-top: 30px; background-color: #f0fdf4; padding: 15px; border-radius: 5px; border: 1px solid #bbf7d0;">
                <h3 style="color: #166534; margin-top: 0;">Personalized Remedies</h3>
                <p style="background-color: #dbeafe; padding: 10px; border-radius: 5px; margin: 10px 0; font-weight: bold;">${kundliData.personalizedRemedies.analysis}</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                  ${kundliData.personalizedRemedies.dailyRemedies.length > 0 ? `
                    <div style="background-color: white; padding: 10px; border-radius: 5px; border: 1px solid #bbf7d0;">
                      <h4 style="color: #166534; margin: 0 0 10px 0;">Daily Remedies</h4>
                      <ul style="margin: 0; padding-left: 20px;">
                        ${kundliData.personalizedRemedies.dailyRemedies.map((remedy: string) => `<li style="font-size: 14px; margin: 5px 0;">${remedy}</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}
                  
                  ${kundliData.personalizedRemedies.weeklyRemedies.length > 0 ? `
                    <div style="background-color: white; padding: 10px; border-radius: 5px; border: 1px solid #dbeafe;">
                      <h4 style="color: #1e40af; margin: 0 0 10px 0;">Weekly Remedies</h4>
                      <ul style="margin: 0; padding-left: 20px;">
                        ${kundliData.personalizedRemedies.weeklyRemedies.map((remedy: string) => `<li style="font-size: 14px; margin: 5px 0;">${remedy}</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}
                  
                  ${kundliData.personalizedRemedies.gemstoneRecommendations.length > 0 ? `
                    <div style="background-color: white; padding: 10px; border-radius: 5px; border: 1px solid #fef3c7;">
                      <h4 style="color: #92400e; margin: 0 0 10px 0;">Gemstone Recommendations</h4>
                      <ul style="margin: 0; padding-left: 20px;">
                        ${kundliData.personalizedRemedies.gemstoneRecommendations.map((gemstone: string) => `<li style="font-size: 14px; margin: 5px 0;">${gemstone}</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}
                  
                  ${kundliData.personalizedRemedies.mantras.length > 0 ? `
                    <div style="background-color: white; padding: 10px; border-radius: 5px; border: 1px solid #fecaca;">
                      <h4 style="color: #dc2626; margin: 0 0 10px 0;">Mantras</h4>
                      <ul style="margin: 0; padding-left: 20px;">
                        ${kundliData.personalizedRemedies.mantras.map((mantra: string) => `<li style="font-size: 14px; margin: 5px 0; font-family: monospace;">${mantra}</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}
              
              <div class="house-meanings">
                <h2>House Meanings</h2>
                <table>
                  <tr><td>1st House</td><td>Self, personality, appearance</td></tr>
                  <tr><td>2nd House</td><td>Wealth, family, speech</td></tr>
                  <tr><td>3rd House</td><td>Courage, siblings, communication</td></tr>
                  <tr><td>4th House</td><td>Mother, home, property</td></tr>
                  <tr><td>5th House</td><td>Children, intelligence, creativity</td></tr>
                  <tr><td>6th House</td><td>Enemies, health, obstacles</td></tr>
                  <tr><td>7th House</td><td>Marriage, partnerships</td></tr>
                  <tr><td>8th House</td><td>Longevity, transformation</td></tr>
                  <tr><td>9th House</td><td>Religion, guru, fortune</td></tr>
                  <tr><td>10th House</td><td>Career, profession, status</td></tr>
                  <tr><td>11th House</td><td>Gains, income, friends</td></tr>
                  <tr><td>12th House</td><td>Expenses, losses, spirituality</td></tr>
                </table>
              </div>
              
              <!-- Footer -->
              <div class="footer">
                <p><strong>Downloaded from Sobhagya for FREE</strong></p>
                <p>This is a computer generated analysis</p>
                <p>Consult our astrologers for better understanding</p>
                <p>Visit: <strong>sobhagya.in</strong></p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setErrorMessage('📄 Failed to download PDF. Please try again.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const shareKundli = async (kundliData: any) => {
    try {
      const shareText = `Check out my free Kundli analysis from Sobhagya!\n\nName: ${kundliData?.personalInfo?.name}\nBirth: ${kundliData?.personalInfo?.dateOfBirth} at ${kundliData?.personalInfo?.timeOfBirth}\nPlace: ${kundliData?.personalInfo?.placeOfBirth}\n\nGenerate your free Kundli at: ${window.location.origin}/free-kundli`;

      if (navigator.share) {
        await navigator.share({
          title: 'My Free Kundli Analysis',
          text: shareText,
          url: window.location.origin + '/free-kundli'
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        setErrorMessage('📋 Kundli details copied to clipboard!');
        setTimeout(() => setErrorMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error sharing Kundli:', error);
      setErrorMessage('💫 Failed to share Kundli. Please try again.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  return (
    <>
      <Head>
        <title>Free Kundli Generator - Generate Your Birth Chart Online | Sobhagya</title>
        <meta name="description" content="Generate your free Kundli (birth chart) online instantly. Get detailed planetary positions, house analysis, and Vedic astrology insights. Free Kundli generation with accurate calculations." />
        <meta name="keywords" content="free kundli, kundli generator, birth chart, janam kundli, horoscope, vedic astrology, planetary positions, free horoscope, online kundli, janam patrika, birth chart calculator, free astrology, kundli analysis, janam kundali, free janam kundli, online birth chart, kundli matching, free kundli generation, janam patrika online, birth chart generator, free horoscope generation, kundli calculator, janam kundali online, free birth chart, online janam kundli, kundli software, free kundli software, janam kundli generator, birth chart analysis, free kundli analysis, online horoscope generator, janam patrika generator, free janam patrika, kundli chart, free kundli chart, online kundli chart, janam kundli chart, birth chart online, free birth chart online, kundli generation, free kundli generation, janam kundli generation, birth chart generation, free birth chart generation, online kundli generation, janam patrika generation, free janam patrika generation, kundli calculator online, free kundli calculator, janam kundli calculator, birth chart calculator online, free birth chart calculator, online kundli calculator, janam patrika calculator, free janam patrika calculator, kundli software online, free kundli software online, janam kundli software, birth chart software, free birth chart software, online kundli software, janam patrika software, free janam patrika software, kundli analysis online, free kundli analysis online, janam kundli analysis, birth chart analysis online, free birth chart analysis, online kundli analysis, janam patrika analysis, free janam patrika analysis, kundli chart online, free kundli chart online, janam kundli chart online, birth chart chart online, free birth chart chart online, online kundli chart online, janam patrika chart, free janam patrika chart, online janam patrika chart, kundli matching online, free kundli matching, janam kundli matching, birth chart matching, free birth chart matching, online kundli matching, janam patrika matching, free janam patrika matching, kundli horoscope, free kundli horoscope, janam kundli horoscope, birth chart horoscope, free birth chart horoscope, online kundli horoscope, janam patrika horoscope, free janam patrika horoscope, kundli astrology, free kundli astrology, janam kundli astrology, birth chart astrology, free birth chart astrology, online kundli astrology, janam patrika astrology, free janam patrika astrology, kundli vedic, free kundli vedic, janam kundli vedic, birth chart vedic, free birth chart vedic, online kundli vedic, janam patrika vedic, free janam patrika vedic, kundli planetary positions, free kundli planetary positions, janam kundli planetary positions, birth chart planetary positions, free birth chart planetary positions, online kundli planetary positions, janam patrika planetary positions, free janam patrika planetary positions, kundli house analysis, free kundli house analysis, janam kundli house analysis, birth chart house analysis, free birth chart house analysis, online kundli house analysis, janam patrika house analysis, free janam patrika house analysis, kundli dasha, free kundli dasha, janam kundli dasha, birth chart dasha, free birth chart dasha, online kundli dasha, janam patrika dasha, free janam patrika dasha, kundli nakshatra, free kundli nakshatra, janam kundli nakshatra, birth chart nakshatra, free birth chart nakshatra, online kundli nakshatra, janam patrika nakshatra, free janam patrika nakshatra, kundli rashi, free kundli rashi, janam kundli rashi, birth chart rashi, free birth chart rashi, online kundli rashi, janam patrika rashi, free janam patrika rashi, kundli graha, free kundli graha, janam kundli graha, birth chart graha, free birth chart graha, online kundli graha, janam patrika graha, free janam patrika graha, kundli bhava, free kundli bhava, janam kundli bhava, birth chart bhava, free birth chart bhava, online kundli bhava, janam patrika bhava, free janam patrika bhava, kundli mangal dosh, free kundli mangal dosh, janam kundli mangal dosh, birth chart mangal dosh, free birth chart mangal dosh, online kundli mangal dosh, janam patrika mangal dosh, free janam patrika mangal dosh, kundli kaal sarp dosh, free kundli kaal sarp dosh, janam kundli kaal sarp dosh, birth chart kaal sarp dosh, free birth chart kaal sarp dosh, online kundli kaal sarp dosh, janam patrika kaal sarp dosh, free janam patrika kaal sarp dosh, kundli pitru dosh, free kundli pitru dosh, janam kundli pitru dosh, birth chart pitru dosh, free birth chart pitru dosh, online kundli pitru dosh, janam patrika pitru dosh, free janam patrika pitru dosh, kundli shani dosh, free kundli shani dosh, janam kundli shani dosh, birth chart shani dosh, free birth chart shani dosh, online kundli shani dosh, janam patrika shani dosh, free janam patrika shani dosh, kundli rahu ketu, free kundli rahu ketu, janam kundli rahu ketu, birth chart rahu ketu, free birth chart rahu ketu, online kundli rahu ketu, janam patrika rahu ketu, free janam patrika rahu ketu, kundli guru, free kundli guru, janam kundli guru, birth chart guru, free birth chart guru, online kundli guru, janam patrika guru, free janam patrika guru, kundli shukra, free kundli shukra, janam kundli shukra, birth chart shukra, free birth chart shukra, online kundli shukra, janam patrika shukra, free janam patrika shukra, kundli budh, free kundli budh, janam kundli budh, birth chart budh, free birth chart budh, online kundli budh, janam patrika budh, free janam patrika budh, kundli surya, free kundli surya, janam kundli surya, birth chart surya, free birth chart surya, online kundli surya, janam patrika surya, free janam patrika surya, kundli chandra, free kundli chandra, janam kundli chandra, birth chart chandra, free birth chart chandra, online kundli chandra, janam patrika chandra, free janam patrika chandra, kundli mangal, free kundli mangal, janam kundli mangal, birth chart mangal, free birth chart mangal, online kundli mangal, janam patrika mangal, free janam patrika mangal, kundli shani, free kundli shani, janam kundli shani, birth chart shani, free birth chart shani, online kundli shani, janam patrika shani, free janam patrika shani, kundli rahu, free kundli rahu, janam kundli rahu, birth chart rahu, free birth chart rahu, online kundli rahu, janam patrika rahu, free janam patrika rahu, kundli ketu, free kundli ketu, janam kundli ketu, birth chart ketu, free birth chart ketu, online kundli ketu, janam patrika ketu, free janam patrika ketu, मुफ्त कुंडली, कुंडली जनरेटर, जन्म कुंडली, जन्म पत्रिका, मुफ्त जन्म कुंडली, ऑनलाइन कुंडली, मुफ्त कुंडली जनरेटर, जन्म पत्रिका ऑनलाइन, मुफ्त जन्म पत्रिका, कुंडली कैलकुलेटर, मुफ्त कुंडली कैलकुलेटर, जन्म कुंडली कैलकुलेटर, ऑनलाइन जन्म कुंडली, मुफ्त कुंडली सॉफ्टवेयर, जन्म कुंडली सॉफ्टवेयर, मुफ्त जन्म कुंडली सॉफ्टवेयर, कुंडली एनालिसिस, मुफ्त कुंडली एनालिसिस, जन्म कुंडली एनालिसिस, मुफ्त जन्म कुंडली एनालिसिस, कुंडली चार्ट, मुफ्त कुंडली चार्ट, जन्म कुंडली चार्ट, मुफ्त जन्म कुंडली चार्ट, कुंडली मैचिंग, मुफ्त कुंडली मैचिंग, जन्म कुंडली मैचिंग, मुफ्त जन्म कुंडली मैचिंग, कुंडली होरोस्कोप, मुफ्त कुंडली होरोस्कोप, जन्म कुंडली होरोस्कोप, मुफ्त जन्म कुंडली होरोस्कोप, कुंडली ज्योतिष, मुफ्त कुंडली ज्योतिष, जन्म कुंडली ज्योतिष, मुफ्त जन्म कुंडली ज्योतिष, कुंडली वैदिक, मुफ्त कुंडली वैदिक, जन्म कुंडली वैदिक, मुफ्त जन्म कुंडली वैदिक, कुंडली ग्रह स्थिति, मुफ्त कुंडली ग्रह स्थिति, जन्म कुंडली ग्रह स्थिति, मुफ्त जन्म कुंडली ग्रह स्थिति, कुंडली भाव विश्लेषण, मुफ्त कुंडली भाव विश्लेषण, जन्म कुंडली भाव विश्लेषण, मुफ्त जन्म कुंडली भाव विश्लेषण, कुंडली दशा, मुफ्त कुंडली दशा, जन्म कुंडली दशा, मुफ्त जन्म कुंडली दशा, कुंडली नक्षत्र, मुफ्त कुंडली नक्षत्र, जन्म कुंडली नक्षत्र, मुफ्त जन्म कुंडली नक्षत्र, कुंडली राशि, मुफ्त कुंडली राशि, जन्म कुंडली राशि, मुफ्त जन्म कुंडली राशि, कुंडली ग्रह, मुफ्त कुंडली ग्रह, जन्म कुंडली ग्रह, मुफ्त जन्म कुंडली ग्रह, कुंडली भाव, मुफ्त कुंडली भाव, जन्म कुंडली भाव, मुफ्त जन्म कुंडली भाव, कुंडली मंगल दोष, मुफ्त कुंडली मंगल दोष, जन्म कुंडली मंगल दोष, मुफ्त जन्म कुंडली मंगल दोष, कुंडली काल सर्प दोष, मुफ्त कुंडली काल सर्प दोष, जन्म कुंडली काल सर्प दोष, मुफ्त जन्म कुंडली काल सर्प दोष, कुंडली पितृ दोष, मुफ्त कुंडली पितृ दोष, जन्म कुंडली पितृ दोष, मुफ्त जन्म कुंडली पितृ दोष, कुंडली शनि दोष, मुफ्त कुंडली शनि दोष, जन्म कुंडली शनि दोष, मुफ्त जन्म कुंडली शनि दोष, कुंडली राहु केतु, मुफ्त कुंडली राहु केतु, जन्म कुंडली राहु केतु, मुफ्त जन्म कुंडली राहु केतु, कुंडली गुरु, मुफ्त कुंडली गुरु, जन्म कुंडली गुरु, मुफ्त जन्म कुंडली गुरु, कुंडली शुक्र, मुफ्त कुंडली शुक्र, जन्म कुंडली शुक्र, मुफ्त जन्म कुंडली शुक्र, कुंडली बुध, मुफ्त कुंडली बुध, जन्म कुंडली बुध, मुफ्त जन्म कुंडली बुध, कुंडली सूर्य, मुफ्त कुंडली सूर्य, जन्म कुंडली सूर्य, मुफ्त जन्म कुंडली सूर्य, कुंडली चंद्र, मुफ्त कुंडली चंद्र, जन्म कुंडली चंद्र, मुफ्त जन्म कुंडली चंद्र, कुंडली मंगल, मुफ्त कुंडली मंगल, जन्म कुंडली मंगल, मुफ्त जन्म कुंडली मंगल, कुंडली शनि, मुफ्त कुंडली शनि, जन्म कुंडली शनि, मुफ्त जन्म कुंडली शनि, कुंडली राहु, मुफ्त कुंडली राहु, जन्म कुंडली राहु, मुफ्त जन्म कुंडली राहु, कुंडली केतु, मुफ्त कुंडली केतु, जन्म कुंडली केतु, मुफ्त जन्म कुंडली केतु" />
        <meta property="og:title" content="Free Kundli Generator - Generate Your Birth Chart Online | Sobhagya" />
        <meta property="og:description" content="Generate your free Kundli (birth chart) online instantly. Get detailed planetary positions, house analysis, and Vedic astrology insights." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sobhagya.com/free-kundli" />
        <meta property="og:image" content="https://sobhagya.com/sobhagya-logo.svg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Kundli Generator - Generate Your Birth Chart Online | Sobhagya" />
        <meta name="twitter:description" content="Generate your free Kundli (birth chart) online instantly. Get detailed planetary positions, house analysis, and Vedic astrology insights." />
        <meta name="twitter:image" content="https://sobhagya.com/sobhagya-logo.svg" />
        <link rel="canonical" href="https://sobhagya.com/free-kundli" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Free Kundli Generator",
            "description": "Generate your free Kundli (birth chart) online instantly with accurate Vedic astrology calculations",
            "url": "https://sobhagya.com/free-kundli",
            "applicationCategory": "Astrology",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "INR"
            }
          })}
        </script>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 pb-safe">
      {/* Beautiful Error Notification */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-4 rounded-xl shadow-lg border border-orange-200 max-w-md mx-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5" />
              </div>
              <p className="font-medium">{errorMessage}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Hero Section */}
      <div className="py-10 sm:py-14 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-10 sm:mb-14"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
              Free Kundli Generator
              <span className="block text-orange-600">Online Birth Chart Calculator</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-4xl mx-auto mb-6 sm:mb-8">
              Generate your accurate Kundli (birth chart) online with our free Vedic astrology calculator. 
              Get detailed planetary positions, house analysis, and 12th house enemies analysis instantly. 
              No registration required - completely free!
            </p>
          </motion.div>

          {/* Free Kundli Generator Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl border border-orange-100 p-4 sm:p-6 lg:p-8 mb-12 sm:mb-16"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                Generate Your Free Kundli
              </h2>
              <p className="text-gray-600">
                Enter your birth details to get your accurate birth chart analysis
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    placeholder="🌟 Enter your full name as per birth certificate"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Time of Birth *
                  </label>
                  <input
                    type="time"
                    name="timeOfBirth"
                    value={formData.timeOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                <div className="relative dropdown-container">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Country *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-left flex items-center justify-between"
                  >
                    <span className={formData.country ? 'text-gray-900' : 'text-gray-500'}>
                      {formData.country || 'Select Country'}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showCountryDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                      <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                        <input
                          type="text"
                          placeholder="🌍 Search for your birth country..."
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {countries
                        .filter(country => 
                          country.toLowerCase().includes(countrySearch.toLowerCase())
                        )
                        .map((country) => (
                          <button
                            key={country}
                            type="button"
                            onClick={() => handleCountrySelect(country)}
                            className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors duration-200"
                          >
                            {country}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                <div className="relative dropdown-container">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    State *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowStateDropdown(!showStateDropdown)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-left flex items-center justify-between"
                  >
                    <span className={formData.state ? 'text-gray-900' : 'text-gray-500'}>
                      {formData.state || 'Select State'}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showStateDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showStateDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                      <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                        <input
                          type="text"
                          placeholder="🏛️ Search for your birth state..."
                          value={stateSearch}
                          onChange={(e) => setStateSearch(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {states
                        .filter(state => 
                          state.toLowerCase().includes(stateSearch.toLowerCase())
                        )
                        .map((state) => (
                          <button
                            key={state}
                            type="button"
                            onClick={() => handleStateSelect(state)}
                            className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors duration-200"
                          >
                            {state}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl shadow-lg transition-all duration-300 font-bold ${
                    isLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-xl hover:scale-105'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Generating Free Kundli...
                    </>
                  ) : (
                    <>
                      <Star className="w-5 h-5 mr-2" />
                      Generate Free Kundli
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Results Section */}
      {kundliData && (
        <div id="kundli-results" className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                Your Free Kundli Analysis
                <span className="block text-orange-600">Birth Chart Results</span>
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                Detailed Vedic astrology analysis with planetary positions and house interpretations
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Language Toggle */}
                <div className="flex justify-center mb-6">
                  <div className="bg-gray-100 rounded-lg p-1 flex w-full max-w-xs">
                    <button
                      onClick={() => setLanguage('english')}
                      className={`flex-1 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        language === 'english'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setLanguage('hindi')}
                      className={`flex-1 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        language === 'hindi'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      हिंदी
                    </button>
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex justify-center mb-6">
                  <div className="bg-orange-100 rounded-lg p-1 flex w-full max-w-sm">
                    <button
                      onClick={() => setViewMode('simple')}
                      className={`flex-1 px-3 sm:px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'simple'
                          ? 'bg-white text-orange-600 shadow-sm'
                          : 'text-orange-600 hover:text-orange-700'
                      }`}
                    >
                      {language === 'hindi' ? 'सरल रिपोर्ट' : 'Simple Report'}
                    </button>
                    <button
                      onClick={() => setViewMode('detailed')}
                      className={`flex-1 px-3 sm:px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'detailed'
                          ? 'bg-white text-orange-600 shadow-sm'
                          : 'text-orange-600 hover:text-orange-700'
                      }`}
                    >
                      {language === 'hindi' ? 'विस्तृत रिपोर्ट' : 'Detailed Report'}
                    </button>
                  </div>
                </div>

                {/* Kundli Chart Component */}
                <KundliChart 
                  planetaryPositions={kundliData?.planetaryPositions || []}
                  personalInfo={kundliData?.personalInfo}
                  language={language}
                />

                {/* House Analysis */}
                {kundliData?.houseAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="bg-white rounded-2xl shadow-xl border border-blue-100 p-4 sm:p-6 mt-8"
                  >
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Shield className="w-6 h-6 text-blue-600" />
                      {language === 'hindi' ? 'भाव विश्लेषण' : 'House Analysis'}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {kundliData.houseAnalysis.map((house: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">{house.house}</h4>
                          <p className="text-sm text-gray-600">{house.analysis}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Vimshottari Dasha - Detailed View Only */}
                {kundliData?.vimshottariDasha && viewMode === 'detailed' && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="bg-white rounded-2xl shadow-xl border border-purple-100 p-4 sm:p-6 mt-8"
                  >
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Zap className="w-6 h-6 text-purple-600" />
                      {language === 'hindi' ? 'विम्शोत्तरी दशा' : 'Vimshottari Dasha'}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-200">
                        <thead>
                          <tr className="bg-purple-50">
                            <th className="border border-gray-200 px-4 py-2 text-left font-semibold">
                              {language === 'hindi' ? 'ग्रह' : 'Planet'}
                            </th>
                            <th className="border border-gray-200 px-4 py-2 text-left font-semibold">
                              {language === 'hindi' ? 'शुरू तिथि' : 'Start Date'}
                            </th>
                            <th className="border border-gray-200 px-4 py-2 text-left font-semibold">
                              {language === 'hindi' ? 'समाप्ति तिथि' : 'End Date'}
                            </th>
                            <th className="border border-gray-200 px-4 py-2 text-left font-semibold">
                              {language === 'hindi' ? 'अवधि' : 'Duration'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {kundliData.vimshottariDasha.map((dasha: any, index: number) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="border border-gray-200 px-4 py-2 font-medium">{dasha.planet}</td>
                              <td className="border border-gray-200 px-4 py-2">{dasha.startDate}</td>
                              <td className="border border-gray-200 px-4 py-2">{dasha.endDate}</td>
                              <td className="border border-gray-200 px-4 py-2">{dasha.duration} {language === 'hindi' ? 'वर्ष' : 'years'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {/* Antardasha Details - Detailed View Only */}
                {kundliData?.vimshottariDasha && kundliData.vimshottariDasha.some((dasha: any) => dasha.antardashas && dasha.antardashas.length > 0) && viewMode === 'detailed' && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.9 }}
                    className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-4 sm:p-6 mt-8"
                  >
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Star className="w-6 h-6 text-indigo-600" />
                      {language === 'hindi' ? 'अंतर्दशा विवरण' : 'Antardasha Details'}
                    </h3>
                    <div className="space-y-6">
                      {kundliData.vimshottariDasha.map((dasha: any, dashaIndex: number) => (
                        dasha.antardashas && dasha.antardashas.length > 0 && (
                          <div key={dashaIndex} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-lg text-gray-900 mb-3">
                              {language === 'hindi' ? `${dasha.planet} महादशा` : `${dasha.planet} Mahadasha`}
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse border border-gray-200">
                                <thead>
                                  <tr className="bg-indigo-50">
                                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-sm">
                                      {language === 'hindi' ? 'अंतर्दशा ग्रह' : 'Antardasha Planet'}
                                    </th>
                                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-sm">
                                      {language === 'hindi' ? 'शुरू तिथि' : 'Start Date'}
                                    </th>
                                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-sm">
                                      {language === 'hindi' ? 'समाप्ति तिथि' : 'End Date'}
                                    </th>
                                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-sm">
                                      {language === 'hindi' ? 'अवधि' : 'Duration'}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {dasha.antardashas.map((antardasha: any, antardashaIndex: number) => (
                                    <tr key={antardashaIndex} className={antardashaIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="border border-gray-200 px-3 py-2 font-medium text-sm">{antardasha.planet}</td>
                                      <td className="border border-gray-200 px-3 py-2 text-sm">{antardasha.startDate}</td>
                                      <td className="border border-gray-200 px-3 py-2 text-sm">{antardasha.endDate}</td>
                                      <td className="border border-gray-200 px-3 py-2 text-sm">{antardasha.years.toFixed(2)} {language === 'hindi' ? 'वर्ष' : 'years'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Yogini Dasha - Detailed View Only */}
                {kundliData?.yoginiDasha && viewMode === 'detailed' && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.0 }}
                    className="bg-white rounded-2xl shadow-xl border border-green-100 p-4 sm:p-6 mt-8"
                  >
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Star className="w-6 h-6 text-green-600" />
                      {language === 'hindi' ? 'योगिनी दशा' : 'Yogini Dasha'}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-200">
                        <thead>
                          <tr className="bg-green-50">
                            <th className="border border-gray-200 px-4 py-2 text-left font-semibold">
                              {language === 'hindi' ? 'योगिनी' : 'Yogini'}
                            </th>
                            <th className="border border-gray-200 px-4 py-2 text-left font-semibold">
                              {language === 'hindi' ? 'शुरू तिथि' : 'Start Date'}
                            </th>
                            <th className="border border-gray-200 px-4 py-2 text-left font-semibold">
                              {language === 'hindi' ? 'समाप्ति तिथि' : 'End Date'}
                            </th>
                            <th className="border border-gray-200 px-4 py-2 text-left font-semibold">
                              {language === 'hindi' ? 'अवधि' : 'Duration'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {kundliData.yoginiDasha.map((yogini: any, index: number) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="border border-gray-200 px-4 py-2 font-medium">{yogini.yogini}</td>
                              <td className="border border-gray-200 px-4 py-2">{yogini.startDate}</td>
                              <td className="border border-gray-200 px-4 py-2">{yogini.endDate}</td>
                              <td className="border border-gray-200 px-4 py-2">{yogini.years} {language === 'hindi' ? 'वर्ष' : 'years'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {/* Sadesati Analysis */}
                {kundliData?.sadesati && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.1 }}
                    className="bg-white rounded-2xl shadow-xl border border-orange-100 p-4 sm:p-6 mt-8"
                  >
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <AlertTriangle className="w-6 h-6 text-orange-600" />
                      {language === 'hindi' ? 'साढ़ेसाती विश्लेषण' : 'Sadesati Analysis'}
                    </h3>
                    <div className="space-y-4">
                      <div className={`p-4 rounded-lg ${kundliData.sadesati.isActive ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {language === 'hindi' ? 'साढ़ेसाती स्थिति' : 'Sadesati Status'}
                        </h4>
                        <p className="text-sm text-gray-700 mb-3">{kundliData.sadesati.description}</p>
                        
                        {kundliData.sadesati.isActive && kundliData.sadesati.phases && (
                          <div className="mt-4">
                            <h5 className="font-medium text-gray-900 mb-2">{language === 'hindi' ? 'साढ़ेसाती चरण:' : 'Sadesati Phases:'}</h5>
                            <div className="grid md:grid-cols-3 gap-3">
                              {kundliData.sadesati.phases.map((phase: any, index: number) => (
                                <div key={index} className="bg-white p-3 rounded border border-orange-200">
                                  <h6 className="font-medium text-sm text-gray-900">{phase.name}</h6>
                                  <p className="text-xs text-gray-600">{phase.duration}</p>
                                  <p className="text-xs text-gray-700 mt-1">{phase.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {kundliData.sadesati.remedies && kundliData.sadesati.remedies.length > 0 && (
                          <div className="mt-4">
                            <h5 className="font-medium text-gray-900 mb-2">{language === 'hindi' ? 'उपाय:' : 'Remedies:'}</h5>
                            <ul className="space-y-1">
                              {kundliData.sadesati.remedies.map((remedy: string, index: number) => (
                                <li key={index} className="flex items-start gap-2">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-sm text-gray-700">{remedy}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {!kundliData.sadesati.isActive && kundliData.sadesati.nextSadesati && (
                          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                            <h5 className="font-medium text-sm text-gray-900 mb-1">{language === 'hindi' ? 'अगली साढ़ेसाती:' : 'Next Sadesati:'}</h5>
                            <p className="text-sm text-gray-700">{kundliData.sadesati.nextSadesati.description}</p>
                            <p className="text-xs text-gray-600 mt-1">Start: {kundliData.sadesati.nextSadesati.startDate}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Dosha Analysis */}
                {kundliData?.doshaAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    className="bg-white rounded-2xl shadow-xl border border-red-100 p-4 sm:p-6 mt-8"
                  >
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                      {language === 'hindi' ? 'दोष विश्लेषण' : 'Dosha Analysis'}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Mangal Dosha */}
                      <div className={`rounded-lg p-4 ${kundliData.doshaAnalysis.mangalDosha.hasDosha ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {language === 'hindi' ? 'मंगल दोष' : 'Mangal Dosha'}
                        </h4>
                        <p className="text-sm text-gray-700 mb-3">{kundliData.doshaAnalysis.mangalDosha.description}</p>
                        {kundliData.doshaAnalysis.mangalDosha.hasDosha && kundliData.doshaAnalysis.mangalDosha.remedies.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">{language === 'hindi' ? 'उपाय:' : 'Remedies:'}</h5>
                            <ul className="space-y-1">
                              {kundliData.doshaAnalysis.mangalDosha.remedies.map((remedy: string, index: number) => (
                                <li key={index} className="flex items-start gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-sm text-gray-700">{remedy}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Kaal Sarp Dosha */}
                      <div className={`rounded-lg p-4 ${kundliData.doshaAnalysis.kaalSarpDosha.hasDosha ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {language === 'hindi' ? 'काल सर्प दोष' : 'Kaal Sarp Dosha'}
                        </h4>
                        <p className="text-sm text-gray-700 mb-3">{kundliData.doshaAnalysis.kaalSarpDosha.description}</p>
                        {kundliData.doshaAnalysis.kaalSarpDosha.hasDosha && kundliData.doshaAnalysis.kaalSarpDosha.remedies.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">{language === 'hindi' ? 'उपाय:' : 'Remedies:'}</h5>
                            <ul className="space-y-1">
                              {kundliData.doshaAnalysis.kaalSarpDosha.remedies.map((remedy: string, index: number) => (
                                <li key={index} className="flex items-start gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-sm text-gray-700">{remedy}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Pitru Dosha */}
                      <div className={`rounded-lg p-4 ${kundliData.doshaAnalysis.pitruDosha.hasDosha ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {language === 'hindi' ? 'पितृ दोष' : 'Pitru Dosha'}
                        </h4>
                        <p className="text-sm text-gray-700 mb-3">{kundliData.doshaAnalysis.pitruDosha.description}</p>
                        {kundliData.doshaAnalysis.pitruDosha.hasDosha && kundliData.doshaAnalysis.pitruDosha.remedies.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">{language === 'hindi' ? 'उपाय:' : 'Remedies:'}</h5>
                            <ul className="space-y-1">
                              {kundliData.doshaAnalysis.pitruDosha.remedies.map((remedy: string, index: number) => (
                                <li key={index} className="flex items-start gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-sm text-gray-700">{remedy}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Shani Dosha */}
                      <div className={`rounded-lg p-4 ${kundliData.doshaAnalysis.shaniDosha.hasDosha ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {language === 'hindi' ? 'शनि दोष' : 'Shani Dosha'}
                        </h4>
                        <p className="text-sm text-gray-700 mb-3">{kundliData.doshaAnalysis.shaniDosha.description}</p>
                        {kundliData.doshaAnalysis.shaniDosha.hasDosha && kundliData.doshaAnalysis.shaniDosha.remedies.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">{language === 'hindi' ? 'उपाय:' : 'Remedies:'}</h5>
                            <ul className="space-y-1">
                              {kundliData.doshaAnalysis.shaniDosha.remedies.map((remedy: string, index: number) => (
                                <li key={index} className="flex items-start gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-sm text-gray-700">{remedy}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Personalized Remedies */}
                {kundliData?.personalizedRemedies && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    className="bg-white rounded-2xl shadow-xl border border-green-100 p-4 sm:p-6 mt-8"
                  >
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      {language === 'hindi' ? 'व्यक्तिगत उपाय' : 'Personalized Remedies'}
                    </h3>
                    
                    {/* Analysis Summary */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                      <p className="text-gray-700 font-medium">{kundliData.personalizedRemedies.analysis}</p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* Daily Remedies */}
                      {kundliData.personalizedRemedies.dailyRemedies.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            {language === 'hindi' ? 'दैनिक उपाय' : 'Daily Remedies'}
                          </h4>
                          <ul className="space-y-3 text-gray-600">
                            {kundliData.personalizedRemedies.dailyRemedies.map((remedy: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span>{remedy}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Weekly Remedies */}
                      {kundliData.personalizedRemedies.weeklyRemedies.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            {language === 'hindi' ? 'साप्ताहिक उपाय' : 'Weekly Remedies'}
                          </h4>
                          <ul className="space-y-3 text-gray-600">
                            {kundliData.personalizedRemedies.weeklyRemedies.map((remedy: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span>{remedy}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Monthly Remedies */}
                      {kundliData.personalizedRemedies.monthlyRemedies.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            {language === 'hindi' ? 'मासिक उपाय' : 'Monthly Remedies'}
                          </h4>
                          <ul className="space-y-3 text-gray-600">
                            {kundliData.personalizedRemedies.monthlyRemedies.map((remedy: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span>{remedy}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Gemstone Recommendations */}
                      {kundliData.personalizedRemedies.gemstoneRecommendations.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            {language === 'hindi' ? 'रत्न सुझाव' : 'Gemstone Recommendations'}
                          </h4>
                          <ul className="space-y-3 text-gray-600">
                            {kundliData.personalizedRemedies.gemstoneRecommendations.map((gemstone: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span>{gemstone}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Deity Worship */}
                      {kundliData.personalizedRemedies.deityWorship.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            {language === 'hindi' ? 'देवता पूजा' : 'Deity Worship'}
                          </h4>
                          <ul className="space-y-3 text-gray-600">
                            {kundliData.personalizedRemedies.deityWorship.map((deity: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span>{deity}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Mantras */}
                      {kundliData.personalizedRemedies.mantras.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            {language === 'hindi' ? 'मंत्र' : 'Mantras'}
                          </h4>
                          <ul className="space-y-3 text-gray-600">
                            {kundliData.personalizedRemedies.mantras.map((mantra: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="font-mono text-sm">{mantra}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Lifestyle Recommendations */}
                      {kundliData.personalizedRemedies.lifestyleRecommendations.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                            {language === 'hindi' ? 'जीवनशैली सुझाव' : 'Lifestyle Recommendations'}
                          </h4>
                          <ul className="space-y-3 text-gray-600">
                            {kundliData.personalizedRemedies.lifestyleRecommendations.map((lifestyle: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span>{lifestyle}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="space-y-6"
              >
                {/* Personal Information */}
                <div className="bg-white rounded-2xl shadow-xl border border-orange-100 p-4 sm:p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-0.5">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-semibold break-anywhere xs:text-right">{kundliData?.personalInfo?.name}</span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-0.5">
                      <span className="text-gray-600">Birth Date:</span>
                      <span className="font-semibold break-anywhere xs:text-right">{kundliData?.personalInfo?.dateOfBirth}</span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-0.5">
                      <span className="text-gray-600">Birth Time:</span>
                      <span className="font-semibold break-anywhere xs:text-right">{kundliData?.personalInfo?.timeOfBirth}</span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-0.5">
                      <span className="text-gray-600">Birth Place:</span>
                      <span className="font-semibold break-anywhere xs:text-right">{kundliData?.personalInfo?.placeOfBirth}</span>
                    </div>
                  </div>
                </div>

                {/* 12th House Enemies Analysis */}
                {kundliData?.twelfthHouseEnemies && (
                  <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      {kundliData.twelfthHouseEnemies.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{kundliData.twelfthHouseEnemies.description}</p>
                    
                    {kundliData.twelfthHouseEnemies.planets.length > 0 ? (
                      <div className="space-y-4">
                        <div className="bg-red-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">
                            {language === 'hindi' ? '12वें भाव के ग्रह:' : 'Planets in 12th House:'}
                          </h4>
                          <div className="space-y-2">
                            {kundliData.twelfthHouseEnemies.planets.map((planet: any, index: number) => (
                              <div key={index} className="flex justify-between items-center bg-white rounded p-2">
                                <span className="font-medium">{planet.name}</span>
                                <span className="text-sm text-gray-600">
                                  {planet.degree}° {planet.sign}
                                  {planet.isRetrograde && <span className="text-red-600 font-bold ml-1">(R)</span>}
                                  {planet.isCombust && <span className="text-yellow-600 font-bold ml-1">(C)</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-yellow-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">
                            {language === 'hindi' ? 'विश्लेषण:' : 'Analysis:'}
                          </h4>
                          <p className="text-gray-700">{kundliData.twelfthHouseEnemies.analysis}</p>
                        </div>
                        
                        {kundliData.twelfthHouseEnemies.remedies.length > 0 && (
                          <div className="bg-green-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">
                              {language === 'hindi' ? 'उपाय:' : 'Remedies:'}
                            </h4>
                            <ul className="space-y-1">
                              {kundliData.twelfthHouseEnemies.remedies.map((remedy: string, index: number) => (
                                <li key={index} className="flex items-start gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-gray-700">{remedy}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-green-800 font-medium">{kundliData.twelfthHouseEnemies.analysis}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="bg-white rounded-2xl shadow-xl border border-orange-100 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Actions</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={() => downloadPDF(kundliData, viewMode)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-colors duration-200"
                    >
                      <Download className="w-4 h-4" />
                      Download {viewMode === 'detailed' ? 'Detailed' : 'Simple'} PDF
                    </button>
                    <button 
                      onClick={() => shareKundli(kundliData)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-orange-200 text-orange-600 font-semibold rounded-xl hover:bg-orange-50 transition-colors duration-200"
                    >
                      <Share2 className="w-4 h-4" />
                      Share Kundli
                    </button>
                    <Link
                      href="/call-with-astrologer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-colors duration-200"
                    >
                      <Star className="w-4 h-4" />
                      Consult Our Astrologer
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Consult Astrologer Section */}
      <div className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-orange-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Need Professional Guidance?
              <span className="block text-orange-600">Consult Our Expert Astrologers</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto mb-6 sm:mb-8">
              Get personalized insights, detailed analysis, and expert guidance from our certified Vedic astrologers. 
              They can provide deeper interpretations and remedies for your specific situation.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/call-with-astrologer"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl shadow-lg transition-all duration-300 font-bold bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-xl hover:scale-105"
              >
                <Star className="w-5 h-5 mr-2" />
                Consult Our Astrologer
              </Link>
              <Link
                href="/services"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl border-2 border-orange-200 text-orange-600 font-bold hover:bg-orange-50 transition-all duration-300"
              >
                View All Services
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Hidden SEO Keywords */}
      <div className="hidden">
        <p>Free Kundli Generator, Online Birth Chart Calculator, Janam Kundli, Janam Patrika, Free Horoscope, Vedic Astrology, Planetary Positions, House Analysis, Free Astrology, Kundli Analysis, Janam Kundali, Free Janam Kundli, Online Birth Chart, Kundli Matching, Free Kundli Generation, Janam Patrika Online, Birth Chart Generator, Free Horoscope Generation, Kundli Calculator, Janam Kundali Online, Free Birth Chart, Online Janam Kundli, Kundli Software, Free Kundli Software, Janam Kundli Generator, Birth Chart Analysis, Free Kundli Analysis, Online Horoscope Generator, Janam Patrika Generator, Free Janam Patrika, Kundli Chart, Free Kundli Chart, Online Kundli Chart, Janam Kundli Chart, Birth Chart Online, Free Birth Chart Online, Kundli Generation, Free Kundli Generation, Janam Kundli Generation, Birth Chart Generation, Free Birth Chart Generation, Online Kundli Generation, Janam Patrika Generation, Free Janam Patrika Generation, Kundli Calculator Online, Free Kundli Calculator, Janam Kundli Calculator, Birth Chart Calculator Online, Free Birth Chart Calculator, Online Kundli Calculator, Janam Patrika Calculator, Free Janam Patrika Calculator, Kundli Software Online, Free Kundli Software Online, Janam Kundli Software, Birth Chart Software, Free Birth Chart Software, Online Kundli Software, Janam Patrika Software, Free Janam Patrika Software, Kundli Analysis Online, Free Kundli Analysis Online, Janam Kundli Analysis, Birth Chart Analysis Online, Free Birth Chart Analysis, Online Kundli Analysis, Janam Patrika Analysis, Free Janam Patrika Analysis, Kundli Chart Online, Free Kundli Chart Online, Janam Kundli Chart Online, Birth Chart Chart Online, Free Birth Chart Chart Online, Online Kundli Chart Online, Janam Patrika Chart, Free Janam Patrika Chart, Online Janam Patrika Chart, Kundli Matching Online, Free Kundli Matching, Janam Kundli Matching, Birth Chart Matching, Free Birth Chart Matching, Online Kundli Matching, Janam Patrika Matching, Free Janam Patrika Matching, Kundli Horoscope, Free Kundli Horoscope, Janam Kundli Horoscope, Birth Chart Horoscope, Free Birth Chart Horoscope, Online Kundli Horoscope, Janam Patrika Horoscope, Free Janam Patrika Horoscope, Kundli Astrology, Free Kundli Astrology, Janam Kundli Astrology, Birth Chart Astrology, Free Birth Chart Astrology, Online Kundli Astrology, Janam Patrika Astrology, Free Janam Patrika Astrology, Kundli Vedic, Free Kundli Vedic, Janam Kundli Vedic, Birth Chart Vedic, Free Birth Chart Vedic, Online Kundli Vedic, Janam Patrika Vedic, Free Janam Patrika Vedic, Kundli Planetary Positions, Free Kundli Planetary Positions, Janam Kundli Planetary Positions, Birth Chart Planetary Positions, Free Birth Chart Planetary Positions, Online Kundli Planetary Positions, Janam Patrika Planetary Positions, Free Janam Patrika Planetary Positions, Kundli House Analysis, Free Kundli House Analysis, Janam Kundli House Analysis, Birth Chart House Analysis, Free Birth Chart House Analysis, Online Kundli House Analysis, Janam Patrika House Analysis, Free Janam Patrika House Analysis, Kundli Dasha, Free Kundli Dasha, Janam Kundli Dasha, Birth Chart Dasha, Free Birth Chart Dasha, Online Kundli Dasha, Janam Patrika Dasha, Free Janam Patrika Dasha, Kundli Nakshatra, Free Kundli Nakshatra, Janam Kundli Nakshatra, Birth Chart Nakshatra, Free Birth Chart Nakshatra, Online Kundli Nakshatra, Janam Patrika Nakshatra, Free Janam Patrika Nakshatra, Kundli Rashi, Free Kundli Rashi, Janam Kundli Rashi, Birth Chart Rashi, Free Birth Chart Rashi, Online Kundli Rashi, Janam Patrika Rashi, Free Janam Patrika Rashi, Kundli Graha, Free Kundli Graha, Janam Kundli Graha, Birth Chart Graha, Free Birth Chart Graha, Online Kundli Graha, Janam Patrika Graha, Free Janam Patrika Graha, Kundli Bhava, Free Kundli Bhava, Janam Kundli Bhava, Birth Chart Bhava, Free Birth Chart Bhava, Online Kundli Bhava, Janam Patrika Bhava, Free Janam Patrika Bhava, Kundli Mangal Dosh, Free Kundli Mangal Dosh, Janam Kundli Mangal Dosh, Birth Chart Mangal Dosh, Free Birth Chart Mangal Dosh, Online Kundli Mangal Dosh, Janam Patrika Mangal Dosh, Free Janam Patrika Mangal Dosh, Kundli Kaal Sarp Dosh, Free Kundli Kaal Sarp Dosh, Janam Kundli Kaal Sarp Dosh, Birth Chart Kaal Sarp Dosh, Free Birth Chart Kaal Sarp Dosh, Online Kundli Kaal Sarp Dosh, Janam Patrika Kaal Sarp Dosh, Free Janam Patrika Kaal Sarp Dosh, Kundli Pitru Dosh, Free Kundli Pitru Dosh, Janam Kundli Pitru Dosh, Birth Chart Pitru Dosh, Free Birth Chart Pitru Dosh, Online Kundli Pitru Dosh, Janam Patrika Pitru Dosh, Free Janam Patrika Pitru Dosh, Kundli Shani Dosh, Free Kundli Shani Dosh, Janam Kundli Shani Dosh, Birth Chart Shani Dosh, Free Birth Chart Shani Dosh, Online Kundli Shani Dosh, Janam Patrika Shani Dosh, Free Janam Patrika Shani Dosh, Kundli Rahu Ketu, Free Kundli Rahu Ketu, Janam Kundli Rahu Ketu, Birth Chart Rahu Ketu, Free Birth Chart Rahu Ketu, Online Kundli Rahu Ketu, Janam Patrika Rahu Ketu, Free Janam Patrika Rahu Ketu, Kundli Guru, Free Kundli Guru, Janam Kundli Guru, Birth Chart Guru, Free Birth Chart Guru, Online Kundli Guru, Janam Patrika Guru, Free Janam Patrika Guru, Kundli Shukra, Free Kundli Shukra, Janam Kundli Shukra, Birth Chart Shukra, Free Birth Chart Shukra, Online Kundli Shukra, Janam Patrika Shukra, Free Janam Patrika Shukra, Kundli Budh, Free Kundli Budh, Janam Kundli Budh, Birth Chart Budh, Free Birth Chart Budh, Online Kundli Budh, Janam Patrika Budh, Free Janam Patrika Budh, Kundli Surya, Free Kundli Surya, Janam Kundli Surya, Birth Chart Surya, Free Birth Chart Surya, Online Kundli Surya, Janam Patrika Surya, Free Janam Patrika Surya, Kundli Chandra, Free Kundli Chandra, Janam Kundli Chandra, Birth Chart Chandra, Free Birth Chart Chandra, Online Kundli Chandra, Janam Patrika Chandra, Free Janam Patrika Chandra, Kundli Mangal, Free Kundli Mangal, Janam Kundli Mangal, Birth Chart Mangal, Free Birth Chart Mangal, Online Kundli Mangal, Janam Patrika Mangal, Free Janam Patrika Mangal, Kundli Shani, Free Kundli Shani, Janam Kundli Shani, Birth Chart Shani, Free Birth Chart Shani, Online Kundli Shani, Janam Patrika Shani, Free Janam Patrika Shani, Kundli Rahu, Free Kundli Rahu, Janam Kundli Rahu, Birth Chart Rahu, Free Birth Chart Rahu, Online Kundli Rahu, Janam Patrika Rahu, Free Janam Patrika Rahu, Kundli Ketu, Free Kundli Ketu, Janam Kundli Ketu, Birth Chart Ketu, Free Birth Chart Ketu, Online Kundli Ketu, Janam Patrika Ketu, Free Janam Patrika Ketu, मुफ्त कुंडली, कुंडली जनरेटर, जन्म कुंडली, जन्म पत्रिका, मुफ्त जन्म कुंडली, ऑनलाइन कुंडली, मुफ्त कुंडली जनरेटर, जन्म पत्रिका ऑनलाइन, मुफ्त जन्म पत्रिका, कुंडली कैलकुलेटर, मुफ्त कुंडली कैलकुलेटर, जन्म कुंडली कैलकुलेटर, ऑनलाइन जन्म कुंडली, मुफ्त कुंडली सॉफ्टवेयर, जन्म कुंडली सॉफ्टवेयर, मुफ्त जन्म कुंडली सॉफ्टवेयर, कुंडली एनालिसिस, मुफ्त कुंडली एनालिसिस, जन्म कुंडली एनालिसिस, मुफ्त जन्म कुंडली एनालिसिस, कुंडली चार्ट, मुफ्त कुंडली चार्ट, जन्म कुंडली चार्ट, मुफ्त जन्म कुंडली चार्ट, कुंडली मैचिंग, मुफ्त कुंडली मैचिंग, जन्म कुंडली मैचिंग, मुफ्त जन्म कुंडली मैचिंग, कुंडली होरोस्कोप, मुफ्त कुंडली होरोस्कोप, जन्म कुंडली होरोस्कोप, मुफ्त जन्म कुंडली होरोस्कोप, कुंडली ज्योतिष, मुफ्त कुंडली ज्योतिष, जन्म कुंडली ज्योतिष, मुफ्त जन्म कुंडली ज्योतिष, कुंडली वैदिक, मुफ्त कुंडली वैदिक, जन्म कुंडली वैदिक, मुफ्त जन्म कुंडली वैदिक, कुंडली ग्रह स्थिति, मुफ्त कुंडली ग्रह स्थिति, जन्म कुंडली ग्रह स्थिति, मुफ्त जन्म कुंडली ग्रह स्थिति, कुंडली भाव विश्लेषण, मुफ्त कुंडली भाव विश्लेषण, जन्म कुंडली भाव विश्लेषण, मुफ्त जन्म कुंडली भाव विश्लेषण, कुंडली दशा, मुफ्त कुंडली दशा, जन्म कुंडली दशा, मुफ्त जन्म कुंडली दशा, कुंडली नक्षत्र, मुफ्त कुंडली नक्षत्र, जन्म कुंडली नक्षत्र, मुफ्त जन्म कुंडली नक्षत्र, कुंडली राशि, मुफ्त कुंडली राशि, जन्म कुंडली राशि, मुफ्त जन्म कुंडली राशि, कुंडली ग्रह, मुफ्त कुंडली ग्रह, जन्म कुंडली ग्रह, मुफ्त जन्म कुंडली ग्रह, कुंडली भाव, मुफ्त कुंडली भाव, जन्म कुंडली भाव, मुफ्त जन्म कुंडली भाव, कुंडली मंगल दोष, मुफ्त कुंडली मंगल दोष, जन्म कुंडली मंगल दोष, मुफ्त जन्म कुंडली मंगल दोष, कुंडली काल सर्प दोष, मुफ्त कुंडली काल सर्प दोष, जन्म कुंडली काल सर्प दोष, मुफ्त जन्म कुंडली काल सर्प दोष, कुंडली पितृ दोष, मुफ्त कुंडली पितृ दोष, जन्म कुंडली पितृ दोष, मुफ्त जन्म कुंडली पितृ दोष, कुंडली शनि दोष, मुफ्त कुंडली शनि दोष, जन्म कुंडली शनि दोष, मुफ्त जन्म कुंडली शनि दोष, कुंडली राहु केतु, मुफ्त कुंडली राहु केतु, जन्म कुंडली राहु केतु, मुफ्त जन्म कुंडली राहु केतु, कुंडली गुरु, मुफ्त कुंडली गुरु, जन्म कुंडली गुरु, मुफ्त जन्म कुंडली गुरु, कुंडली शुक्र, मुफ्त कुंडली शुक्र, जन्म कुंडली शुक्र, मुफ्त जन्म कुंडली शुक्र, कुंडली बुध, मुफ्त कुंडली बुध, जन्म कुंडली बुध, मुफ्त जन्म कुंडली बुध, कुंडली सूर्य, मुफ्त कुंडली सूर्य, जन्म कुंडली सूर्य, मुफ्त जन्म कुंडली सूर्य, कुंडली चंद्र, मुफ्त कुंडली चंद्र, जन्म कुंडली चंद्र, मुफ्त जन्म कुंडली चंद्र, कुंडली मंगल, मुफ्त कुंडली मंगल, जन्म कुंडली मंगल, मुफ्त जन्म कुंडली मंगल, कुंडली शनि, मुफ्त कुंडली शनि, जन्म कुंडली शनि, मुफ्त जन्म कुंडली शनि, कुंडली राहु, मुफ्त कुंडली राहु, जन्म कुंडली राहु, मुफ्त जन्म कुंडली राहु, कुंडली केतु, मुफ्त कुंडली केतु, जन्म कुंडली केतु, मुफ्त जन्म कुंडली केतु</p>
      </div>
    </div>
    </>
  );
}
