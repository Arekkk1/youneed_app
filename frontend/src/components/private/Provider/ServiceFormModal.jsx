import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, IconButton, Grid } from '@mui/material';
import { X, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Profanity Filter Note: Input validation, including profanity checks,
// should ideally be performed on the backend before saving data to the database
// for better security and consistency. Libraries like 'bad-words' can be used in Node.js.

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 500,
  bgcolor: 'background.paper', // Uses theme's background
  border: '1px solid #ccc',
  borderRadius: 2, // Equivalent to rounded-lg
  boxShadow: 24,
  p: 4, // Padding
  color: 'text.primary', // Uses theme's text color
  // Add dark mode considerations if using Material UI theme switching
  // '@media (prefers-color-scheme: dark)': {
  //   bgcolor: '#424242', // Example dark background
  //   color: '#fff',
  //   borderColor: '#666',
  // },
};

function ServiceFormModal({ isOpen, onClose, onSave, serviceData, mode }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '', // Duration in minutes
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (mode === 'edit' && serviceData) {
      setFormData({
        name: serviceData.name || '',
        description: serviceData.description || '',
        // Ensure price and duration are strings for the TextField
        price: serviceData.price != null ? String(serviceData.price) : '',
        duration: serviceData.duration != null ? String(serviceData.duration) : '',
      });
    } else {
      // Reset for create mode
      setFormData({ name: '', description: '', price: '', duration: '' });
    }
    setErrors({}); // Clear errors when modal opens or data changes
  }, [isOpen, serviceData, mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear specific error on change
    if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
      const newErrors = {};
      if (!formData.name.trim()) {
          newErrors.name = 'Nazwa usługi jest wymagana.';
      } else if (formData.name.length > 100) {
          newErrors.name = 'Nazwa usługi jest za długa (max 100 znaków).';
      }

      if (formData.description.length > 500) {
          newErrors.description = 'Opis jest za długi (max 500 znaków).';
      }

      const priceValue = parseFloat(formData.price);
      if (formData.price === '' || isNaN(priceValue) || priceValue < 0) {
          newErrors.price = 'Cena musi być poprawną liczbą nieujemną (np. 0, 50, 120.50).';
      }

      const durationValue = parseInt(formData.duration, 10);
      if (formData.duration === '' || isNaN(durationValue) || durationValue <= 0 || !Number.isInteger(durationValue)) {
          newErrors.duration = 'Czas trwania musi być dodatnią liczbą całkowitą (w minutach, np. 30, 60, 90).';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0; // Return true if no errors
  };


  const handleSave = (e) => {
    e.preventDefault(); // Prevent default form submission if wrapped in <form>
    if (validateForm()) {
        // Pass validated and potentially type-converted data
        onSave({
            ...formData,
            price: parseFloat(formData.price),
            duration: parseInt(formData.duration, 10)
        });
    } else {
        toast.error("Proszę poprawić błędy w formularzu.");
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="service-form-modal-title"
      aria-describedby="service-form-modal-description" // Added for accessibility
    >
      {/* Using Box with sx for styling */}
      <Box sx={modalStyle} component="form" onSubmit={handleSave} noValidate>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography id="service-form-modal-title" variant="h6" component="h2">
            {mode === 'edit' ? 'Edytuj Usługę' : 'Dodaj Nową Usługę'}
          </Typography>
          <IconButton onClick={onClose} size="small" aria-label="Zamknij">
            <X />
          </IconButton>
        </Box>

        <Typography id="service-form-modal-description" sx={{ mb: 2, fontSize: '0.9rem', color: 'text.secondary' }}>
            Wprowadź szczegóły usługi. Pola oznaczone gwiazdką (*) są wymagane.
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Nazwa usługi"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
              margin="dense"
              size="small"
              error={!!errors.name}
              helperText={errors.name || ' '} // Reserve space for helper text
              inputProps={{ maxLength: 100 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Opis (opcjonalnie)"
              name="description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              margin="dense"
              size="small"
              error={!!errors.description}
              helperText={errors.description || ' '} // Reserve space
              inputProps={{ maxLength: 500 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Cena (PLN)"
              name="price"
              type="number" // Allows browser validation, but we rely on our parseFloat
              value={formData.price}
              onChange={handleChange}
              fullWidth
              required
              margin="dense"
              size="small"
              InputProps={{ inputProps: { min: 0, step: "0.01" } }}
              error={!!errors.price}
              helperText={errors.price || ' '} // Reserve space
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Czas trwania (minuty)"
              name="duration"
              type="number" // Allows browser validation
              value={formData.duration}
              onChange={handleChange}
              fullWidth
              required
              margin="dense"
              size="small"
              InputProps={{ inputProps: { min: 1, step: "1" } }} // Only positive integers
              error={!!errors.duration}
              helperText={errors.duration || ' '} // Reserve space
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={onClose} variant="outlined" color="secondary">
              Anuluj
          </Button>
          <Button type="submit" variant="contained" color="primary" startIcon={<Save size="1rem" />}>
            Zapisz {mode === 'edit' ? 'Zmiany' : 'Usługę'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

export default ServiceFormModal;
