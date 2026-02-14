import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Chip,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { memberService } from '../services/memberService';
import type { Member } from '../services/memberService';
import { formatDate } from '../utils/dateUtils';

const MemberDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMember = async () => {
      if (!id) return;
      try {
        const response = await memberService.getById(parseInt(id));
        setMember(response.data.member);
      } catch (error) {
        console.error('Failed to fetch member details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!member) {
    return (
      <Box p={3}>
        <Typography variant="h5" color="error">Member not found</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/members')} sx={{ mt: 2 }}>
          Back to Members
        </Button>
      </Box>
    );
  }

  const lastPaidDate = member.transactions && member.transactions.length > 0
    ? member.transactions[0].createdAt
    : null;

  const activeLoans = member.loans?.filter((l: any) => l.status === 'ACTIVE') || [];
  const completedLoans = member.loans?.filter((l: any) => l.status === 'COMPLETED') || [];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3} gap={2}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/members')}>
          Back
        </Button>
        <Box>
          <Typography variant="h4" color="primary.main">
            {member.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Account: {member.accountNumber}
          </Typography>
        </Box>
        <Chip 
          label={member.isActive ? 'Active' : 'Inactive'} 
          color={member.isActive ? 'success' : 'default'} 
          sx={{ ml: 'auto' }} 
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* Personal Info */}
        <Box>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="primary">Personal Information</Typography>
            <Box display="flex" flexDirection="column" gap={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary">Father's Name</Typography>
                <Typography variant="body1">{member.fathersName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Mobile</Typography>
                <Typography variant="body1">{member.mobile || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Address</Typography>
                <Typography variant="body1">{member.address || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Joining Date</Typography>
                <Typography variant="body1">{formatDate(member.joiningDate || member.createdAt)}</Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Financial Summary */}
        <Box>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="primary">Financial Summary</Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 2, color: 'primary.contrastText' }}>
                <Typography variant="subtitle2">Current Account Balance</Typography>
                <Typography variant="h4">₹{member.account?.totalAmount.toLocaleString() || 0}</Typography>
              </Box>
              
              <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Last Paid Date</Typography>
                <Typography variant="h5" color="secondary.main">
                  {lastPaidDate ? formatDate(lastPaidDate) : 'No transactions yet'}
                </Typography>
                {lastPaidDate && (
                  <Typography variant="caption" color="text.secondary">
                    for {member.transactions?.[0]?.type?.replace('_', ' ') || 'Transaction'}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Loan Section */}
        <Box sx={{ gridColumn: { xs: '1 / -1' } }}>
          <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>Loan Status</Typography>
          
          {activeLoans.length > 0 ? (
            activeLoans.map((loan: any) => (
              <Card key={loan.id} sx={{ mb: 3, borderLeft: '6px solid', borderColor: 'warning.main' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" flexWrap="wrap">
                    <Box>
                        <Typography variant="h6" color="warning.main" gutterBottom>Active Loan</Typography>
                        <Typography variant="body2"><strong>Principal:</strong> ₹{loan.principalAmount.toLocaleString()}</Typography>
                        <Typography variant="body2"><strong>Remaining:</strong> ₹{loan.remainingBalance.toLocaleString()}</Typography>
                        <Typography variant="body2"><strong>Interest Rate:</strong> {loan.interestRate}%</Typography>
                        <Typography variant="body2"><strong>Date:</strong> {formatDate(loan.loanDate)}</Typography>
                    </Box>
                    <Box textAlign="right">
                        <Typography variant="h4" color="warning.main">₹{loan.remainingBalance.toLocaleString()}</Typography>
                        <Typography variant="caption">Remaining to Pay</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))
          ) : (
             <Box mb={3} p={2} bgcolor="success.light" borderRadius={1} color="success.dark">
                <Typography fontWeight="bold">No Active Loans</Typography>
             </Box>
          )}

          {/* Loan History */}
          <Typography variant="h6" gutterBottom>Loan History</Typography>
          {completedLoans.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Principal</TableCell>
                    <TableCell>Interest Paid</TableCell>
                    <TableCell>Completed Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {completedLoans.map((loan: any) => (
                    <TableRow key={loan.id}>
                      <TableCell>{formatDate(loan.loanDate)}</TableCell>
                      <TableCell>₹{loan.principalAmount.toLocaleString()}</TableCell>
                      <TableCell>₹{loan.totalInterestPaid.toLocaleString()}</TableCell>
                      <TableCell>{loan.completedAt ? formatDate(loan.completedAt) : '-'}</TableCell>
                      <TableCell>
                        <Chip label="Completed" color="success" size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">No completed loans found.</Typography>
          )}

           {activeLoans.length === 0 && completedLoans.length === 0 && (
             <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
               This member has never taken a loan.
             </Typography>
           )}
        </Box>
      </Box>
    </Box>
  );
};

export default MemberDetails;
