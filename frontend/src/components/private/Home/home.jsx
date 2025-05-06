import { Link } from 'react-router-dom'
import Navbar from '../../shared/Navbar'
import React, { useState, useEffect, useRef } from 'react';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { clients as modulesData } from '../../../constents'; // Renamed import for clarity
import YourSubscriptions from './YourSubscriptions';
import DownNavbar from '../../shared/DownNavbar';
// Import SVG directly
import BackIcon from '../../../assets/icon/Back.svg';

function Home() {
  const [moveToggle, setMoveToggle] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const slickRef = useRef(null);

  function onMoveToggle() {
    setMoveToggle(prevState => !prevState);
  }

  function handleSlideClicks(index) {
    // Only navigate if the clicked slide is the center one
    if (index === currentSlideIndex) {
      // Navigate logic here, potentially using slickRef.current.innerSlider.state.currentSlide
      // For simplicity, we assume the link is directly on the item.
    } else {
       slickRef.current.slickGoTo(index); // Go to the clicked slide
    }
     setCurrentSlideIndex(index); // Update the index regardless
  }

  const settings = {
    className: "center",
    centerMode: true,
    infinite: true,
    centerPadding: "20px",
    slidesToShow: 3,
    slidesToScroll: 1,
    focusOnSelect: true,
    speed: 500,
    arrows: false, // Corrected 'arrow' to 'arrows'
    beforeChange: (oldIndex, newIndex) => {
      setCurrentSlideIndex(newIndex);
    },
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          centerPadding: "1px",
          slidesToShow: 3,
        }
      },
      {
        breakpoint: 600,
        settings: {
          centerPadding: "1px",
          slidesToShow: 1,
        }
      },
      {
        breakpoint: 480,
        settings: {
          centerPadding: "1px",
          slidesToShow: 1,
        }
      }
    ]
  };

  return (
    <section className="full-height overflow-hidden">
      <div className='flex-1 bg-Grayscale-Gray80'>
        <div className='relative bg-Grayscale-Gray70 z-[5]'>
          <Navbar color={'text-white'} lgColor={'fill-sky-500'} />
        </div>
        <main className={`relative w-full min-h-[70vh] bg-Grayscale-Gray70 grid content-around transition-all duration-500 z-[3] ${moveToggle ? 'xl:-translate-y-[60vh] md:-translate-y-[67vh] -translate-y-[530px] rounded-b-full' : '-translate-y-0 rounded-b-3xl'}`}>

          <div className="text-center overflow-hidden w-full">
            <h2 className='text-white font-extrabold text-2xl md:text-5xl'>Select what you're doing</h2> {/* Corrected typo */}

            <div className='home overflow-hidden w-full pt-[7vh]'>
              <Slider ref={slickRef} className="z-[0]" {...settings}>
                {modulesData.map((item, index) => (
                  <div key={item.id}> {/* Use item.id for key */}
                    {/* Wrap the clickable area */}
                    <div onClick={() => handleSlideClicks(index)} className="cursor-pointer">
                      <Link to={index === currentSlideIndex ? item.link : '#'} onClick={(e) => index !== currentSlideIndex && e.preventDefault()}>
                        <aside className="mx-auto flex items-center justify-center"> {/* Added flex centering */}
                          <img src={item.logo} alt={item.name} className="object-contain h-20 w-20" /> {/* Adjusted size */}
                        </aside>
                        <h3>{item.name}</h3>
                      </Link>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>
          </div>
          <div className={`relative flex justify-center text-center animate-bounce z-[2]`}>
            <button data-aos="fade-left" data-aos-duration="1000" data-aos-delay="500" className={` cursor-pointer duration-700 ease-in-out ${moveToggle ? '-rotate-90' : 'rotate-90'}`} onClick={onMoveToggle}>
              <img className="max-h-8" src={BackIcon} alt="Toggle Subscriptions" />
            </button>
          </div>
        </main>
        <main className={`relative pt-[20vh] mt-10 duration-500 ease-linear z-[1] -mb-40 ${moveToggle ? '-translate-y-[70vh]' : '-translate-y-[90vh]'}`}>
          <YourSubscriptions moveToggle={moveToggle} />
        </main>
      </div>
      <DownNavbar />
    </section>
  )
}

export default Home;
