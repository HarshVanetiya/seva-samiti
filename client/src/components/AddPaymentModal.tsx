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
  Typography,
} from '@mui/material';
import Modal from './Modal';
import { loanService } from '../services/loanService';
import type { Loan } from '../services/loanService';
import { addPaymentSchema, type AddPaymentFormData } from '../validations/schemas';

interface AddPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  loan: Loan | null;
}

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ open, onClose, onSuccess, loan }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddPaymentFormData>({
    resolver: zodResolver(addPaymentSchema),
    defaultValues: {
      interestPaid: 0,
      principalPaid: 0,
    },
  });

  const onSubmit = async (data: AddPaymentFormData) => {
    setError('');
    setLoading(true);

    try {
      if (!loan) {
        throw new Error('No loan selected');
      }

      await loanService.addPayment(loan.id, {
        interestPaid: data.interestPaid,
        principalPaid: data.principalPaid,
        paymentDate: data.paymentDate,
      });

      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to add payment');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    reset();
    onClose();
  };

  const [fullLoan, setFullLoan] = useState<Loan | null>(null);

  useEffect(() => {
    if (open && loan) {
      setLoading(true); // Reuse loading state or create a specific one? Reuse might disable buttons which is fine.
      loanService.getById(loan.id)
        .then((response) => {
          setFullLoan(response.data.loan);
        })
        .catch((err) => {
          console.error('Failed to fetch loan details:', err);
          setError('Failed to load loan details for calculation');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
        setFullLoan(null);
    }
  }, [open, loan]);

  const paymentDate = watch('paymentDate');

  // Removed early return here: if (!loan) return null;

  const displayLoan = fullLoan || loan;

  // 1. Determine Last Payment Date
  // If payments exist, use the most recent payment date. Otherwise, use the loan creation date.
  const lastPaymentDate = displayLoan?.payments && displayLoan.payments.length > 0
    ? displayLoan.payments[0].paymentDate // Assuming payments are ordered by date desc from backend
    : displayLoan?.loanDate;

  // 2. Calculate Time Period (Months)
  // Logic: Count full months. e.g., Feb to Oct = 8 months.
  const calculateMonths = (startDateStr?: string, endDateStr?: string) => {
    if (!startDateStr || !endDateStr) return 0;
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    // Calculate difference in months
    // (Year2 - Year1) * 12 + (Month2 - Month1)
    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    
    // If the day of the end date is explicitly before the day of start date?
    // User requirement: "no matter when last payment date was in 1st of that month or 30th count time period on basis of month only"
    // So distinct month difference is strictly what they requested.
    
    return Math.max(0, months);
  };

  const monthsPassed = calculateMonths(lastPaymentDate, paymentDate);

  // 3. Calculate Interest Per Month
  // OLD_SCHEME: Interest on Original Principal
  // NEW_SCHEME: Interest on Remaining Balance
  // Handle case where displayLoan might be null safely (though we won't render if it is)
  const interestPerMonth = displayLoan
    ? (displayLoan.scheme === 'OLD_SCHEME'
        ? Math.round(displayLoan.principalAmount * (displayLoan.interestRate / 100))
        : Math.round(displayLoan.remainingBalance * (displayLoan.interestRate / 100)))
    : 0;

  // 4. Calculate Total Suggested Interest
  const totalSuggestedInterest = monthsPassed * interestPerMonth;

  // Auto-fill suggested interest
  useEffect(() => {
    setValue('interestPaid', totalSuggestedInterest);
  }, [totalSuggestedInterest, setValue]);

  if (!loan || !displayLoan) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Loan Payment"
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
            {loading ? 'Adding...' : 'Add Payment'}
          </Button>
        </>
      }
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}
        
        {/* Loan Info */}
        <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Loan Details
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Member:</strong> {displayLoan.member?.name} ({displayLoan.member?.accountNumber})
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Remaining Balance:</strong> ₹{displayLoan.remainingBalance.toLocaleString()}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Scheme:</strong> {displayLoan.scheme === 'OLD_SCHEME' ? 'Old (Interest on Original)' : 'New (Interest on Remaining)'} ({displayLoan.interestRate}%)
          </Typography>
          
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'grey.300' }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Interest Calculation
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Last Payment Date:</strong> {lastPaymentDate ? new Date(lastPaymentDate).toLocaleDateString('en-GB') : 'N/A'}
            </Typography>
             <Typography variant="body2" gutterBottom>
              <strong>Time Period:</strong> {monthsPassed} month{monthsPassed !== 1 ? 's' : ''}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Interest Per Month:</strong> ₹{interestPerMonth.toLocaleString()}
            </Typography>
            <Typography variant="subtitle1" color="primary" sx={{ mt: 1, fontWeight: 'bold' }}>
              Suggested Interest: ₹{totalSuggestedInterest.toLocaleString()}
            </Typography>
          </Box>
        </Box>
        
        <Controller
          name="paymentDate"
          control={control}
          render={({ field }) => (
            <DatePicker
              label="Payment Date"
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
          label="Interest Amount (₹)"
          type="number"
          {...register('interestPaid', { valueAsNumber: true })}
          error={!!errors.interestPaid}
          helperText={errors.interestPaid?.message || `Suggested for ${monthsPassed} months: ₹${totalSuggestedInterest}`}
          fullWidth
          
          inputProps={{ min: 0 }}
          placeholder={`Suggested: ₹${totalSuggestedInterest}`}
        />
        
        <TextField
          label="Principal Amount (₹)"
          type="number"
          {...register('principalPaid', { valueAsNumber: true })}
          error={!!errors.principalPaid}
          helperText={errors.principalPaid?.message || `Maximum: ₹${displayLoan.remainingBalance.toLocaleString()}`}
          fullWidth
          inputProps={{ min: 0, max: displayLoan.remainingBalance }}
        />
      </Box>
    </Modal>
  );
};

export default AddPaymentModal;
