/**
 * Modern Special Offers Screen
 * Functional implementation with backend sync
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform, 
  Modal, 
  TextInput, 
  Alert,
  Switch,
  KeyboardAvoidingView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@clerk/clerk-expo';
import { theme } from '../theme/theme';
import { FloatingIconButton, Icon, IconButton } from '../components/Icons';
import { Button } from '../components/Button';
import { LoadingState } from '../components/LoadingState';
import { apiClient } from '../services/api';
import { authService } from '../services/authService';

interface Offer {
  id: string;
  title: string;
  description?: string;
  discount?: string;
  code?: string;
  isActive: boolean;
  endDate?: string;
}

const SpecialOffersScreen: React.FC = () => {
  const navigation = useNavigation();
  const { getToken } = useAuth();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [truckId, setTruckId] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  
  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDiscount, setFormDiscount] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formExpiry, setFormExpiry] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await getToken();
      if (token) authService.setToken(token);
      
      const userRes = await authService.getCurrentUser();
      const user = userRes.user as any;
      
      if (user?.profile?.truck?.id) {
        setTruckId(user.profile.truck.id);
        const res = await apiClient.get<{ offers: Offer[] }>(`/api/trucks/${user.profile.truck.id}/offers`);
        if (res.data?.offers) {
          setOffers(res.data.offers);
        }
      }
    } catch (error) {
      console.error('Error loading offers:', error);
      Alert.alert('Error', 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingOffer(null);
    setFormTitle('');
    setFormDescription('');
    setFormDiscount('');
    setFormCode('');
    setFormActive(true);
    setFormExpiry('');
    setShowModal(true);
  };

  const openEditModal = (offer: Offer) => {
    setEditingOffer(offer);
    setFormTitle(offer.title);
    setFormDescription(offer.description || '');
    setFormDiscount(offer.discount || '');
    setFormCode(offer.code || '');
    setFormActive(offer.isActive);
    setFormExpiry(offer.endDate ? new Date(offer.endDate).toISOString().split('T')[0] : '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    if (!truckId) return;

    setSaving(true);
    try {
      const token = await getToken();
      if (token) authService.setToken(token);

      const payload = {
        title: formTitle,
        description: formDescription,
        discount: formDiscount,
        code: formCode,
        isActive: formActive,
        expiryDate: formExpiry || null,
      };

      if (editingOffer) {
        const res = await apiClient.put<Offer>(`/api/trucks/${truckId}/offers/${editingOffer.id}`, payload);
        if (res.data) {
          setOffers(prev => prev.map(o => o.id === editingOffer.id ? res.data! : o));
          Alert.alert('Success', 'Offer updated!');
        }
      } else {
        const res = await apiClient.post<Offer>(`/api/trucks/${truckId}/offers`, payload);
        if (res.data) {
          setOffers(prev => [res.data!, ...prev]);
          Alert.alert('Success', 'Offer created!');
        }
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving offer:', error);
      Alert.alert('Error', 'Failed to save offer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (offer: Offer) => {
    Alert.alert(
      'Delete Offer',
      `Are you sure you want to delete "${offer.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              if (token) authService.setToken(token);
              
              await apiClient.delete(`/api/trucks/${truckId}/offers/${offer.id}`);
              setOffers(prev => prev.filter(o => o.id !== offer.id));
            } catch (error) {
              console.error('Error deleting:', error);
              Alert.alert('Error', 'Failed to delete offer');
            }
          }
        },
      ]
    );
  };

  if (loading) {
    return <LoadingState message="Loading offers..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <IconButton name="back" onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Special Offers</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.subtitle}>Create exciting deals for your customers! 🏷️</Text>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {offers.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="gift" size={48} color={theme.colors.gray[300]} />
            <Text style={styles.emptyText}>No Active Offers</Text>
            <Text style={styles.emptySubtext}>Tap + to create your first deal</Text>
          </View>
        ) : (
          offers.map((offer, index) => (
            <Animated.View 
              key={offer.id}
              entering={FadeInUp.delay(index * 100).springify()}
              style={[styles.offerCard, !offer.isActive && styles.offerCardInactive]}
            >
              <LinearGradient
                colors={offer.isActive ? theme.gradients.primary : [theme.colors.gray[200], theme.colors.gray[300]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.offerDecoration}
              />
              
              <View style={styles.offerContent}>
                <View style={styles.offerHeader}>
                  <Text style={[styles.offerTitle, !offer.isActive && styles.textInactive]}>{offer.title}</Text>
                  <View style={[styles.statusBadge, offer.isActive ? styles.statusActive : styles.statusInactive]}>
                    <Text style={[styles.statusText, offer.isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                      {offer.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.offerDesc}>{offer.description}</Text>
                
                <View style={styles.offerMeta}>
                  {offer.code && (
                    <View style={styles.codeContainer}>
                      <Icon name="gift" size={14} color={theme.colors.gray[600]} />
                      <Text style={styles.codeText}>{offer.code}</Text>
                    </View>
                  )}
                  {offer.discount && (
                    <View style={styles.expiryContainer}>
                       <Text style={styles.discountText}>{offer.discount}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(offer)}>
                   <Icon name="edit" size={20} color={theme.colors.primary.main} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(offer)}>
                   <Icon name="close" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))
        )}
        <View style={{height: 100}} />
      </ScrollView>

      {/* FAB */}
      <View style={styles.fabContainer}>
        <FloatingIconButton 
          name="plus" 
          onPress={openAddModal} 
          backgroundColor={theme.colors.primary.main}
          color={theme.colors.white}
        />
      </View>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingOffer ? 'Edit Offer' : 'New Offer'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Icon name="close" size={24} color={theme.colors.gray[500]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="e.g. Taco Tuesday"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formDescription}
                onChangeText={setFormDescription}
                placeholder="Describe the deal..."
                multiline
                numberOfLines={3}
              />

              <View style={styles.row}>
                <View style={[styles.col, { marginRight: 10 }]}>
                  <Text style={styles.label}>Discount</Text>
                  <TextInput
                    style={styles.input}
                    value={formDiscount}
                    onChangeText={setFormDiscount}
                    placeholder="e.g. 20% OFF"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Promo Code</Text>
                  <TextInput
                    style={styles.input}
                    value={formCode}
                    onChangeText={setFormCode}
                    placeholder="e.g. TACO20"
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Active Status</Text>
                <Switch 
                  value={formActive} 
                  onValueChange={setFormActive}
                  trackColor={{ false: theme.colors.gray[300], true: theme.colors.success }}
                />
              </View>

              {/* Bottom spacing */}
              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title={saving ? 'Saving...' : 'Save Offer'}
                onPress={handleSave}
                size="large"
                disabled={saving}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.white,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.base,
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
    ...theme.shadows.sm,
    marginBottom: theme.spacing.md,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.gray[900],
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.gray[500],
    textAlign: 'center',
  },
  listContainer: {
    padding: theme.spacing.base,
    paddingBottom: 80,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['3xl'],
  },
  emptyText: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.gray[500],
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.gray[400],
    marginTop: theme.spacing.xs,
  },
  offerCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  offerCardInactive: {
    opacity: 0.8,
  },
  offerDecoration: {
    width: 6,
  },
  offerContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  offerTitle: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.gray[900],
  },
  textInactive: {
    color: theme.colors.gray[600],
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.md,
  },
  statusActive: {
    backgroundColor: theme.colors.successLight,
  },
  statusInactive: {
    backgroundColor: theme.colors.gray[100],
  },
  statusText: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeights.bold,
  },
  statusTextActive: {
    color: theme.colors.success,
  },
  statusTextInactive: {
    color: theme.colors.gray[500],
  },
  offerDesc: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.gray[600],
    marginBottom: theme.spacing.md,
    lineHeight: 18,
  },
  offerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.gray[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 12,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.gray[700],
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  discountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary.main,
  },
  actions: {
    padding: theme.spacing.sm,
    justifyContent: 'center',
    gap: theme.spacing.sm,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.gray[100],
  },
  actionBtn: {
    padding: 8,
  },
  fabContainer: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius['2xl'],
    borderTopRightRadius: theme.borderRadius['2xl'],
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  modalTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.gray[900],
  },
  formContainer: {
    padding: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.gray[700],
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.gray[50],
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.gray[900],
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  toggleLabel: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.gray[700],
  },
  modalFooter: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    paddingBottom: Platform.OS === 'ios' ? 40 : theme.spacing.lg,
  },
});

export default SpecialOffersScreen;
