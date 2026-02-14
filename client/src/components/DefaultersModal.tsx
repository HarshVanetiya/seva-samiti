import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Button,
} from '@mui/material';
import Modal from './Modal';
import { loanService } from '../services/loanService';
import { formatDate } from '../utils/dateUtils';
import dayjs from 'dayjs';

interface DefaultersModalProps {
  open: boolean;
  onClose: () => void;
}

interface OverdueLoan {
  id: number;
  principalAmount: number;
  remainingBalance: number;
  loanDate: string;
  member: {
    id: number;
    name: string;
    accountNumber: string;
    mobile?: string;
  };
  payments: {
    paymentDate: string;
  }[];
}

const DefaultersModal: React.FC<DefaultersModalProps> = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [defaulters, setDefaulters] = useState<OverdueLoan[]>([]);

  useEffect(() => {
    if (open) {
      fetchDefaulters();
    }
  }, [open]);

  const fetchDefaulters = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch loans with no payments in the last 3 months
      const response = await loanService.getOverdue({ months: 3 });
      setDefaulters(response.data.overdueLoans);
    } catch (err: any) {
      console.error('Failed to fetch defaulters:', err);
      setError('Failed to load defaulters list');
    } finally {
      setLoading(false);
    }
  };

  const getMonthsOverdue = (loan: OverdueLoan) => {
    const lastPaymentDate = loan.payments.length > 0 
      ? loan.payments[0].paymentDate 
      : loan.loanDate;
      
    // Calculate full months passed
    return dayjs().diff(dayjs(lastPaymentDate), 'month');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Defaulters List (No Payment > 3 Months)"
      maxWidth="md"
      actions={
        <Button onClick={onClose}>
          Close
        </Button>
      }
    >
      <Box sx={{ minHeight: 400, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : defaulters.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
            <Typography variant="body1" color="text.secondary">
              No defaulters found. Good job!
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell>Loan Balance</TableCell>
                  <TableCell>Last Activity</TableCell>
                  <TableCell>Months Overdue</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {defaulters.map((loan) => {
                    const monthsOverdue = getMonthsOverdue(loan);
                    // Determine severity based on months (e.g. > 6 months is critical)
                    const severity = monthsOverdue >= 6 ? 'error' : 'warning';
                    
                    return (
                        <TableRow key={loan.id} hover>
                        <TableCell>
                            <Typography variant="subtitle2">{loan.member.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                            {loan.member.accountNumber} • {loan.member.mobile || 'No Mobile'}
                            </Typography>
                        </TableCell>
                        <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                            ₹{loan.remainingBalance.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                            Principal: ₹{loan.principalAmount.toLocaleString()}
                            </Typography>
                        </TableCell>
                        <TableCell>
                            {loan.payments.length > 0 ? (
                            <>
                                <Typography variant="body2">{formatDate(loan.payments[0].paymentDate)}</Typography>
                                <Typography variant="caption" color="text.secondary">Last Payment</Typography>
                            </>
                            ) : (
                            <>
                                <Typography variant="body2">{formatDate(loan.loanDate)}</Typography>
                                <Typography variant="caption" color="text.secondary">Loan Taken</Typography>
                            </>
                            )}
                        </TableCell>
                        <TableCell>
                            <Typography variant="body2" color={`${severity}.main`} fontWeight="bold">
                            {monthsOverdue} months
                            </Typography>
                        </TableCell>
                        <TableCell>
                            <Chip 
                                label={monthsOverdue >= 6 ? "Critical" : "Overdue"} 
                                color={severity} 
                                size="small" 
                                variant="outlined"
                            />
                        </TableCell>
                        </TableRow>
                    );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Modal>
  );
};

export default DefaultersModal;
