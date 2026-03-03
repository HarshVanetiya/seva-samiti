import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Box,
  Typography,
  Divider,
  LinearProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Modal from './Modal';
import type { PaymentSummary } from '../services/loanService';

interface PaymentSummaryModalProps {
  open: boolean;
  onClose: () => void;
  summary: PaymentSummary | null;
}

const AUTO_CLOSE_SECONDS = 30;

const PaymentSummaryModal: React.FC<PaymentSummaryModalProps> = ({ open, onClose, summary }) => {
  const [countdown, setCountdown] = useState(AUTO_CLOSE_SECONDS);

  const handleClose = useCallback(() => {
    setCountdown(AUTO_CLOSE_SECONDS);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      setCountdown(AUTO_CLOSE_SECONDS);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, handleClose]);

  if (!summary) return null;

  const progress = ((AUTO_CLOSE_SECONDS - countdown) / AUTO_CLOSE_SECONDS) * 100;
  const formattedDate = summary.paymentDate
    ? new Date(summary.paymentDate).toLocaleDateString('en-GB')
    : 'N/A';

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Payment Receipt"
      actions={
        <Button variant="contained" onClick={handleClose} autoFocus>
          OK ({countdown}s)
        </Button>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        {/* Progress bar for auto-close countdown */}
        <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 1 }} />

        {/* Success / Warning Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
          {summary.newPending > 0 ? (
            <>
              <WarningAmberIcon color="warning" fontSize="large" />
              <Typography variant="h6" color="warning.main" fontWeight={700}>
                Partial Payment Recorded
              </Typography>
            </>
          ) : (
            <>
              <CheckCircleIcon color="success" fontSize="large" />
              <Typography variant="h6" color="success.main" fontWeight={700}>
                Payment Successful
              </Typography>
            </>
          )}
        </Box>

        <Divider />

        {/* Member Info */}
        <Box>
          <Typography variant="body2" color="text.secondary">Member</Typography>
          <Typography variant="body1" fontWeight={600}>
            {summary.memberName} ({summary.accountNumber})
          </Typography>
        </Box>

        <Divider />

        {/* Payment Details */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">Interest Paid</Typography>
            <Typography variant="body1" fontWeight={600}>₹{summary.interestPaid.toLocaleString()}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Principal Paid</Typography>
            <Typography variant="body1" fontWeight={600}>₹{summary.principalPaid.toLocaleString()}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Total Paid</Typography>
            <Typography variant="h6" color="primary.main" fontWeight={700}>₹{summary.totalPaid.toLocaleString()}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Payment Date</Typography>
            <Typography variant="body1" fontWeight={600}>{formattedDate}</Typography>
          </Box>
        </Box>

        <Divider />

        {/* Pending & Balance */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          {summary.previousPending > 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary">Previous Pending</Typography>
              <Typography variant="body1" fontWeight={600}>₹{summary.previousPending.toLocaleString()}</Typography>
            </Box>
          )}
          <Box>
            <Typography variant="body2" color="text.secondary">
              {summary.newPending > 0 ? 'New Pending Interest' : 'Pending Interest'}
            </Typography>
            <Typography
              variant="body1"
              fontWeight={700}
              color={summary.newPending > 0 ? 'warning.main' : 'success.main'}
            >
              ₹{summary.newPending.toLocaleString()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Remaining Loan Balance</Typography>
            <Typography variant="body1" fontWeight={600}>₹{summary.remainingBalance.toLocaleString()}</Typography>
          </Box>
          {summary.loanStatus === 'COMPLETED' && (
            <Box>
              <Typography variant="body2" color="text.secondary">Loan Status</Typography>
              <Typography variant="body1" fontWeight={700} color="success.main">
                ✅ COMPLETED
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default PaymentSummaryModal;
