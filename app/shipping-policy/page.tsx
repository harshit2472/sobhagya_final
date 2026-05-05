import React from 'react';
import Link from 'next/link';

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-white">

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Shipping Policy
            </h1>
            <p className="text-gray-600 text-lg">
              Last updated: December 2024
            </p>
          </div>

          {/* Shipping Policy Content */}
          <div className="prose prose-lg max-w-none">
            <div lang="en" className="space-y-8 text-gray-700 leading-8 tracking-[0.01em] text-left md:text-justify hyphens-auto break-words [text-align-last:left]">
              
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Safe & Secure Delivery</h2>
                <p className="mb-4">
                  At Sobhagya, your trust in us is paramount, and we're committed to delivering your treasures with the utmost care and reliability. Here's everything you need to know about our shipping process to ensure a smooth and secure experience.
                </p>
                <p className="mb-4">
                  We partner with reliable courier services including Shiprocket, Bluedart and Aftership to guarantee timely and safe delivery of your precious items. Every order is carefully packaged to withstand the journey, ensuring that your ordered products including gemstones, rudraksha, crystals, etc. arrive in pristine condition.
                </p>
              </section>

              {/* Shipping Timeline */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Shipping Timeline</h2>
                <p className="mb-4">
                  Orders are processed and dispatched within <strong>4 business days</strong> of confirmation. For customized or personalized items, please allow extra time.
                </p>
                <p className="mb-4">
                  Standard delivery time is typically <strong>7-10 days</strong> from dispatch. International orders may take longer due to customs procedures.
                </p>
              </section>

              {/* Delivery Timelines */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Delivery Timelines</h2>
                <p className="mb-4">
                  <strong>India:</strong> Delivery within Metro Cities typically takes 2 to 3 days from dispatch. For other regions, delivery may take 3 to 7 days from dispatch.
                </p>
                <p className="mb-4">
                  <strong>International:</strong> For orders placed from outside India, delivery is typically expected to take 30 to 35 days from dispatch. We currently offer delivery to over 150 countries worldwide.
                </p>
                <p className="mb-4">
                  Please note that these timeframes are estimates and may vary based on factors such as location, customs clearance, and other circumstances beyond our control.
                </p>
              </section>

              {/* Order Tracking */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Order Tracking</h2>
                <p className="mb-4">
                  Once your order is on its way, you'll receive a confirmation email with tracking details. Follow your package's journey with ease through the provided link.
                </p>
                <p className="mb-4">
                  We'll keep you informed throughout the shipping process with regular updates via email or SMS.
                </p>
              </section>

              {/* Shipping Costs */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Shipping Costs</h2>
                <p className="mb-4">
                  Shipping charges are calculated based on the destination and weight of your order. Free shipping may be available on orders above a certain value, and we'll communicate any such promotions on our website.
                </p>
                <p className="mb-4">
                  You can also contact us at <a href="mailto:support@sobhagya.com" className="text-[#F7971D] hover:text-orange-600 underline">support@sobhagya.com</a> to enquire about shipping offers and we'll be happy to assist you.
                </p>
              </section>

              {/* Delivery Location */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Delivery Location</h2>
                <p className="mb-4">
                  Please ensure your delivery information is complete and accurate at checkout. We deliver to residential or business addresses only, not to PO Boxes or public places.
                </p>
                <p className="mb-4">
                  If you need to update your delivery address, contact our customer support promptly.
                </p>
              </section>

              {/* What to Expect at Delivery */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. What to Expect at Delivery</h2>
                <p className="mb-4">
                  For high-value orders, we may require a signature and ID verification upon delivery to ensure the package reaches you safely.
                </p>
                <p className="mb-4">
                  Our courier partner will make up to three attempts to deliver your package. If delivery fails, contact us at <a href="mailto:support@sobhagya.com" className="text-[#F7971D] hover:text-orange-600 underline">support@sobhagya.com</a>.
                </p>
              </section>

              {/* Cancellation Policy */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cancellation Policy</h2>
                <p className="mb-4">
                  Once an order is placed, cancellations are not permitted under any circumstances. Please review your order carefully before confirming.
                </p>
              </section>

              {/* Our Commitment */}
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Our Commitment to You</h2>
                <p className="mb-4">
                  We aim to make your shopping experience as seamless and delightful as the gemstones we offer. If you have any questions or concerns, please don't hesitate to reach out to our dedicated customer support team.
                </p>
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-4">
              If you have any questions about this Shipping Policy, please contact us at{' '}
              <a href="mailto:info@sobhagya.in" className="text-[#F7971D] hover:text-orange-600 underline font-medium">
                info@sobhagya.in
              </a>
            </p>
            <p className="text-sm text-gray-500">
              Happy shopping! - The Sobhagya Team
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
  