import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/presentation/navigation/AppNavigator';
import { StatusBar } from 'react-native';
import './src/presentation/i18n/i18n';

const App = () => {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AppNavigator />
    </NavigationContainer>
  );
};

export default App;
