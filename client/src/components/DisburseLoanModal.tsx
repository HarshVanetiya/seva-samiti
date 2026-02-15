import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import {
  TextField,
  Button,
  Box,
  Alert,
  Autocomplete,
} from '@mui/material';
import Modal from './Modal';
import { memberService } from '../services/memberService';
import { loanService } from '../services/loanService';
import type { Member } from '../services/memberService';
import { disburseLoanSchema, type DisburseLoanFormData } from '../validations/schemas';

interface DisburseLoanModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DisburseLoanModal: React.FC<DisburseLoanModalProps> = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [members, setMembers] = useState<Member[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DisburseLoanFormData>({
    resolver: zodResolver(disburseLoanSchema),
    defaultValues: {
      memberId: 0,
      principalAmount: 0,
      interestRate: 1,
      scheme: 'OLD_SCHEME',
    },
  });

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open]);

  const fetchMembers = async () => {
    try {
      const response = await memberService.getAll({ limit: 1000 });
      setMembers(response.data.members);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    }
  };

  const onSubmit = async (data: DisburseLoanFormData) => {
    setError('');
    setLoading(true);

    try {
      await loanService.create({
        memberId: data.memberId,
        principalAmount: data.principalAmount,
        interestRate: data.interestRate,
        scheme: data.scheme,
        loanDate: data.loanDate,
      });

      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to disburse loan');
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
      title="Disburse New Loan"
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
            {loading ? 'Disbursing...' : 'Disburse Loan'}
          </Button>
        </>
      }
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}
        
        <Controller
          name="memberId"
          control={control}
          render={({ field }) => (
            <Autocomplete
              options={members}
              getOptionLabel={(member) => `${member.name} (${member.accountNumber})`}
              value={members.find(m => m.id === field.value) || null}
              onChange={(_, newValue) => setValue('memberId', newValue?.id || 0)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Member"
                  autoFocus
                  required
                  error={!!errors.memberId}
                  helperText={errors.memberId?.message}
                  placeholder="Search by name or account number"
                />
              )}
            />
          )}
        />
        
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
                  required: true, 
                }
              }}
            />
          )}
        />

        <TextField
          label="Loan Amount (₹)"
          type="number"
          {...register('principalAmount', { valueAsNumber: true })}
          error={!!errors.principalAmount}
          helperText={errors.principalAmount?.message}
          required
          fullWidth
          inputProps={{ min: 1 }}
          placeholder="Enter loan amount"
        />
        
        <TextField
          label="Interest Rate (%)"
          type="number"
          {...register('interestRate', { valueAsNumber: true })}
          error={!!errors.interestRate}
          helperText={errors.interestRate?.message}
          required
          fullWidth
          inputProps={{ min: 0, max: 100, step: 0.1 }}
        />
      </Box>
    </Modal>
  );
};

export default DisburseLoanModal;
