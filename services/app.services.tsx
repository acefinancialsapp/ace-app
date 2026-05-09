import { useState, useCallback } from 'react';
import axios, { AxiosRequestConfig, Method } from 'axios';
import { getToken } from './common.services';

type HttpMethod = Method;

interface UseHttpOptions {
    method?: HttpMethod;
    headers?: Record<string, string>;
    body?: any;
}

interface UseHttpResult<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
    sendRequest: (url: string, options?: UseHttpOptions) => Promise<void>;
}

export function useHttp<T = any>(): UseHttpResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const sendRequest = useCallback(
        async (url: string, options: UseHttpOptions = {}) => {
            setLoading(true);
            setError(null);
            setData(null);

            // Remove Authorization header for login requests
            const isLoginRequest = url.includes('/login');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...(options.headers || {}),
            };
            if (!isLoginRequest) {
               headers.Authorization = `Bearer ${await getToken()}`;

                //   headers.Authorization = `Bearer AMIvuvkU1ItNfpUVj0gt29ATpQOTLxzO`;
            }

            const axiosConfig: AxiosRequestConfig = {
                url,
                method: options.method || 'GET',
                headers,
                data: options.body,
            };

            try {
                const response = await axios(axiosConfig);
                setData(response.data);
                return response.data;
            } catch (err: any) {
                setError(
                    err.response?.data?.message ||
                    err.message ||
                    'Something went wrong'
                );
                return err;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return { data, error, loading, sendRequest };
}