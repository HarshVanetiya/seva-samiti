import { useState, useEffect, useMemo } from 'react';
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
  TextField,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import UndoIcon from '@mui/icons-material/Undo';
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

interface TransactionHistoryResponse {
  data: {
    transactions: Transaction[];
    pagination?: {
      totalPages: number;
    };
  };
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const getTransactionHistoryPage = (page: number, limit: number) =>
        dashboardService.getTransactionHistory({ page, limit }) as Promise<TransactionHistoryResponse>;

      const pageLimit = 500;
      const firstPageResponse = await getTransactionHistoryPage(1, pageLimit);
      const firstPageTransactions: Transaction[] = firstPageResponse.data.transactions || [];
      const totalPages: number = firstPageResponse.data.pagination?.totalPages || 1;

      if (totalPages <= 1) {
        setTransactions(firstPageTransactions);
        return;
      }

      const pageRequests: Promise<TransactionHistoryResponse>[] = [];
      for (let page = 2; page <= totalPages; page += 1) {
        pageRequests.push(getTransactionHistoryPage(page, pageLimit));
      }

      const pageResponses = await Promise.all(pageRequests);
      const otherPageTransactions = pageResponses.flatMap((response) => response.data.transactions || []);
      setTransactions([...firstPageTransactions, ...otherPageTransactions]);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const isInvalidRange = useMemo(() => {
    return Boolean(startMonth && endMonth && startMonth > endMonth);
  }, [startMonth, endMonth]);

  const filteredTransactions = useMemo(() => {
    if (isInvalidRange) return [];

    const startDate = startMonth ? new Date(`${startMonth}-01T00:00:00`) : null;
    const endDate = endMonth ? new Date(`${endMonth}-01T23:59:59.999`) : null;
    if (endDate) {
      endDate.setMonth(endDate.getMonth() + 1, 0);
    }

    return transactions.filter((tx) => {
      const txDate = new Date(tx.createdAt);
      if (startDate && txDate < startDate) return false;
      if (endDate && txDate > endDate) return false;
      return true;
    });
  }, [transactions, startMonth, endMonth, isInvalidRange]);

  const escapeXml = (value: string) => {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const handleDownloadFilteredExcel = () => {
    if (filteredTransactions.length === 0) return;

    try {
      setDownloading(true);
      const headerCells = ['Date', 'Type', 'Description', 'Member', 'Amount'];

      const rows = filteredTransactions.map((tx) => {
        const isCredit = ['DONATION', 'MEMBERSHIP', 'LOAN_PAYMENT', 'INTEREST_PAYMENT'].includes(tx.type);
        return [
          new Date(tx.createdAt).toLocaleString(),
          tx.type.replace('_', ' '),
          tx.description || '',
          tx.member?.name || '-',
          `${isCredit ? '+' : '-'}${tx.amount}`,
        ];
      });

      const tableRowsXml = [headerCells, ...rows]
        .map((row) => `<Row>${row.map((cell) => `<Cell><Data ss:Type="String">${escapeXml(String(cell))}</Data></Cell>`).join('')}</Row>`)
        .join('');

      const xml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Transactions">
  <Table>${tableRowsXml}</Table>
 </Worksheet>
</Workbook>`;

      const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const rangeName = `${startMonth || 'all'}_to_${endMonth || 'all'}`;
      link.setAttribute('download', `Transactions_${rangeName}.xls`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate transactions report', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleRevert = async (id: number) => {
    if (!window.confirm('Are you sure you want to revert this transaction? This action cannot be undone.')) {
      return;
    }
    try {
      await dashboardService.revertTransaction(id);
      fetchTransactions();
    } catch (error) {
      console.error('Failed to revert transaction:', error);
      alert('Failed to revert transaction');
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

      <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
          <TextField
            label="Start Month"
            type="month"
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            label="End Month"
            type="month"
            value={endMonth}
            onChange={(e) => setEndMonth(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <Button
            variant="text"
            onClick={() => {
              setStartMonth('');
              setEndMonth('');
            }}
          >
            Clear Filter
          </Button>
          <Button
            variant="contained"
            onClick={handleDownloadFilteredExcel}
            disabled={downloading || isInvalidRange || filteredTransactions.length === 0}
          >
            {downloading ? 'Generating...' : 'Download Excel'}
          </Button>
          <Typography variant="body2" color={isInvalidRange ? 'error.main' : 'text.secondary'}>
            {isInvalidRange
              ? 'Start month cannot be after end month.'
              : `Showing ${filteredTransactions.length} of ${transactions.length} transactions`}
          </Typography>
        </Stack>
      </Paper>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Member</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.map((tx) => (
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
                <TableCell align="right">
                  {tx.type !== 'CANCELLED' && (
                    <Button
                      size="small"
                      color="warning"
                      startIcon={<UndoIcon />}
                      onClick={() => handleRevert(tx.id)}
                    >
                      Revert
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredTransactions.length === 0 && (
        <Box textAlign="center" py={8} bgcolor="background.paper" sx={{ borderBottomLeftRadius: 8, borderBottomRightRadius: 8, border: '1px solid', borderColor: 'divider', borderTop: 'none' }}>
          <Typography color="text.secondary">
            {isInvalidRange ? 'Please select a valid date range.' : 'No transactions found for selected period.'}
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

