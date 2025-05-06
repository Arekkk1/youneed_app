import React from 'react';
import Settings from '../Settings'; // Reuse the general Settings component

function ClientProfile() {
  // The Settings component handles fetching and updating profile data.
  // We just need to pass the correct role.
  return (
    <div>
      {/* Optional: Add a Client-specific header or other elements */}
      {/* <h1 className="text-3xl font-bold p-6">Mój Profil</h1> */}
      <Settings role="client" />
    </div>
  );
}

export default ClientProfile;
