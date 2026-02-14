import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import {
  TextField,
  Button,
  Box,
  Alert,
} from '@mui/material';
import Modal from './Modal';
import { dashboardService } from '../services/dashboardService';
import { addDonationSchema, type AddDonationFormData } from '../validations/schemas';

interface AddDonationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddDonationModal: React.FC<AddDonationModalProps> = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AddDonationFormData>({
    resolver: zodResolver(addDonationSchema),
    defaultValues: {
      amount: 0,
      donorName: '',
      description: '',
    },
  });

  const onSubmit = async (data: AddDonationFormData) => {
    setError('');
    setLoading(true);

    try {
      await dashboardService.addDonation({
        amount: data.amount,
        donorName: data.donorName?.trim() || undefined,
        description: data.description?.trim() || undefined,
        date: data.date,
      });

      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to add donation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Donation"
      actions={
        <>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Donation'}
          </Button>
        </>
      }
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}
        
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <DatePicker
              label="Date"
              format="DD/MM/YYYY"
              value={field.value ? dayjs(field.value) : null}
              onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
              slotProps={{
                textField: {
                  fullWidth: true,
                }
              }}
            />
          )}
        />

        <TextField
          label="Donation Amount (₹)"
          type="number"
          {...register('amount', { valueAsNumber: true })}
          error={!!errors.amount}
          helperText={errors.amount?.message}
          required
          fullWidth
          inputProps={{ min: 1 }}
          placeholder="Enter donation amount"
        />
        
        <TextField
          label="Donor Name (Optional)"
          {...register('donorName')}
          error={!!errors.donorName}
          helperText={errors.donorName?.message}
          fullWidth
          placeholder="Enter donor's name"
        />
        
        <TextField
          label="Description (Optional)"
          {...register('description')}
          error={!!errors.description}
          helperText={errors.description?.message}
          fullWidth
          multiline
          rows={2}
          placeholder="Enter description or notes"
        />
      </Box>
    </Modal>
  );
};

export default AddDonationModal;
