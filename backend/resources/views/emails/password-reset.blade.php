<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 10px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #0d9488;
        }
        .logo span {
            color: #333;
        }
        h1 {
            color: #333;
            font-size: 24px;
            margin-bottom: 20px;
        }
        p {
            margin-bottom: 15px;
            color: #666;
        }
        .button {
            display: inline-block;
            background-color: #0d9488;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 30px;
            border-radius: 50px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }
        .button:hover {
            background-color: #0f766e;
        }
        .button-container {
            text-align: center;
        }
        .link-text {
            word-break: break-all;
            font-size: 12px;
            color: #999;
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
            margin-top: 20px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
        }
        .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 5px 5px 0;
        }
        .warning p {
            margin: 0;
            color: #92400e;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Medi<span>Clinic</span></div>
        </div>
        
        <h1>Reset Your Password</h1>
        
        <p>Hello {{ $userName }},</p>
        
        <p>We received a request to reset the password for your MediClinic account. Click the button below to create a new password:</p>
        
        <div class="button-container">
            <a href="{{ $resetUrl }}" class="button">Reset Password</a>
        </div>
        
        <div class="warning">
            <p>⏰ This link will expire in <strong>1 hour</strong> for security reasons.</p>
        </div>
        
        <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <div class="link-text">{{ $resetUrl }}</div>
        
        <div class="footer">
            <p>This is an automated message from MediClinic.</p>
            <p>Please do not reply to this email.</p>
            <p>&copy; {{ date('Y') }} MediClinic. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
