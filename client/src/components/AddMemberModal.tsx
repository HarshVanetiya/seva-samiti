import React, { useState, useEffect, useRef } from 'react';
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
import { memberService } from '../services/memberService';
import { addMemberSchema, type AddMemberFormData } from '../validations/schemas';

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AddMemberFormData>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      name: 'shri',
      fathersName: 'shri',
      mobile: '',
      membershipFee: 500,
      joiningDate: new Date().toISOString().split('T')[0],
      accountNumber: '',
    },
  });

  useEffect(() => {
    if (open) {
      // Small timeout to allow modal animation to complete/render
      const timer = setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
          const val = nameInputRef.current.value;
          // Move cursor to end
          nameInputRef.current.setSelectionRange(val.length, val.length);
        }
      }, 100); 
      return () => clearTimeout(timer);
    }
  }, [open]);

  const onSubmit = async (data: AddMemberFormData) => {
    setError('');
    setLoading(true);

    try {
      await memberService.create({
        name: data.name.trim().toUpperCase(),
        fathersName: data.fathersName.trim().toUpperCase(),
        mobile: data.mobile?.trim() || undefined,
        membershipFee: data.membershipFee,
        joiningDate: data.joiningDate,
        accountNumber: data.accountNumber?.trim() || undefined,
      });

      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to add member');
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
      title="Add New Member"
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
            {loading ? 'Adding...' : 'Add Member'}
          </Button>
        </>
      }
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}

        

        <TextField
          label="Name"
          {...register('name')}
          inputRef={(e) => {
            register('name').ref(e);
            nameInputRef.current = e;
          }}
          error={!!errors.name}
          helperText={errors.name?.message}
          required
          fullWidth
          placeholder="Enter member name"
          inputProps={{ style: { textTransform: 'uppercase' } }}
        />

        <TextField
          label="Father's Name"
          {...register('fathersName')}
          error={!!errors.fathersName}
          helperText={errors.fathersName?.message}
          required
          fullWidth
          placeholder="Enter father's name"
          inputProps={{ style: { textTransform: 'uppercase' } }}
        />
        
        <TextField
          label="Mobile (Optional)"
          {...register('mobile')}
          error={!!errors.mobile}
          helperText={errors.mobile?.message}
          fullWidth
          placeholder="Enter 10 digit mobile number"
        />

        <TextField
          label="Account Number (Optional)"
          {...register('accountNumber')}
          fullWidth
          placeholder="Leave blank to auto-generate"
          helperText={errors.accountNumber?.message}
          error={!!errors.accountNumber}
        />
        
        <Controller
          name="joiningDate"
          control={control}
          render={({ field }) => (
            <DatePicker
              label="Joining Date"
              format="DD/MM/YYYY"
              value={field.value ? dayjs(field.value) : null}
              onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.joiningDate,
                  helperText: errors.joiningDate?.message,
                  required: true,
                }
              }}
            />
          )}
        />

        <TextField
          label="Membership Fee"
          type="number"
          {...register('membershipFee', { valueAsNumber: true })}
          error={!!errors.membershipFee}
          helperText={errors.membershipFee?.message}
          required
          fullWidth
          inputProps={{ min: 0 }}
        />
      </Box>
    </Modal>
  );
};

export default AddMemberModal;
