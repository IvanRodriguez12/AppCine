// components/StatCard.tsx - COMPONENTE SEPARADO PARA EVITAR WARNINGS
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
}

const StatCard = ({ title, value, icon, color, subtitle }: StatCardProps) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <View style={styles.statContent}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

const styles = StyleSheet.create({
  statCard: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(8),
    borderLeftWidth: 4,
    width: '48%',
  },
  statIcon: {
    fontSize: moderateScale(24),
    marginRight: moderateScale(8),
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: moderateScale(12),
    color: '#8C8C8C',
    marginBottom: verticalScale(4),
  },
  statValue: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statSubtitle: {
    fontSize: moderateScale(10),
    color: '#4CAF50',
    marginTop: verticalScale(2),
  },
});

export default StatCard;