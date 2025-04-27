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
            console.log(data);
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
                    }
                    throw new Error(responseData?.detail || 'API Error');
                }
                return responseData;
            } catch (parseError) {
                throw new Error('Invalid JSON response');
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
