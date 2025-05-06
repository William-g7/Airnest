import { getAccessToken } from "../auth/session";

interface RequestOptions {
    forceRefresh?: boolean;
}

const apiService = {
    get: async function (url: string, options: RequestOptions = {}): Promise<any> {
        try {
            const headers: Record<string, string> = {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            };

            if (options.forceRefresh) {
                headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
                headers['Pragma'] = 'no-cache';
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
                method: 'GET',
                headers,
                cache: options.forceRefresh ? 'reload' : 'default',
            });

            if (!response.ok) {
                console.log(response);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log(data);
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    getwithtoken: async function (url: string): Promise<any> {
        try {
            const token = await getAccessToken();

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                console.log(response);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },

    post: async function (url: string, data: any): Promise<any> {
        try {
            const token = await getAccessToken();

            if (!token) {
                throw new Error('No authentication token available');
            }

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${token}`,
            };
            if (!(data instanceof FormData)) {
                headers['Content-Type'] = 'application/json';
                data = JSON.stringify(data);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
                method: 'POST',
                headers: headers,
                body: data,
                credentials: 'include'
            });

            const responseText = await response.text();

            try {
                const json = JSON.parse(responseText);
                return json;
            } catch (parseError) {
                throw new Error('Invalid JSON response');
            }
        } catch (error) {
            console.error('POST request error:', error);
            throw error;
        }
    },

    postwithouttoken: async function (url: string, data: any): Promise<any> {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const text = await response.text();
            if (!text) {
                throw new Error('Empty response received');
            }

            try {
                const responseData = JSON.parse(text);

                if (!response.ok) {
                    if (responseData && responseData.email) {
                        throw new Error(responseData.email[0]);
                    } else if (responseData && responseData.detail) {
                        throw new Error(responseData.detail);
                    } else if (responseData && responseData.non_field_errors) {
                        throw new Error(responseData.non_field_errors[0]);
                    } else if (responseData && responseData.password) {
                        throw new Error(responseData.password[0]);
                    } else if (typeof responseData === 'object' && Object.keys(responseData).length > 0) {
                        const firstErrorKey = Object.keys(responseData)[0];
                        const errorValue = responseData[firstErrorKey];
                        const errorMessage = Array.isArray(errorValue) ? errorValue[0] : errorValue;
                        throw new Error(errorMessage || 'API Error');
                    } else {
                        throw new Error('AUTH_INVALID_CREDENTIALS');
                    }
                }

                return responseData;
            } catch (parseError) {
                console.error('JSON parsing error:', parseError);
                console.log('Response text:', text);

                if (url.includes('/login/')) {
                    throw new Error('AUTH_INVALID_CREDENTIALS');
                } else {
                    throw new Error('Invalid response from server. Please try again later.');
                }
            }
        } catch (error) {
            throw error;
        }
    },

    patch: async function (url: string, data: any): Promise<any> {
        try {
            const token = await getAccessToken();
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: data,
            });
            if (!response.ok) {
                console.log(response);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.log(error);
        }
    }

};

export default apiService;
