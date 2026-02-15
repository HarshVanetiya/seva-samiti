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
  Chip,
  Tabs,
  Tab,
  InputAdornment,
  TextField,
  LinearProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import type { Loan } from '../services/loanService';
import { loanService } from '../services/loanService';
import DisburseLoanModal from '../components/DisburseLoanModal';
import AddPaymentModal from '../components/AddPaymentModal';
import { formatDate } from '../utils/dateUtils';

const Loans = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [search, setSearch] = useState('');
  const [disburseLoanOpen, setDisburseLoanOpen] = useState(false);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const response = await loanService.getAll({ 
        status: tab, 
        search,
        pagination: false // Fetch all matching records
      });
      setLoans(response.data.loans);
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLoans();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [tab, search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if space is pressed
      if (e.key === ' ' && !disburseLoanOpen && !addPaymentOpen) {
        // Check if active element is input or textarea or has contenteditable
        const activeElement = document.activeElement as HTMLElement;
        const isInputActive = 
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' || 
          activeElement.isContentEditable;

        if (!isInputActive) {
          e.preventDefault(); // Prevent scrolling
          setDisburseLoanOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disburseLoanOpen, addPaymentOpen]);

  const handleAddPayment = (loan: Loan) => {
    setSelectedLoan(loan);
    setAddPaymentOpen(true);
  };

  // Removed blocking loading check to keep input in focus

  // Import InputAdornment and SearchIcon if not already imported (Need to check imports first)
  // Actually, let's just add the search field below the header.

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
            <Typography variant="h4" color="primary.main" gutterBottom>Loans</Typography>
            <Typography variant="body1" color="text.secondary">
                Manage active and completed loans
            </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setDisburseLoanOpen(true)}
          sx={{ px: 3, py: 1 }}
        >
          Disburse Loan
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs 
            value={tab} 
            onChange={(_, val) => setTab(val)} 
            sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                '& .MuiTab-root': { textTransform: 'none', fontSize: '1rem', fontWeight: 500 }
            }}
        >
            <Tab label="Active Loans" value="ACTIVE" />
            <Tab label="Completed Loans" value="COMPLETED" />
        </Tabs>
        <Box p={2} borderTop={1} borderColor="divider">
             <TextField
              fullWidth
              placeholder="Search by member name, father's name, or account number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.default'
                }
              }}
            />
        </Box>
        {loading && <LinearProgress />}
      </Paper>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Member</TableCell>
              <TableCell>Account Number</TableCell>
              <TableCell align="right">Principal</TableCell>
              <TableCell align="center">Interest Rate</TableCell>
              <TableCell align="right">Remaining</TableCell>
              <TableCell align="right">Interest Paid</TableCell>
              <TableCell align="center">Payments</TableCell>
              <TableCell>Loan Date</TableCell>
              <TableCell>Scheme</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loans.map((loan) => (
              <TableRow key={loan.id} hover>
                <TableCell>
                    <Typography variant="body2" fontWeight="600">{loan.member?.name}</Typography>
                </TableCell>
                <TableCell>{loan.member?.accountNumber}</TableCell>
                <TableCell align="right">
                    <Typography variant="body2" fontWeight="500">₹{loan.principalAmount.toLocaleString()}</Typography>
                </TableCell>
                <TableCell align="center">
                    <Chip label={`${loan.interestRate}%`} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right">
                    <Typography variant="body2" fontWeight="600" color="warning.main">
                        ₹{loan.remainingBalance.toLocaleString()}
                    </Typography>
                </TableCell>
                <TableCell align="right">
                    <Typography variant="body2" color="success.main">
                        ₹{loan.totalInterestPaid.toLocaleString()}
                    </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip label={loan._count?.payments || 0} size="small" />
                </TableCell>
                <TableCell>
                  {formatDate(loan.loanDate)}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={loan.scheme === 'NEW_SCHEME' ? 'New' : 'Old'} 
                    size="small" 
                    color={loan.scheme === 'NEW_SCHEME' ? 'primary' : 'default'}
                    variant={loan.scheme === 'NEW_SCHEME' ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell align="right">
                  {loan.status === 'ACTIVE' && (
                    <Button 
                        size="small" 
                        variant="contained" 
                        color="success"
                        onClick={() => handleAddPayment(loan)}
                        disableElevation
                    >
                      Add Payment
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && loans.length === 0 && (
        <Box textAlign="center" py={8} bgcolor="background.paper" sx={{ borderBottomLeftRadius: 8, borderBottomRightRadius: 8, border: '1px solid', borderColor: 'divider', borderTop: 'none' }}>
          <Typography color="text.secondary">
            No {tab.toLowerCase()} loans found.
          </Typography>
        </Box>
      )}

      {/* Disburse Loan Modal */}
      <DisburseLoanModal
        open={disburseLoanOpen}
        onClose={() => setDisburseLoanOpen(false)}
        onSuccess={fetchLoans}
      />

      {/* Add Payment Modal */}
      <AddPaymentModal
        open={addPaymentOpen}
        onClose={() => {
          setAddPaymentOpen(false);
          setSelectedLoan(null);
        }}
        onSuccess={fetchLoans}
        loan={selectedLoan}
      />
    </Box>
  );
};

export default Loans;

