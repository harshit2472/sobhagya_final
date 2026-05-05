import React from 'react';
import SectionHeader from "@/app/components/ui/SectionHeader";

export const metadata = {
  title: 'Refund Policy - Sobhagya',
  description: 'Read our refund policy for Sobhagya products and services.',
};

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-gradient-to-b from-orange-50/50 to-white pt-16 pb-8">
        <div className="section-container">
          <SectionHeader
            tag="Legal"
            title="Refund Policy"
            subtitle="Last updated: December 2024"
            center
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="section-container pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Refund Policy Content */}
          <div lang="en" className="prose prose-orange max-w-none font-poppins text-gray-700 leading-8 tracking-[0.01em] space-y-10 text-left md:text-justify hyphens-auto break-words [text-align-last:left]">
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-garamond">1. Return & Replacement Policy</h2>
              <p>
                At Sobhagya, we take pride in offering handcrafted natural gemstones and jewelry, making each piece truly unique. However, due to the nature of the products, we implore you to kindly refer to the below-mentioned policy before requesting a return/exchange and/or refund.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-garamond">2. Return & Exchange Policy</h2>
              <p>
                While we want to ensure you are satisfied with your purchase, we cannot guarantee that each request for return/refund and/or exchange will be accepted by us. We reserve the right to refuse and/or deny any such request if it is not aligned with the below-mentioned conditions.
              </p>
              <p>
                <strong>Eligibility:</strong> Returns or exchanges are only accepted if your order is damaged during transit or if you received an incorrect product. Note - The Company acknowledges and agrees that, due to the nature of the products, the Company requires videographic proof to process any return or exchange request.
              </p>
              <p>
                <strong>Timeframe:</strong> Requests for a refund or exchange must be made within seven (07) days of receiving your product. The item must be returned in its original condition with its original certification and packaging intact.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-garamond">3. Categories Not Eligible for Return</h2>
              <p>
                Please note that returns are not possible for the following categories unless the product is damaged:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Customised Jewelry</li>
                <li>Beads Bracelets</li>
                <li>Rudraksha</li>
                <li>Crystal Trees</li>
                <li>Rakhi Products</li>
                <li>Gift Cards</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-garamond">4. Refund Process</h2>
              <p>
                If your return request is approved, your refund will be processed and credited to your original payment method within <strong>10-12 working days</strong>, subject to bank processes and public holidays.
              </p>
              <p>
                Once your return is received and inspected by our team, we will send you an email notification acknowledging receipt and informing you of the approval or rejection of your refund.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-garamond">6. Cancellation Policy</h2>
              <p>
                Once an order is placed, cancellations are not permitted under any circumstances. Please review your order carefully before confirming.
              </p>
            </section>

            <section className="bg-orange-50 rounded-2xl p-8 border border-orange-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-garamond">Contact Support</h2>
              <p className="mb-0">
                For any further queries or assistance with returns and refunds, please don't hesitate to contact our customer support team at: <br/>
                <a href="mailto:info@sobhagya.in" className="text-[#F7971E] font-bold hover:underline">info@sobhagya.in</a>
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}