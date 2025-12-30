# Frontend Development Setup

## ✅ Status: Ready to Develop!

Your frontend is fully set up and ready for development.

## Quick Start

### 1. Start the Backend (Laravel)
Open a terminal and run:
```powershell
cd backend
php artisan serve
```
The backend will run on `http://localhost:8000`

### 2. Start the Frontend (React)
Open another terminal and run:
```powershell
cd frontend
npm start
```
The frontend will run on `http://localhost:3000` and automatically open in your browser.

## Frontend Stack

- **React 19.2** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Hot Toast** for notifications
- **Swiper** for carousels
- **Lucide React** for icons

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API calls
│   ├── components/       # Reusable components
│   │   ├── common/       # Common components (Navbar, etc.)
│   │   └── HomePage/     # Home page components
│   ├── pages/            # Page components
│   │   └── dashboard/    # Dashboard pages for different roles
│   ├── config/           # Configuration files
│   └── types/            # TypeScript type definitions
└── public/               # Static assets
```

## Available Pages

- `/` - HomePage
- `/login` - LoginPage
- `/register` - RegisterPage
- `/portal` - PortalPage
- `/admin` - AdminDashboard
- `/doctor` - DoctorDashboard
- `/patient` - PatientDashboard
- `/pharmacist` - PharmacistDashboard
- `/receptionist` - ReceptionistDashboard

## API Configuration

The frontend is configured to connect to the Laravel backend at `http://localhost:8000`.

API endpoints are defined in `src/config/api.ts`:
- Authentication: `/api/auth/login`, `/api/auth/register`, etc.
- Services: `/api/services`
- Testimonials: `/api/testimonials`
- Doctors: `/api/doctors`
- Appointments: `/api/appointments`

## Development Commands

```powershell
# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file in the frontend directory (already created):
```
REACT_APP_API_URL=http://localhost:8000
```

## Hot Reload

The development server supports hot reload - any changes you make will automatically refresh in the browser.

## Backend Connection

Make sure your Laravel backend is running before testing API calls. The frontend will make requests to:
- `http://localhost:8000/api/*` for API endpoints

## Troubleshooting

### Port 3000 already in use
```powershell
# Set a different port
$env:PORT=3001
npm start
```

### API connection errors
- Verify backend is running: `php artisan serve`
- Check CORS configuration in `backend/config/cors.php`
- Verify API URL in `.env` file

### Dependencies issues
```powershell
# Reinstall dependencies
rm -r node_modules
npm install
```

## Next Steps

1. Start both servers (backend and frontend)
2. Open `http://localhost:3000` in your browser
3. Start developing your components and pages!

