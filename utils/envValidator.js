/**
 * Validates that all required environment variables are present.
 * Throws an error if any are missing.
 */
const validateEnv = () => {
    const requiredEnv = [
        'PORT',
        'NODE_ENV',
        'JWT_SECRET',
        'DB_HOST',
        'DB_USER',
        'DB_PASSWORD',
        'DB_NAME'
    ];

    const missing = requiredEnv.filter((env) => !process.env[env]);

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach((m) => console.error(`   - ${m}`));

        // In production, we should exit if critical envs are missing
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        } else {
            console.warn('⚠️  Continuing in development mode, but some features might fail.');
        }
    } else {
        console.log('✅ Environment variables validated.');
    }
};

module.exports = validateEnv;
