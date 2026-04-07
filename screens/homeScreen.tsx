import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';

const diwanImg = require('../assets/images/diwan.jpg');
const savoyImg = require('../assets/images/savoy.jpg');

const HomeScreen = () => {
  const categories = ['Work', 'Study', 'Meetings', 'Events'];

  const featuredSpaces = [
    {
      title: 'Diwan Studio',
      location: 'Manama',
      type: 'Coworking Space',
      image: diwanImg,
    },
    {
      title: 'Savoy Hotel Lounge',
      location: 'Juffair',
      type: 'Meeting Space',
      image: savoyImg,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.greeting}>Find your next{'\n'}perfect space</Text>

        <TextInput
          placeholder="Search spaces..."
          placeholderTextColor="#888"
          style={styles.searchInput}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {categories.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.categoryChip,
                index === 0 && styles.activeCategoryChip,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  index === 0 && styles.activeCategoryText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Featured spaces</Text>

        {featuredSpaces.map((space, index) => (
          <TouchableOpacity key={index} style={styles.card}>
            <Image source={space.image} style={styles.image} />

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{space.title}</Text>
              <Text style={styles.cardSubtitle}>{space.location}</Text>
              <Text style={styles.cardType}>{space.type}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={[styles.tabItem, styles.activeTab]}>
          <Text style={[styles.tabIcon, styles.activeTabText]}>⌂</Text>
          <Text style={[styles.tabText, styles.activeTabText]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabIcon}>▣</Text>
          <Text style={styles.tabText}>Explore</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabIcon}>🕘</Text>
          <Text style={styles.tabText}>Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabIcon}>👤</Text>
          <Text style={styles.tabText}>Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeScreen;

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
  greeting: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 20,
    lineHeight: 38,
  },
  searchInput: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 15,
  },
  categoryRow: {
    paddingTop: 18,
    paddingBottom: 8,
  },
  categoryChip: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  activeCategoryChip: {
    backgroundColor: '#12CFFF',
    borderColor: '#12CFFF',
  },
  categoryText: {
    color: '#BDBDBD',
    fontSize: 14,
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#000000',
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#161616',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#BDBDBD',
    fontSize: 14,
    marginTop: 6,
  },
  cardType: {
    color: '#12CFFF',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
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
    fontSize: 12,
    color: '#BDBDBD',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000000',
    fontWeight: '700',
  },
});