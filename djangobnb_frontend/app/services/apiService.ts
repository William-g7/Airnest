const apiService = {
    get: async function (url: string): Promise<any> {
        console.log('get', url);

        return new Promise((resolve, reject) => {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            })
                .then(response => response.json())
                .then(data => {
                    console.log('data', data);
                    resolve(data);
                })
                .catch(error => {
                    console.error('error', error);
                    reject(error);
                });
        });
    }
};

export default apiService;
