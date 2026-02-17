import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import {
  Button,
  Box,
  Alert,
  TextField,
} from '@mui/material';
import Modal from './Modal';
import { loanService } from '../services/loanService';
import type { Loan } from '../services/loanService';

const editLoanSchema = z.object({
  loanDate: z.string().min(1, 'Loan date is required'),
});

type EditLoanFormData = z.infer<typeof editLoanSchema>;

interface EditLoanModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  loan: Loan | null;
}

const EditLoanModal: React.FC<EditLoanModalProps> = ({ open, onClose, onSuccess, loan }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EditLoanFormData>({
    resolver: zodResolver(editLoanSchema),
    defaultValues: {
      loanDate: '',
    },
  });

  useEffect(() => {
    if (loan && open) {
      setValue('loanDate', dayjs(loan.loanDate).format('YYYY-MM-DD'));
    }
  }, [loan, open, setValue]);

  const onSubmit = async (data: EditLoanFormData) => {
    if (!loan) return;
    setError('');
    setLoading(true);

    try {
      await loanService.update(loan.id, {
        loanDate: data.loanDate,
      });

      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update loan');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    reset();
    onClose();
  };

  if (!loan) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Edit Loan"
      actions={
        <>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}
        
        <Controller
          name="loanDate"
          control={control}
          render={({ field }) => (
            <DatePicker
              label="Loan Date"
              format="DD/MM/YYYY"
              value={field.value ? dayjs(field.value) : null}
              onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.loanDate,
                  helperText: errors.loanDate?.message
                }
              }}
            />
          )}
        />
      </Box>
    </Modal>
  );
};

export default EditLoanModal;
