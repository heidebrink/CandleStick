<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PHP Application</title>
</head>
<body>
    <h1>PHP Application with Session Tracking</h1>
    
    <div id="status"></div>
    
    <form method="POST">
        <input type="text" name="username" placeholder="Username">
        <input type="password" name="password" placeholder="Password">
        <button type="submit">Login</button>
    </form>

    <!-- Session Tracker SDK -->
    <script src="http://localhost:5173/session-tracker.umd.js"></script>
    <script>
        var tracker = SessionTracker.init({
            apiEndpoint: 'http://localhost:3001/api',
            userId: '<?php echo $_SESSION["user_id"] ?? "guest"; ?>',
            userName: '<?php echo $_SESSION["user_name"] ?? "Guest User"; ?>',
            userEmail: '<?php echo $_SESSION["user_email"] ?? ""; ?>',
            metadata: {
                phpSessionId: '<?php echo session_id(); ?>',
                accountType: '<?php echo $_SESSION["account_type"] ?? "free"; ?>'
            }
        });
        
        document.getElementById('status').innerHTML = 
            'Recording session: ' + tracker.getSessionId();
    </script>
</body>
</html>
