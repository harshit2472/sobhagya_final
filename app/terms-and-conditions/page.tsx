import React from 'react';
import SectionHeader from "@/app/components/ui/SectionHeader";

export const metadata = {
  title: 'Terms and Conditions - Sobhagya',
  description: 'Read our terms and conditions for using Sobhagya astrology services.',
};

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-gradient-to-b from-orange-50/50 to-white pt-16 pb-8">
        <div className="section-container">
          <SectionHeader
            tag="Legal"
            title="Terms & Conditions"
            subtitle="Last updated: 20th September, 2023"
            center
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="section-container pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Terms Content */}
          <div lang="en" className="prose prose-orange max-w-none font-poppins text-gray-700 leading-8 tracking-[0.01em] space-y-10 text-left md:text-justify hyphens-auto break-words [text-align-last:left]">
            
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-garamond">1. TERMS AND CONDITIONS OF USAGE</h2>
              <p>
                These terms and conditions of Use (hereinafter referred as "Terms of Usage") describe and govern the User's use of the content and services offered by Elysion Softwares Private Limited through www.sobhagya.in (hereinafter referred as "We" "Sobhagya" "us" "our" "sobhagya application" "Website").
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-garamond">2. UPDATION</h2>
              <p>
                The Website may update/amend/modify these Terms of Usage from time to time. The User is responsible to check the Terms of Usage periodically to remain in compliance with these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-garamond">3. USER CONSENT</h2>
              <p>
                By accessing the Website and using it, you ("Member", "You", "Your") indicate that you understand the terms and unconditionally & expressly consent to the Terms of Usage of this Website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-garamond">4. GENERAL DESCRIPTION</h2>
              <p>
                The Website is an internet-based portal providing astrological content, reports, data, telephone, video and email consultations (hereinafter referred as "Content"). The Website is offering "Free Services" and "Paid Services" (Collectively referred as "Services").
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-garamond">5. REGISTRATION AND ELIGIBILITY</h2>
              <p>
                By using this website, you agree that you are over the age of 18 years and are allowed to enter into a legally binding and enforceable contract under Indian Contract Act, 1872.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-garamond">6. FEATURE "CALL WITH ASTROLOGER"</h2>
              <p>
                The Website is providing certain service which is available through the medium of telecommunication with the Astrologer listed and enrolled with the Website. By agreeing to the present Terms of Usage, you are also giving your unconditional consent to the Website to arrange a call with you on your mobile number.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-garamond">11. DELIVERY, CANCELLATION AND REFUND</h2>
              <p>
                No refund shall be processed on the order of any reports under any circumstances if the order has reached the "processing" (Assigned to an Astrologer) stage.
              </p>
              <p>
                <strong>Note:</strong> All refunds will be credited to user's Sobhagya wallet.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-garamond">14. DISCLAIMER / LIMITATION OF LIABILITY</h2>
              <p>
                <strong>Important:</strong> The website is not a suicide helpline platform. If you are considering or contemplating suicide or feel that you are a danger to yourself or to others, please notify appropriate police or emergency medical personnel.
              </p>
            </section>

            <section className="bg-orange-50 rounded-2xl p-8 border border-orange-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-garamond">Contact Us</h2>
              <p className="mb-0">
                If you have any questions about these Terms and Conditions, please contact us at: <br/>
                <a href="mailto:info@sobhagya.in" className="text-[#F7971E] font-bold hover:underline">info@sobhagya.in</a>
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
