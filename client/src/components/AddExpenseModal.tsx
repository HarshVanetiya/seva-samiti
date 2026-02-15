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
import { addExpenseSchema, type AddExpenseFormData } from '../validations/schemas';

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AddExpenseFormData>({
    resolver: zodResolver(addExpenseSchema),
    defaultValues: {
      amount: 0,
      description: '',
    },
  });

  const onSubmit = async (data: AddExpenseFormData) => {
    setError('');
    setLoading(true);

    try {
      await dashboardService.addExpense({
        amount: data.amount,
        description: data.description.trim(),
        date: data.date,
      });

      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to add expense');
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
      title="Add Expense"
      actions={
        <>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Expense'}
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
                  autoFocus: true,
                }
              }}
            />
          )}
        />

        <TextField
          label="Expense Amount (₹)"
          type="number"
          {...register('amount', { valueAsNumber: true })}
          error={!!errors.amount}
          helperText={errors.amount?.message}
          required
          fullWidth
          inputProps={{ min: 1 }}
          placeholder="Enter expense amount"
        />
        
        <TextField
          label="Description"
          {...register('description')}
          error={!!errors.description}
          helperText={errors.description?.message}
          required
          fullWidth
          multiline
          rows={2}
          placeholder="Describe the expense (e.g., 'Office supplies', 'Transport')"
        />
      </Box>
    </Modal>
  );
};

export default AddExpenseModal;
