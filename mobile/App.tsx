import React from 'react';
import { StatusBar } from 'react-native';
import { AppLoading } from "expo";
import { Ubuntu_700Bold, useFonts } from '@expo-google-fonts/ubuntu'
import { Roboto_400Regular, Roboto_500Medium } from '@expo-google-fonts/roboto'

import Routes from './src/routes'

export default function App() {
  const [fontsLoaded] = useFonts({
    Ubuntu_700Bold, 
    Roboto_500Medium, 
    Roboto_400Regular
  });

  if(!fontsLoaded){
    return <AppLoading />
  }

  return (
    <>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent/>
      <Routes />
    </>
  );
}
