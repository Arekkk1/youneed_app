import React, {useState, useEffect} from 'react'
// Import the SVG directly
import Logo from '../../assets/images/youneed_logo_white.png';

const LogoAnime = ({textColor, lgColor}) => { // lgColor prop seems unused with direct SVG import

    const [rotationClass, setRotationClass] = useState(false);

    useEffect(() => {
      const timeoutId = setTimeout(() => {
        setRotationClass(true); // This state seems unused as well
      }, 1000);

      return () => clearTimeout(timeoutId);
    }, []); // [] as dependency array to run only once

  return (
    <section className='flex justify-center text-center'>
      {/* Use the imported SVG */}
      <img src={Logo} alt="YouNeed Logo" className='object-contain max-w-40' />
      {/* Removed the complex SVG structure as we are using a simple img tag now */}
    </section>
  )
}

export default LogoAnime;
