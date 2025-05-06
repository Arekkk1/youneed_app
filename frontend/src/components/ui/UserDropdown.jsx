import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownItem } from './Dropdown';

const UserDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
      >
        <img
          src="/images/user-placeholder.png"
          alt="User"
          className="w-8 h-8 rounded-full"
        />
        <span className="hidden lg:block">Użytkownik</span>
      </button>
      <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-48 p-2">
        <DropdownItem
          tag="a"
          to="/dashboard/provider/profile"
          onItemClick={closeDropdown}
          className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          Profil
        </DropdownItem>
        <DropdownItem
          onItemClick={() => {
            closeDropdown();
            handleLogout();
          }}
          className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          Wyloguj
        </DropdownItem>
      </Dropdown>
    </div>
  );
};

export default UserDropdown;
