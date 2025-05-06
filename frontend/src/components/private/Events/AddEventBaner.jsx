import React from 'react';
import PropTypes from 'prop-types';

const AddEventBaner = ({ sendValue, hour, selectedDate, isOccupied }) => {
  const handleClick = () => {
    sendValue();
  };

  // Ukrywamy przycisk dla zajętych godzin
  if (isOccupied) {
    return null;
  }

  return (
    <div className="mt-2">
      <button
        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        onClick={handleClick}
      >
        Dodaj zlecenie o {hour}
      </button>
    </div>
  );
};

AddEventBaner.propTypes = {
  sendValue: PropTypes.func.isRequired,
  hour: PropTypes.string.isRequired,
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  isOccupied: PropTypes.bool,
};

AddEventBaner.defaultProps = {
  isOccupied: false,
};

export default AddEventBaner;
