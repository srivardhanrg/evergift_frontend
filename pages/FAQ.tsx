import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  icon: string;
  questions: FAQItem[];
}

const FAQ: React.FC = () => {
  const [openSections, setOpenSections] = useState<{ [key: number]: boolean }>({});
  const [openQuestions, setOpenQuestions] = useState<{ [key: string]: boolean }>({});

  const toggleSection = (index: number) => {
    setOpenSections(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleQuestion = (key: string) => {
    setOpenQuestions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const faqSections: FAQSection[] = [
    {
      title: "📏 Size & Quality",
      icon: "📏",
      questions: [
        {
          question: "How many pages does the storybook have?",
          answer: "The complete storybook has 26 pages total, including the cover, dedication page, introduction pages, and illustrated story pages. You'll get a preview of 14 pages before purchase."
        },
        {
          question: "What format is the digital book?",
          answer: "The digital book is delivered as a high-quality PDF file that you can view on any device, print at home, or take to a professional printing service."
        },
        {
          question: "Can I print the digital PDF at home?",
          answer: "Yes! The PDF is high-resolution and optimized for printing. You can print it at home on standard A4 or Letter size paper, or take it to a professional printing service."
        },
        {
          question: "What's the quality of the physical printed book?",
          answer: "Physical books are professionally printed by our partner Lulu on premium paper with a choice of softcover or hardcover binding. The print quality is excellent for personalized storybooks."
        },
        {
          question: "How does the AI generate the illustrations?",
          answer: "We use advanced AI technology (Fal.ai and Segmind) to create personalized illustrations featuring your child as the main character. The AI analyzes the uploaded photo and generates age-appropriate artwork in your chosen theme."
        }
      ]
    },
    {
      title: "💸 Cancellation & Refund Policy",
      icon: "💸",
      questions: [
        {
          question: "What is your refund policy?",
          answer: "We offer a 30-day money-back guarantee on both digital and physical books. If you're not satisfied, contact us at hello@juvilabs.com with your order number for a full refund."
        },
        {
          question: "Can I get a refund for a digital book after downloading?",
          answer: "Yes, within 30 days of purchase. We stand behind our quality and want you to be completely happy with your personalized storybook."
        },
        {
          question: "How do refunds work for physical books?",
          answer: "For physical books, refunds are provided for defective printing or shipping damage. You'll need to return the book (we provide a prepaid label for defects). Refunds are not available for subjective preferences about AI art style, as you can preview before purchase."
        },
        {
          question: "How long does it take to receive a refund?",
          answer: "Refunds are typically processed within 5-10 business days after approval. Allow an additional 3-5 days for your bank to process the refund to your original payment method."
        },
        {
          question: "Can I modify my order after purchase?",
          answer: "Once an order is placed, we cannot modify it as the personalization process begins immediately. However, you can request a refund within 30 days and create a new storybook with your desired changes."
        },
        {
          question: "What if I don't like the AI-generated art style?",
          answer: "You can preview the storybook before purchasing! The preview shows the AI art style, character resemblance, and story content. Refunds for art style preference are only granted if the final book significantly differs from the preview in quality."
        }
      ]
    },
    {
      title: "🚚 Delivery Timeline",
      icon: "🚚",
      questions: [
        {
          question: "How long does it take to generate my storybook?",
          answer: "The AI generation process takes approximately 60-90 seconds to create your personalized preview. You'll see a progress screen while your storybook is being created."
        },
        {
          question: "When will I receive my digital book?",
          answer: "Digital books (PDF) are delivered via email within 2-3 minutes after payment. If you don't see it, check your spam folder or contact us at hello@juvilabs.com."
        },
        {
          question: "How long does shipping take for physical books?",
          answer: "Physical books take 3-5 days for printing, then:\n• India: 5-10 days delivery\n• International: 10-20 days delivery\n\nTotal time: 8-15 days for India, 13-25 days for international orders."
        },
        {
          question: "Do you provide tracking for physical books?",
          answer: "Yes! You'll receive tracking information via email once your book is shipped from our print partner Lulu."
        },
        {
          question: "Can I re-download my digital book?",
          answer: "Yes, your digital book is available for re-download for 30 days after purchase. Check your email for the download link."
        },
        {
          question: "What if my preview expires before I can purchase?",
          answer: "Previews expire after 7 days if not purchased. You'll need to create a new storybook, but the process only takes 60-90 seconds."
        },
        {
          question: "Can I expedite shipping for physical books?",
          answer: "Shipping times are determined by our print partner Lulu and courier services. We cannot offer expedited shipping at this time."
        }
      ]
    },
    {
      title: "🔒 Are My Photos Safe?",
      icon: "🔒",
      questions: [
        {
          question: "How do you protect my child's photos?",
          answer: "Your privacy and your child's safety are extremely important to us. Photos are used only to create your personalized book and are never shared with unauthorized third parties, never sold, and never used for advertising or AI training."
        },
        {
          question: "How long do you keep uploaded photos?",
          answer: "If you do not save your preview, all uploaded photos are automatically deleted within 48 hours. If you save a preview or place an order, images are securely stored for up to 30 days so you can access your book or request a reprint. After that, they are permanently deleted."
        },
        {
          question: "Can I request immediate deletion of my photos?",
          answer: "Yes! You can request immediate deletion of your photos and personal data at any time by emailing us at hello@juvilabs.com, and we will remove everything linked to your preview or order."
        },
        {
          question: "Do you use facial recognition technology?",
          answer: "No, we do not use facial recognition technology. We use AI image generation to create illustrations based on your uploaded photo, but this is different from facial recognition systems."
        },
        {
          question: "Who has access to the uploaded photos?",
          answer: "Photos are encrypted and stored securely on Cloudflare R2. Only authorized personnel can access them for technical support purposes. Our third-party AI services (Fal.ai, Segmind) process photos temporarily but do not retain them."
        },
        {
          question: "Is my payment information secure?",
          answer: "Yes, all payments are processed through Shopify's secure payment gateway. We never store your credit card information on our servers."
        },
        {
          question: "Do you comply with children's privacy laws?",
          answer: "Yes, we comply with COPPA (Children's Online Privacy Protection Act) and other applicable children's privacy laws. Our service is intended for parents and guardians, and we require parental consent for all photo uploads."
        }
      ]
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
              {/* Section Header */}
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

              {/* Questions */}
              {openSections[sectionIndex] && (
                <div className="px-6 pb-4 space-y-3">
                  {section.questions.map((faq, qIndex) => {
                    const questionKey = `${sectionIndex}-${qIndex}`;
                    return (
                      <div
                        key={qIndex}
                        className="border-t border-gray-100 pt-3"
                      >
                        <button
                          onClick={() => toggleQuestion(questionKey)}
                          className="w-full text-left flex items-start justify-between gap-4 group"
                        >
                          <span className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                            {faq.question}
                          </span>
                          {openQuestions[questionKey] ? (
                            <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          )}
                        </button>
                        {openQuestions[questionKey] && (
                          <p className="mt-2 text-gray-600 leading-relaxed whitespace-pre-line">
                            {faq.answer}
                          </p>
                        )}
                      </div>
                    );
                  })}
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
