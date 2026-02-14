import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Avatar,
  useTheme,
  alpha,
  Button,
} from '@mui/material';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import WarningIcon from '@mui/icons-material/Warning';
import DefaultersModal from '../components/DefaultersModal';
import { dashboardService } from '../services/dashboardService';
import type { DashboardData } from '../services/dashboardService';
import { formatDate } from '../utils/dateUtils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StatsCard = ({ title, value, icon, color, subtitle }: any) => {
  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          bgcolor: alpha(color, 0.1),
          zIndex: 0,
        }}
      />
      <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(color, 0.1),
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" fontWeight="700" sx={{ mb: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight="500">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDefaulters, setOpenDefaulters] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response: any = await dashboardService.getDashboard(); 
        // Force Any because the return type in service file might be just the body, and we need to check structure
        // But dashboardService.getDashboard returns response.data
        setDashboardData(response);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!dashboardData || !dashboardData.data) return null;

  const { fund, loans, members, recentTransactions } = dashboardData.data;

  // Mock data for the chart (replace with real data if available in future)
  const chartData = [
    { name: 'Jan', amount: 4000 },
    { name: 'Feb', amount: 3000 },
    { name: 'Mar', amount: 5000 },
    { name: 'Apr', amount: 4500 },
    { name: 'May', amount: 6000 },
    { name: 'Jun', amount: 5500 },
  ];

  return (
    <Box>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" gutterBottom color="primary.main">
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Overview of your community fund status
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="error"
          startIcon={<WarningIcon />}
          onClick={() => setOpenDefaulters(true)}
        >
          Defaulters List
        </Button>
      </Box>

      {/* Stats Cards Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
        <Box>
          <StatsCard
            title="Total Cash in Hand"
            value={`₹${fund.cashInHand.toLocaleString()}`}
            icon={<AccountBalanceWalletIcon />}
            color={theme.palette.primary.main}
            subtitle="+12% from last month"
          />
        </Box>
        <Box>
          <StatsCard
            title="Active Loans"
            value={`₹${loans.totalActiveAmount.toLocaleString()}`}
            icon={<MonetizationOnIcon />}
            color={theme.palette.warning.main}
            subtitle={`${loans.totalActive} active loans`}
          />
        </Box>
        <Box>
          <StatsCard
            title="Total Members"
            value={members.total}
            icon={<PeopleIcon />}
            color={theme.palette.success.main}
            subtitle="2 joined this month"
          />
        </Box>
        <Box>
          <StatsCard
            title="Profit / Interest"
            value={`₹${fund.totalProfit.toLocaleString()}`}
            icon={<TrendingUpIcon />}
            color={theme.palette.secondary.main}
            subtitle="Generated this year"
          />
        </Box>
      </Box>

      {/* Main Content Grid (Chart + Transactions) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        <Box>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Fund Growth</Typography>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 8, 
                    border: 'none', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke={theme.palette.primary.main} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        <Box>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box p={3} borderBottom={`1px solid ${theme.palette.divider}`}>
              <Typography variant="h6">Recent Transactions</Typography>
            </Box>
            <Box sx={{ flexGrow: 1, overflow: 'auto', maxHeight: 350 }}>
              {recentTransactions && recentTransactions.length > 0 ? (
                <Table>
                  <TableBody>
                    {recentTransactions.map((tx: any) => {
                      const isCredit = ['DONATION', 'MEMBERSHIP', 'LOAN_PAYMENT', 'INTEREST_PAYMENT'].includes(tx.type);
                      return (
                        <TableRow key={tx.id} hover>
                          <TableCell sx={{ borderBottom: '1px solid #f0f0f0' }}>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar 
                                sx={{ 
                                  bgcolor: isCredit ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                                  color: isCredit ? 'success.main' : 'error.main',
                                  width: 32,
                                  height: 32
                                }}
                              >
                                {isCredit ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="600">
                                  {tx.description || tx.type.replace('_', ' ')}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(tx.createdAt)}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ borderBottom: '1px solid #f0f0f0' }}>
                            <Typography 
                              variant="body2" 
                              fontWeight="600"
                              color={isCredit ? 'success.main' : 'error.main'}
                            >
                              {isCredit ? '+' : '-'}₹{tx.amount.toLocaleString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <Box p={3} textAlign="center">
                  <Typography color="text.secondary">No recent transactions</Typography>
                </Box>
              )}
            </Box>
            <Box p={2} borderTop={`1px solid ${theme.palette.divider}`}>
              <Button fullWidth color="primary" href="/transactions">
                View All Transactions
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
      
      <DefaultersModal 
        open={openDefaulters} 
        onClose={() => setOpenDefaulters(false)} 
      />
    </Box>
  );
};

export default Dashboard;
