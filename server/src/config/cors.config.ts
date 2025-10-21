// CORS configuration for the application
export const corsOptions = {
  origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return cb(null, true);
    
    // Allowed origins
    const allowedOrigins = [
      'https://frontend-production-56b7.up.railway.app',
      'https://www.evolution-x.io',
      'http://localhost:3000',
      'https://localhost:3000',
      'http://localhost:3001',
      'https://localhost:3001'
    ];
    
    console.log('🌐 CORS检查来源:', origin);
    const isAllowed = allowedOrigins.includes(origin);
    console.log('🌐 CORS允许状态:', isAllowed);
    cb(null, isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['X-Request-Id'],
  optionsSuccessStatus: 200
};
