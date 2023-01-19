const whitelist = [
    'https://www.yoursite.com',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    process.env.FRONTEND_URL
];

const corsOptions = {
    origin: (origin, callback) => {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200
}

export default corsOptions;