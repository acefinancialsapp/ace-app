import * as secureStore from 'expo-secure-store';



export const storeToken = async (token: string) => {
  try {
    await secureStore.setItem('authToken', token);
  } catch (e) {
    console.error('Failed to save token', e);
  }
};

export const getToken = async () => {
  try {
    const token = await secureStore.getItem('authToken');
    return token;
  } catch (e) {
    console.error('Failed to fetch token', e);
    return null;
  }
};
export const getCompUrl = async () => {
  try {
    const comUrl = await secureStore.getItemAsync('comUrl');
    return comUrl;
  }
  catch (e) {
    console.error('Failed to fetch comUrl', e);
    return null;
  } 
}