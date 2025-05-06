import CircularProgress from '@mui/joy/CircularProgress'; // Assuming @mui/joy is installed and configured
import React from 'react'
import { Link } from 'react-router-dom';
import SwitchButton from '../../shared/SwitchButton';
import { subscriptionArray } from '../../../constents';
// Import SVG logo
import logoSvg from '../../../assets/icon/Logo.svg';


function YourSubscriptions({moveToggle}) {
  const [progress, setProgress] = React.useState(0); // Progress state seems unused

  // Removed useEffect for progress timer as it wasn't used

  return (
<section className={`grid content-around h-[20vh] md:h-[30vh] ${moveToggle ? '-mb-32 md:-mb-52' : '-mb-80'}`}>
  <div className='style-flex'>
  <div className='mx-auto w-fit md:w-96 -mt-32'>

  <div className='border mx-auto w-fit border-Grayscale-Gray70 border-dashed p-4 rounded-full'>
<div className='customShadowRouded rounded-full'>
<Link to="/events"> {/* Consider linking to a specific subscription page */}
<CircularProgress sx={{ '--CircularProgress-size': '200px', '--CircularProgress-progressColor': '#FF7966' }} variant="plain" determinate value={66.67}>

<div className='customShadowRouded p-6 grid content-around rounded-full'>
 <div className='text-white text-center font-semibold'>
  <h1>
  $1,235 {/* Placeholder value */}
  </h1>
  <h4 className='text-xs py-2 text-Grayscale-Gray40'>This month bills</h4>
  </div>
  <button className='btn-sm cursor-pointer bg-Grayscale-Gray70 text-white'>See your budget</button> {/* Changed to button */}
  </div>

</CircularProgress>
</Link>
</div>
</div>


<div className="style-flex mt-2">
<main className="text-white font-semibold">
  <div className='flex flex-row gap-x-2 justify-around'>
  <Link to='/events'> {/* Link to relevant page */}
  <div className='h-0.5 translate-y-0.5 mx-auto btn-primary w-14 rounded-full'></div>
  <button className='btn-sq h-16 w-24 py-4 flex-wrap style-flex bg-Grayscale-Gray70'>
    <p className='font-normal text-Grayscale-Gray30 text-[10px]'>Active subs</p>
    <p className=''>12</p> {/* Placeholder value */}
  </button>
  </Link>
  <Link to='/watch'> {/* Link to relevant page */}
  <div className='h-0.5 translate-y-0.5 mx-auto btn-primary w-14 rounded-full'></div>
  <button className='btn-sq h-16 w-24 py-4 flex-wrap style-flex bg-Grayscale-Gray70'>
    <p className='font-normal text-Grayscale-Gray30 text-[10px]'>Highest subs</p>
    <p className=''>$19.99</p> {/* Placeholder value */}
  </button>
  </Link>
  <Link to='/watch'> {/* Link to relevant page */}
  <div className='h-0.5 translate-y-0.5 mx-auto btn-primary w-14 rounded-full'></div>
  <button className='btn-sq h-16 w-24 py-4 flex-wrap style-flex bg-Grayscale-Gray70'>
    <p className='font-normal text-Grayscale-Gray30 text-[10px]'>Lowest subs</p>
    <p className=''>$5.99</p> {/* Placeholder value */}
  </button>
  </Link>
  </div>
</main>

</div>
<div className='overflow-hidden relative'>
<SwitchButton />
<div className='flex text-Grayscale-Gray40 flex-col gap-2 overflow-auto md:h-64 h-40 scrollbar-none'>
  {subscriptionArray.map((item) => ( // Removed index as key, use item.id
                  <div key={item.id}> {/* Use unique item.id as key */}
  <div className='flex items-center justify-between border relative z-[-10] border-Grayscale-Gray60 rounded-xl p-3'>
    <div className='flex items-center space-x-4'>
    {/* Use the imported SVG logo */}
    <img src={logoSvg} alt={item.name} className='aspect-square p-1 w-12 rounded-xl bg-Grayscale-Gray70' />
    <p>{item.name}</p>
    </div>
    {/* Display price or status */}
    <p className='text-white'>{item.price === 'Trial' ? 'Trial End' : item.price}</p>
  </div>
  </div>
           ))}

  {/* Removed commented out duplicate elements */}
</div>
</div>
</div>
</div>

</section>
  )
}

export default YourSubscriptions;
