import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemeProvider } from './context/ThemeContext';
import CalculatorScreen from './screens/Calculator';
import HistoryScreen from './screens/History';
import ComparatorScreen from './screens/Comparator';
import ExtrasScreen from './screens/Extras';
import SettingsScreen from './screens/Settings';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer independent={true}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof MaterialIcons.glyphMap;

              if (route.name === 'Calculadora') {
                iconName = 'calculate';
              } else if (route.name === 'Histórico') {
                iconName = 'history';
              } else if (route.name === 'Comparar') {
                iconName = 'compare';
              } else if (route.name === 'Extras') {
                iconName = 'more-horiz';
              } else if (route.name === 'Configurações') {
                iconName = 'settings';
              } else {
                iconName = 'help';
              }

              return <MaterialIcons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#2E7D32',
            tabBarInactiveTintColor: '#999',
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
            },
            tabBarStyle: {
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#eee',
              height: 65,
              paddingBottom: 8,
              paddingTop: 8,
            },
            headerShown: false,
          })}
        >
          <Tab.Screen name="Calculadora" component={CalculatorScreen} />
          <Tab.Screen name="Histórico" component={HistoryScreen} />
          <Tab.Screen name="Comparar" component={ComparatorScreen} />
          <Tab.Screen name="Extras" component={ExtrasScreen} />
          <Tab.Screen name="Configurações" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});