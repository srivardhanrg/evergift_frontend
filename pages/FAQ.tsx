import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FAQSection {
  title: string;
  icon: string;
  answer: string;
}

const FAQ: React.FC = () => {
  const [openSections, setOpenSections] = useState<{ [key: number]: boolean }>({});

  const toggleSection = (index: number) => {
    setOpenSections(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const faqSections: FAQSection[] = [
    {
      title: "Size & Quality",
      icon: "📏",
      answer: "Your storybook is 24 pages long with fully illustrated story pages, and the book size is 8.5 x 8.5 inches. You'll get a free 14-page preview before buying. The digital version is a high-resolution PDF — perfect for viewing on any device or printing at home. Physical books are professionally printed on premium paper with softcover or hardcover binding."
    },
    {
      title: "Cancellation & Refund Policy",
      icon: "💸",
      answer: "Because every book is uniquely created for your child, all sales are final once payment is made. We provide a full 14-page preview before purchase so you can review the art style and story, before committing. If your physical book arrives damaged or defective, email us at hello@juvilabs.com within 7 days and we'll send a free replacement."
    },
    {
      title: "Delivery Timeline",
      icon: "🚚",
      answer: "Your personalized preview is ready in about 60–90 seconds. Digital PDFs are delivered to your email within 2–3 minutes of purchase — check your spam if you don't see it. Physical books take 3–5 days to print, then 5–10 days to deliver within USA, Canada and 10–20 days internationally. Timelines may vary based on the location."
    },
    {
      title: "Are My Photos Safe?",
      icon: "🔒",
      answer: "Absolutely. Uploaded photos are used only to generate your storybook and are automatically deleted from our servers once generation is complete. We never share, sell, or use them for AI training."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-softPink/30 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-heading text-gray-900 mb-2">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-500">Everything you need to know about StoryGift</p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-4">
          {faqSections.map((section, sectionIndex) => (
            <div
              key={sectionIndex}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <button
                onClick={() => toggleSection(sectionIndex)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-xl font-heading text-gray-900 flex items-center gap-3">
                  <span className="text-2xl">{section.icon}</span>
                  {section.title}
                </h2>
                {openSections[sectionIndex] ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {openSections[sectionIndex] && (
                <div className="px-6 pb-5 pt-1">
                  <p className="text-gray-600 leading-relaxed">{section.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still Need Help Section */}
        <div className="mt-12 bg-gradient-to-br from-primary/10 to-pink-100 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-heading text-gray-900 mb-3">Still need help?</h3>
          <p className="text-gray-600 mb-6">
            Have a question or need assistance with your order? Just respond to our emails or contact us directly.
          </p>
          <a
            href="mailto:hello@juvilabs.com"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all"
          >
            <span>Email: hello@juvilabs.com</span>
          </a>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            For privacy concerns, email{' '}
            <a href="mailto:hello@juvilabs.com" className="text-primary hover:underline">
              hello@juvilabs.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
