import React, {useState} from 'react'
// Import SVG directly
import CloseIcon from '../../assets/icon/light-close.svg';

const TaskCreate = ({sendValue}) =>  {
    const [nameEvent, setNameEvent] = useState('');
    const [link, setLink] = useState('');
    const [description, setDescription] = useState(''); // Added state for description

    // Function to handle closing the modal/task creation form
    const handleClose = () => {
        if (sendValue && typeof sendValue === 'function') {
            sendValue(); // Call the passed function to close
        }
    };

  return (
    // Improved positioning and styling for modal appearance
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
        <div className='bg-white text-neutral-700 p-6 rounded-lg shadow-xl w-full max-w-md relative'>
            <button
                onClick={handleClose}
                className="absolute top-2 right-2 text-neutral-500 hover:text-neutral-800"
                aria-label="Close task creation"
            >
                <img src={CloseIcon} alt="Close" className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold mb-4 text-center">Utwórz nowe spotkanie</h3>

            <form className="space-y-4">
                <div>
                    <label htmlFor="eventName" className="block font-bold mb-1 text-sm">Nazwa wydarzenia*</label>
                    <input
                        id="eventName"
                        placeholder='Podaj nazwę wydarzenia'
                        value={nameEvent}
                        onChange={(e) => setNameEvent(e.target.value)}
                        // Basic validation styling example
                        className={`input-style border ${nameEvent.trim() === '' ? 'border-red-500 ring-1 ring-red-500 placeholder:text-red-400' : 'border-gray-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500'} outline-none`}
                        required // Added HTML5 required attribute
                    />
                     {nameEvent.trim() === '' && <p className="text-red-500 text-xs mt-1">Nazwa wydarzenia jest wymagana.</p>}
                </div>

                <div>
                    <label htmlFor="eventDescription" className="block font-bold mb-1 text-sm">Opis wydarzenia</label>
                    <textarea
                        id="eventDescription"
                        placeholder="Dodaj opis..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="input-style border border-gray-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none h-24 resize-none" // Added height and disabled resize
                    />
                    {/* Rich text editor could replace textarea if needed */}
                    {/* <RichEditor valueChange={receiveValueFromChild} /> */}
                </div>

                <div>
                    <label htmlFor="eventLink" className="block font-bold mb-1 text-sm">Link do wideokonferencji</label>
                    <input
                        id="eventLink"
                        type="url" // Use type="url" for better validation/input handling
                        placeholder="np. https://meet.google.com/..."
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="input-style border border-gray-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                    />
                </div>

                <div className="flex justify-end pt-4">
                     <button
                         type="button" // Prevent default form submission
                         onClick={handleClose}
                         className="btn-sm bg-gray-200 text-gray-700 hover:bg-gray-300 mr-2 rounded-lg"
                     >
                         Anuluj
                     </button>
                     <button
                         type="submit" // Or handle submit logic here
                         className="btn-sm bg-sky-500 text-white hover:bg-sky-600 rounded-lg"
                         // Add disabled state based on validation if needed
                     >
                         Utwórz
                     </button>
                 </div>
            </form>
        </div>
    </div>
  )
}

export default TaskCreate;
