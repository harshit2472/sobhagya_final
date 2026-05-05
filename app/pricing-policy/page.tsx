import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Pricing Policy - Sobhagya',
  description: 'Pricing Policy for Sobhagya astrology services.',
};

export default function PricingPolicy() {
  return (
    <div className="min-h-screen bg-white">

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Pricing Policy
            </h1>
            <p className="text-gray-600">
              Last updated: 20th September, 2023
            </p>
          </div>

          {/* Pricing Policy Content - Formatted Content */}
          <div className="prose prose-lg max-w-none">
            <div lang="en" className="space-y-8 text-gray-700 leading-8 tracking-[0.01em] text-left md:text-justify hyphens-auto break-words [text-align-last:left]">
              
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. PRICING POLICY OVERVIEW</h2>
                <p>
                  At Sobhagya.in we have customised pricing according to the services rendered by us. The details are provided to you beforehand according to the effort, efficiency and the output of the service.
                </p>
              </section>

              {/* Price Range */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. PRICE RANGE</h2>
                <p>
                  Typically, the range of transactions on our Android applications varies from <strong>INR 500 to 1500</strong> per user per session.
                </p>
              </section>

              {/* Price Matching */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. PRICE MATCHING</h2>
                <p className="mb-4">
                  For At sobhagya.in we are committed to offering you the best possible prices. We will be glad to meet our competitor's pricing if you ever find a service that we offer, in the similar interest and providing same professionalism and features, available from a similar service provider.
                </p>
                <p>
                  Our prices do not vary according to the market needs, competitor pricing etc.
                </p>
              </section>

              {/* Schedule of Payment */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. SCHEDULE OF PAYMENT</h2>
                <p>
                  Some of our services can be utilised for fixed durations. In such cases, it is clearly mentioned within the description of these services. The period of usage in these cases vary from <strong>1 month to 6 months</strong>.
                </p>
              </section>

              {/* Sale Adjustment */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. SALE ADJUSTMENT</h2>
                <p className="mb-4">
                  If a service that you have purchased is reduced in price within one weeks of your booking date, we will not be able to adjust the sale price for you. Please note that we cannot make sale adjustment.
                </p>
                <p className="mb-4">
                  If you have booked a slot for a date, generally, we cannot reschedule the slot to another date. This will result in the cancellation of the booking/order(s). Please refer cancellation policies for more details.
                </p>
              </section>

              {/* Pricing Errors */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. PRICING ERRORS</h2>
                <p className="mb-4">
                  We work hard to ensure the accuracy of pricing. Despite our efforts, pricing errors may still occur. If a service's price is higher than the price displayed, we will cancel your booking and notify you of the cancellation.
                </p>
                <p>
                  Our service is offered for sale by Elysion Softwares Private Limited for your personal needs. Therefore, we reserve the right to refuse to sell to any person whom we believe may be misusing the service.
                </p>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. CONTACT INFORMATION</h2>
                <p>
                  Please feel free to reach us at{' '}
                  <a href="mailto:support@sobhagya.com" className="text-[#F7971E] hover:text-[#E68A19]">
                    support@sobhagya.com
                  </a>
                </p>
              </section>

            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-600">
              If you have any questions about this Pricing Policy, please contact us at{' '}
              <a href="mailto:info@sobhagya.in" className="text-[#F7971E] hover:text-[#E68A19]">
                info@sobhagya.in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
