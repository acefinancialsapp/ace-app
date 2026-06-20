import { DarkTheme, DefaultTheme, NavigationContainer, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import HomeScreen from './(tabs)';
import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!loaded) return;

    // 1. Foreground notification received listener
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received in foreground:", notification);
        const { title, body, data } = notification.request.content;
        Alert.alert(title || "New Notification", body || "", [
          { text: "Dismiss", style: "cancel" },
          { text: "View", onPress: () => handleNotificationAction(data) },
        ]);
      }
    );

    // 2. Background/Terminated state notification tap listener
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("User tapped on notification:", response);
        const data = response.notification.request.content.data;
        handleNotificationAction(data);
      }
    );

    // 3. Cold start check (app opened from terminated state via notification)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        console.log("App launched from terminated state via notification:", response);
        const data = response.notification.request.content.data;
        handleNotificationAction(data);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [loaded]);

  const handleNotificationAction = (data: Record<string, any>) => {
    console.log("Notification action data received:", data);
  };

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
      <HomeScreen />
  );
}
