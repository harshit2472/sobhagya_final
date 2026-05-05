'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, RefreshCw, Heart, Users, TrendingUp } from 'lucide-react';
import Lottie from 'lottie-react';
import Link from 'next/link';

export default function HoroscopeService() {
  const [isLoading, setIsLoading] = useState(true);
  const [horoscopes, setHoroscopes] = useState<any>({});
  const [language, setLanguage] = useState<'english' | 'hindi'>('english');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [symbolData, setSymbolData] = useState<any>({});

  const zodiacSigns = [
    { 
      name: 'Aries', 
      symbol: '/aries.json', 
      element: 'Fire', 
      dates: 'Mar 21 - Apr 19', 
      color: 'bg-[#F6F6F6]', 
      borderColor: 'border-gray-300', 
      textColor: 'text-black', 
      apiName: 'aries',
      description: 'Bold, energetic, and natural leaders',
      image: '/Group 13384.png'
    },
    { 
      name: 'Taurus', 
      symbol: '/taurus.json', 
      element: 'Earth', 
      dates: 'Apr 20 - May 20', 
      color: 'bg-[#F6F6F6]', 
      borderColor: 'border-gray-300', 
      textColor: 'text-black', 
      apiName: 'taurus',
      description: 'Patient, reliable, and determined',
      image: '/Group 13383.png'
    },
    { 
      name: 'Gemini', 
      symbol: '/gemini (1).json', 
      element: 'Air', 
      dates: 'May 21 - Jun 20', 
      color: 'bg-[#F6F6F6]', 
      borderColor: 'border-gray-300', 
      textColor: 'text-black', 
      apiName: 'gemini',
      description: 'Adaptable, curious, and expressive',
      image: '/Group 13382.png'
    },
    { 
      name: 'Cancer', 
      symbol: '/cancer.json', 
      element: 'Water', 
      dates: 'Jun 21 - Jul 22', 
      color: 'bg-[#F6F6F6]', 
      borderColor: 'border-gray-300', 
      textColor: 'text-black', 
      apiName: 'cancer',
      description: 'Nurturing, intuitive, and protective',
      image: '/Group 13388.png'
    },
    { 
      name: 'Leo', 
      symbol: '/leo.json', 
      element: 'Fire', 
      dates: 'Jul 23 - Aug 22', 
      color: 'bg-[#F6F6F6]', 
      borderColor: 'border-gray-300', 
      textColor: 'text-black', 
      apiName: 'leo',
      description: 'Confident, creative, and generous',
      image: '/Group 13385.png'
    },
    { 
      name: 'Virgo', 
      symbol: '/virgo.json', 
      element: 'Earth', 
      dates: 'Aug 23 - Sep 22', 
      color: 'bg-[#F6F6F6]', 
      borderColor: 'border-gray-300', 
      textColor: 'text-black', 
      apiName: 'virgo',
      description: 'Analytical, practical, and kind',
      image: '/Group 13386.png'
    },
    { 
      name: 'Libra', 
      symbol: '/libra.json', 
      element: 'Air', 
      dates: 'Sep 23 - Oct 22', 
      color: 'bg-[#F6F6F6]', 
      borderColor: 'border-gray-300', 
      textColor: 'text-black', 
      apiName: 'libra',
      description: 'Diplomatic, gracious, and fair-minded',
      image: '/Group 13387.png'
    },
    { 
      name: 'Scorpio', 
      symbol: '/scorpio.json', 
      element: 'Water', 
      dates: 'Oct 23 - Nov 21', 
      color: 'bg-[#F6F6F6]', 
      borderColor: 'border-gray-300', 
      textColor: 'text-black', 
      apiName: 'scorpio',
      description: 'Passionate, mysterious, and determined',
      image: '/Group 13396.png'
    },
    { 
      name: 'Sagittarius', 
      symbol: '/sagittarius.json', 
      element: 'Fire', 
      dates: 'Nov 22 - Dec 21', 
      color: 'bg-[#F6F6F6]', 
      borderColor: 'border-gray-300', 
      textColor: 'text-black', 
      apiName: 'sagittarius',
      description: 'Optimistic, adventurous, and honest',
      image: '/Group 13395.png'
    },
    { 
      name: 'Capricorn', 
      symbol: '/capricorn.json', 
      element: 'Earth', 
      dates: 'Dec 22 - Jan 19', 
      color: 'bg-[#F6F6F6]', 
      borderColor: 'border-gray-300', 
      textColor: 'text-black', 
      apiName: 'capricorn',
      description: 'Responsible, disciplined, and ambitious',
      image: '/Group 13394.png'
    },
    { 
      name: 'Aquarius', 
      symbol: '/aquarius.json', 
      element: 'Air', 
      dates: 'Jan 20 - Feb 18', 
      color: 'bg-[#F6F6F6]', 
      borderColor: 'border-gray-300', 
      textColor: 'text-black', 
      apiName: 'aquarius',
      description: 'Independent, original, and humanitarian',
      image: '/Group 13393.png'
    },
    { 
      name: 'Pisces', 
      symbol: '/pisces.json', 
      element: 'Water', 
      dates: 'Feb 19 - Mar 20', 
      color: 'bg-[#F6F6F6]', 
      borderColor: 'border-gray-300', 
      textColor: 'text-black', 
      apiName: 'pisces',
      description: 'Compassionate, artistic, and intuitive',
      image: '/Group 13367.png'
    }
  ];

  // Generate horoscopes using astronomical calculations
  const fetchHoroscopes = async () => {
    setIsLoading(true);
    try {
      const { default: AstronomicalHoroscopeGenerator } = await import('../../utils/horoscope-generator');
      const generator = new AstronomicalHoroscopeGenerator();
      const today = new Date();
      const horoscopeData: any = {};

      // Generate horoscopes for all signs using astronomical calculations
      for (const sign of zodiacSigns) {
        try {
          const horoscope = generator.generateHoroscope(sign.name, today, 'daily', language);
          
          horoscopeData[sign.name] = {
            date: horoscope.date,
            horoscope: horoscope.horoscope,
            sign: sign.name,
            color: horoscope.luckyColor,
            compatibility: horoscope.compatibility,
            mood: horoscope.mood,
            luckyNumber: horoscope.luckyNumber,
            luckyTime: horoscope.luckyTime,
            planetaryInfluences: horoscope.planetaryInfluences,
            remedies: horoscope.remedies
          };
        } catch (error) {
          console.error(`Error generating horoscope for ${sign.name}:`, error);
          // Fallback data
          horoscopeData[sign.name] = {
            date: today.toISOString().split('T')[0],
            horoscope: language === 'hindi' ? 
              `${sign.name} राशि के लिए आज का दिन शुभ है। नए अवसर मिल सकते हैं और आपका मन प्रसन्न रहेगा।` :
              `Today is a favorable day for ${sign.name}. New opportunities may arise and you will feel content.`,
            sign: sign.name,
            color: 'Gold',
            compatibility: 'Aries',
            mood: 'Happy',
            luckyNumber: Math.floor(Math.random() * 9) + 1,
            luckyTime: '12:00 PM',
            planetaryInfluences: ['Positive planetary energy surrounds you'],
            remedies: ['Practice meditation', 'Wear your lucky color']
          };
        }
      }

      setHoroscopes(horoscopeData);
      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      console.error('Error generating horoscopes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadSymbolData = async () => {
      try {
        const symbols: any = {};
        for (const sign of zodiacSigns) {
          try {
            console.log(`Loading symbol for ${sign.name} from ${sign.symbol}`);
            const response = await fetch(sign.symbol);
            if (response.ok) {
              const data = await response.json();
              symbols[sign.name] = data;
              console.log(`Successfully loaded symbol for ${sign.name}:`, data);
            } else {
              console.warn(`Failed to load symbol for ${sign.name}: ${response.status} ${response.statusText}`);
            }
          } catch (error) {
            console.warn(`Failed to load symbol for ${sign.name}:`, error);
          }
        }
        console.log('Final symbols data:', symbols);
        setSymbolData(symbols);
      } catch (error) {
        console.error('Error loading symbol data:', error);
      }
    };

    loadSymbolData();
    fetchHoroscopes();
  }, [language]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* Main Content */}
      <div className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Daily Horoscope
              <span className="block text-orange-600">All 12 Zodiac Signs</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Get your personalized daily horoscope based on your zodiac sign. Updated daily with fresh insights and guidance.
            </p>
            
            {/* Language Toggle and Refresh */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="bg-white rounded-full p-1 shadow-lg border border-orange-100">
                <button
                  onClick={() => setLanguage('english')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    language === 'english'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-orange-600'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('hindi')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    language === 'hindi'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-orange-600'
                  }`}
                >
                  हिंदी
                </button>
              </div>
              
              <button
                onClick={fetchHoroscopes}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-4">
                Last updated: {lastUpdated}
              </p>
            )}
          </motion.div>

          {/* Horoscope Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {zodiacSigns.map((sign, index) => {
                const horoscope = horoscopes[sign.name];
                return (
                  <motion.div
                    key={sign.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="group relative"
                  >
                    <Link href={`/services/horoscope/${sign.name.toLowerCase()}`}>
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 h-full">
                        {/* Sign Header */}
                        <div className="text-center mb-6">
                          <div className="relative mb-4">
                            <div className="mb-2 flex justify-center">
                              <div className="w-24 h-24 flex items-center justify-center">
                                {symbolData[sign.name] ? (
                                  <Lottie
                                    animationData={symbolData[sign.name]}
                                    loop={true}
                                    autoplay={true}
                                    style={{ width: '96px', height: '96px' }}
                                    onError={() => {
                                      console.warn(`Failed to load Lottie animation for ${sign.name}`);
                                    }}
                                  />
                                ) : (
                                  <div className="text-6xl font-bold text-gray-400">
                                    {sign.name.charAt(0)}
                                    <div className="text-xs text-gray-300 mt-1">Loading...</div>
                                  </div>
                                )}
                              </div>
                              
                            </div>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">{sign.name}</h3>
                          <p className="text-sm text-gray-600 mb-3 font-medium">{sign.dates}</p>
                          <div className="flex items-center justify-center gap-2 mb-4">
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${sign.color} ${sign.textColor} border ${sign.borderColor} shadow-sm`}>
                              {sign.element}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 text-center mb-6 leading-relaxed">
                          {sign.description}
                        </p>

                        {/* Today's Horoscope Preview */}
                        {horoscope && (
                          <div className={`${sign.color} rounded-xl p-4 mb-4`}>
                            <h4 className="font-semibold text-gray-900 mb-2 text-center">
                              {language === 'hindi' ? 'आज का होरोस्कोप' : "Today's Horoscope"}
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {horoscope.horoscope}
                            </p>
                          </div>
                        )}

                        {/* Lucky Details */}
                        {horoscope && (
                          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                            <div className="text-center">
                              <div className="font-semibold text-gray-900">Lucky Number</div>
                              <div className="text-orange-600 font-bold">{horoscope.luckyNumber}</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-gray-900">Lucky Time</div>
                              <div className="text-orange-600 font-bold">{horoscope.luckyTime}</div>
                            </div>
                          </div>
                        )}

                        {/* View Details Button */}
                        <div className="text-center">
                          <div className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors duration-200 group-hover:scale-105">
                            <Star className="w-4 h-4" />
                            View Details
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-16 text-center"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-orange-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Need Personalized Guidance?
              </h2>
              <p className="text-gray-600 mb-6">
                Get detailed insights and remedies from our expert astrologers.
              </p>
              <Link
                href="/call-with-astrologer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors duration-200"
              >
                <Star className="w-5 h-5" />
                Consult Our Astrologer
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
