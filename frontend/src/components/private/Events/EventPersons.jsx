import React from 'react'
import { eventArray } from '../../../constents'

const EventPersons = ({item}) => {
  return (
    <section>
      {eventArray.map((i, index) => (

    <div key={index} className={`w-full rounded-md py-2`}>
      <a className='group inline-flex gap-2 text-center justify-center mt-4'>
        {/* Sprawdzamy, czy tablica persons istnieje i czy ma co najmniej jeden element */}
            
                <img src={i.persons.user.img} alt={i.persons.user.name} className='h-10 z-[0] mx-auto object-contain transition-all duration-1000 ease-in-out' />
             
                {i.togglePullDown && (
                  <div className='w-[0vw] font-poppins translate-y-3 font-semibold group-hover:w-[30vw] md:group-hover:w-[10vw] text-xl whitespace-nowrap transition-all duration-1000 ease-in-out'>
                    <h4 className='group-hover:visible group-hover:delay-300 invisible'>{i.persons.user.name}</h4>
                  </div>
                )}
         
      <div className='h-10 w-10 rounded-full bg-major-dark text-white text-lg text-center flex justify-center items-center -translate-x-5'>
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_66_2801)">
<path d="M15.3333 7.33333H8.66667V0.666667C8.66667 0.489856 8.59643 0.320286 8.47141 0.195262C8.34638 0.0702379 8.17681 0 8 0V0C7.82319 0 7.65362 0.0702379 7.5286 0.195262C7.40357 0.320286 7.33333 0.489856 7.33333 0.666667V7.33333H0.666667C0.489856 7.33333 0.320286 7.40357 0.195262 7.5286C0.0702379 7.65362 0 7.82319 0 8H0C0 8.17681 0.0702379 8.34638 0.195262 8.47141C0.320286 8.59643 0.489856 8.66667 0.666667 8.66667H7.33333V15.3333C7.33333 15.5101 7.40357 15.6797 7.5286 15.8047C7.65362 15.9298 7.82319 16 8 16C8.17681 16 8.34638 15.9298 8.47141 15.8047C8.59643 15.6797 8.66667 15.5101 8.66667 15.3333V8.66667H15.3333C15.5101 8.66667 15.6797 8.59643 15.8047 8.47141C15.9298 8.34638 16 8.17681 16 8C16 7.82319 15.9298 7.65362 15.8047 7.5286C15.6797 7.40357 15.5101 7.33333 15.3333 7.33333Z" fill="white"/>
</g>
<defs>
<clipPath id="clip0_66_2801">
<rect width="16" height="16" fill="white"/>
</clipPath>
</defs>
</svg> 
        <p>{i.persons.user.id}</p>

      </div>
      </a>

    </div>
  ))}
</section>
  )
}

export default EventPersons
