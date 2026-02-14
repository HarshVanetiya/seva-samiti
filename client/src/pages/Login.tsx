import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  alpha,
  useTheme,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useAuthStore } from '../stores/authStore';

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
      }}
    >
      <Container maxWidth="xs">
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            width: '100%',
            borderRadius: 3,
            boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
            }}
          >
            <LockIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>

          <Typography variant="h5" component="h1" gutterBottom align="center" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Seva Smiti
          </Typography>
          <Typography variant="body2" gutterBottom align="center" color="text.secondary" sx={{ mb: 4 }}>
            Community Fund Management System<br/>
            <Box component="span" sx={{ fontWeight: 500, color: 'text.primary', display: 'block', mt: 0.5 }}>
              Authorized Access Only
            </Box>
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, width: '100%', borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
              autoFocus
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              variant="outlined"
              sx={{ mb: 3 }}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ py: 1.5, fontSize: '1rem', fontWeight: 600 }}
            >
              {loading ? 'Authenticating...' : 'Login'}
            </Button>
          </form>
        </Paper>
        <Typography variant="caption" display="block" align="center" color="text.secondary" sx={{ mt: 3 }}>
          &copy; {new Date().getFullYear()} Seva Smiti. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Login;
