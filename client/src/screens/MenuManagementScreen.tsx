/**
 * Menu Management Screen
 * Full CRUD for truck menu items
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Platform,
  Alert,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@clerk/clerk-expo';
import { theme } from '../theme/theme';
import { Icon, IconButton, FloatingIconButton } from '../components/Icons';
import { Button } from '../components/Button';
import { LoadingState } from '../components/LoadingState';
import { apiClient } from '../services/api';
import { authService } from '../services/authService';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  isAvailable: boolean;
  isPopular: boolean;
  imageUrl?: string;
}

const CATEGORIES = ['TACOS', 'BURRITOS', 'QUESADILLAS', 'SIDES', 'DRINKS', 'DESSERTS', 'SPECIALS'];

const MenuManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const { getToken } = useAuth();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [truckId, setTruckId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('TACOS');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('TACOS');
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await getToken();
      if (token) authService.setToken(token);
      
      // Get truck ID from user profile
      const userRes = await authService.getCurrentUser();
      const user = userRes.user as any;
      
      // Backend now returns truck at root level for vendors
      const truckData = user?.truck || user?.profile?.truck;
      
      if (truckData?.id) {
        console.log('✅ Menu: Found truck:', truckData.id);
        setTruckId(truckData.id);
        
        // Fetch menu items
        const menuRes = await apiClient.get<{ menu: MenuItem[] }>(`/api/trucks/${truckData.id}/menu`);
        if (menuRes.data?.menu) {
          setMenuItems(menuRes.data.menu);
        }
      } else {
        console.log('⚠️ Menu: No truck found');
        Alert.alert('Error', 'No truck found. Please set up your truck first.');
      }
    } catch (error) {
      console.error('Error loading menu:', error);
      Alert.alert('Error', 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormDescription('');
    setFormPrice('');
    setFormCategory(activeCategory);
    setFormIsAvailable(true);
    setFormIsPopular(false);
    setShowModal(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormDescription(item.description || '');
    setFormPrice(item.price.toString());
    setFormCategory(item.category);
    setFormIsAvailable(item.isAvailable);
    setFormIsPopular(item.isPopular);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formPrice.trim()) {
      Alert.alert('Error', 'Name and price are required');
      return;
    }

    if (!truckId) {
      Alert.alert('Error', 'Truck not found');
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      if (token) authService.setToken(token);

      const payload = {
        name: formName.trim(),
        description: formDescription.trim(),
        price: parseFloat(formPrice),
        category: formCategory,
        isAvailable: formIsAvailable,
        isPopular: formIsPopular,
      };

      if (editingItem) {
        // Update existing item
        const res = await apiClient.put<MenuItem>(`/api/trucks/${truckId}/menu/${editingItem.id}`, payload);
        if (res.data) {
          setMenuItems(prev => prev.map(item => 
            item.id === editingItem.id ? res.data! : item
          ));
          Alert.alert('Success', 'Menu item updated!');
        }
      } else {
        // Create new item
        const res = await apiClient.post<MenuItem>(`/api/trucks/${truckId}/menu`, payload);
        if (res.data) {
          setMenuItems(prev => [...prev, res.data!]);
          Alert.alert('Success', 'Menu item added!');
        }
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert('Error', 'Failed to save menu item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: MenuItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              if (token) authService.setToken(token);
              
              await apiClient.delete(`/api/trucks/${truckId}/menu/${item.id}`);
              setMenuItems(prev => prev.filter(i => i.id !== item.id));
              Alert.alert('Success', 'Menu item deleted');
            } catch (error) {
              console.error('Error deleting:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          }
        },
      ]
    );
  };

  const filteredItems = menuItems.filter(item => item.category === activeCategory);

  if (loading) {
    return <LoadingState message="Loading menu..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <IconButton name="back" onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Menu Management</Text>
          <View style={{ width: 40 }} />
        </View>
        
        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoryContainer}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat}
              style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Menu List */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="food" size={48} color={theme.colors.gray[300]} />
            <Text style={styles.emptyText}>No items in {activeCategory}</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first item</Text>
          </View>
        ) : (
          <Animated.View entering={FadeIn.duration(300)}>
            {filteredItems.map((item, index) => (
              <Animated.View 
                key={item.id}
                entering={FadeInDown.delay(index * 50)}
                style={styles.menuItem}
              >
                <View style={styles.imagePlaceholder}>
                  <Icon name="food" size={24} color={theme.colors.gray[400]} />
                </View>
                <View style={styles.itemInfo}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                  </View>
                  <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                  <View style={styles.badges}>
                    {!item.isAvailable && (
                      <View style={styles.badgeUnavailable}>
                        <Text style={styles.badgeText}>Unavailable</Text>
                      </View>
                    )}
                    {item.isPopular && (
                      <View style={styles.badgePopular}>
                        <Text style={styles.badgeTextPopular}>⭐ Popular</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
                    <Icon name="edit" size={18} color={theme.colors.primary.main} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
                    <Icon name="close" size={18} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB to Add Item */}
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
                {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Icon name="close" size={24} color={theme.colors.gray[500]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g. Carne Asada Taco"
                placeholderTextColor={theme.colors.gray[400]}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formDescription}
                onChangeText={setFormDescription}
                placeholder="Describe your dish..."
                placeholderTextColor={theme.colors.gray[400]}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Price *</Text>
              <TextInput
                style={styles.input}
                value={formPrice}
                onChangeText={setFormPrice}
                placeholder="3.50"
                placeholderTextColor={theme.colors.gray[400]}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catOption, formCategory === cat && styles.catOptionActive]}
                    onPress={() => setFormCategory(cat)}
                  >
                    <Text style={[styles.catOptionText, formCategory === cat && styles.catOptionTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Available</Text>
                <TouchableOpacity 
                  style={[styles.toggle, formIsAvailable && styles.toggleActive]}
                  onPress={() => setFormIsAvailable(!formIsAvailable)}
                >
                  <Text style={styles.toggleText}>{formIsAvailable ? 'Yes' : 'No'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Popular Item</Text>
                <TouchableOpacity 
                  style={[styles.toggle, formIsPopular && styles.toggleActive]}
                  onPress={() => setFormIsPopular(!formIsPopular)}
                >
                  <Text style={styles.toggleText}>{formIsPopular ? 'Yes' : 'No'}</Text>
                </TouchableOpacity>
              </View>
              
              {/* Bottom spacing for scroll */}
              <View style={{ height: 30 }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title={saving ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}
                onPress={handleSave}
                variant="primary"
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
    paddingBottom: theme.spacing.md,
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
    ...theme.shadows.sm,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.base,
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.gray[900],
  },
  categoryContainer: {
    paddingHorizontal: theme.spacing.base,
    gap: theme.spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.gray[100],
    marginRight: theme.spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary.main,
  },
  categoryText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.gray[600],
  },
  categoryTextActive: {
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeights.bold,
  },
  listContainer: {
    padding: theme.spacing.base,
    paddingTop: theme.spacing.lg,
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
  menuItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  itemInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.gray[900],
    flex: 1,
  },
  itemPrice: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.primary.main,
  },
  itemDesc: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.gray[500],
    lineHeight: 18,
  },
  badges: {
    flexDirection: 'row',
    marginTop: 6,
    gap: theme.spacing.xs,
  },
  badgeUnavailable: {
    backgroundColor: theme.colors.gray[200],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  badgePopular: {
    backgroundColor: theme.colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  badgeText: {
    fontSize: 10,
    color: theme.colors.gray[600],
  },
  badgeTextPopular: {
    fontSize: 10,
    color: theme.colors.warning,
  },
  itemActions: {
    gap: theme.spacing.sm,
  },
  editButton: {
    padding: 8,
    backgroundColor: theme.colors.primary.main + '15',
    borderRadius: theme.borderRadius.md,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: theme.colors.error + '15',
    borderRadius: theme.borderRadius.md,
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
    maxHeight: '80%',
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
  categoryPicker: {
    marginTop: theme.spacing.xs,
  },
  catOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.gray[100],
    marginRight: theme.spacing.sm,
  },
  catOptionActive: {
    backgroundColor: theme.colors.primary.main,
  },
  catOptionText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.gray[600],
  },
  catOptionTextActive: {
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeights.bold,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  toggleLabel: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.gray[700],
  },
  toggle: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.gray[200],
  },
  toggleActive: {
    backgroundColor: theme.colors.success,
  },
  toggleText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.white,
  },
  modalFooter: {
    padding: theme.spacing.lg,
    paddingBottom: 80,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
});

export default MenuManagementScreen;
