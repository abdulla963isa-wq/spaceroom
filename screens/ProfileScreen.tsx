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
              <Text style={styles.name}>Abdulla Albahrani</Text>
              <Text style={styles.country}>🇧🇭 Bahrain</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.lastMenuItem,
              ]}
            >
              <Text style={styles.menuText}>{item}</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabIcon}>⌂</Text>
          <Text style={styles.tabText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabIcon}>🕘</Text>
          <Text style={styles.tabText}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabItem, styles.activeTab]}>
          <Text style={[styles.tabIcon, styles.activeTabText]}>👤</Text>
          <Text style={[styles.tabText, styles.activeTabText]}>Account</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 120,
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
    borderWidth: 1,
    borderColor: '#2A2A2A',
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  arrow: {
    color: '#12CFFF',
    fontSize: 22,
    fontWeight: '600',
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
  bottomTabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#161616',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 18,
  },
  activeTab: {
    backgroundColor: '#12CFFF',
  },
  tabIcon: {
    fontSize: 18,
    color: '#BDBDBD',
    marginBottom: 4,
  },
  tabText: {
    fontSize: 13,
    color: '#BDBDBD',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000000',
    fontWeight: '700',
  },
});