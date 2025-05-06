import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api'; // Corrected path relative to this file
import Step1Industry from './ProviderRegister/Step1Industry';
import Step2About from './ProviderRegister/Step2About';
import Step3SmsCode from './ProviderRegister/Step3SmsCode';
import Step4Company from './ProviderRegister/Step4Company';
import Step5Goals from './ProviderRegister/Step5Goals';
import Step6Visibility from './ProviderRegister/Step6Visibility';
import Step7Congratulations from './ProviderRegister/Step7Congratulations';
import LogoAnime from '../shared/LogoAnime';
import Logo from '../../assets/images/youneed_logo_white.png'; // Corrected path assuming Logo.svg is here

// This component now handles the full multi-step PROVIDER registration process.

const ProviderRegistration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // --- Core Registration Fields ---
    email: '',
    password: '',
    industry: '',
    firstName: '',
    lastName: '',
    companyName: '',
    acceptTerms: false,
    marketingConsent: false,
    partnerConsent: false,
    // --- SMS Verification ---
    phoneNumber: '+48', // Default country code
    phoneNumberVerified: false, // Track verification status
    // --- Additional Profile Fields (Collected in later steps) ---
    addressStreet: '',
    addressApartment: '', // Keep if needed, or remove if street includes it
    addressCity: '',
    addressPostalCode: '',
    serviceLocation: [], // Consider how to handle this - maybe a simple text area for now?
    employees: '', // Number or range
    openingHours: Array(7).fill({ isOpen: true, openTime: '08:00', closeTime: '16:00' }),
    services: [], // List of services offered
    goals: [], // Provider goals
    tutorialNeeded: false,
    visibilityStartDate: '',
    // --- Post-Registration State ---
    userId: null, // Will be set after successful registration
    token: null, // Will be set after successful registration
    registrationError: '', // Store registration API errors
    profileUpdateError: '', // Store profile update API errors (for steps 4-7)
    backendErrors: null, // Store specific field errors from backend validation
  });

  // Function to update form data centrally - wrapped in useCallback
  const updateFormData = useCallback((newData) => {
    setFormData(prev => ({
        ...prev,
        ...newData,
        registrationError: '', // Clear general error on data update
        profileUpdateError: '', // Clear profile error on update
        backendErrors: null, // Clear specific field errors on data update
    }));
  }, []); // Pusta tablica zależności zapewnia stabilną referencję funkcji


  // Function to handle the initial registration API call (triggered from Step 2)
  const handleRegistrationSubmit = async (step2Data) => {
    // Update state with Step 2 data first using functional update
    // This ensures we have the latest step2Data merged before making the API call
    let combinedData;
    setFormData(prev => {
        combinedData = { ...prev, ...step2Data };
        return combinedData;
    });

    const registrationPayload = {
      firstName: combinedData.firstName,
      lastName: combinedData.lastName,
      email: combinedData.email,
      password: combinedData.password,
      role: 'provider',
      terms: {
        acceptTerms: combinedData.acceptTerms,
        marketingConsent: combinedData.marketingConsent,
        partnerConsent: combinedData.partnerConsent,
      },
      industry: combinedData.industry,
      companyName: combinedData.companyName,
      // Include phoneNumber if collected earlier, otherwise it might be null/empty
      // phoneNumber: combinedData.phoneNumber, // Uncomment if needed by backend during initial registration
    };

    console.log("Submitting Registration Payload:", registrationPayload); // Debug log

    try {
      const response = await api.post('/auth/register', registrationPayload);
      console.log("Registration Response Received:", response); // Log the whole response

      // --- CORRECTED CHECK ---
      // Check for token and user.id within response.data.data
      if (response.data && response.data.status === 'success' && response.data.data && response.data.data.token && response.data.data.user && response.data.data.user.id) {
        console.log("Registration successful, token and user ID received.");
        const { user, token } = response.data.data; // Extract user and token from the nested data object

        // SUCCESS! Store token, user ID, clear error, advance to Step 3 (SMS)
        localStorage.setItem('token', token); // Store token for subsequent API calls
        localStorage.setItem('userId', user.id);
        localStorage.setItem('role', user.role);

        // Update state with user ID and token, clear errors using functional update
        // This ensures the state update completes before setStep
        setFormData(prev => ({
          ...prev,
          ...step2Data, // Re-apply step2Data to be safe
          userId: user.id, // Use user.id from response
          token: token, // Use token from response
          registrationError: '',
          backendErrors: null,
        }));
        // Now advance the step
        setStep(3); // Move to SMS verification
        console.log("Navigating to Step 3.");

      } else {
        // Handle unexpected success response structure OR if status is not 'success'
        console.error("Registration succeeded (status 2xx) but response structure is unexpected or status is not 'success':", response.data);
        // Use functional update to set the error based on previous state
        setFormData(prev => ({
            ...prev,
            ...step2Data, // Keep step 2 data
            // Use backend message if available, otherwise generic error
            registrationError: response.data?.message || 'Rejestracja zakończona, ale wystąpił nieoczekiwany błąd odpowiedzi serwera.',
            backendErrors: null, // Clear specific errors
        }));
      }
    } catch (err) {
        const message = err.response?.data?.message || 'Wystąpił błąd podczas rejestracji.';
        const errors = err.response?.data?.errors; // Capture validation errors if available
        console.error('Registration API Error:', err.response || err);

        // Store general error and specific field errors if available using functional update
        setFormData(prev => ({
            ...prev,
            ...step2Data, // Keep step 2 data
            registrationError: message,
            backendErrors: errors || null // Store the errors object
        }));
        // Do NOT advance step on error
    }
  };


  // Function to handle advancing steps and potentially saving profile data (Steps 3+)
  const handleNext = async (newData) => {
    // Update central state first using functional update
    let currentFormData;
    setFormData(prev => {
        currentFormData = { ...prev, ...newData };
        return currentFormData;
    });

    const currentStep = step; // Capture current step before potential async operations

    // --- Logic for Profile Updates (Steps 4-7) ---
    // Example: Incremental save after Step 4 (Company Details)
    if (currentStep === 4) {
      const profilePayload = {
         // companyName: currentFormData.companyName, // Only send if it's part of Step 4 form
         address: {
             street: currentFormData.addressStreet,
             apartment: currentFormData.addressApartment,
             city: currentFormData.addressCity,
             postalCode: currentFormData.addressPostalCode,
         },
         // Include other fields collected in Step 4 if any
         // employees: currentFormData.employees, // Example if collected here
         // openingHours: currentFormData.openingHours, // Example if collected here
      };
      try {
        console.log("Attempting profile update after Step 4:", profilePayload);
        // Ensure the token is set in the API headers (AuthContext should handle this)
        // --- CORRECTED URL ---
        await api.put('/profile', profilePayload); // Use the correct endpoint
        console.log("Profile updated successfully after Step 4");
        setFormData(prev => ({ ...prev, profileUpdateError: '' })); // Clear profile error on success
        setStep(prevStep => prevStep + 1); // Advance step on success
      } catch (err) {
         const message = err.response?.data?.message || 'Błąd podczas zapisywania danych firmy.';
         console.error('Profile Update Error (Step 4):', err.response || err);
         setFormData(prev => ({ ...prev, profileUpdateError: message }));
         // Decide if you want to block progression or just show an error
         // return; // Optional: Stop progression on error
      }
    } else {
        // For other steps (like 5, 6) where we might just collect data
        // or if profile update wasn't needed/successful in step 4
        setStep(prevStep => prevStep + 1);
    }
    // Add similar blocks for Step 5 and Step 6 if saving incrementally
  };

  // Function to handle going back
  const handlePrevious = () => {
    if (step > 1) {
      // Clear errors specific to the step being left? Optional.
      setFormData(prev => ({ ...prev, registrationError: '', profileUpdateError: '', backendErrors: null }));
      setStep(step - 1);
    }
  };

  // Function specifically for Step 3 (SMS) completion
  const handleSmsVerified = () => {
    console.log("SMS Verified, moving to Step 4.");
    // Use functional update to ensure state is set before advancing
    setFormData(prev => ({ ...prev, phoneNumberVerified: true, profileUpdateError: '' /* Clear potential SMS errors */ }));
    setStep(4); // Move to Step 4 after successful SMS verification
  };

  const renderStep = () => {
    console.log("Rendering Step:", step, " User ID:", formData.userId); // Log current step and userId
    switch (step) {
      case 1:
        return <Step1Industry formData={formData} updateFormData={updateFormData} onNext={() => setStep(2)} />;
      case 2:
        return <Step2About formData={formData} onSubmitRegistration={handleRegistrationSubmit} onPrevious={handlePrevious} />;
      case 3:
        // Ensure userId is passed correctly. If it's null, Step 3 shouldn't render or should show an error.
        if (!formData.userId) {
            console.error("Attempting to render Step 3 without a userId!");
            // Optionally redirect or show an error message
            // navigate('/login'); // Or show a specific error component
            return <div className="text-red-500 text-center">Błąd: Brak ID użytkownika. Nie można kontynuować weryfikacji SMS. Spróbuj ponownie przejść rejestrację.</div>;
        }
        return <Step3SmsCode formData={formData} userId={formData.userId} onVerified={handleSmsVerified} onPrevious={handlePrevious} />;
      case 4:
        return <Step4Company formData={formData} onNext={handleNext} onPrevious={handlePrevious} />;
      case 5:
        return <Step5Goals formData={formData} onNext={handleNext} onPrevious={handlePrevious} />;
      case 6:
        return <Step6Visibility formData={formData} onNext={handleNext} onPrevious={handlePrevious} />;
      case 7:
        return <Step7Congratulations formData={formData} /* onFinish={handleFinalProfileSave} */ />;
      default:
        navigate('/login');
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center py-12 px-4">
      <div className="relative z-10 bg-Grayscale-Gray80 px-5 md:px-20 py-10 rounded-2xl max-w-lg w-full"> {/* Increased max-w */}
        <LogoAnime textColor="text-white" lgColor={Logo} />
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          Rejestracja Usługodawcy
        </h2>
        <p className="text-sm text-Grayscale-Gray50 text-center mb-6">
          Krok {step} z 7
        </p>
        {/* Display registration error prominently if it occurs (typically after Step 2 submit) */}
        {/* Make sure this doesn't show if backendErrors exist */}
        {formData.registrationError && !formData.backendErrors && (
          <p className="text-red-500 text-sm text-center mb-4 bg-red-900/30 p-2 rounded">{formData.registrationError}</p>
        )}
         {/* Display profile update error prominently if it occurs (Steps 4+) */}
         {formData.profileUpdateError && (
          <p className="text-red-500 text-sm text-center mb-4 bg-red-900/30 p-2 rounded">{formData.profileUpdateError}</p>
        )}
        {renderStep()}
      </div>
    </div>
  );
};

export default ProviderRegistration;
