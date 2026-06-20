import { useHttp } from "@/services/app.services";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Dimensions,
  ImageBackground,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { storeToken } from "@/services/common.services";
import { endpointConstants } from "@/constants/endpoint";
import { Dropdown } from "react-native-element-dropdown";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

import * as Application from "expo-application";

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
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState("");
  const { sendRequest } = useHttp();
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState("");

  const [companyOptions, setCompanyOptions] = useState<any[]>([]);
  const [registrationDetails, setRegistrationDetails] = useState<{
    userId: string;
    companyId: string;
    deviceId: string;
    token: string;
  } | null>(null);

  const getDeviceId = useCallback(async () => {
    try {
      if (Platform.OS === "android") {
        return Application.getAndroidId();
      }
      if (Platform.OS === "ios") {
        return (await Application.getIosIdForVendorAsync()) || null;
      }
      return null;
    } catch (error) {
      console.error("Failed to resolve device id", error);
      return null;
    }
  }, []);

  const registerPushDevice = useCallback(
    async (userId: string, companyId: string, customToken?: string) => {
      try {
        // if (!Device.isDevice) {
        //   console.log(
        //     "Push notification registration skipped: not a physical device."
        //   );
        //   return;
        // }

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#04447c",
          });
        }

        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          console.warn("Push notification permission denied by user.");
          return;
        }

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ||
          Constants.easConfig?.projectId;

        if (!projectId) {
          throw new Error("Missing Expo EAS projectId for push token generation.");
        }

        const token =
          customToken ||
          (Platform.OS === "android" || Platform.OS === "ios"
            ? (await Notifications.getDevicePushTokenAsync()).data
            : (await Notifications.getExpoPushTokenAsync({ projectId })).data);

        if (!token) {
          throw new Error("Expo push token generation failed.");
        }

        const deviceId = await getDeviceId();
        if (!deviceId) {
          throw new Error("Unable to resolve a unique device identifier.");
        }

        const compUrl =
          companyOptions.find((c) => c.value === companyId)?.url ||
          (await SecureStore.getItemAsync("comUrl")) ||
          "";
        if (!compUrl) {
          throw new Error("Company URL is unavailable for push registration.");
        }

        const registrationUrl = `${compUrl}/api/${endpointConstants.REGISTERPUSHDEVICE}/${encodeURIComponent(
          companyId
        )}/${encodeURIComponent(userId)}/${encodeURIComponent(
          deviceId
        )}/${encodeURIComponent(token)}`;

        console.log("Registering push device", {
          userId,
          companyId,
          deviceId,
          token
        });

        const response: any = await sendRequest(registrationUrl, {
          method: "POST",
        });

        if (response?.response || response?.isAxiosError) {
          throw new Error(
            response?.message || "Push device registration API failed."
          );
        }

        console.log("Push device registration succeeded");
        return { userId, companyId, deviceId, token };
      } catch (error: any) {
        const errorMessage =
          typeof error === "string"
            ? error
            : error?.message || "Unknown push registration error";
        console.error(`Push registration error: ${errorMessage}`);
      }
    },
    [companyOptions, getDeviceId, sendRequest]
  );

  const fetchCompanyList = useCallback(async () => {
    try {
      const response: any = await sendRequest(
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
  }, [sendRequest]);

  const retriveCredentials = useCallback(async () => {
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
  }, [sendRequest]);

  useEffect(() => {
    fetchCompanyList();
    const checkCredentials = async () => {
      const credentialsExist = await retriveCredentials();
      if (!credentialsExist) {
        setPage("Register");
      }
    };
    checkCredentials();
  }, [fetchCompanyList, retriveCredentials]);

  useEffect(() => {
    const pushTokenSubscription = Notifications.addPushTokenListener(
      async (pushToken) => {
        if (!username || !compId) {
          return;
        }
        await registerPushDevice(username, compId, pushToken.data);
      }
    );

    return () => {
      pushTokenSubscription.remove();
    };
  }, [username, compId, registerPushDevice]);

  const storeCredentials = async (userId: string, compId: string) => {
    try {
      const selectedCompany = companyOptions.find((c) => c.value === compId);
      await SecureStore.setItemAsync("userId", userId);
      await SecureStore.setItemAsync("compId", compId);
      await SecureStore.setItemAsync("comUrl", selectedCompany?.url || "");
      await SecureStore.setItemAsync("compName", selectedCompany?.label || "");
      console.log("Credentials stored successfully", userId, compId);
    } catch (error) {
      console.log("Error storing credentials", error);
    }
  };



  const handleReRegister = () => {
    setError("");
    setPage("Register");
  };

  const handleGoToLogin = () => {
    setError("");
    setPassword("");
    setPage("Login");
  };

  const handleLogin = async (retryCount = 0) => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setIsLoading(true);
    try {
      const compUrl =
        companyOptions.find((c) => c.value === compId)?.url ||
        (await SecureStore.getItemAsync("comUrl")) ||
        "";
      console.log("Company URL:", compUrl);
      const apiUrl = `${compUrl}/api/${endpointConstants.LOGINURL}`;
      const apiUrlpParams = {
        Compid: compId,
        Username: username,
        Password: password,
      };

      console.log("Login URL", apiUrl);
      const response: any = await sendRequest(apiUrl, {
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

          const details = await registerPushDevice(username, compId);

          if (page === "Register") {
            if (details) setRegistrationDetails(details);
            setPage("RegisterComplete");
          } else {
            navigation.navigate("Menu");
          }

          console.log("Login successful");
        } catch (storageError) {
          console.error("Storage error:", storageError);
          setError("Failed to save login information");
        }
      } else {
        setError("Incorrect Username or Password.");
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
        <Text style={styles.title}>
          {page}
        </Text>
        <View style={styles.inpputcontainer}>
          {page === "RegisterComplete" ? (
            <View>
              <Text
                style={{
                  color: "#04447c",
                  fontSize: 16,
                  fontWeight: "bold",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Registration Successful!
              </Text>
              <Text
                style={{
                  color: "#555",
                  fontSize: 13,
                  textAlign: "center",
                  marginBottom: 24,
                }}
              >
                Your account has been set up. You can re-register with updated
                details or proceed to login.
              </Text>
              <View style={{ marginBottom: 12 }}>
                <Button
                  title="Re-Register"
                  color="#04447c"
                  onPress={handleReRegister}
                />
              </View>
              <View>
                <Button
                  title="Login"
                  color="#61A3BA"
                  onPress={handleGoToLogin}
                />
              </View>
            </View>
          ) : (
            <>
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
          {page === "Register" && registrationDetails && (
            <View
              style={{
                marginTop: 20,
                padding: 14,
                backgroundColor: "#f0f7ff",
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#9db7c5",
              }}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  color: "#04447c",
                  marginBottom: 10,
                  fontSize: 14,
                }}
              >
                Registration Details
              </Text>
              <Text style={{ color: "#555", marginBottom: 6, fontSize: 13 }}>
                <Text style={{ fontWeight: "bold" }}>User ID: </Text>
                {registrationDetails.userId}
              </Text>
              <Text style={{ color: "#555", marginBottom: 6, fontSize: 13 }}>
                <Text style={{ fontWeight: "bold" }}>Company ID: </Text>
                {registrationDetails.companyId}
              </Text>
              <Text style={{ color: "#555", marginBottom: 6, fontSize: 13 }}>
                <Text style={{ fontWeight: "bold" }}>Device ID: </Text>
                {registrationDetails.deviceId}
              </Text>
              <Text style={{ color: "#555", fontSize: 13 }}>
                <Text style={{ fontWeight: "bold" }}>Token: </Text>
                {registrationDetails.token}
              </Text>
            </View>
          )}
            </>
          )}
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

});
