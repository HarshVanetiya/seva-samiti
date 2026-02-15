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
  TextField,
  InputAdornment,
  LinearProgress,
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
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    fathersName: string;
    mobile: string;
  }>({ name: '', fathersName: '', mobile: '' });
  const [saveLoading, setSaveLoading] = useState(false);
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

  const handleEditClick = (member: Member) => {
    setEditingMemberId(member.id);
    setEditFormData({
      name: member.name,
      fathersName: member.fathersName,
      mobile: member.mobile || '',
    });
  };

  const handleCancelClick = () => {
    setEditingMemberId(null);
    setEditFormData({ name: '', fathersName: '', mobile: '' });
  };

  const handleSaveClick = async (id: number) => {
    setSaveLoading(true);
    try {
      await memberService.update(id, {
        name: editFormData.name.trim().toUpperCase(),
        fathersName: editFormData.fathersName.trim().toUpperCase(),
        mobile: editFormData.mobile.trim() || undefined,
      });
      
      // Update local state to reflect changes without full refetch if possible, 
      // or just refetch. Refetch is safer for derived data but update is faster.
      // Let's refetch to be safe and consistent.
      await fetchMembers();
      setEditingMemberId(null);
    } catch (error) {
      console.error('Failed to update member:', error);
      // Ideally show a snackbar here
      alert('Failed to update member');
    } finally {
      setSaveLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers();
    }, 300); // Debounce search
    
    return () => clearTimeout(timer);
  }, [search]); // Only re-fetch when search changes

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if space is pressed
      if (e.key === ' ' && !addModalOpen) {
        // Check if active element is input or textarea or has contenteditable
        const activeElement = document.activeElement as HTMLElement;
        const isInputActive = 
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' || 
          activeElement.isContentEditable;

        if (!isInputActive) {
          e.preventDefault(); // Prevent scrolling
          setAddModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addModalOpen]);

  useEffect(() => {
    fetchMembers();
  }, [page]); // Re-fetch when page changes

  // Removed blocking loading check to keep input in focus
  
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

      {loading && <LinearProgress sx={{ mb: 1 }} />}

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
                    {editingMemberId === member.id ? (
                      <TextField 
                        size="small" 
                        value={editFormData.name} 
                        onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                        fullWidth
                        inputProps={{ style: { textTransform: 'uppercase' } }}
                      />
                    ) : (
                      <>
                        <Typography variant="body2" fontWeight="500">{member.name}</Typography>
                        <Typography variant="caption" color="text.secondary">Joined: {formatDate(member.joiningDate || member.createdAt)}</Typography> 
                      </>
                    )}
                </TableCell>
                <TableCell>
                    {editingMemberId === member.id ? (
                      <TextField 
                        size="small" 
                        value={editFormData.fathersName} 
                        onChange={(e) => setEditFormData({...editFormData, fathersName: e.target.value})}
                        fullWidth
                        inputProps={{ style: { textTransform: 'uppercase' } }}
                      />
                    ) : (
                      member.fathersName
                    )}
                </TableCell>
                <TableCell>
                    {editingMemberId === member.id ? (
                      <TextField 
                        size="small" 
                        value={editFormData.mobile} 
                        onChange={(e) => setEditFormData({...editFormData, mobile: e.target.value})}
                        fullWidth
                        placeholder="Mobile"
                      />
                    ) : (
                      member.mobile || '-'
                    )}
                </TableCell>
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
                  {editingMemberId === member.id ? (
                     <Box display="flex" gap={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleSaveClick(member.id)}
                          disabled={saveLoading}
                        >
                          Save
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={handleCancelClick}
                          disabled={saveLoading}
                        >
                          Cancel
                        </Button>
                     </Box>
                  ) : (
                    <Box display="flex" gap={1} justifyContent="flex-end">
                      <Button 
                        size="small" 
                        variant="outlined" 
                        sx={{ borderRadius: 2 }}
                        onClick={() => handleEditClick(member)}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        sx={{ borderRadius: 2 }}
                        onClick={() => navigate(`/members/${member.id}`)}
                      >
                        View
                      </Button>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && members.length === 0 && (
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

