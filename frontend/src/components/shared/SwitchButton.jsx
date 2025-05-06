import React from 'react'
import { useState } from 'react';

function SwitchButton() {
  const [progress, setProgress] = useState();

  function switchButton(){
    setProgress(prevState => !prevState);
  }
    return (
      <div>
              <div className="bg-black my-5 w-full py-1 px-2 rounded-full">
            
                <div className='flex text-sm justify-between p-2' onClick={switchButton}>
                <div className={`w-full transition rounded-2xl duration-700 ease-in-out z-1 text-center px-3 py-2 whitespace-nowrap ${progress ? 'text-white bg-Grayscale-Gray70' : 'bg-black  text-Grayscale-Gray60'}`}>Your subscriptions </div>
                <div className={`w-full transition rounded-2xl duration-700 ease-in-out z-1 text-center px-3 py-2 ${!progress ? 'text-white bg-Grayscale-Gray70' : 'bg-black  text-Grayscale-Gray60'}`}>Upcoming bills</div>
                </div>
              </div>
        
      </div>
    );
  }
  
  export default SwitchButton;
