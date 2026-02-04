@extends('layouts.mail')

@section('content')
  <p>
    Hi {{ $userName }},
  </p>

  <p>
    This is to confirm that your <strong>{{ $appName }}</strong> account has been permanently deleted.
  </p>

  <h3>What this means</h3>

  <ul>
    <li>All personal data associated with your account has been removed from our active systems.</li>
    <li>You no longer have access to your account, history, or stored information.</li>
    <li>This action is permanent and cannot be undone.</li>
  </ul>

  <p>
    If you believe this was done in error or have any questions, you may contact us at <a href="mailto:{{ $supportEmail }}">{{ $supportEmail }}</a>. Please note that deleted accounts cannot be restored.
  </p>

  <p>
    Thank you for having used {{ $appName }}.
  </p>

  <p>
    Best regards,<br>
    {{ $companyName }} Support Team
  </p>
@endsection

