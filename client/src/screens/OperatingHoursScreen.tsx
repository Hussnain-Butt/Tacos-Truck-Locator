/**
 * Modern Operating Hours Screen
 * Functional implementation with backend sync
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  Platform, 
  TouchableOpacity, 
  Alert,
  Modal,
  TextInput 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@clerk/clerk-expo';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { Icon, IconButton } from '../components/Icons';
import { LoadingState } from '../components/LoadingState';
import { apiClient } from '../services/api';
import { authService } from '../services/authService';

interface OperatingHour {
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

const DAYS_ORDER = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
];

const DEFAULT_HOURS: OperatingHour[] = DAYS_ORDER.map(day => ({
  dayOfWeek: day,
  openTime: '10:00 AM',
  closeTime: '09:00 PM',
  isClosed: day === 'SUNDAY',
}));

const OperatingHoursScreen: React.FC = () => {
  const navigation = useNavigation();
  const { getToken } = useAuth();
  
  const [hours, setHours] = useState<OperatingHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [truckId, setTruckId] = useState<string | null>(null);

  // Edit Modal State
  const [editingDay, setEditingDay] = useState<OperatingHour | null>(null);
  const [editOpenTime, setEditOpenTime] = useState('');
  const [editCloseTime, setEditCloseTime] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

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
        
        // Fetch hours
        const res = await apiClient.get<{ hours: OperatingHour[] }>(`/api/trucks/${user.profile.truck.id}/hours`);
        
        if (res.data?.hours && res.data.hours.length > 0) {
          // Sort by day order
          const sorted = [...res.data.hours].sort((a, b) => 
            DAYS_ORDER.indexOf(a.dayOfWeek) - DAYS_ORDER.indexOf(b.dayOfWeek)
          );
          setHours(sorted);
        } else {
          setHours(DEFAULT_HOURS);
        }
      }
    } catch (error) {
      console.error('Error loading hours:', error);
      Alert.alert('Error', 'Failed to load operating hours');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (dayIndex: number) => {
    const newHours = [...hours];
    newHours[dayIndex].isClosed = !newHours[dayIndex].isClosed;
    setHours(newHours);
  };

  const openValidTimeModal = (day: OperatingHour) => {
    if (day.isClosed) return;
    setEditingDay(day);
    setEditOpenTime(day.openTime);
    setEditCloseTime(day.closeTime);
    setModalVisible(true);
  };

  const saveTimeEdit = () => {
    if (editingDay) {
      setHours(prev => prev.map(h => 
        h.dayOfWeek === editingDay.dayOfWeek 
          ? { ...h, openTime: editOpenTime, closeTime: editCloseTime }
          : h
      ));
      setModalVisible(false);
    }
  };

  const handleSaveAll = async () => {
    if (!truckId) return;
    
    setSaving(true);
    try {
      const token = await getToken();
      if (token) authService.setToken(token);

      await apiClient.put(`/api/trucks/${truckId}/hours`, { hours });
      Alert.alert('Success', 'Operating hours updated!');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving hours:', error);
      Alert.alert('Error', 'Failed to update operating hours');
    } finally {
      setSaving(false);
    }
  };

  const formatDayName = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
  };

  if (loading) {
    return <LoadingState message="Loading hours..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <IconButton name="back" onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Operating Hours</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.subtitle}>Set when your hungry customers can find you! 🕒</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.card}>
           {hours.map((day, index) => (
             <Animated.View 
              key={day.dayOfWeek} 
              entering={FadeInDown.delay(index * 50)}
              style={[styles.dayRow, index !== hours.length - 1 && styles.divider]}
            >
              <TouchableOpacity 
                style={styles.dayInfo} 
                onPress={() => openValidTimeModal(day)}
                disabled={day.isClosed}
              >
                 <Text style={styles.dayName}>{formatDayName(day.dayOfWeek)}</Text>
                 <View style={styles.timeContainer}>
                   <Text style={[styles.hoursOpen, day.isClosed && styles.closedText]}>
                     {day.isClosed ? 'Closed' : `${day.openTime} - ${day.closeTime}`}
                   </Text>
                   {!day.isClosed && <Icon name="edit" size={14} color={theme.colors.primary.main} style={{marginLeft: 6}} />}
                 </View>
              </TouchableOpacity>
               <Switch
                 value={!day.isClosed}
                 onValueChange={() => handleToggleDay(index)}
                 trackColor={{ false: theme.colors.gray[300], true: theme.colors.success }}
                 thumbColor={theme.colors.white}
               />
             </Animated.View>
           ))}
        </Animated.View>

        <Button 
          title={saving ? "Saving..." : "Save Changes"} 
          onPress={handleSaveAll} 
          style={styles.saveButton}
          size="large"
          fullWidth
          disabled={saving}
        />
      </ScrollView>

      {/* Edit Time Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Times for {editingDay ? formatDayName(editingDay.dayOfWeek) : ''}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Open Time</Text>
              <TextInput 
                style={styles.input} 
                value={editOpenTime} 
                onChangeText={setEditOpenTime}
                placeholder="e.g. 10:00 AM" 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Close Time</Text>
              <TextInput 
                style={styles.input} 
                value={editCloseTime} 
                onChangeText={setEditCloseTime}
                placeholder="e.g. 09:00 PM" 
              />
            </View>

            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} variant="outline" style={{flex: 1}} />
              <View style={{width: 10}} />
              <Button title="Set Time" onPress={saveTimeEdit} style={{flex: 1}} />
            </View>
          </View>
        </View>
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
    marginBottom: theme.spacing.lg,
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
  content: {
    padding: theme.spacing.base,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
    marginBottom: theme.spacing.xl,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  dayInfo: {
    flex: 1,
    gap: 4,
  },
  dayName: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.gray[900],
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursOpen: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.gray[600],
  },
  closedText: {
    color: theme.colors.error,
    fontWeight: theme.typography.fontWeights.medium,
  },
  saveButton: {
    marginBottom: theme.spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
  },
  modalTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.gray[700],
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.gray[50],
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSizes.base,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
  },
});

export default OperatingHoursScreen;
