import { useHttp } from "@/services/app.services";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import {
  Dimensions,
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

type RootStackParamList = {
  List: undefined;
  Login: undefined;
  // add other routes here if needed
};
const { width } = Dimensions.get("window");
type MenuScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "List">;
};

const menuData = [
  { key: "1", title: "Approval (16)" },
  { key: "2", title: "Query (2)" },
  // Add more menu items here if needed
];

import { useState, useEffect } from "react";
import { endpointConstants } from "@/constants/endpoint";
import * as SecureStore from "expo-secure-store";
import { getCompUrl } from "@/services/common.services";

export default function MenuScreen({ navigation }: MenuScreenProps) {
  const useHttpService = useHttp();
  const [queryOptions, setQueryOptions] = useState<any[]>([]);
  const [menuData, setMenuData] = useState<any[]>([]);
  useEffect(() => {
    fetchApprovalCount();
    fetchTotalCount();
  }, []);
  const fetchApprovalCount = async () => {
    const compUrl = await getCompUrl();

    const compId = await SecureStore.getItemAsync("compId");
    const userId = await SecureStore.getItemAsync("userId");
    try {
      const response: any = await useHttpService.sendRequest(
        `${compUrl}/${endpointConstants.GETAPPROVALLOGINCOUNT}/${compId}/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response && response.Data) {
      
        const filtered = response.Data.filter(
          (i: any) => i.ApprovalType !== "2Query"//Query screen next release we need consider
        );
        setMenuData(filtered);
      } else {
        // Handle error appropriately
      }
    } catch (error: any) {
      console.error("Error fetching company list:", error);
      // Handle error appropriately
    }
  };
  const fetchTotalCount = async () => {
    const compUrl = await getCompUrl();
    const compId = await SecureStore.getItemAsync("compId");
    const userId = await SecureStore.getItemAsync("userId");
    try {
      const response: any = await useHttpService.sendRequest(
        `${compUrl}/${endpointConstants.GETAPPROVALCOUNT}/${compId}/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response && response.Data) {
      } else {
        // Handle error appropriately
      }
    } catch (error: any) {
      console.error("Error fetching company list:", error);
      // Handle error appropriately
    }
  };

  const handleMenuPress = (item: any) => {
    if (item.ApprovalType === "1Approval") {
      navigation.navigate("List");
    } else if (item.ApprovalType === "2Query") {
      navigation.navigate("List");
    }
    // Handle navigation for Query if needed
    // Add more navigation logic for other menu items if needed
  };

  const handleLogoutPress = () => {
    navigation.navigate("Login");
  };

  return (
    <View style={styles.headercontainer}>
      <ImageBackground
        source={require("../../assets/images/headerbg.gif")} // Replace with your image path
        style={styles.header}
        resizeMode="cover"
      >
        <View></View>

        <View>
          <TouchableOpacity
            style={styles.logout}
            onPress={() => handleLogoutPress()}
          >
            <Icon name="logout" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </ImageBackground>

      <View style={styles.container}>
        <FlatList
          data={menuData}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuPress(item)}
            >
              <View style={styles.menuContent}>
                <Icon
                  name={
                    item.ApprovalType === "1Approval"
                      ? "file-document-check"
                      : "message-question"
                  }
                  size={32}
                  color="#04447c"
                  style={styles.menuIcon}
                />
                <View style={styles.textContainer}>
                  <Text style={styles.menuText}>
                    {item.ApprovalType.substring(1)}
                  </Text>
                  <Text style={styles.countText}>({item.NoOfRecord})</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  headercontainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  header: {
    width: width, // Set width to screen width
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 30,
    marginTop: 40,
  },
  headerText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  logo: {
    width: 120,
    height: 60,
    alignSelf: "center",
  },
  // menuItem: {
  //   backgroundColor: "#9db7c5",
  //   padding: 20,
  //   marginVertical: 10,
  //   marginHorizontal: 20,
  //   borderRadius: 8,
  //   alignItems: "center",
  //   flexDirection: "row",
  // },
  // menuText: {
  //   fontSize: 18,
  //   color: "#04447c",
  //   fontWeight: "bold",
  // },

  // menuIcon: {
  //   marginRight: 10, // Add some spacing between the icon and text
  // },

  logout: {
    marginRight: 5, // Add some spacing between the icon and text
  },

  menuItem: {
    marginTop: 30,
    backgroundColor: "#e4e2d6ff",
    padding: 60,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 4, // Android shadow
    shadowColor: "#04447c", // iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    marginRight: 15,
  },
  textContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuText: {
    fontSize: 24,
    color: "#04447c",
    fontWeight: "bold",
    marginRight: 8,
  },
  countText: {
    fontSize: 24,
    color: "#04447c",
    fontWeight: "bold",
  },
});
