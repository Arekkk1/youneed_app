import React, { useState } from 'react';
import api from '../../../api'; // Use the configured api instance
import { toast } from 'react-hot-toast';
import { Megaphone, Send, Percent, Tag } from 'lucide-react'; // Icons

// Placeholder component - Actual features depend on backend implementation
// Examples: Sending newsletters, creating promotions/discounts

function MarketingModule() {
  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterContent, setNewsletterContent] = useState('');
  const [isSendingNewsletter, setIsSendingNewsletter] = useState(false);

  const [promoCode, setPromoCode] = useState('');
  const [discountValue, setDiscountValue] = useState(''); // Could be percentage or fixed amount
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'fixed'
  const [isCreatingPromo, setIsCreatingPromo] = useState(false);

  const handleSendNewsletter = async (e) => {
    e.preventDefault();
    setIsSendingNewsletter(true);
    const sendToast = toast.loading('Wysyłanie newslettera...');
    try {
      // Assume endpoint POST /api/providers/marketing/newsletter
      await api.post('/providers/marketing/newsletter', {
        subject: newsletterSubject,
        content: newsletterContent,
      });
      toast.success('Newsletter wysłany pomyślnie!', { id: sendToast });
      setNewsletterSubject('');
      setNewsletterContent('');
    } catch (err) {
      console.error("Błąd wysyłania newslettera:", err);
      toast.error(err.response?.data?.message || 'Nie udało się wysłać newslettera.', { id: sendToast });
    } finally {
      setIsSendingNewsletter(false);
    }
  };

  const handleCreatePromotion = async (e) => {
     e.preventDefault();
     setIsCreatingPromo(true);
     const createToast = toast.loading('Tworzenie promocji...');
     try {
       // Assume endpoint POST /api/providers/marketing/promotions
       await api.post('/providers/marketing/promotions', {
         code: promoCode,
         type: discountType,
         value: parseFloat(discountValue),
         // Add other options like expiry date, usage limits if supported
       });
       toast.success('Promocja utworzona pomyślnie!', { id: createToast });
       setPromoCode('');
       setDiscountValue('');
     } catch (err) {
       console.error("Błąd tworzenia promocji:", err);
       toast.error(err.response?.data?.message || 'Nie udało się utworzyć promocji.', { id: createToast });
     } finally {
       setIsCreatingPromo(false);
     }
   };


  return (
    <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Newsletter Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Megaphone size={20} /> Wyślij Newsletter do Klientów
        </h3>
        <form onSubmit={handleSendNewsletter} className="space-y-4">
          <div>
            <label htmlFor="newsletterSubject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Temat</label>
            <input
              type="text"
              id="newsletterSubject"
              value={newsletterSubject}
              onChange={(e) => setNewsletterSubject(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="newsletterContent" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Treść</label>
            <textarea
              id="newsletterContent"
              rows="5"
              value={newsletterContent}
              onChange={(e) => setNewsletterContent(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Wpisz treść wiadomości..."
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSendingNewsletter}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
            >
              <Send size={16} className="mr-2" />
              {isSendingNewsletter ? 'Wysyłanie...' : 'Wyślij'}
            </button>
          </div>
        </form>
      </div>

      {/* Promotions Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
         <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
           <Tag size={20} /> Utwórz Promocję / Kod Rabatowy
         </h3>
         <form onSubmit={handleCreatePromotion} className="space-y-4">
           <div>
             <label htmlFor="promoCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kod Promocyjny</label>
             <input
               type="text"
               id="promoCode"
               value={promoCode}
               onChange={(e) => setPromoCode(e.target.value.toUpperCase())} // Example: Force uppercase
               required
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
               placeholder="np. LATO20"
             />
           </div>
           <div className="grid grid-cols-3 gap-4">
             <div className="col-span-2">
               <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Wartość Rabatowa</label>
               <input
                 type="number"
                 id="discountValue"
                 step={discountType === 'percentage' ? '1' : '0.01'}
                 min="0"
                 value={discountValue}
                 onChange={(e) => setDiscountValue(e.target.value)}
                 required
                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
               />
             </div>
             <div>
               <label htmlFor="discountType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Typ</label>
               <select
                 id="discountType"
                 value={discountType}
                 onChange={(e) => setDiscountType(e.target.value)}
                 className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
               >
                 <option value="percentage">%</option>
                 <option value="fixed">PLN</option>
               </select>
             </div>
           </div>
           {/* Add fields for expiry date, usage limits etc. if needed */}
           <div className="flex justify-end">
             <button
               type="submit"
               disabled={isCreatingPromo}
               className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
             >
               <Percent size={16} className="mr-2" />
               {isCreatingPromo ? 'Tworzenie...' : 'Utwórz Promocję'}
             </button>
           </div>
         </form>
         {/* Add a list of existing promotions below if needed */}
       </div>

    </div>
  );
}

export default MarketingModule;
