import { useHttp } from "@/services/app.services";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Dimensions,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { storeToken } from "@/services/common.services";
import { endpointConstants } from "@/constants/endpoint";
import { Picker } from "@react-native-picker/picker";
import { getCompUrl } from "@/services/common.services";
import { Dropdown } from "react-native-element-dropdown";
import {
  getOrGenerateDeviceId,
  registerForPushNotificationsAsync,
  registerDeviceWithBackend,
} from "@/services/notification.services";
import * as Clipboard from "expo-clipboard";

type RootStackParamMenu = {
  Menu: undefined;
  Login: undefined;
  // add other routes here if needed
};

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamMenu, "Menu">;
};

const { width } = Dimensions.get("window");

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [compId, setCompId] = useState("");
  const [registeredDeviceId, setRegisteredDeviceId] = useState("");
  const [registeredDeviceToken, setRegisteredDeviceToken] = useState("");
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState("");

  const copyToClipboard = async (text: string, label: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    alert(`${label} copied to clipboard!`);
  };
  const useHttpService = useHttp();
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [smessage, setSmesssage] = useState("");
  const [apiUrlpParams, setApiParams] = useState<{
    Compid: string;
    Username: string;
    Password: string;
  }>({ Compid: "", Username: "", Password: "" });

  const [companyOptions, setCompanyOptions] = useState<any[]>([]);

  useEffect(() => {
    fetchCompanyList();
    const checkCredentials = async () => {
      const credentialsExist = await retriveCredentials();
      if (!credentialsExist) {
        setPage("Register");
      }
    };
    checkCredentials();

    const loadDeviceDetails = async () => {
      try {
        const deviceId = await getOrGenerateDeviceId();
        if (deviceId) {
          setRegisteredDeviceId(deviceId);
        }
        const token = await registerForPushNotificationsAsync("expo", false);
        if (token) {
          setRegisteredDeviceToken(token);
        }
      } catch (err) {
        console.error("Error loading device details on mount:", err);
      }
    };
    loadDeviceDetails();
  }, []);
  const fetchCompanyList = async () => {
    try {
      const response: any = await useHttpService.sendRequest(
        "https://app.acefinancials.com/ACECompanyListAPI/api/ace/GetCompanyList",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Company list response:", response);

      if (response && response.Data) {
        const formattedOptions = response.Data.map((company: any) => ({
          label: company.COMP_NAME, // Adjust based on the actual property name
          value: company.COMPID, // Adjust based on the actual property name
          url: company.MobileAppUrl, // Adjust based on the actual property name
        }));
        setCompanyOptions([
          { label: "Select company", value: "" },
          ...formattedOptions,
        ]);
      } else {
        console.log("Failed to fetch company list");
        // Handle error appropriately
      }
    } catch (error: any) {
      console.error("Error fetching company list:", error);
      // Handle error appropriately
    }
  };
  const retriveCredentials = async () => {
    try {
      const userId = await SecureStore.getItemAsync("userId");
      const compId = await SecureStore.getItemAsync("compId");
      const comUrl = await SecureStore.getItemAsync("comUrl");
      if (userId && compId && comUrl) {
        setUsername(userId);
        setCompId(compId);
        setPage("Login");
        console.log("Credentials retrieved successfully");
        return true;
      } else {
        console.log("No credentials found");
        return false;
      }
    } catch (error) {
      console.log("Error retrieving credentials", error);
      return false;
    }
  };
  const storeCredentials = async (userId: string, compId: string) => {
    try {
      await SecureStore.setItemAsync("userId", userId);
      await SecureStore.setItemAsync("compId", compId);
      await SecureStore.setItemAsync(
        "comUrl",
        companyOptions.find((c) => c.value === compId)?.url || ""
      );
      console.log("Credentials stored successfully", userId, compId);
    } catch (error) {
      console.log("Error storing credentials", error);
    }
  };

  const handleLogin = async (retryCount = 0) => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setIsLoading(true);
    try {
      const compUrl = companyOptions.find((c) => c.value === compId)?.url || ""
      console.log("Company URL:", compUrl);
      const apiUrl = `${compUrl}/api/${endpointConstants.LOGINURL}`;
      const apiUrlpParams = {
        Compid: compId,
        Username: username,
        Password: password,
      };

      setApiUrl(apiUrl);
      console.log("Login URL", apiUrl);
      setApiParams(apiUrlpParams);
      const response: any = await useHttpService.sendRequest(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiUrlpParams),
      });

      if (response?.token) {
        try {
          // Store credentials before navigation
          await Promise.all([
            storeToken(response.token),
            storeCredentials(username, compId),
          ]);

          let pushToken = "";
          let deviceId = "";
          try {
            deviceId = await getOrGenerateDeviceId();
            if (deviceId) {
              setRegisteredDeviceId(deviceId);
            }
            const fetchedToken = await registerForPushNotificationsAsync("expo");
            if (fetchedToken) {
              pushToken = fetchedToken;
              console.log("Push Token obtained:", pushToken);
              setRegisteredDeviceToken(pushToken);
              
              // Wait for device registration API to complete
              const registered = await registerDeviceWithBackend({
                userId: username,
                companyId: compId,
                deviceId: deviceId,
                deviceToken: pushToken,
                sendRequestFn: useHttpService.sendRequest,
              });

              if (registered) {
                console.log("Device successfully registered for push notifications.");
              } else {
                console.warn("Device registration API returned failure.");
              }
            } else {
              console.log("Push Token was null.");
            }
          } catch (pushErr) {
            console.error("Error setting up push notifications:", pushErr);
          }

          setSmesssage(page === "Register" ? "Registration completed successfully!" : "Login successful!");
          navigation.navigate("Menu");

          console.log("Login successful");
        } catch (storageError) {
          console.error("Storage error:", storageError);
          setError("Failed to save login information");
        }
      } else {
        setError("Invalid username or password.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (retryCount < 3) {
        setTimeout(() => {
          handleLogin(retryCount + 1);
        }, 1000); // Add delay between retries
      } else {
        setError("Login failed. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.headercontainer}>
      <Modal
        transparent={true}
        animationType="none"
        visible={isLoading}
        onRequestClose={() => {}}
      >
        <View style={styles.modalBackground}>
          <View style={styles.activityIndicatorWrapper}>
            <ActivityIndicator
              animating={isLoading}
              size="large"
              color="#04447c"
            />
          </View>
        </View>
      </Modal>
      <ImageBackground
        source={require("../../assets/images/headerbg.gif")}
        style={styles.header}
        resizeMode="cover"
      >
        <View></View>
      </ImageBackground>

      <View style={styles.container}>
        <Text style={styles.title}>{page}</Text>

        <View style={styles.inpputcontainer}>
          {error ? (
            <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text>
          ) : null}
          {page === "Register" ? (
            <>
              <Text style={{ marginBottom: 8, color: "#04447c" }}>Company</Text>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: compId ? "#61A3BA" : "#ccc",
                  borderRadius: 8,
                  marginBottom: 16,
                  backgroundColor: "#fff",
                  paddingHorizontal: 8,
                  height: 48,
                  justifyContent: "center",
                }}
              >
                <Dropdown
                  onChange={(itemValue) => setCompId(itemValue.value)}
                  style={{ height: 70, width: "100%" }}
                  data={companyOptions}
                  value={compId}
                  disable={false}
                  labelField="label"
                  valueField="value"
                  placeholder="Select company"
                  placeholderStyle={{ color: "#999" }}
                  selectedTextStyle={{ color: "#000" }}
                  maxHeight={300}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={{ marginBottom: 8, color: "#04447c" }}>Company</Text>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: compId ? "#61A3BA" : "#ccc",
                  borderRadius: 8,
                  marginBottom: 16,
                  backgroundColor: "#fff",
                  paddingHorizontal: 8,
                  height: 48,
                  justifyContent: "center",
                }}
              >
                <Dropdown
                  onChange={(itemValue) => setCompId(itemValue.value)}
                  style={{ height: 70, width: "100%" }}
                  data={companyOptions}
                  value={compId}
                  labelField="label"
                  disable={true}
                  valueField="value"
                  placeholder="Select company"
                  placeholderStyle={{ color: "#999" }}
                  selectedTextStyle={{ color: "#000" }}
                  maxHeight={300}
                />
              </View>
            </>
          )}
          <Text style={{ marginBottom: 8, color: "#04447c" }}>User Id</Text>
          <TextInput
            style={[
              styles.input,
              usernameFocused && {
                borderColor: "#61A3BA",
                backgroundColor: "#fff",
                fontSize: 16,
              },
            ]}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            onFocus={() => setUsernameFocused(true)}
            onBlur={() => setUsernameFocused(false)}
          />
          <Text style={{ marginBottom: 8, color: "#04447c" }}>Password</Text>
          <TextInput
            secureTextEntry
            textContentType="password"
            autoComplete="password"
            style={[
              styles.input,
              passwordFocused && {
                borderColor: "#61A3BA",
                backgroundColor: "#fff",
                fontSize: 16,
              },
            ]}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            autoCapitalize="none"
          />

          <View style={styles.buttonContainer}>
            <Button
              title={page === "Register" ? "Register" : "Login"}
              color="#04447c"
              onPress={() => handleLogin()}
            />
          </View>

          {/* <Text>
            {apiUrl} --- {apiUrlpParams.Compid},{apiUrlpParams.Username},
            {apiUrlpParams.Password} --- {smessage}
          </Text> */}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 20,
  },

  headercontainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  inpputcontainer: {
    margin: 30,
    borderWidth: 1,
    borderColor: "#9db7c5",
    padding: 30,
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
  title: {
    fontSize: 24,
    marginBottom: 10,
    textAlign: "center",
    color: "#04447c",
  },
  headerText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  input: {
    height: 48,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonContainer: {
    width: 150, // set your desired width
    alignSelf: "flex-end", // align the button to the right
  },
  logo: {
    width: 120,
    height: 60,
    alignSelf: "center",
  },
  modalBackground: {
    flex: 1,
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "space-around",
    backgroundColor: "#00000040",
  },
  activityIndicatorWrapper: {
    backgroundColor: "#FFFFFF",
    height: 100,
    width: 100,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
  },
  testInfoContainer: {
    marginHorizontal: 30,
    marginTop: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#04447c",
    backgroundColor: "#f0f8ff",
    borderRadius: 8,
  },
  testInfoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#04447c",
    marginBottom: 10,
    textAlign: "center",
  },
  testInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  testInfoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  testInfoValue: {
    fontSize: 12,
    color: "#555",
    backgroundColor: "#fff",
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
  },
});
