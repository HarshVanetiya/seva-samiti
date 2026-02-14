import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { dashboardService } from '../services/dashboardService';
import AddDonationModal from '../components/AddDonationModal';
import AddExpenseModal from '../components/AddExpenseModal';
import { formatDate } from '../utils/dateUtils';
import { alpha } from '@mui/material/styles';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  member?: {
    id: number;
    name: string;
  };
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await dashboardService.getTransactionHistory({ limit: 100 });
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const getTypeColor = (type: string): 'success' | 'error' | 'primary' | 'secondary' | 'info' | 'warning' => {
    switch (type) {
      case 'DONATION':
      case 'MEMBERSHIP':
      case 'LOAN_PAYMENT':
        return 'success';
      case 'LOAN_DISBURSEMENT':
      case 'EXPENSE':
        return 'error';
      default:
        return 'primary';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
            <Typography variant="h4" color="primary.main" gutterBottom>Transactions</Typography>
            <Typography variant="body1" color="text.secondary">
                Financial ledger of donations, expenses and payments
            </Typography>
        </Box>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />} 
            sx={{ mr: 1, px: 3, bgcolor: 'background.paper' }}
            onClick={() => setDonationModalOpen(true)}
            color="success"
          >
            Add Donation
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<RemoveIcon />}
            onClick={() => setExpenseModalOpen(true)}
            sx={{ px: 3, bgcolor: 'background.paper' }}
          >
            Add Expense
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Member</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id} hover>
                <TableCell>
                  <Typography variant="body2">{formatDate(tx.createdAt)}</Typography>
                  <Typography variant="caption" color="text.secondary">{new Date(tx.createdAt).toLocaleTimeString()}</Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={tx.type.replace('_', ' ')} 
                    size="small" 
                    sx={{ 
                      fontWeight: 500,
                      bgcolor: (theme) => alpha(theme.palette[getTypeColor(tx.type)].main, 0.1),
                      color: (theme) => theme.palette[getTypeColor(tx.type)].main,
                      border: '1px solid',
                      borderColor: (theme) => alpha(theme.palette[getTypeColor(tx.type)].main, 0.2)
                    }}
                  />
                </TableCell>
                <TableCell>{tx.description}</TableCell>
                <TableCell>{tx.member?.name || '-'}</TableCell>
                <TableCell align="right">
                  <Typography 
                    variant="body2" 
                    fontWeight="600"
                    color={getTypeColor(tx.type) === 'success' ? 'success.main' : getTypeColor(tx.type) === 'error' ? 'error.main' : 'text.primary'}
                  >
                    {['DONATION', 'MEMBERSHIP', 'LOAN_PAYMENT', 'INTEREST_PAYMENT'].includes(tx.type) ? '+' : '-'}
                    ₹{tx.amount.toLocaleString()}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {transactions.length === 0 && (
        <Box textAlign="center" py={8} bgcolor="background.paper" sx={{ borderBottomLeftRadius: 8, borderBottomRightRadius: 8, border: '1px solid', borderColor: 'divider', borderTop: 'none' }}>
          <Typography color="text.secondary">
            No transactions found.
          </Typography>
        </Box>
      )}

      {/* Add Donation Modal */}
      <AddDonationModal
        open={donationModalOpen}
        onClose={() => setDonationModalOpen(false)}
        onSuccess={fetchTransactions}
      />

      {/* Add Expense Modal */}
      <AddExpenseModal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSuccess={fetchTransactions}
      />
    </Box>
  );
};

export default Transactions;

