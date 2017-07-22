module.exports = (req) => {
    return new Promise((resolve, reject) => {
        let chunks = [];
        req.on('data', (chunk) => {
            chunks.push(chunk);
        });

        req.on('end', () => {
            try {
                let data = JSON.parse(chunks.join(''));
                resolve(data);
            } catch (err) {
                reject(err);
            }
        });
    });
};
