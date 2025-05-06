import React from 'react'
// Import SVGs directly
import quotesIcon from '../../assets/quotes.svg';
// Import the placeholder SVG logo
import logoSvg from '../../assets/icon/Logo.svg';

const FeedbackCard = ({ headerTitle, content, name, title, img, day, date }) => {
  // Use the imported logoSvg as a fallback if the specific person image (img) is not available or removed
  const imageSrc = img || logoSvg;

  return (
    <section>
            <div className={`absolute mx-auto z-[0] flex w-fit h-full ${day <= 2 ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="mt-2 rounded-full blur-md duration-200 p-2 w-full h-96 mx-auto py-10 transition-all ease-in-out assing-delay"></div>
                </div>
        <div className='flex flex-col justify-between rounded-md max-w-96 h-96 p-12 feedback-card'>
    <img src={quotesIcon} alt='Quote' className='object-contain max-w-10'/>
    <p className='font-poppins font-bold my-2'>
        <h3>{headerTitle}</h3>
        <span>Deadline: {day}{date}</span> {/* Combined day and date */}
      </p>
      <p className='font-poppins my-4'>
        {content}
      </p>
    <div className='flex flex-row mt-4'>
    <img src={imageSrc} alt={name} className='max-w-12 max-h-12 object-contain rounded-full'/> {/* Added rounded-full */}
    <div className='flex flex-col ml-4'>
      <h4 className='font-poppins font-semibold text-xl'>{name}</h4>
    <p className='font-poppins'>
        {title}
      </p>
    </div>
    </div>
    </div>
    </section>
  )
}

export default FeedbackCard;
