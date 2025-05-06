import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const ClientAddEventBanner = () => { // Removed onAdd prop
  const [isTouching, setIsTouching] = useState(false);
  const navigate = useNavigate(); // Initialize navigate

  const handleTouchStart = () => {
    setIsTouching(true);
  };

  const handleTouchEnd = () => {
    setIsTouching(false);
  };

  // Navigate to provider search page with intent state
  const handleNavigateToSearch = () => {
    navigate('/dashboard/client/searchProvider', { state: { intent: 'createOrder' } });
  };

  return (
    <div className="flex w-full content-center justify-center pb-1">
      <div className="group w-full" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div
          className={`flex justify-center group-hover:text-left rounded-lg element-grid-opacity cursor-pointer backdrop-blur-sm py-2 transition-all duration-300 ease-in group-hover:bg-lightmode-backgroudMain ${
            isTouching ? 'bg-lightmode-backgroudMain' : ''
          }`}
          onClick={handleNavigateToSearch} // Use the navigation handler
        >
          <div
            className={`items-center mx-auto justify-center group-hover:-translate-x-24 md:group-hover:-translate-x-32 transition-all duration-300 ease-in ${
              isTouching ? '-translate-x-24 md:-translate-x-32' : ''
            }`}
          >
            {/* SVG remains the same */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 22 22"
            >
              <g id="Group_312" data-name="Group 312" transform="translate(-26.5 -30)">
                <line
                  className="group-hover:stroke-lightmode-button stroke-[#C8D5DE]"
                  id="Line_4"
                  data-name="Line 4"
                  x2="18"
                  transform="translate(28.5 41)"
                  fill="none"
                  strokeLinecap="round"
                  strokeWidth="4"
                />
                <line
                  className="group-hover:stroke-lightmode-button stroke-[#C8D5DE]"
                  id="Line_5"
                  data-name="Line 5"
                  x2="18"
                  transform="translate(37.5 32) rotate(90)"
                  fill="none"
                  strokeLinecap="round"
                  strokeWidth="4"
                />
              </g>
            </svg>
          </div>
          <div className="items-center mx-auto justify-center absolute">
            <p
              className={`hidden mx-auto text-lightmode-button group-hover:text-left group-hover:delay-500 group-hover:block font-medium transition-all duration-300 ease-in ${
                isTouching ? 'block text-left delay-500' : 'hidden'
              }`}
            >
              Dodaj nowe zlecenie
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientAddEventBanner;
