<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html style="background-color: #4A00E0;" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
      
      body {
        background-color: #4A00E0 !important;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #333333;
        font-family: 'Poppins', sans-serif;
        font-size: 14px;
        line-height: 20px;
        margin: 0;
        padding: 0;
        min-height: 100vh;
        width: 100%;
      }

      html {
        background-color: #4A00E0 !important;
      }

      .email-container {
        background-color: #ffffff;
        width: 777px;
        height: auto;
        padding: 40px;
        margin: 20px auto;
        display: block;
      }
      
      .logo {
        width: 100%;
        display: flex;
        text-align: center;
        margin-bottom: 30px;
      }
      
      .logo img {
        max-width: 200px;
        height: auto;
        margin: 0 auto;
        justify-self: center;
        align-self: center;
      }
      
      .main-heading {
        text-align: center;
        font-family: 'Poppins', sans-serif;
        font-weight: 500;
        font-size: 21px;
        line-height: 32px;
        letter-spacing: 0%;
        color: #333333;
        margin-bottom: 30px;
      }
      
      .content {
        font-family: 'Poppins', sans-serif;
        font-weight: 400;
        font-size: 14px;
        line-height: 20px;
        letter-spacing: 0%;
        color: #333333;
      }

      .paragraph {
        margin-bottom: 20px;
      }
      
      .interest-details {
        background-color: #f8f9fa;
        border-left: 4px solid #4A00E0;
        padding: 20px;
        margin: 20px 0;
      }
      
      .detail-item {
        margin-bottom: 10px;
      }
      
      .detail-label {
        font-weight: 500;
        color: #4A00E0;
      }

      @media only screen and (max-width: 800px) {
        .email-container {
          width: 100%;
          max-width: 777px;
          margin: 10px auto;
          padding: 20px;
        }
      }
      
      @media only screen and (max-width: 600px) {
        .email-container {
          margin: 5px auto;
          padding: 15px;
        }
        
        .main-heading {
          font-size: 18px;
          line-height: 28px;
        }
        
        .content {
          font-size: 13px;
          line-height: 18px;
        }
        
        .logo img {
          max-width: 150px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container-wrapper" style='background-color: #4A00E0 !important; width: 100%;'>
      <div class="email-container" style="width: 777px;" >
        <div class="logo" style="width: 100%;">
          <img src="https://downloads.zunou.ai/assets/logos/zunou/PNG/zunou-logo.png" alt="Zunou Logo">
        </div>
        
        @yield('content')
      </div>
    </div>
  </body>
</html>