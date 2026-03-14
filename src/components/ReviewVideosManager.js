import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';
import { Delete, Add, Movie } from '@mui/icons-material';
import { db, storage } from '../firebase/config';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const ReviewVideosManager = ({ open, onClose }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [newVideo, setNewVideo] = useState({
    title: '',
    videoUrl: '',
    fileName: ''
  });

  useEffect(() => {
    if (open) {
      fetchVideos();
    }
  }, [open]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'reviewVideos'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const videoList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVideos(videoList);
    } catch (err) {
      setError('Error al cargar videos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('Por favor sube solo archivos de video');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const storageRef = ref(storage, `reviews/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      setNewVideo(prev => ({
        ...prev,
        videoUrl: url,
        fileName: snapshot.ref.fullPath
      }));
      setSuccess('Video subido correctamente. Ahora asígnale un título y guárdalo.');
    } catch (err) {
      setError('Error al subir video: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!newVideo.videoUrl) {
      setError('Debes subir un video primero');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'reviewVideos'), {
        title: newVideo.title || 'Reseña Delizukar',
        videoUrl: newVideo.videoUrl,
        storagePath: newVideo.fileName,
        createdAt: new Date().toISOString()
      });
      
      setNewVideo({ title: '', videoUrl: '', fileName: '' });
      setSuccess('Video guardado en la colección');
      fetchVideos();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (video) => {
    if (!window.confirm('¿Estás seguro de eliminar esta reseña de video?')) return;

    setLoading(true);
    try {
      // Eliminar de Storage si existe el path
      if (video.storagePath) {
        const storageRef = ref(storage, video.storagePath);
        await deleteObject(storageRef);
      }
      
      // Eliminar de Firestore
      await deleteDoc(doc(db, 'reviewVideos', video.id));
      
      setSuccess('Video eliminado correctamente');
      fetchVideos();
    } catch (err) {
      setError('Error al eliminar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#c8626d', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Movie />
          <Typography variant="h6" fontWeight={700}>Gestionar Video Reviews</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: '#fafafa' }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>Añadir Nuevo Video</Typography>
          <TextField
            fullWidth
            label="Título de la Review"
            value={newVideo.title}
            onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
            margin="dense"
            size="small"
          />
          
          <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={uploading ? <CircularProgress size={20} /> : <Add />}
              disabled={uploading}
              sx={{ color: '#c8626d', borderColor: '#c8626d' }}
            >
              {uploading ? 'Subiendo...' : 'Seleccionar Video'}
              <input type="file" hidden accept="video/*" onChange={handleFileUpload} />
            </Button>
            
            {newVideo.videoUrl && (
              <Typography variant="caption" color="success.main">✓ Video listo</Typography>
            )}
          </Box>

          <Button
            fullWidth
            variant="contained"
            onClick={handleSave}
            disabled={!newVideo.videoUrl || loading}
            sx={{ mt: 2, backgroundColor: '#c8626d', '&:hover': { backgroundColor: '#b5555a' } }}
          >
            Guardar en el Carrusel
          </Button>
        </Paper>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" fontWeight={700} gutterBottom>Videos Actuales</Typography>
        {loading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto' }} />}
        
        <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
          {videos.map((video) => (
            <ListItem key={video.id} divider>
              <ListItemText 
                primary={video.title} 
                secondary={new Date(video.createdAt).toLocaleDateString()}
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleDelete(video)} color="error">
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
          {videos.length === 0 && !loading && (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
              No hay videos cargados aún.
            </Typography>
          )}
        </List>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReviewVideosManager;
