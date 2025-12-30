@echo off
REM Database Setup Script for Taco Truck Locator
REM Run this script to create the .env file

echo Creating .env file for Taco Truck Locator Backend...

(
echo # Taco Truck Locator - Backend Server
echo.
echo # Server
echo PORT=3000
echo NODE_ENV=development
echo.
echo # Database ^(PostgreSQL^)
echo # Option 1: Local PostgreSQL
echo # DATABASE_URL="postgresql://postgres:password@localhost:5432/taco_truck?schema=public"
echo.
echo # Option 2: Neon.tech Free Cloud PostgreSQL ^(Recommended^)
echo # Sign up at https://neon.tech and paste your connection string here
echo DATABASE_URL="postgresql://postgres:password@localhost:5432/taco_truck?schema=public"
echo.
echo # Clerk Authentication
echo CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
echo.
echo # Frontend URL ^(for CORS^)
echo CLIENT_URL=http://localhost:8081
echo.
echo # Socket.IO
echo SOCKET_CORS_ORIGIN=http://localhost:8081
) > .env

echo.
echo ✅ .env file created!
echo.
echo ⚠️  IMPORTANT: Edit .env and update DATABASE_URL with your PostgreSQL credentials
echo.
echo Options:
echo   1. Local PostgreSQL: postgresql://postgres:YOUR_PASSWORD@localhost:5432/taco_truck
echo   2. Neon.tech Free: Sign up at https://neon.tech and get a free PostgreSQL database
echo.
pause
