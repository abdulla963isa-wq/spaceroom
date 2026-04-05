import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const ProfileScreen = () => {
  const menuItems = [
    'My account',
    'Payment method',
    'Favorites',
    'Calendar',
    'History',
    'Help and support',
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.name}>Abdulla Ali</Text>
              <Text style={styles.country}>🇧🇭 Bahrain</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem}>
              <Text style={styles.menuText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerCard: {
    backgroundColor: '#161616',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#12CFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#000000',
    fontSize: 24,
    fontWeight: '700',
  },
  userInfo: {
    marginLeft: 16,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  country: {
    color: '#BDBDBD',
    fontSize: 15,
    marginTop: 4,
  },
  menuContainer: {
    backgroundColor: '#161616',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  menuItem: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  menuText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 24,
    backgroundColor: '#12CFFF',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
});