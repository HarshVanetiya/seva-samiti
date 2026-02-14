import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import type { Member } from '../services/memberService';
import { memberService } from '../services/memberService';
import AddMemberModal from '../components/AddMemberModal';
import { formatDate } from '../utils/dateUtils';

const Members = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await memberService.getAll({ page, search, limit: 50 });
      setMembers(response.data.members);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers();
    }, 300); // Debounce search
    
    return () => clearTimeout(timer);
  }, [search]); // Only re-fetch when search changes

  useEffect(() => {
    fetchMembers();
  }, [page]); // Re-fetch when page changes

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
          <Typography variant="h4" color="primary.main" gutterBottom>
              Members
          </Typography>
          <Typography variant="body1" color="text.secondary">
              Manage community members and view their details
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setAddModalOpen(true)}
          sx={{ px: 3, py: 1 }}
        >
          Add Member
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by name, father's name, or account number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
      </Paper>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Account Number</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Father's Name</TableCell>
              <TableCell>Mobile</TableCell>
              <TableCell align="right">Account Balance</TableCell>
              <TableCell align="center">Loans</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id} hover>
                <TableCell>
                    <Typography variant="body2" fontWeight="600">{member.accountNumber}</Typography>
                </TableCell>
                <TableCell>
                    <Typography variant="body2" fontWeight="500">{member.name}</Typography>
                    <Typography variant="caption" color="text.secondary">Joined: {formatDate(member.joiningDate || member.createdAt)}</Typography> 
                </TableCell>
                <TableCell>{member.fathersName}</TableCell>
                <TableCell>{member.mobile || '-'}</TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="600" color="primary.main">
                    ₹{member.account?.totalAmount.toLocaleString() || 0}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                    {(member._count?.loans || 0) > 0 ? (
                        <Box 
                            sx={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                width: 24, 
                                height: 24, 
                                borderRadius: '50%', 
                                bgcolor: 'secondary.light', 
                                color: 'secondary.dark',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                            }}
                        >
                            {member._count?.loans}
                        </Box>
                    ) : (
                        '-'
                    )}
                </TableCell>
                <TableCell align="center">
                    {/* Placeholder for status logic - keeping it Active for now */}
                    <Box 
                        sx={{ 
                            display: 'inline-block',
                            px: 1, 
                            py: 0.5, 
                            borderRadius: 1, 
                            bgcolor: 'success.light', 
                            color: 'success.main',
                            fontSize: '0.75rem',
                            fontWeight: 600
                        }}
                    >
                        Active
                    </Box>
                </TableCell>
                <TableCell align="right">
                  <Button 
                    size="small" 
                    variant="outlined" 
                    sx={{ borderRadius: 2 }}
                    onClick={() => navigate(`/members/${member.id}`)}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {members.length === 0 && (
        <Box textAlign="center" py={8} bgcolor="background.paper" sx={{ borderBottomLeftRadius: 8, borderBottomRightRadius: 8, border: '1px solid', borderColor: 'divider', borderTop: 'none' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
            No members found
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
            Try adjusting your search or add a new member.
            </Typography>
            <Button 
                variant="outlined" 
                startIcon={<AddIcon />}
                onClick={() => setAddModalOpen(true)}
            >
                Add Member
            </Button>
        </Box>
      )}

      {/* Add Member Modal */}
      <AddMemberModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={fetchMembers}
      />
    </Box>
  );
};

export default Members;

