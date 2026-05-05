'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Clock, Users, Shield } from 'lucide-react';

export default function KundliService() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                  <Star className="w-4 h-4" />
                  Premium Service
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Your Birth Chart
                  <span className="block text-orange-600">Kundli Analysis</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Discover your cosmic blueprint with our comprehensive Kundli analysis. 
                  Understand your planetary positions, strengths, and life path through 
                  ancient Vedic astrology wisdom.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Duration</h3>
                  </div>
                  <p className="text-gray-600">3 minutes</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Expert</h3>
                  </div>
                  <p className="text-gray-600">Vedic Astrologer</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/call-with-astrologer?service=kundli"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Book Kundli Analysis
                </Link>
                <button className="inline-flex items-center justify-center px-8 py-4 border-2 border-orange-200 text-orange-600 font-bold rounded-2xl hover:bg-orange-50 transition-all duration-300">
                  Learn More
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10">
                <Image
                  src="/kundli-service.jpg"
                  alt="Kundli Analysis"
                  width={600}
                  height={600}
                  className="w-full h-auto rounded-2xl shadow-2xl"
                  priority
                />
              </div>
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full opacity-20 blur-2xl"></div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-20 blur-2xl"></div>
            </motion.div>
          </div>
        </div>
      </div>

            {/* Free Kundli Generation Section */}
      <div className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-6">
              <span className="text-lg"></span>
              Start Your Journey
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              First Generate Your Free Kundli
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Begin your astrological journey by generating your free birth chart. 
              Then consult with our expert astrologers for detailed analysis and personalized guidance.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Step 1: Generate Free Kundli */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-xl border border-orange-100 p-8 text-center"
            >
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Step 1: Generate Free Kundli</h3>
              <p className="text-gray-600 mb-6">
                Enter your birth details and get instant access to your basic birth chart 
                with planetary positions and essential insights.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Birth Chart (Kundli)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Planetary Positions</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Basic Predictions</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Printable Report</span>
                </div>
              </div>
              <Link
                href="/free-kundli"
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Generate Free Kundli
              </Link>
            </motion.div>

            {/* Step 2: Review Your Chart */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-xl border border-orange-100 p-8 text-center"
            >
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Step 2: Review Your Chart</h3>
              <p className="text-gray-600 mb-6">
                Analyze your birth chart, understand planetary influences, and identify 
                key areas of your life that need attention.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>House Analysis</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Planetary Dosh</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Life Path Insights</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Save & Share</span>
                </div>
              </div>
              <div className="px-4 py-2 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-700 font-medium">Free with your generated Kundli</p>
              </div>
            </motion.div>

            {/* Step 3: Consult Expert */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-xl border border-orange-100 p-8 text-center"
            >
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">👨‍🏫</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Step 3: Consult Expert Astrologer</h3>
              <p className="text-gray-600 mb-6">
                Book a consultation with our expert Vedic astrologers for detailed analysis, 
                personalized guidance, and remedial solutions.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Detailed Analysis</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Personalized Guidance</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Remedial Solutions</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Q&A Session</span>
                </div>
              </div>
              <Link
                href="/call-with-astrologer?service=kundli"
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Book Expert Consultation
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <div className="bg-orange-50 p-8 rounded-2xl border border-orange-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Why This Approach?</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Start with your free Kundli to understand the basics, then leverage our expert astrologers 
                for deeper insights and personalized solutions. This ensures you get the most value from your consultation.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              What's Included in Your Kundli Analysis
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive Kundli analysis covers all aspects of your birth chart 
              to provide you with deep insights into your personality and destiny.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Birth Chart Analysis",
                description: "Complete analysis of your birth chart with planetary positions and their influences.",
                icon: "📊",
                color: "bg-blue-100 text-blue-600"
              },
              {
                title: "Planetary Dosh",
                description: "Identification and remedies for planetary imbalances affecting your life.",
                icon: "⭐",
                color: "bg-purple-100 text-purple-600"
              },
              {
                title: "Life Path Guidance",
                description: "Clear guidance on your life purpose, career, and personal development.",
                icon: "🛤️",
                color: "bg-green-100 text-green-600"
              },
              {
                title: "Relationship Insights",
                description: "Understanding of relationship patterns and compatibility factors.",
                icon: "💕",
                color: "bg-pink-100 text-pink-600"
              },
              {
                title: "Health & Wellness",
                description: "Astrological insights into health patterns and wellness recommendations.",
                icon: "🏥",
                color: "bg-red-100 text-red-600"
              },
              {
                title: "Remedial Measures",
                description: "Practical remedies and solutions to enhance positive planetary influences.",
                icon: "🔮",
                color: "bg-indigo-100 text-indigo-600"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-white to-orange-50 p-8 rounded-2xl shadow-sm border border-orange-100 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center text-2xl mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 lg:py-24 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to Discover Your Cosmic Blueprint?
            </h2>
            <p className="text-xl text-orange-100 max-w-2xl mx-auto">
              Book your Kundli analysis today and unlock the secrets of your birth chart 
              with our expert Vedic astrologers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/free-kundli"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-bold rounded-2xl hover:bg-white hover:text-orange-600 transition-all duration-300"
              >
                Try 
                
                
              </Link>
              <Link
                href="/call-with-astrologer?service=kundli"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-orange-600 font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Book Expert Analysis - ₹999
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-bold rounded-2xl hover:bg-white hover:text-orange-600 transition-all duration-300"
              >
                View All Services
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
