const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiService = {
    get: async function (url: string): Promise<any> {
        try {
            console.log('Starting fetch request to:', `${API_URL}${url}`);
            console.log('API_URL value:', API_URL);

            const response = await fetch(`${API_URL}${url}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Response data:', data);
            return data;
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    },

    post: async function (url: string, data: any): Promise<any> {
        try {
            console.log('Starting POST request to:', `${API_URL}${url}`);
            console.log('Request data:', data);

            const response = await fetch(`${API_URL}${url}`, {
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

            // 尝试解析 JSON
            try {
                const responseData = JSON.parse(text);
                console.log('Response data:', responseData);

                if (!response.ok) {
                    if (responseData && responseData.email) {
                        throw new Error(responseData.email[0]);
                    }
                    throw new Error(responseData?.detail || 'API Error');
                }

                return responseData;
            } catch (parseError) {
                console.error('JSON Parse error:', parseError);
                throw new Error('Invalid JSON response');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }
};

export default apiService;
