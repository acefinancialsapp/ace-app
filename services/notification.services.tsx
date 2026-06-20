import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { endpointConstants } from '@/constants/endpoint';
import { getCompUrl } from './common.services';

// Define the global handler for how notifications are displayed when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Retrieves a unique Device ID.
 * Persistent across app updates/reinstalls by caching in SecureStore.
 */
export async function getOrGenerateDeviceId(): Promise<string> {
  try {
    let deviceId = await SecureStore.getItemAsync('deviceId');
    if (deviceId) {
      return deviceId;
    }

    if (Platform.OS === 'android') {
      deviceId = Application.getAndroidId();
    } else if (Platform.OS === 'ios') {
      deviceId = (await Application.getIosIdForVendorAsync()) || '';
    }

    // Fallback: Generate custom UUID-like string if native IDs are not available
    if (!deviceId) {
      deviceId =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
    }

    await SecureStore.setItemAsync('deviceId', deviceId);
    return deviceId;
  } catch (error) {
    console.error('Error retrieving/generating device ID:', error);
    return 'dev-' + Math.random().toString(36).substring(2, 10);
  }
}

/**
 * Request notification permissions and fetch the token.
 * Defaults to 'expo' push token, but can fetch native 'fcm' tokens too.
 * @param tokenType 'expo' | 'native'
 */
export async function registerForPushNotificationsAsync(
  tokenType: 'expo' | 'native' = 'expo'
): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device.');
    return null;
  }

  // 1. Configure Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#04447C',
    });
  }

  // 2. Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Notification permissions denied.');
    return null;
  }

  // 3. Get the token
  try {
    if (tokenType === 'native') {
      const deviceToken = (await Notifications.getDevicePushTokenAsync()).data;
      return deviceToken;
    } else {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      if (!projectId) {
        throw new Error('EAS Project ID not found in configuration.');
      }

      const expoToken = (
        await Notifications.getExpoPushTokenAsync({ projectId })
      ).data;
      return expoToken;
    }
  } catch (error) {
    console.error('Failed to generate push notification token:', error);
    return null;
  }
}

interface RegisterDeviceParams {
  userId: string;
  companyId: string;
  deviceId: string;
  deviceToken: string;
  sendRequestFn: (url: string, options?: any) => Promise<any>;
}

/**
 * Calls the RegisterPushDevice endpoint to register the device details in the database
 */
export async function registerDeviceWithBackend({
  userId,
  companyId,
  deviceId,
  deviceToken,
  sendRequestFn,
}: RegisterDeviceParams): Promise<boolean> {
  try {
    const compUrl = await getCompUrl();
    if (!compUrl) {
      console.error('Failed to retrieve Company URL (comUrl) from secure storage.');
      return false;
    }

    // Build API endpoint format as requested:
    // const apiUrl = `${compUrl}/api/${endpointConstants.REGISTERPUSHDEVICE}/${companyId}/${userId}/${deviceId}/${token}`;
    const escapedToken = encodeURIComponent(deviceToken);
    const apiUrl = `${compUrl}/api/${endpointConstants.REGISTERPUSHDEVICE}/${companyId}/${userId}/${deviceId}/${escapedToken}`;

    console.log('Registering push device with API URL:', apiUrl);

    const payload = {
      userId,
      companyId,
      deviceId,
      deviceToken,
    };

    const response = await sendRequestFn(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Device registration response:', response);
    return response !== null && !(response instanceof Error);
  } catch (error) {
    console.error('Failed to register push device with backend:', error);
    return false;
  }
}
