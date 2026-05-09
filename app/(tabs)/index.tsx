import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import ListScreen from "./list";
import MenuScreen from "./menu";
import LoginScreen from "./login";
import DetailScreen from "./detail";


// Define the type for route parameters
type RootStackParamList = {
  Login: undefined;
  Menu: undefined;
  List: undefined;
  Detail: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function HomeScreen() {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
      />
      <Stack.Screen
        name="Menu"
        component={MenuScreen}
      />
      <Stack.Screen
        name="List"
        component={ListScreen}
      />
      <Stack.Screen
        name="Detail"
        component={DetailScreen}
      />
    </Stack.Navigator>
  );
}